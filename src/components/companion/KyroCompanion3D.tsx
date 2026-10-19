'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Move,
  Send,
  X,
  MessageSquare,
  Pin,
  PinOff,
  Palette,
  Zap,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'
import { useKyroStore } from '@/store/kyroStore'
import { useKyroBrain } from '@/hooks/useKyroBrain'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useAppStore } from '@/store/appStore'
import { KYRO_COLOR_THEMES } from '@/types/kyro'
import { toast } from 'sonner'

export function KyroCompanion3D() {
  const router = useRouter()
  const mountRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)

  const {
    animationState,
    activeSpeech,
    speechBubbleVisible,
    actionChips,
    settings,
    customPosition,
    lastProvider,
    lastLatencyMs,
    messages,
    speak,
    dismissSpeech,
    setCustomPosition,
    toggleMinimized,
    togglePinned,
    toggleVoice,
    toggleOpen,
    setProviderTelemetry,
  } = useKyroStore()

  const { handleActionChip } = useKyroBrain()

  const [mounted, setMounted] = useState(false)
  const [quickInput, setQuickInput] = useState('')
  const [isSendingQuick, setIsSendingQuick] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Responsive mobile scaling & Android APK detection
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return
      const isSmall = window.innerWidth < 640
      const isNative = Boolean(
        (window as unknown as { NexoraNativeBridge?: { isNative?: () => boolean } }).NexoraNativeBridge?.isNative?.() ||
          (window as unknown as { NexoraNativeBridge?: unknown }).NexoraNativeBridge ||
          /NexoraNativeAndroid/i.test(navigator.userAgent)
      )
      setIsMobile(isSmall || isNative)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Ultra-compact 95x110 on mobile/APK to never obstruct UI; 160x180 on desktop
  const stageWidth = isMobile ? 95 : 160
  const stageHeight = isMobile ? 110 : 180

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
      const maxX = Math.max(8, window.innerWidth - stageWidth - 12)
      const maxY = Math.max(8, window.innerHeight - stageHeight - 16)
      const newX = Math.max(8, Math.min(maxX, e.clientX - offsetX))
      const newY = Math.max(8, Math.min(maxY, e.clientY - offsetY))
      setCustomPosition({ x: newX, y: newY })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !e.touches[0]) return
      e.preventDefault()
      const touch = e.touches[0]
      const maxX = Math.max(8, window.innerWidth - stageWidth - 12)
      const maxY = Math.max(8, window.innerHeight - stageHeight - 16)
      const newX = Math.max(8, Math.min(maxX, touch.clientX - offsetX))
      const newY = Math.max(8, Math.min(maxY, touch.clientY - offsetY))
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
    if (!mounted) return
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
    const particleCount = 40
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
      costumeGroup = new THREE.Group()
      headGroup.add(costumeGroup)
      rootGroup.add(headGroup)

      const activePalette = KYRO_COLOR_THEMES[colorThemeRef.current] || KYRO_COLOR_THEMES.obsidian_gold
      const primaryColor = new THREE.Color(activePalette.hexAccent)
      const secondaryColor = new THREE.Color(activePalette.hexBody)
      const eyeColor = new THREE.Color(activePalette.hexGlow)

      rimLight.color = primaryColor

      const model = modelTypeRef.current

      // Custom GLB support
      if (model === 'custom_glb' && customGlbRef.current) {
        const loader = new GLTFLoader()
        loader.load(
          customGlbRef.current,
          (gltf) => {
            const loadedScene = gltf.scene
            const box = new THREE.Box3().setFromObject(loadedScene)
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z) || 1
            loadedScene.scale.setScalar(2.0 / maxDim)
            const center = box.getCenter(new THREE.Vector3())
            loadedScene.position.sub(center.multiplyScalar(2.0 / maxDim))
            rootGroup.add(loadedScene)
            if (gltf.animations && gltf.animations.length > 0) {
              gltfMixer = new THREE.AnimationMixer(loadedScene)
              gltfMixer.clipAction(gltf.animations[0]).play()
            }
          },
          undefined,
          () => {
            buildProcedural('kyro_prime', primaryColor, secondaryColor, eyeColor)
            buildCostume(costumeRef.current, primaryColor, eyeColor)
          }
        )
        return
      }

      buildProcedural(model, primaryColor, secondaryColor, eyeColor)
      buildCostume(costumeRef.current, primaryColor, eyeColor)
    }

    const buildProcedural = (
      type: string,
      primaryColor: THREE.Color,
      secondaryColor: THREE.Color,
      eyeColor: THREE.Color
    ) => {
      const darkBodyMat = new THREE.MeshStandardMaterial({
        color: secondaryColor,
        roughness: 0.25,
        metalness: 0.75,
      })

      const accentMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.2,
        metalness: 0.9,
        emissive: primaryColor,
        emissiveIntensity: 0.28,
      })

      const eyeGlowMat = new THREE.MeshBasicMaterial({
        color: eyeColor,
      })

      const mouthGlowMat = new THREE.MeshBasicMaterial({
        color: primaryColor,
      })

      if (type === 'pyro_fox') {
        // Fox Spirit Head
        const headGeo = new THREE.SphereGeometry(0.68, 32, 32)
        const headMesh = new THREE.Mesh(headGeo, accentMat)
        headGroup.add(headMesh)

        const snoutGeo = new THREE.ConeGeometry(0.26, 0.45, 16)
        const snoutMesh = new THREE.Mesh(snoutGeo, darkBodyMat)
        snoutMesh.rotation.x = Math.PI / 2
        snoutMesh.position.set(0, -0.1, 0.68)
        headGroup.add(snoutMesh)

        const earGeo = new THREE.ConeGeometry(0.24, 0.65, 16)
        const leftEar = new THREE.Mesh(earGeo, darkBodyMat)
        leftEar.position.set(-0.42, 0.68, 0)
        leftEar.rotation.z = 0.28
        const rightEar = new THREE.Mesh(earGeo, darkBodyMat)
        rightEar.position.set(0.42, 0.68, 0)
        rightEar.rotation.z = -0.28
        headGroup.add(leftEar, rightEar)

        const bodyGeo = new THREE.ConeGeometry(0.48, 0.9, 24)
        const bodyMesh = new THREE.Mesh(bodyGeo, darkBodyMat)
        bodyMesh.position.set(0, -0.78, 0)
        rootGroup.add(bodyMesh)
      } else if (type === 'aegis_bot') {
        // Mecha Sentinel Head
        const headGeo = new THREE.BoxGeometry(1.12, 0.88, 0.95)
        const headMesh = new THREE.Mesh(headGeo, darkBodyMat)
        headGroup.add(headMesh)

        const trimGeo = new THREE.BoxGeometry(1.16, 0.12, 0.98)
        const trimMesh = new THREE.Mesh(trimGeo, accentMat)
        trimMesh.position.set(0, 0.35, 0)
        headGroup.add(trimMesh)

        const torsoGeo = new THREE.CylinderGeometry(0.45, 0.28, 0.82, 8)
        const torsoMesh = new THREE.Mesh(torsoGeo, accentMat)
        torsoMesh.position.set(0, -0.82, 0)
        rootGroup.add(torsoMesh)
      } else {
        // Default: Kyro Prime (Cyber Spirit)
        const headGeo = new THREE.SphereGeometry(0.66, 32, 32)
        const headMesh = new THREE.Mesh(headGeo, darkBodyMat)
        headGroup.add(headMesh)

        const visorGeo = new THREE.SphereGeometry(0.58, 32, 16)
        const visorMat = new THREE.MeshStandardMaterial({
          color: 0x050505,
          roughness: 0.1,
          metalness: 0.95,
        })
        const visorMesh = new THREE.Mesh(visorGeo, visorMat)
        visorMesh.position.set(0, 0.03, 0.15)
        headGroup.add(visorMesh)

        const earGeo = new THREE.ConeGeometry(0.16, 0.48, 16)
        const leftAntenna = new THREE.Mesh(earGeo, accentMat)
        leftAntenna.position.set(-0.48, 0.56, 0)
        leftAntenna.rotation.z = 0.38
        const rightAntenna = new THREE.Mesh(earGeo, accentMat)
        rightAntenna.position.set(0.48, 0.56, 0)
        rightAntenna.rotation.z = -0.38
        headGroup.add(leftAntenna, rightAntenna)

        const ringGeo = new THREE.TorusGeometry(0.92, 0.032, 16, 64)
        haloRing = new THREE.Mesh(ringGeo, accentMat)
        haloRing.rotation.x = Math.PI / 2.3
        haloRing.position.set(0, 0.25, -0.15)
        rootGroup.add(haloRing)

        const coreGeo = new THREE.OctahedronGeometry(0.36, 1)
        const coreMesh = new THREE.Mesh(coreGeo, accentMat)
        coreMesh.position.set(0, -0.78, 0)
        rootGroup.add(coreMesh)
      }

      // Expressive Eyes
      const eyeGeo = new THREE.SphereGeometry(0.095, 16, 16)
      leftEyeMesh = new THREE.Mesh(eyeGeo, eyeGlowMat)
      leftEyeMesh.scale.set(1, 1.35, 0.5)
      leftEyeMesh.position.set(-0.22, 0.08, 0.68)

      rightEyeMesh = new THREE.Mesh(eyeGeo, eyeGlowMat)
      rightEyeMesh.scale.set(1, 1.35, 0.5)
      rightEyeMesh.position.set(0.22, 0.08, 0.68)
      headGroup.add(leftEyeMesh, rightEyeMesh)

      // Expressive Talking Mouth
      const mouthGeo = new THREE.BoxGeometry(0.18, 0.045, 0.04)
      mouthMesh = new THREE.Mesh(mouthGeo, mouthGlowMat)
      mouthMesh.position.set(0, -0.15, 0.69)
      headGroup.add(mouthMesh)

      // Floating Chibi Hands
      const handGeo = new THREE.SphereGeometry(0.13, 16, 16)
      leftHand = new THREE.Mesh(handGeo, accentMat)
      leftHand.position.set(-0.82, -0.25, 0.25)
      rightHand = new THREE.Mesh(handGeo, accentMat)
      rightHand.position.set(0.82, -0.25, 0.25)
      rootGroup.add(leftHand, rightHand)
    }

    // ── 3D HEADGEAR & COSTUME BUILDER ──
    const buildCostume = (costume: string, primaryColor: THREE.Color, eyeColor: THREE.Color) => {
      if (!costumeGroup) return
      while (costumeGroup.children.length > 0) {
        costumeGroup.remove(costumeGroup.children[0])
      }

      const goldMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.15,
        metalness: 0.95,
        emissive: primaryColor,
        emissiveIntensity: 0.35,
      })

      switch (costume) {
        case 'royal_crown': {
          const baseGeo = new THREE.CylinderGeometry(0.36, 0.32, 0.18, 24)
          const baseMesh = new THREE.Mesh(baseGeo, goldMat)
          baseMesh.position.set(0, 0.72, 0)
          costumeGroup.add(baseMesh)

          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2
            const spikeGeo = new THREE.ConeGeometry(0.08, 0.22, 8)
            const spike = new THREE.Mesh(spikeGeo, goldMat)
            spike.position.set(Math.cos(angle) * 0.28, 0.88, Math.sin(angle) * 0.28)
            costumeGroup.add(spike)
          }
          break
        }

        case 'cyber_visor': {
          const visorGeo = new THREE.BoxGeometry(0.92, 0.24, 0.35)
          const visorMat = new THREE.MeshStandardMaterial({
            color: eyeColor,
            emissive: eyeColor,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.78,
            roughness: 0.1,
          })
          const visor = new THREE.Mesh(visorGeo, visorMat)
          visor.position.set(0, 0.1, 0.58)
          costumeGroup.add(visor)
          break
        }

        case 'samurai_crest': {
          const centerGeo = new THREE.OctahedronGeometry(0.16, 0)
          const centerGem = new THREE.Mesh(centerGeo, goldMat)
          centerGem.position.set(0, 0.62, 0.55)
          costumeGroup.add(centerGem)

          const hornGeo = new THREE.ConeGeometry(0.09, 0.75, 12)
          const leftHorn = new THREE.Mesh(hornGeo, goldMat)
          leftHorn.position.set(-0.32, 0.85, 0.45)
          leftHorn.rotation.z = 0.55

          const rightHorn = new THREE.Mesh(hornGeo, goldMat)
          rightHorn.position.set(0.32, 0.85, 0.45)
          rightHorn.rotation.z = -0.55

          costumeGroup.add(leftHorn, rightHorn)
          break
        }

        case 'wizard_hat': {
          const hatMat = new THREE.MeshStandardMaterial({
            color: 0x1e1b4b,
            roughness: 0.4,
            metalness: 0.3,
          })
          const brimGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.05, 24)
          const brim = new THREE.Mesh(brimGeo, hatMat)
          brim.position.set(0, 0.65, 0)

          const coneGeo = new THREE.ConeGeometry(0.42, 0.85, 24)
          const cone = new THREE.Mesh(coneGeo, hatMat)
          cone.position.set(0, 1.05, -0.05)
          cone.rotation.x = -0.15

          const bandGeo = new THREE.TorusGeometry(0.38, 0.04, 12, 32)
          const band = new THREE.Mesh(bandGeo, goldMat)
          band.rotation.x = Math.PI / 2
          band.position.set(0, 0.7, 0)

          costumeGroup.add(brim, cone, band)
          break
        }

        case 'pro_headphones': {
          const bandGeo = new THREE.TorusGeometry(0.68, 0.055, 12, 32, Math.PI)
          const band = new THREE.Mesh(bandGeo, goldMat)
          band.position.set(0, 0.08, 0)

          const earpadMat = new THREE.MeshStandardMaterial({
            color: eyeColor,
            emissive: eyeColor,
            emissiveIntensity: 0.5,
          })
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

      // Cursor Gaze (Strictly rotates 3D head Group inside WebGL canvas)
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
  }, [
    mounted,
    settings.model,
    settings.costume,
    settings.colorTheme,
    settings.customGlbUrl,
    settings.isMinimized,
    stageWidth,
    stageHeight,
  ])

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
      speak(speech, settings.isPinned ? 0 : 10000)

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

  // Hydration barrier: do not render on server
  if (!mounted) {
    return null
  }

  // Compute position: tucked neatly above bottom nav on mobile/APK, anchored to corner on desktop
  const defaultBottom = isMobile ? '74px' : '24px'
  const defaultSide = isMobile ? '10px' : '20px'

  const positionStyle: React.CSSProperties = customPosition
    ? { left: `${customPosition.x}px`, top: `${customPosition.y}px` }
    : settings.anchor === 'bottom-left'
    ? { left: defaultSide, bottom: defaultBottom }
    : settings.anchor === 'top-right'
    ? { right: defaultSide, top: isMobile ? '68px' : '80px' }
    : { right: defaultSide, bottom: defaultBottom }

  // Minimized Pill
  if (settings.isMinimized) {
    return (
      <div ref={containerRef} style={positionStyle} className="fixed z-40 pointer-events-auto">
        <button
          onClick={toggleMinimized}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-950/90 border border-amber-500/40 text-stone-100 shadow-xl hover:border-amber-400 transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-300">Kyro 3D</span>
          <Maximize2 className="w-3 h-3 text-stone-400" />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={positionStyle}
      className="fixed z-40 flex flex-col items-end pointer-events-none select-none"
    >
      {/* ── STREAMLINED LIQUID GLASS SPEECH BUBBLE ── */}
      {speechBubbleVisible && (
        <div
          className={`pointer-events-auto mb-1.5 ${
            isMobile ? 'w-60 max-w-[78vw] p-2.5 text-[11px]' : 'w-72 sm:w-80 p-3 text-xs'
          } rounded-2xl bg-stone-950/95 backdrop-blur-2xl border border-amber-500/35 shadow-2xl transition-all`}
        >
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-stone-800/80">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 font-mono truncate max-w-[110px]">
                Kyro · {settings.model.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Telemetry Badge */}
              {lastProvider === 'gemini-2.5-flash' ? (
                <span
                  title={`Live Gemini 2.5 Flash (${lastLatencyMs}ms)`}
                  className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[8px] font-bold flex items-center gap-0.5"
                >
                  <Zap className="w-2 h-2 text-emerald-400" />
                  <span>{lastLatencyMs}ms</span>
                </span>
              ) : (
                <button
                  onClick={() => router.push('/character')}
                  title="Configure Gemini 2.5 Flash Key in Atelier"
                  className="px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[8px] font-bold flex items-center gap-0.5 cursor-pointer hover:bg-amber-500/25"
                >
                  <ShieldCheck className="w-2 h-2 text-amber-400" />
                  <span>0ms</span>
                </button>
              )}

              {/* Pin / Unpin */}
              <button
                onClick={togglePinned}
                title={settings.isPinned ? 'Unpin Bubble' : 'Pin Bubble Open'}
                className="p-0.5 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                {settings.isPinned ? (
                  <Pin className="w-3 h-3 text-amber-400" />
                ) : (
                  <PinOff className="w-3 h-3" />
                )}
              </button>

              {/* Close Bubble */}
              <button
                onClick={dismissSpeech}
                className="p-0.5 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Expandable Conversation History Scroll */}
          {showHistory && (
            <div
              ref={chatScrollRef}
              className="max-h-28 overflow-y-auto mb-1.5 p-1.5 rounded-xl bg-stone-900/60 border border-stone-800/80 space-y-1 text-[11px]"
            >
              {messages.slice(-4).map((msg) => (
                <div
                  key={msg.id}
                  className={`p-1.5 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-amber-400/10 text-amber-200 ml-3'
                      : 'bg-stone-800/60 text-stone-300 mr-3'
                  }`}
                >
                  <span className="font-bold text-[9px] block text-stone-400">
                    {msg.sender === 'user' ? 'You' : 'Kyro'}
                  </span>
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Active Typewriter Speech */}
          <div className="flex items-start justify-between gap-1.5">
            <p className="text-[11px] sm:text-xs leading-snug text-stone-200 font-medium">
              {displayedText || activeSpeech}
            </p>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="shrink-0 text-[9px] text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
            >
              {showHistory ? 'Hide' : 'Log'}
            </button>
          </div>

          {/* Action Chips */}
          {actionChips.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-stone-800/80">
              {actionChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => {
                    if (chip.action === 'open_wardrobe') {
                      router.push('/character')
                    } else {
                      handleActionChip(chip)
                    }
                  }}
                  className="px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-semibold transition-all cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Direct Command Input */}
          <form onSubmit={handleQuickChatSubmit} className="mt-2 flex items-center gap-1">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Ask Kyro..."
              className="flex-1 min-w-0 bg-stone-900/90 border border-stone-800 focus:border-amber-500/50 rounded-lg px-2 py-1 text-[11px] text-stone-100 placeholder:text-stone-500 outline-none"
            />
            <button
              type="submit"
              disabled={isSendingQuick}
              className="p-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}

      {/* ── ULTRA-COMPACT 3D WEBGL COMPANION STAGE ── */}
      <div className="relative pointer-events-auto flex flex-col items-center">
        <div
          ref={mountRef}
          onClick={() => {
            speak('Standing by at your side, Boss! What objective shall we tackle next?', 6000, [
              { id: 'next', label: '🎯 Next Task', action: 'ask_next_task' },
              { id: 'focus', label: '⚡ 25m Focus', action: 'start_focus' },
              { id: 'wardrobe', label: '🎨 Atelier', action: 'open_wardrobe' },
            ])
          }}
          style={{ width: `${stageWidth}px`, height: `${stageHeight}px` }}
          className="cursor-pointer"
          title="Tap Kyro for tactical guidance"
        />

        {/* ── STREAMLINED MINI CONTROL BAR ── */}
        <div className="flex items-center justify-center gap-0.5 px-2 py-1 rounded-full bg-stone-950/90 backdrop-blur-md border border-stone-800/90 shadow-lg">
          {/* Scoped Drag Handle */}
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
              toast.info('Snapped back to corner')
            }}
            className={`p-1 transition-colors cursor-grab active:cursor-grabbing ${
              isDragging ? 'text-amber-400' : 'text-stone-400 hover:text-amber-400'
            }`}
            title="Drag Kyro (Double-tap to reset)"
          >
            <Move className="w-3 h-3" />
          </button>

          {/* Snap Back if Custom Positioned */}
          {customPosition && (
            <button
              onClick={() => {
                setCustomPosition(null)
                toast.info('Re-anchored to corner')
              }}
              className="p-1 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              title="Reset to corner"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}

          {/* Open Companion Atelier (/character) */}
          <button
            onClick={() => router.push('/character')}
            className="p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Open Companion Atelier (3D Models, Costumes, Shaders & Gemini Key)"
          >
            <Palette className="w-3 h-3" />
          </button>

          {/* Toggle Voice */}
          <button
            onClick={toggleVoice}
            className={`p-1 transition-colors cursor-pointer ${
              settings.voiceEnabled ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Toggle Voice Output"
          >
            {settings.voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          </button>

          {/* Full Chat Drawer */}
          <button
            onClick={toggleOpen}
            className="p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Open Full Command Chat"
          >
            <MessageSquare className="w-3 h-3" />
          </button>

          {/* Minimize */}
          <button
            onClick={toggleMinimized}
            className="p-1 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            title="Minimize Companion"
          >
            <Minimize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
