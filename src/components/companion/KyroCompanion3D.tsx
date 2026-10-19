'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  Bot,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Move,
  Send,
  Sparkles,
  Upload,
  X,
  MessageSquare,
  Pin,
  PinOff,
  Palette,
  KeyRound,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Crown,
  Glasses,
  Headphones,
  Check,
  RotateCcw,
} from 'lucide-react'
import { useKyroStore } from '@/store/kyroStore'
import { useKyroBrain } from '@/hooks/useKyroBrain'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useAppStore } from '@/store/appStore'
import {
  KyroCharacterModel,
  KyroCostume,
  KyroColorTheme,
  KYRO_COLOR_THEMES,
  KyroActionChip,
} from '@/types/kyro'
import { toast } from 'sonner'

export function KyroCompanion3D() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)

  const {
    animationState,
    activeSpeech,
    speechBubbleVisible,
    actionChips,
    settings,
    customPosition,
    lastProvider,
    lastLatencyMs,
    lastErrorReason,
    messages,
    speak,
    dismissSpeech,
    setModel,
    setCostume,
    setColorTheme,
    setCustomPosition,
    toggleMinimized,
    togglePinned,
    toggleVoice,
    toggleOpen,
    setProviderTelemetry,
  } = useKyroStore()

  const { handleActionChip } = useKyroBrain()

  const [quickInput, setQuickInput] = useState('')
  const [isSendingQuick, setIsSendingQuick] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [wardrobeOpen, setWardrobeOpen] = useState(false)
  const [keyModalOpen, setKeyModalOpen] = useState(false)
  const [tempApiKey, setTempApiKey] = useState('')
  const [isTestingKey, setIsTestingKey] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Responsive mobile scaling & Android APK detection
  const [isMobile, setIsMobile] = useState(false)
  const [scaleMode, setScaleMode] = useState<'compact' | 'standard'>('standard')

  useEffect(() => {
    const checkMobile = () => {
      const isSmall = typeof window !== 'undefined' && window.innerWidth < 640
      const isNative =
        typeof window !== 'undefined' &&
        Boolean(
          (window as unknown as { NexoraNativeBridge?: { isNative?: () => boolean } }).NexoraNativeBridge?.isNative?.() ||
          (window as unknown as { NexoraNativeBridge?: unknown }).NexoraNativeBridge ||
          /NexoraNativeAndroid/i.test(navigator.userAgent)
        )
      setIsMobile(isSmall || isNative)
      if (isSmall || isNative) {
        setScaleMode('compact')
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isCompact = scaleMode === 'compact' || isMobile
  const stageWidth = isCompact ? 125 : 190
  const stageHeight = isCompact ? 140 : 210

  // Keep refs updated for the Three.js 60FPS loop without causing re-renders
  const animStateRef = useRef(animationState)
  const modelTypeRef = useRef(settings.model)
  const costumeRef = useRef(settings.costume)
  const colorThemeRef = useRef(settings.colorTheme)
  const customGlbRef = useRef(settings.customGlbUrl)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    animStateRef.current = animationState
  }, [animationState])

  useEffect(() => {
    modelTypeRef.current = settings.model
    costumeRef.current = settings.costume
    colorThemeRef.current = settings.colorTheme
    customGlbRef.current = settings.customGlbUrl
  }, [settings.model, settings.costume, settings.colorTheme, settings.customGlbUrl])

  // Load API key for modal input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTempApiKey(localStorage.getItem('nexora_gemini_api_key') || '')
    }
  }, [keyModalOpen])

  // Typewriter effect for speech bubble
  useEffect(() => {
    if (!activeSpeech || !speechBubbleVisible) {
      setDisplayedText('')
      return
    }
    setDisplayedText('')
    let idx = 0
    const interval = setInterval(() => {
      idx++
      setDisplayedText(activeSpeech.slice(0, idx))
      if (idx >= activeSpeech.length) {
        clearInterval(interval)
      }
    }, 16)
    return () => clearInterval(interval)
  }, [activeSpeech, speechBubbleVisible])

  // Auto-scroll chat history inside bubble
  useEffect(() => {
    if (showHistory && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [showHistory, messages])

  // ── MOUSE GAZE TRACKING (ONLY FOR 3D HEAD/EYE ROTATION - NEVER MOVES CONTAINER) ──
  useEffect(() => {
    const handleGazeMove = (e: MouseEvent) => {
      if (typeof window === 'undefined') return
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      }
    }

    window.addEventListener('mousemove', handleGazeMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleGazeMove)
    }
  }, [])

  // ── STRICT SCOPED DRAG HANDLER (ONLY ACTIVE WHEN USER INTENTIONALLY DRAGS HANDLE) ──
  const startDrag = (startX: number, startY: number) => {
    isDraggingRef.current = true
    setIsDragging(true)

    const rect = containerRef.current?.getBoundingClientRect()
    const offsetX = rect ? startX - rect.left : stageWidth / 2
    const offsetY = rect ? startY - rect.top : stageHeight / 2

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      if (!isDraggingRef.current) return
      const maxX = Math.max(10, window.innerWidth - stageWidth - 16)
      const maxY = Math.max(10, window.innerHeight - stageHeight - 24)
      const newX = Math.max(10, Math.min(maxX, e.clientX - offsetX))
      const newY = Math.max(10, Math.min(maxY, e.clientY - offsetY))
      setCustomPosition({ x: newX, y: newY })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !e.touches[0]) return
      e.preventDefault()
      const touch = e.touches[0]
      const maxX = Math.max(10, window.innerWidth - stageWidth - 16)
      const maxY = Math.max(10, window.innerHeight - stageHeight - 24)
      const newX = Math.max(10, Math.min(maxX, touch.clientX - offsetX))
      const newY = Math.max(10, Math.min(maxY, touch.clientY - offsetY))
      setCustomPosition({ x: newX, y: newY })
    }

    const handleDragEnd = () => {
      isDraggingRef.current = false
      setIsDragging(false)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handleDragEnd)
      window.removeEventListener('pointercancel', handleDragEnd)
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleDragEnd)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerup', handleDragEnd)
    window.addEventListener('pointercancel', handleDragEnd)
    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseup', handleDragEnd)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleDragEnd)
  }

  // ── THREE.JS 60FPS WEBGL SCENE WITH COSTUMES & COLOR THEMES ──
  useEffect(() => {
    const container = mountRef.current
    if (!container || settings.isMinimized) return

    const width = stageWidth
    const height = stageHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(0, 0.35, 4.2)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.4)
    keyLight.position.set(3, 5, 4)
    scene.add(keyLight)

    const rimLight = new THREE.PointLight(0xd4a853, 3.2, 9)
    rimLight.position.set(-2.5, 1.5, -2)
    scene.add(rimLight)

    const rootGroup = new THREE.Group()
    scene.add(rootGroup)

    let headGroup = new THREE.Group()
    let leftEyeMesh: THREE.Mesh | null = null
    let rightEyeMesh: THREE.Mesh | null = null
    let mouthMesh: THREE.Mesh | null = null
    let haloRing: THREE.Mesh | null = null
    let leftHand: THREE.Mesh | null = null
    let rightHand: THREE.Mesh | null = null
    let costumeGroup: THREE.Group | null = null
    let gltfMixer: THREE.AnimationMixer | null = null

    // Confetti System
    const particleCount = 45
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const velocities: Array<{ x: number; y: number; z: number }> = []

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      const isGold = i % 2 === 0
      colors[i * 3] = isGold ? 0.83 : 0.06
      colors[i * 3 + 1] = isGold ? 0.66 : 0.72
      colors[i * 3 + 2] = isGold ? 0.32 : 0.5
      velocities.push({
        x: (Math.random() - 0.5) * 2.5,
        y: Math.random() * 2.5 + 1,
        z: (Math.random() - 0.5) * 2.5,
      })
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0,
    })
    const confettiPoints = new THREE.Points(particleGeo, particleMat)
    scene.add(confettiPoints)

    // Build 3D Character Model + Selected Costume
    const buildCharacter = () => {
      while (rootGroup.children.length > 0) {
        rootGroup.remove(rootGroup.children[0])
      }
      headGroup = new THREE.Group()
      rootGroup.add(headGroup)
      gltfMixer = null

      const model = modelTypeRef.current
      const costume = costumeRef.current
      const themeKey = colorThemeRef.current || 'obsidian_gold'
      const palette = KYRO_COLOR_THEMES[themeKey]?.colors || KYRO_COLOR_THEMES.obsidian_gold.colors
      const customUrl = customGlbRef.current

      // ── Custom GLB Loader ──
      if (model === 'custom_glb' && customUrl) {
        const loader = new GLTFLoader()
        loader.load(
          customUrl,
          (gltf) => {
            const root = gltf.scene
            const box = new THREE.Box3().setFromObject(root)
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z) || 1
            const scale = 1.9 / maxDim
            root.scale.setScalar(scale)
            const center = box.getCenter(new THREE.Vector3())
            root.position.sub(center.multiplyScalar(scale))
            headGroup.add(root)

            if (gltf.animations && gltf.animations.length > 0) {
              gltfMixer = new THREE.AnimationMixer(root)
              const action = gltfMixer.clipAction(gltf.animations[0])
              action.play()
            }
          },
          undefined,
          () => {
            modelTypeRef.current = 'kyro_prime'
            buildCharacter()
          }
        )
        return
      }

      // Materials with dynamic Color Theme
      const bodyMat = new THREE.MeshStandardMaterial({
        color: palette.body,
        roughness: 0.22,
        metalness: 0.65,
      })
      const accentMat = new THREE.MeshStandardMaterial({
        color: palette.accent,
        emissive: palette.accent,
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.85,
      })
      const eyeMat = new THREE.MeshBasicMaterial({ color: palette.glow })
      const visorMat = new THREE.MeshStandardMaterial({
        color: palette.visor,
        roughness: 0.1,
        metalness: 0.9,
      })

      // 1. Head / Core Geometry
      const headGeo =
        model === 'aegis_bot'
          ? new THREE.BoxGeometry(1.15, 0.95, 1.0)
          : new THREE.SphereGeometry(0.68, 32, 32)
      const headMesh = new THREE.Mesh(headGeo, bodyMat)
      headGroup.add(headMesh)

      // 2. Visor Screen Plate
      const visorGeo = new THREE.SphereGeometry(0.58, 24, 24)
      visorGeo.scale(1, 0.75, 0.5)
      const visorMesh = new THREE.Mesh(visorGeo, visorMat)
      visorMesh.position.set(0, 0.02, 0.42)
      headGroup.add(visorMesh)

      // 3. Expressive Cartoon Eyes
      const eyeGeo = new THREE.SphereGeometry(0.095, 16, 16)
      eyeGeo.scale(1, 1.35, 0.5)
      leftEyeMesh = new THREE.Mesh(eyeGeo, eyeMat)
      leftEyeMesh.position.set(-0.22, 0.08, 0.69)
      rightEyeMesh = new THREE.Mesh(eyeGeo, eyeMat)
      rightEyeMesh.position.set(0.22, 0.08, 0.69)
      headGroup.add(leftEyeMesh, rightEyeMesh)

      // 4. Talking Mouth Indicator
      const mouthGeo = new THREE.CapsuleGeometry(0.06, 0.1, 8, 8)
      mouthGeo.rotateZ(Math.PI / 2)
      mouthMesh = new THREE.Mesh(mouthGeo, eyeMat)
      mouthMesh.position.set(0, -0.14, 0.67)
      headGroup.add(mouthMesh)

      // 5. Archetype Specifics (Fox Ears / Halo / Antenna)
      if (model === 'pyro_fox') {
        const earGeo = new THREE.ConeGeometry(0.24, 0.55, 16)
        const leftEar = new THREE.Mesh(earGeo, bodyMat)
        leftEar.position.set(-0.42, 0.68, 0)
        leftEar.rotation.z = 0.35
        const rightEar = new THREE.Mesh(earGeo, bodyMat)
        rightEar.position.set(0.42, 0.68, 0)
        rightEar.rotation.z = -0.35
        headGroup.add(leftEar, rightEar)
      } else {
        const ringGeo = new THREE.TorusGeometry(0.52, 0.04, 16, 48)
        ringGeo.rotateX(Math.PI / 2)
        haloRing = new THREE.Mesh(ringGeo, accentMat)
        haloRing.position.set(0, 0.82, 0)
        headGroup.add(haloRing)
      }

      // 6. Floating Articulated Hands
      const handGeo = new THREE.SphereGeometry(0.16, 16, 16)
      leftHand = new THREE.Mesh(handGeo, accentMat)
      leftHand.position.set(-0.88, -0.25, 0.2)
      rightHand = new THREE.Mesh(handGeo, accentMat)
      rightHand.position.set(0.88, -0.25, 0.2)
      rootGroup.add(leftHand, rightHand)

      // ── 7. RENDER 3D COSTUME / ACCESSORY ──
      costumeGroup = new THREE.Group()
      headGroup.add(costumeGroup)

      switch (costume) {
        case 'royal_crown': {
          // Sovereign Golden Crown with Gem
          const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.15, 24, 1, true), accentMat)
          crownBase.position.set(0, 0.72, 0)
          costumeGroup.add(crownBase)

          // 5 Golden Spikes
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), accentMat)
            spike.position.set(Math.cos(angle) * 0.4, 0.88, Math.sin(angle) * 0.4)
            costumeGroup.add(spike)
          }

          // Floating Ruby / Mana Gem
          const gemMat = new THREE.MeshBasicMaterial({ color: 0xef4444 })
          const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), gemMat)
          gem.position.set(0, 0.88, 0.42)
          costumeGroup.add(gem)
          break
        }

        case 'cyber_visor': {
          // Holographic AR Tactical Glasses
          const visorMatAR = new THREE.MeshBasicMaterial({
            color: palette.glow,
            wireframe: true,
            transparent: true,
            opacity: 0.85,
          })
          const visorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.1), visorMatAR)
          visorGlass.position.set(0, 0.08, 0.72)
          costumeGroup.add(visorGlass)
          break
        }

        case 'samurai_crest': {
          // Shogun Helmet Crest (Kabuto Horn)
          const crestMat = new THREE.MeshStandardMaterial({ color: palette.accent, metalness: 0.95, roughness: 0.1 })
          const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.45, 8), crestMat)
          hornL.position.set(-0.25, 0.85, 0.2)
          hornL.rotation.z = 0.5
          hornL.rotation.x = -0.2

          const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.45, 8), crestMat)
          hornR.position.set(0.25, 0.85, 0.2)
          hornR.rotation.z = -0.5
          hornR.rotation.x = -0.2
          costumeGroup.add(hornL, hornR)
          break
        }

        case 'wizard_hat': {
          // Arcane Star-Weaver Hat
          const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.5 })
          const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.04, 32), hatMat)
          brim.position.set(0, 0.68, 0)
          const cone = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.9, 24), hatMat)
          cone.position.set(0, 1.15, -0.05)
          cone.rotation.x = -0.15
          costumeGroup.add(brim, cone)
          break
        }

        case 'pro_headphones': {
          // Studio Deep-Focus Headphones
          const bandMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8 })
          const band = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.04, 16, 32, Math.PI), bandMat)
          band.rotation.z = Math.PI
          band.position.set(0, 0.35, 0)

          const earpadMat = new THREE.MeshStandardMaterial({ color: palette.accent, metalness: 0.9 })
          const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16), earpadMat)
          earL.rotation.z = Math.PI / 2
          earL.position.set(-0.68, 0.15, 0)

          const earR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16), earpadMat)
          earR.rotation.z = Math.PI / 2
          earR.position.set(0.68, 0.15, 0)

          costumeGroup.add(band, earL, earR)
          break
        }

        case 'none':
        default:
          break
      }
    }

    buildCharacter()

    const clock = new THREE.Clock()
    let animFrameId: number
    let blinkTimer = 0

    const animate = () => {
      animFrameId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()
      const state = animStateRef.current

      if (gltfMixer) gltfMixer.update(delta)

      // Eye blinking
      blinkTimer += delta
      const isBlinking = blinkTimer % 3.6 > 3.45
      if (leftEyeMesh && rightEyeMesh) {
        const targetScaleY = isBlinking ? 0.1 : state === 'FOCUS_MODE' ? 0.55 : 1.35
        leftEyeMesh.scale.y = THREE.MathUtils.lerp(leftEyeMesh.scale.y, targetScaleY, 0.3)
        rightEyeMesh.scale.y = THREE.MathUtils.lerp(rightEyeMesh.scale.y, targetScaleY, 0.3)
      }

      // Cursor Gaze
      const targetRotY = mouseRef.current.x * 0.45
      const targetRotX = -mouseRef.current.y * 0.3
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetRotY, 0.08)
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, targetRotX, 0.08)

      // Halo Rotation
      if (haloRing) {
        haloRing.rotation.z = elapsed * 1.2
      }

      // State Machine
      if (state === 'CELEBRATING') {
        rootGroup.position.y = Math.abs(Math.sin(elapsed * 9)) * 0.65
        rootGroup.rotation.y += delta * 8
        particleMat.opacity = 0.95
        const posArr = particleGeo.attributes.position.array as Float32Array
        for (let i = 0; i < particleCount; i++) {
          posArr[i * 3] += velocities[i].x * delta
          posArr[i * 3 + 1] += velocities[i].y * delta
          posArr[i * 3 + 2] += velocities[i].z * delta
          if (posArr[i * 3 + 1] > 2.2) {
            posArr[i * 3] = 0
            posArr[i * 3 + 1] = 0
            posArr[i * 3 + 2] = 0
          }
        }
        particleGeo.attributes.position.needsUpdate = true
      } else {
        rootGroup.rotation.y = THREE.MathUtils.lerp(rootGroup.rotation.y, 0, 0.1)
        particleMat.opacity = THREE.MathUtils.lerp(particleMat.opacity, 0, 0.1)

        if (state === 'WALKING') {
          rootGroup.position.y = Math.abs(Math.sin(elapsed * 12)) * 0.25
          rootGroup.rotation.z = Math.sin(elapsed * 12) * 0.12
        } else if (state === 'FOCUS_MODE') {
          rootGroup.position.y = Math.sin(elapsed * 1.5) * 0.06 - 0.15
          rootGroup.rotation.z = 0
        } else {
          // IDLE or TALKING
          rootGroup.position.y = Math.sin(elapsed * 2.6) * 0.12
          rootGroup.rotation.z = 0
        }
      }

      // Talking Pulse
      if (mouthMesh) {
        if (state === 'TALKING') {
          const pulse = 0.6 + Math.abs(Math.sin(elapsed * 18)) * 1.6
          mouthMesh.scale.set(1, pulse, 1)
        } else {
          mouthMesh.scale.set(1, 0.35, 1)
        }
      }

      if (leftHand && rightHand) {
        const handWave = state === 'TALKING' ? Math.sin(elapsed * 10) * 0.22 : Math.sin(elapsed * 2.6) * 0.08
        leftHand.position.y = -0.25 + handWave
        rightHand.position.y = -0.25 - handWave
      }

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animFrameId)
      renderer.dispose()
    }
  }, [settings.model, settings.costume, settings.colorTheme, settings.customGlbUrl, settings.isMinimized, stageWidth, stageHeight])

  // Custom Blender .GLB Upload
  const handleGlbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setModel('custom_glb', objectUrl)
    speak(`Loaded custom 3D model "${file.name}" into the Sanctuary!`, 4000)
  }

  // Unified Quick Chat Query
  const handleQuickChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickInput.trim() || isSendingQuick) return

    const msg = quickInput.trim()
    setQuickInput('')
    setIsSendingQuick(true)

    try {
      const tasks = useTaskStore.getState().tasks
      const activeTasks = tasks.filter((t) => t.status !== 'done')
      const urgentTasks = activeTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high')
      const habits = useHabitStore.getState().habits
      const userName = useAppStore.getState().preferences?.displayName || 'Explorer'
      const localKey =
        typeof window !== 'undefined' ? localStorage.getItem('nexora_gemini_api_key') || undefined : undefined

      const history = messages.slice(-4).map((m) => ({ sender: m.sender, text: m.text }))

      const res = await fetch('/api/kyro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          userApiKey: localKey,
          history,
          context: {
            userName,
            activeTasksCount: activeTasks.length,
            urgentTasks,
            habitsSummary: `${habits.length} active habits`,
            focusMinutesToday: 25,
          },
        }),
      })

      const data = await res.json()

      setProviderTelemetry(data.provider, data.latencyMs, data.errorReason)

      const speech = data.speechBubble || data.reply || 'Standing by, Boss!'
      speak(speech, settings.isPinned ? 0 : 12000)

      // Add to full unified chat history
      useKyroStore.setState((s) => ({
        messages: [
          ...s.messages,
          {
            id: 'user_' + Date.now(),
            sender: 'user',
            text: msg,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'kyro_' + (Date.now() + 1),
            sender: 'kyro',
            text: data.reply || speech,
            timestamp: new Date().toISOString(),
          },
        ],
      }))
    } catch {
      setProviderTelemetry('local-context-engine', 1, 'Network exception')
      speak('Standing by at your command, Boss! Check your Task Matrix for the next priority.', 5000)
    } finally {
      setIsSendingQuick(false)
    }
  }

  // In-App Key Tester
  const handleTestApiKey = async () => {
    setIsTestingKey(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/kyro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Telemetry uplink ping.',
          userApiKey: tempApiKey.trim() || undefined,
          context: { userName: 'Explorer', agentName: 'Kyro' },
        }),
      })
      const data = await res.json()
      setProviderTelemetry(data.provider, data.latencyMs, data.errorReason)

      if (data.provider === 'gemini-2.5-flash') {
        setTestResult(`SUCCESS (⚡ Gemini 2.5 Flash • ${data.latencyMs}ms): "${data.speechBubble || data.reply}"`)
        toast.success(`Gemini 2.5 Flash connected (${data.latencyMs}ms)!`)
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexora_gemini_api_key', tempApiKey.trim())
        }
      } else {
        setTestResult(`NOTICE (0ms Local Brain fallback): ${data.errorReason || 'Using local engine'}`)
        toast.info('Operating on 0ms Local Context Engine.')
      }
    } catch (e: any) {
      setTestResult(`FAILED: ${e.message}`)
      toast.error('Test ping failed.')
    } finally {
      setIsTestingKey(false)
    }
  }

  // Hydration barrier: do not render on server
  if (!mounted) {
    return null
  }

  // Compute position
  const positionStyle: React.CSSProperties = customPosition
    ? { left: `${customPosition.x}px`, top: `${customPosition.y}px` }
    : settings.anchor === 'bottom-left'
    ? { left: '20px', bottom: '24px' }
    : settings.anchor === 'top-right'
    ? { right: '20px', top: '80px' }
    : { right: '20px', bottom: '24px' }

  // Minimized Pill
  if (settings.isMinimized) {
    return (
      <div ref={containerRef} style={positionStyle} className="fixed z-50 pointer-events-auto">
        <button
          onClick={toggleMinimized}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-stone-950/90 border border-amber-500/40 text-stone-100 shadow-xl hover:border-amber-400 transition-all cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider uppercase text-amber-300">Kyro 3D Active</span>
          <Maximize2 className="w-3.5 h-3.5 text-stone-400" />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={positionStyle}
      className="fixed z-50 flex flex-col items-end pointer-events-none select-none transition-transform duration-75"
    >
      {/* Hidden File Input */}
      <input
        id="kyro-glb-upload-input"
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleGlbUpload}
        className="hidden"
      />

      {/* ── PERSISTENT LIQUID GLASS SPEECH BUBBLE & CONVERSATION SCROLL ── */}
      {speechBubbleVisible && (
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`pointer-events-auto mb-2 ${
            isCompact ? 'w-64 max-w-[84vw] p-2.5 text-xs' : 'w-80 sm:w-96 p-3.5'
          } rounded-2xl bg-stone-950/95 backdrop-blur-2xl border border-amber-500/35 shadow-2xl transition-all`}
        >
          {/* Header with Provider Telemetry Badge & Pin Toggle */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-stone-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                Kyro · {settings.model.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Telemetry Badge */}
              {lastProvider === 'gemini-2.5-flash' ? (
                <span
                  title={`Live Gemini 2.5 Flash response in ${lastLatencyMs}ms`}
                  className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[9px] font-bold flex items-center gap-1"
                >
                  <Zap className="w-2.5 h-2.5 text-emerald-400" />
                  <span>GEMINI 2.5 FLASH • {lastLatencyMs}ms</span>
                </span>
              ) : (
                <button
                  onClick={() => setKeyModalOpen(true)}
                  title="Running on 0ms Local Brain. Click to configure free Gemini Key!"
                  className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[9px] font-bold flex items-center gap-1 cursor-pointer hover:bg-amber-500/25 transition-colors"
                >
                  <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
                  <span>LOCAL BRAIN (0ms)</span>
                </button>
              )}

              {/* Pin / Unpin Button */}
              <button
                onClick={togglePinned}
                title={settings.isPinned ? 'Unpin Speech Bubble' : 'Pin Speech Bubble Always Open'}
                className="p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                {settings.isPinned ? <Pin className="w-3.5 h-3.5 text-amber-400" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>

              {/* Close Button */}
              <button
                onClick={dismissSpeech}
                className="p-1 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Expandable Conversation History Scroll */}
          {showHistory && (
            <div
              ref={chatScrollRef}
              className="max-h-36 overflow-y-auto mb-2 p-2 rounded-xl bg-stone-900/60 border border-stone-800/80 space-y-1.5 text-xs font-sans"
            >
              {messages.slice(-4).map((msg) => (
                <div
                  key={msg.id}
                  className={`p-1.5 rounded-lg ${
                    msg.sender === 'user' ? 'bg-amber-400/10 text-amber-200 ml-4' : 'bg-stone-800/60 text-stone-300 mr-4'
                  }`}
                >
                  <span className="font-bold text-[10px] block text-stone-400">
                    {msg.sender === 'user' ? 'You' : 'Kyro'}
                  </span>
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Current Active Typewriter Speech */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs sm:text-[13px] leading-relaxed text-stone-200 font-medium">
              {displayedText || activeSpeech}
            </p>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="shrink-0 text-[10px] text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
            >
              {showHistory ? 'Hide' : 'History'}
            </button>
          </div>

          {/* Action Chips */}
          {actionChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-stone-800/80">
              {actionChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => handleActionChip(chip)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-all cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Direct J.A.R.V.I.S. Command Bar */}
          <form onSubmit={handleQuickChatSubmit} className="mt-2.5 flex items-center gap-1.5">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Ask Kyro anything..."
              className="flex-1 bg-stone-900/90 border border-stone-800 focus:border-amber-500/50 rounded-lg px-2.5 py-1 text-xs text-stone-100 placeholder:text-stone-500 outline-none"
            />
            <button
              type="submit"
              disabled={isSendingQuick}
              className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-colors cursor-pointer"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}

      {/* ── 3D WEBGL COMPANION STAGE ── */}
      <div className="relative pointer-events-auto group">
        <div
          ref={mountRef}
          onClick={() => {
            speak('Standing by at your side, Boss! What objective shall we tackle next?', 5000, [
              { id: 'next', label: '🎯 What next?', action: 'ask_next_task' },
              { id: 'focus', label: '⚡ 25m Focus', action: 'start_focus' },
              { id: 'wardrobe', label: '🎨 Wardrobe', action: 'open_wardrobe' },
            ])
          }}
          style={{ width: `${stageWidth}px`, height: `${stageHeight}px` }}
          className="cursor-pointer"
          title="Click to talk to Kyro"
        />

        {/* ── FLOATING MINI CONTROL DECK ── */}
        <div className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-full bg-stone-950/95 backdrop-blur-md border border-stone-800 shadow-xl">
          {/* Drag Handle (Scoped Pointer & Touch Dragging) */}
          <button
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
              e.preventDefault()
              startDrag(e.clientX, e.clientY)
            }}
            onTouchStart={(e) => {
              if (e.touches[0]) {
                startDrag(e.touches[0].clientX, e.touches[0].clientY)
              }
            }}
            onDoubleClick={() => {
              setCustomPosition(null)
              toast.info('Companion snapped back to anchor corner')
            }}
            className={`p-1 transition-colors cursor-grab active:cursor-grabbing ${
              isDragging ? 'text-amber-400' : 'text-stone-400 hover:text-amber-400'
            }`}
            title="Drag Kyro anywhere (Double-click to reset to corner)"
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          {/* Reset position to anchor corner if customized */}
          {customPosition && (
            <button
              onClick={() => {
                setCustomPosition(null)
                toast.info('Companion re-anchored to screen corner')
              }}
              className="p-1 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              title="Snap back to default screen corner"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 3D Wardrobe & Colors Popover Trigger */}
          <button
            onClick={() => setWardrobeOpen(!wardrobeOpen)}
            className="p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="3D Wardrobe & Color Themes"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          {/* Key & Diagnostics Modal Trigger */}
          <button
            onClick={() => setKeyModalOpen(true)}
            className="p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Gemini 2.5 Flash Neural Key & Diagnostics"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>

          {/* Upload Custom Blender .GLB */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Upload Custom Blender .GLB Model"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Voice */}
          <button
            onClick={toggleVoice}
            className={`p-1 transition-colors cursor-pointer ${
              settings.voiceEnabled ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Toggle Voice Output"
          >
            {settings.voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Full Chat Drawer */}
          <button
            onClick={toggleOpen}
            className="p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Open Full Command Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          {/* Minimize */}
          <button
            onClick={toggleMinimized}
            className="p-1 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            title="Minimize Companion"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 🎨 3D WARDROBE & COLOR THEMES POPOVER ── */}
      {wardrobeOpen && (
        <div className="pointer-events-auto absolute bottom-24 right-0 w-80 p-4 rounded-2xl bg-stone-950/98 border border-amber-500/40 shadow-2xl backdrop-blur-2xl z-50 animate-in zoom-in-95 duration-150 space-y-3.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-stone-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
              3D Wardrobe &amp; Palette Studio
            </span>
            <button onClick={() => setWardrobeOpen(false)} className="text-stone-400 hover:text-stone-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 1. Base Archetype */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase">3D Archetype</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'kyro_prime', label: 'Kyro Prime', icon: '✨' },
                { id: 'pyro_fox', label: 'Pyro Fox', icon: '🦊' },
                { id: 'aegis_bot', label: 'Aegis Bot', icon: '🤖' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id as KyroCharacterModel)}
                  className={`p-1.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                    settings.model === m.id
                      ? 'bg-amber-400 text-stone-950 font-bold'
                      : 'bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <span className="text-sm">{m.icon}</span>
                  <span className="text-[10px]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. 3D Costumes / Headgear */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase">3D Headgear &amp; Attire</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'none', label: 'Clean Default' },
                { id: 'royal_crown', label: 'Sovereign Crown' },
                { id: 'cyber_visor', label: 'AR Cyber Visor' },
                { id: 'samurai_crest', label: 'Shogun Crest' },
                { id: 'wizard_hat', label: 'Star Wizard Hat' },
                { id: 'pro_headphones', label: 'Studio Audio' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCostume(c.id as KyroCostume)}
                  className={`p-1.5 rounded-xl text-[10px] font-semibold text-center transition-all cursor-pointer ${
                    settings.costume === c.id
                      ? 'bg-amber-400 text-stone-950 font-bold shadow'
                      : 'bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Luxury 3D Color Themes */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase">Color Palette</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(KYRO_COLOR_THEMES) as KyroColorTheme[]).map((themeKey) => {
                const t = KYRO_COLOR_THEMES[themeKey]
                const isSelected = settings.colorTheme === themeKey
                return (
                  <button
                    key={themeKey}
                    onClick={() => setColorTheme(themeKey)}
                    className={`p-2 rounded-xl text-[11px] font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                        : 'border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.hexAccent }} />
                      <span>{t.name}</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 4. Stage Sizing (Mobile & Desktop Scale) */}
          <div className="space-y-1 pt-2 border-t border-stone-800">
            <label className="text-[10px] font-bold text-stone-400 uppercase">Stage Scale</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setScaleMode('compact')}
                className={`p-1.5 rounded-xl text-[10px] font-semibold text-center transition-all cursor-pointer ${
                  isCompact
                    ? 'bg-amber-400 text-stone-950 font-bold'
                    : 'bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800'
                }`}
              >
                Compact (125px)
              </button>
              <button
                type="button"
                onClick={() => setScaleMode('standard')}
                className={`p-1.5 rounded-xl text-[10px] font-semibold text-center transition-all cursor-pointer ${
                  !isCompact
                    ? 'bg-amber-400 text-stone-950 font-bold'
                    : 'bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800'
                }`}
              >
                Standard (190px)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 🔑 NEURAL KEY & GEMINI 2.5 FLASH DIAGNOSTICS MODAL ── */}
      {keyModalOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-stone-950 border border-amber-500/40 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-stone-100">Gemini 2.5 Flash Neural Key</h3>
              </div>
              <button onClick={() => setKeyModalOpen(false)} className="text-stone-400 hover:text-stone-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Equip Kyro with high-speed intelligence using your free Google AI Studio Gemini API key. Stored locally
              in device memory (`localStorage`) for desktop and Android APK use.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-300">Google AI Studio Key</label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-amber-400 underline hover:text-amber-300"
                >
                  Get Free Gemini Key ↗
                </a>
              </div>
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-400 text-xs text-stone-100 font-mono outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleTestApiKey}
                disabled={isTestingKey}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isTestingKey ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>{isTestingKey ? 'Pinging Gemini...' : 'Test Gemini 2.5 Flash'}</span>
              </button>

              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('nexora_gemini_api_key')
                    setTempApiKey('')
                    setProviderTelemetry('local-context-engine', 0, null)
                    toast.info('API key removed. Running on 0ms Local Brain.')
                  }
                }}
                className="py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear Key
              </button>
            </div>

            {testResult && (
              <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-xs font-mono text-stone-200">
                {testResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
