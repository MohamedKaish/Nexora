"""
AI model inference service.

Wraps the ResNeXt-101 32x8d deepfake detection model. Handles weight
resolution (local file → Hugging Face fallback), checkpoint normalisation
for common PyTorch packaging conventions, architecture detection from
tensor shapes, and thread-safe lazy loading.

DO NOT modify the inference pipeline, model architecture, or weight
loading logic without validating against a representative ground-truth
dataset first. Silent accuracy regressions are the primary risk.

Sprint 7: Add batched inference (process multiple frames in one forward
          pass) and optional half-precision (torch.float16) for GPU
          deployments to reduce inference latency.
Sprint 7: Expose inference latency via a Prometheus histogram metric.
"""

from pathlib import Path
from threading import Lock

import torch
from huggingface_hub import hf_hub_download
from PIL import Image
from torch import nn
from torchvision import transforms
from torchvision.models.resnet import Bottleneck, ResNet

from config.settings import get_settings


class ModelLoadError(RuntimeError):
    """
    Raised when the deepfake detection model cannot be loaded.

    Wraps lower-level exceptions (IO errors, missing weights, incompatible
    checkpoint format) with a user-facing message that avoids leaking
    internal file paths or PyTorch internals.
    """


class DeepfakeDetectorModel:
    """
    Thread-safe wrapper around the ResNeXt-101 32x8d deepfake detection model.

    The model is lazy-loaded on the first call to load() or predict_fake_probability()
    and then cached for the lifetime of the process. Thread safety is guaranteed
    by a double-checked locking pattern using threading.Lock.

    Inference pipeline per frame:
        PIL.Image → RGB conversion → torchvision transforms → model forward pass
        → sigmoid (1-logit head) OR softmax[:, :2] (2-logit head)
        → float probability in [0.0, 1.0] where 1.0 = definitely fake

    Image preprocessing (ImageNet standard):
        Resize to 256px → CenterCrop to 224px → ToTensor → Normalize(μ, σ)

    Sprint 7: Add batch inference support via predict_fake_probability_batch().
    """

    def __init__(self) -> None:
        self._model: nn.Module | None = None
        self._lock = Lock()
        self._device = torch.device("cpu")
        # Updated when the model is loaded; used to choose the output activation.
        self._output_features: int = 2
        # ImageNet normalisation — must match the preprocessing used during training.
        self._transform = transforms.Compose(
            [
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225],
                ),
            ]
        )

    def _build_model(self, output_features: int = 1000, width_per_group: int = 16) -> nn.Module:
        """
        Construct the ResNeXt-101 32x8d architecture.

        Args:
            output_features: Number of output classes (detected from fc.weight shape).
            width_per_group: Cardinality width (8 or 16, detected from conv2 shape).

        Returns:
            An uninitialised ResNet instance (weights not yet loaded).
        """
        return ResNet(
            block=Bottleneck,
            layers=[3, 4, 23, 3],  # ResNet-101 layer configuration
            groups=32,
            width_per_group=width_per_group,
            num_classes=output_features,
        )

    def _extract_state_dict(self, checkpoint: object) -> dict[str, torch.Tensor]:
        """
        Normalise a raw PyTorch checkpoint into a clean state dictionary.

        Handles common packaging conventions:
        - Nested dicts: unwraps state_dict / model_state_dict / model / net keys
        - Key prefixes: strips module. / model. / net. from DataParallel wrapping
        - Key renames: maps last_linear.* → fc.* for CadenaResNet compatibility

        Args:
            checkpoint: Raw object returned by torch.load().

        Returns:
            A flat dict mapping parameter name → tensor.

        Raises:
            ModelLoadError: If the checkpoint is not a dict or contains no tensors.
        """
        if not isinstance(checkpoint, dict):
            raise ModelLoadError("The model checkpoint is not a valid PyTorch state dictionary.")

        # Unwrap common outer wrappers before iterating keys.
        candidate = checkpoint
        for key in ("state_dict", "model_state_dict", "model", "net"):
            value = checkpoint.get(key)
            if isinstance(value, dict):
                candidate = value
                break

        cleaned_state: dict[str, torch.Tensor] = {}
        for key, value in candidate.items():
            if not torch.is_tensor(value):
                continue
            cleaned_key = key
            # Strip DataParallel / custom wrapper prefixes.
            for prefix in ("module.", "model.", "net."):
                if cleaned_key.startswith(prefix):
                    cleaned_key = cleaned_key[len(prefix):]
            # Remap CadenaResNet-style final layer name to torchvision convention.
            cleaned_key = cleaned_key.replace("last_linear.", "fc.")
            cleaned_state[cleaned_key] = value

        if not cleaned_state:
            raise ModelLoadError("The model checkpoint does not contain tensor weights.")

        return cleaned_state

    def _resolve_weights(self) -> Path:
        """
        Locate the model weights file, downloading from Hugging Face if absent.

        Resolution order:
        1. models/{model_filename} relative to the project root (fast path)
        2. Hugging Face Hub download to models/ directory

        Returns:
            Absolute Path to the weights file.

        Raises:
            ModelLoadError: If the file is missing locally and download fails.
        """
        settings = get_settings()
        settings.model_dir.mkdir(parents=True, exist_ok=True)
        local_path = (settings.model_dir / settings.model_filename).resolve()
        if local_path.exists():
            return local_path

        try:
            downloaded = hf_hub_download(
                repo_id=settings.model_repo_id,
                filename=settings.model_filename,
                local_dir=settings.model_dir,
                local_dir_use_symlinks=False,
            )
            return Path(downloaded)
        except Exception as exc:
            raise ModelLoadError(
                f"Model weights not found locally at '{local_path}' and Hugging Face download failed. "
                f"Place '{settings.model_filename}' in the 'models/' directory or ensure network access "
                f"to '{settings.model_repo_id}'."
            ) from exc

    def load(self) -> nn.Module:
        """
        Load and return the model, using the cached instance if already loaded.

        Thread-safe via double-checked locking: the first check (outside the lock)
        avoids lock contention on every inference call once the model is warm.
        The second check (inside the lock) prevents duplicate loading if two
        threads both pass the first check simultaneously.

        Returns:
            The loaded, eval()-mode nn.Module ready for inference.

        Raises:
            ModelLoadError: If weights cannot be resolved or loaded.
        """
        if self._model is not None:
            return self._model

        with self._lock:
            # Double-check: another thread may have loaded the model while we waited.
            if self._model is not None:
                return self._model

            weights_path = self._resolve_weights()

            try:
                # weights_only=False is required for the ig.bin checkpoint format.
                # Try the modern API first; fall back for older torch versions.
                try:
                    checkpoint = torch.load(
                        weights_path,
                        map_location=self._device,
                        weights_only=False,
                    )
                except TypeError:
                    checkpoint = torch.load(weights_path, map_location=self._device)

                cleaned_state = self._extract_state_dict(checkpoint)

                # Detect architecture parameters from tensor shapes.
                output_features = 1000
                if "fc.weight" in cleaned_state:
                    output_features = int(cleaned_state["fc.weight"].shape[0])

                width_per_group = 8
                if "layer4.0.conv2.weight" in cleaned_state:
                    conv2_in = cleaned_state["layer4.0.conv2.weight"].shape[1]
                    width_per_group = 16 if conv2_in == 128 else 8

                model = self._build_model(
                    output_features=output_features,
                    width_per_group=width_per_group,
                )
                incompatible = model.load_state_dict(cleaned_state, strict=False)

                loaded_keys = set(cleaned_state) - set(incompatible.unexpected_keys)
                if not loaded_keys:
                    raise ModelLoadError("No compatible model weights were loaded.")

                self._output_features = output_features
                model.to(self._device)
                model.eval()
            except ModelLoadError:
                raise
            except Exception as exc:
                raise ModelLoadError(
                    "The pretrained model weights could not be parsed. "
                    "The checkpoint file may be corrupt or in an unsupported format."
                ) from exc

            self._model = model
            return self._model

    def predict_fake_probability(self, image: Image.Image) -> float:
        """
        Return the probability that ``image`` is a deepfake frame.

        Args:
            image: A PIL Image of any mode (converted to RGB internally).

        Returns:
            Float in [0.0, 1.0] where 1.0 means the model is certain the
            frame is manipulated and 0.0 means certain it is authentic.
        """
        model = self.load()
        tensor = self._transform(image.convert("RGB")).unsqueeze(0).to(self._device)

        with torch.inference_mode():
            logits = model(tensor)
            # 1-logit output head: apply sigmoid to get a probability.
            if self._output_features == 1 or logits.shape[-1] == 1:
                return float(torch.sigmoid(logits.flatten())[0].item())
            # 2+ logit output head: softmax over [real, fake] and return P(fake).
            probabilities = torch.softmax(
                logits[:, :2] if logits.shape[-1] >= 2 else logits, dim=1
            )

        return float(probabilities[0, 1].item())

    def is_loaded(self) -> bool:
        """Return True if the model weights are loaded and ready for inference."""
        return self._model is not None


# Module-level singleton — import this rather than instantiating directly.
deepfake_model = DeepfakeDetectorModel()