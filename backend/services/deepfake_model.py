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
    pass


class DeepfakeDetectorModel:
    def __init__(self) -> None:
        self._model: nn.Module | None = None
        self._lock = Lock()
        self._device = torch.device("cpu")
        self._output_features = 2
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
        return ResNet(
            block=Bottleneck,
            layers=[3, 4, 23, 3],
            groups=32,
            width_per_group=width_per_group,
            num_classes=output_features,
        )

    def _extract_state_dict(self, checkpoint: object) -> dict[str, torch.Tensor]:
        if not isinstance(checkpoint, dict):
            raise ModelLoadError("The model checkpoint is not a valid PyTorch state dictionary.")

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
            for prefix in ("module.", "model.", "net."):
                if cleaned_key.startswith(prefix):
                    cleaned_key = cleaned_key[len(prefix) :]
            cleaned_key = cleaned_key.replace("last_linear.", "fc.")
            cleaned_state[cleaned_key] = value

        if not cleaned_state:
            raise ModelLoadError("The model checkpoint does not contain tensor weights.")

        return cleaned_state

    def _resolve_weights(self) -> Path:
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
                "Unable to load the pretrained deepfake model. Place the model weights in the models folder or allow Hugging Face download access."
            ) from exc

    def load(self) -> nn.Module:
        if self._model is not None:
            return self._model

        with self._lock:
            if self._model is not None:
                return self._model

            weights_path = self._resolve_weights()

            try:
                try:
                    checkpoint = torch.load(
                        weights_path,
                        map_location=self._device,
                        weights_only=False,
                    )
                except TypeError:
                    checkpoint = torch.load(
                        weights_path,
                        map_location=self._device,
                    )
                cleaned_state = self._extract_state_dict(checkpoint)

                output_features = 1000
                if "fc.weight" in cleaned_state:
                    output_features = int(cleaned_state["fc.weight"].shape[0])

                width_per_group = 8
                if "layer4.0.conv2.weight" in cleaned_state:
                    conv2_in = cleaned_state["layer4.0.conv2.weight"].shape[1]
                    width_per_group = 16 if conv2_in == 128 else 8

                model = self._build_model(output_features=output_features, width_per_group=width_per_group)
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
                raise ModelLoadError("The pretrained model weights could not be loaded.") from exc

            self._model = model
            return self._model

    def predict_fake_probability(self, image: Image.Image) -> float:
        model = self.load()
        tensor = self._transform(image.convert("RGB")).unsqueeze(0).to(self._device)

        with torch.inference_mode():
            logits = model(tensor)
            if self._output_features == 1 or logits.shape[-1] == 1:
                return float(torch.sigmoid(logits.flatten())[0].item())

            probabilities = torch.softmax(logits[:, :2] if logits.shape[-1] >= 2 else logits, dim=1)

        return float(probabilities[0, 1].item())


deepfake_model = DeepfakeDetectorModel()