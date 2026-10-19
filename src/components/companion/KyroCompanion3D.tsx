'use client'

import React, { useEffect, useRef, useState } from 'react'
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
} from 'lucide-react'
import { useKyroStore } from '@/store/kyroStore'
import { useKyroBrain } from '@/hooks/useKyroBrain'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useAppStore } from '@/store/appStore'

export function KyroCompanion3D() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const {
    animationState,
    activeSpeech,
    speechBubbleVisible,
    actionChips,
    settings,
    customPosition,
    speak,
    dismissSpeech,
    setModel,
    setCustomPosition,
    toggleMinimized,
    toggleVoice,
    toggleOpen,
  } = useKyroStore()

  const { handleActionChip } = useKyroBrain()

  const [quickInput, setQuickInput] = useState('')
  const [isSendingQuick, setIsSendingQuick] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Keep refs updated for the 60FPS Three.js loop without causing re-renders
  const animStateRef = useRef(animationState)
  const modelTypeRef = useRef(settings.model)
  const customGlbRef = useRef(settings.customGlbUrl)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    animStateRef.current = animationState
  }, [animationState])

  useEffect(() => {
    modelTypeRef.current = settings.model
    customGlbRef.current = settings.customGlbUrl
  }, [settings.model, settings.customGlbUrl])

  // Typewriter Effect for Clash-of-Clans style Speech Bubble
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
    }, 18)
    return () => clearInterval(interval)
  }, [activeSpeech, speechBubbleVisible])

  // Track cursor for 3D eye/head gaze
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      }
      if (isDragging) {
        setCustomPosition({
          x: Math.max(16, Math.min(window.innerWidth - 220, e.clientX - dragOffset.current.x)),
          y: Math.max(16, Math.min(window.innerHeight - 260, e.clientY - dragOffset.current.y)),
        })
      }
    }
    const handleMouseUp = () => setIsDragging(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, setCustomPosition])

  // ── THREE.JS 60FPS WEBGL SCENE ──
  useEffect(() => {
    const container = mountRef.current
    if (!container || settings.isMinimized) return

    const width = 200
    const height = 220

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(0, 0.4, 4.2)

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.2)
    keyLight.position.set(3, 5, 4)
    scene.add(keyLight)

    const goldRimLight = new THREE.PointLight(0xd4a853, 3, 8)
    goldRimLight.position.set(-2, 1.5, -2)
    scene.add(goldRimLight)

    // Root Group for Character
    const characterRoot = new THREE.Group()
    scene.add(characterRoot)

    let headGroup = new THREE.Group()
    let leftEyeMesh: THREE.Mesh | null = null
    let rightEyeMesh: THREE.Mesh | null = null
    let mouthMesh: THREE.Mesh | null = null
    let haloRing: THREE.Mesh | null = null
    let leftHand: THREE.Mesh | null = null
    let rightHand: THREE.Mesh | null = null
    let gltfMixer: THREE.AnimationMixer | null = null

    // Confetti Particle System
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

    // Build Procedural Cartoon Companion or Load Custom GLB
    const buildCharacter = () => {
      while (characterRoot.children.length > 0) {
        characterRoot.remove(characterRoot.children[0])
      }
      headGroup = new THREE.Group()
      characterRoot.add(headGroup)
      gltfMixer = null

      const model = modelTypeRef.current
      const customUrl = customGlbRef.current

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
            // Fallback to Kyro Prime if GLB fails
            modelTypeRef.current = 'kyro_prime'
            buildCharacter()
          }
        )
        return
      }

      // Colors per archetype
      const palette =
        model === 'pyro_fox'
          ? { body: 0xea580c, accent: 0xfef08a, eye: 0x38bdf8 }
          : model === 'aegis_bot'
          ? { body: 0x334155, accent: 0x10b981, eye: 0x34d399 }
          : { body: 0x1c1917, accent: 0xd4a853, eye: 0x38bdf8 } // kyro_prime

      const bodyMat = new THREE.MeshStandardMaterial({
        color: palette.body,
        roughness: 0.25,
        metalness: 0.6,
      })
      const accentMat = new THREE.MeshStandardMaterial({
        color: palette.accent,
        emissive: palette.accent,
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.8,
      })
      const eyeMat = new THREE.MeshBasicMaterial({ color: palette.eye })

      // Head / Core
      const headGeo =
        model === 'aegis_bot'
          ? new THREE.BoxGeometry(1.15, 0.95, 1.0)
          : new THREE.SphereGeometry(0.68, 32, 32)
      const headMesh = new THREE.Mesh(headGeo, bodyMat)
      headGroup.add(headMesh)

      // Face Visor Plate
      const visorGeo = new THREE.SphereGeometry(0.58, 24, 24)
      visorGeo.scale(1, 0.75, 0.5)
      const visorMat = new THREE.MeshStandardMaterial({
        color: 0x09090b,
        roughness: 0.1,
        metalness: 0.9,
      })
      const visorMesh = new THREE.Mesh(visorGeo, visorMat)
      visorMesh.position.set(0, 0.02, 0.42)
      headGroup.add(visorMesh)

      // Expressive Cartoon Eyes
      const eyeGeo = new THREE.SphereGeometry(0.095, 16, 16)
      eyeGeo.scale(1, 1.35, 0.5)
      leftEyeMesh = new THREE.Mesh(eyeGeo, eyeMat)
      leftEyeMesh.position.set(-0.22, 0.08, 0.69)
      rightEyeMesh = new THREE.Mesh(eyeGeo, eyeMat)
      rightEyeMesh.position.set(0.22, 0.08, 0.69)
      headGroup.add(leftEyeMesh, rightEyeMesh)

      // Talking Mouth / Core Voice Indicator
      const mouthGeo = new THREE.CapsuleGeometry(0.06, 0.1, 8, 8)
      mouthGeo.rotateZ(Math.PI / 2)
      mouthMesh = new THREE.Mesh(mouthGeo, eyeMat)
      mouthMesh.position.set(0, -0.14, 0.67)
      headGroup.add(mouthMesh)

      // Archetype Specific Features (Fox Ears / Halo / Antenna)
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

      // Floating Chibi Hands
      const handGeo = new THREE.SphereGeometry(0.16, 16, 16)
      leftHand = new THREE.Mesh(handGeo, accentMat)
      leftHand.position.set(-0.88, -0.25, 0.2)
      rightHand = new THREE.Mesh(handGeo, accentMat)
      rightHand.position.set(0.88, -0.25, 0.2)
      characterRoot.add(leftHand, rightHand)
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

      // Natural Eye Blinking every ~3.5 seconds
      blinkTimer += delta
      const isBlinking = blinkTimer % 3.6 > 3.45
      if (leftEyeMesh && rightEyeMesh) {
        const targetScaleY = isBlinking ? 0.1 : state === 'FOCUS_MODE' ? 0.55 : 1.35
        leftEyeMesh.scale.y = THREE.MathUtils.lerp(leftEyeMesh.scale.y, targetScaleY, 0.3)
        rightEyeMesh.scale.y = THREE.MathUtils.lerp(rightEyeMesh.scale.y, targetScaleY, 0.3)
      }

      // Cursor Gaze Tracking
      const targetRotY = mouseRef.current.x * 0.45
      const targetRotX = -mouseRef.current.y * 0.3
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetRotY, 0.08)
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, targetRotX, 0.08)

      // Halo Rotation
      if (haloRing) {
        haloRing.rotation.z = elapsed * 1.2
      }

      // State Machine Animations
      if (state === 'CELEBRATING') {
        characterRoot.position.y = Math.abs(Math.sin(elapsed * 9)) * 0.65
        characterRoot.rotation.y += delta * 8
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
        characterRoot.rotation.y = THREE.MathUtils.lerp(characterRoot.rotation.y, 0, 0.1)
        particleMat.opacity = THREE.MathUtils.lerp(particleMat.opacity, 0, 0.1)

        if (state === 'WALKING') {
          characterRoot.position.y = Math.abs(Math.sin(elapsed * 12)) * 0.25
          characterRoot.rotation.z = Math.sin(elapsed * 12) * 0.12
        } else if (state === 'FOCUS_MODE') {
          characterRoot.position.y = Math.sin(elapsed * 1.5) * 0.06 - 0.15
          characterRoot.rotation.z = 0
        } else {
          // IDLE or TALKING breathing
          characterRoot.position.y = Math.sin(elapsed * 2.6) * 0.12
          characterRoot.rotation.z = 0
        }
      }

      // Talking Mouth & Hand Gestures
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
  }, [settings.model, settings.customGlbUrl, settings.isMinimized])

  // Handle Custom Blender .GLB Upload
  const handleGlbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setModel('custom_glb', objectUrl)
    speak(`Loaded custom 3D model "${file.name}" into the Sanctuary!`, 4000)
  }

  // Handle Quick Chat to Gemini 2.5 Flash API
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
      const localKey = typeof window !== 'undefined' ? localStorage.getItem('nexora_gemini_api_key') || undefined : undefined

      const res = await fetch('/api/kyro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          userApiKey: localKey,
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
      speak(data.speechBubble || data.reply || 'Standing by, Boss!', 6000)
    } catch {
      speak('Standing by at your command, Boss! Check your Task Matrix for the next priority.', 4000)
    } finally {
      setIsSendingQuick(false)
    }
  }

  // Compute screen coordinates
  const positionStyle: React.CSSProperties = customPosition
    ? { left: `${customPosition.x}px`, top: `${customPosition.y}px` }
    : settings.anchor === 'bottom-left'
    ? { left: '20px', bottom: '24px' }
    : settings.anchor === 'top-right'
    ? { right: '20px', top: '80px' }
    : { right: '20px', bottom: '24px' }

  if (settings.isMinimized) {
    return (
      <div style={positionStyle} className="fixed z-50 pointer-events-auto">
        <button
          onClick={toggleMinimized}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-stone-950/90 border border-amber-500/40 text-stone-100 shadow-xl hover:border-amber-400 transition-all cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider uppercase text-amber-300">Kyro Active</span>
          <Maximize2 className="w-3.5 h-3.5 text-stone-400" />
        </button>
      </div>
    )
  }

  return (
    <div
      style={positionStyle}
      className="fixed z-50 flex flex-col items-end pointer-events-none select-none"
    >
      {/* Hidden File Input for Custom Blender .GLB Models */}
      <input
        id="kyro-glb-upload-input"
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleGlbUpload}
        className="hidden"
      />

      {/* ── CLASH OF CLANS + JARVIS SPEECH BUBBLE ── */}
      {speechBubbleVisible && activeSpeech && (
        <div className="pointer-events-auto mb-2 w-72 sm:w-80 rounded-2xl bg-stone-950/95 backdrop-blur-xl border border-amber-500/35 p-3.5 shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Kyro • {settings.model.replace('_', ' ')}
              </span>
            </div>
            <button
              onClick={dismissSpeech}
              className="text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs sm:text-[13px] leading-relaxed text-stone-200 font-medium">
            {displayedText}
          </p>

          {/* Quick Action Chips */}
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

          {/* Direct Mini J.A.R.V.I.S. Command Input */}
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
            if (!speechBubbleVisible) {
              speak('Standing by at your side, Boss! What objective shall we tackle next?', 5000, [
                { id: 'next', label: '🎯 What next?', action: 'ask_next_task' },
                { id: 'focus', label: '⚡ 25m Focus', action: 'start_focus' },
                { id: 'switch', label: '🔄 Switch 3D Model', action: 'switch_model' },
              ])
            }
          }}
          className="w-[200px] h-[220px] cursor-pointer"
          title="Click to talk to Kyro"
        />

        {/* Floating Mini Control Deck */}
        <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/90 backdrop-blur-md border border-stone-800 shadow-lg">
          {/* Drag Handle */}
          <button
            onMouseDown={(e) => {
              const rect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect()
              if (rect) {
                dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
                setIsDragging(true)
              }
            }}
            className="p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-grab active:cursor-grabbing"
            title="Drag Kyro anywhere"
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          {/* Switch 3D Archetype (Kyro Prime / Pyro Fox / Aegis Bot) */}
          <button
            onClick={() =>
              handleActionChip({ id: 'switch', label: 'Switch', action: 'switch_model' })
            }
            className="p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Switch 3D Cartoon Companion"
          >
            <Bot className="w-3.5 h-3.5" />
          </button>

          {/* Upload Custom Blender .GLB */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Upload Custom Blender .GLB Model"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Toggle J.A.R.V.I.S. Voice Synthesis */}
          <button
            onClick={toggleVoice}
            className={`p-1 transition-colors cursor-pointer ${
              settings.voiceEnabled ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Toggle Voice Output"
          >
            {settings.voiceEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Open Full Kyro Chat Drawer */}
          <button
            onClick={toggleOpen}
            className="p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Open Full Command Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          {/* Minimize to Pill */}
          <button
            onClick={toggleMinimized}
            className="p-1 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            title="Minimize Companion"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
