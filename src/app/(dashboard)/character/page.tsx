'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useCharacterStore } from '@/store/characterStore'
import { useAppStore } from '@/store/appStore'
import { Companion } from '@/components/companion/Companion'
import { CompanionMood, CreatureArchetype, normalizeArchetype } from '@/components/companion/CompanionState'
import { ORIGINAL_CREATURES } from '@/components/companion/companion-data'
import {
  Sparkles,
  Shuffle,
  RotateCcw,
  Heart,
  Smile,
  Zap,
  Award,
  Crown,
  Check,
  Ear,
  Eye,
  MessageCircle,
  HelpCircle,
  Moon,
  BatteryCharging,
  Bot,
  Volume2,
  VolumeX,
  Upload,
  CheckCircle2,
  Palette,
  KeyRound,
  ShieldCheck,
  Sliders,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { useKyroStore } from '@/store/kyroStore'
import {
  KyroCharacterModel,
  KyroCostume,
  KyroColorTheme,
  KYRO_COLOR_THEMES,
  KyroAnimationState,
} from '@/types/kyro'
import { playChime } from '@/utils/soundEngine'
import { toast } from 'sonner'

const ARCHETYPE_CARDS: Array<{
  id: KyroCharacterModel
  name: string
  badge: string
  icon: string
  desc: string
}> = [
  {
    id: 'kyro_prime',
    name: 'Kyro Prime',
    badge: 'Cyber Spirit',
    icon: '✨',
    desc: 'Chibi Cyber-Spirit & J.A.R.V.I.S. Core with expressive gaze-tracking eyes, floating hands, and sovereign halo ring.',
  },
  {
    id: 'pyro_fox',
    name: 'Pyro Fox',
    badge: 'Elemental Guardian',
    icon: '🦊',
    desc: 'Stylized elemental creature with twin fox ears, sculpted snout, and reactive ember geometry.',
  },
  {
    id: 'aegis_bot',
    name: 'Aegis Bot',
    badge: 'Mecha Sentinel',
    icon: '🤖',
    desc: 'Armored tactical sentinel with heavy obsidian plating, LED optical matrix, and hovering thruster core.',
  },
]

const COSTUME_CARDS: Array<{
  id: KyroCostume
  name: string
  icon: string
  desc: string
}> = [
  {
    id: 'royal_crown',
    name: 'Royal Crown',
    icon: '👑',
    desc: '5-point sovereign gold diadem forged for peak command.',
  },
  {
    id: 'cyber_visor',
    name: 'Cyber Visor',
    icon: '🕶️',
    desc: 'Translucent holographic HUD visor synced to eye glow.',
  },
  {
    id: 'samurai_crest',
    name: 'Samurai Crest',
    icon: '⚔️',
    desc: 'Golden kabuto V-horns with a central octahedral gem.',
  },
  {
    id: 'wizard_hat',
    name: 'Wizard Hat',
    icon: '🧙',
    desc: 'Arcane midnight spire hat ringed with a golden band.',
  },
  {
    id: 'pro_headphones',
    name: 'Pro Headphones',
    icon: '🎧',
    desc: 'Over-ear studio focus headphones with neon earcups.',
  },
  {
    id: 'none',
    name: 'Pure Core (None)',
    icon: '✨',
    desc: 'Clean, unadorned base 3D silhouette.',
  },
]

const MOOD_TESTS: Array<{ id: CompanionMood; label: string; icon: React.ElementType; quote: string }> = [
  { id: 'idle', label: 'Idle (Breath & Blink)', icon: Heart, quote: 'Breathing peacefully in the sanctuary.' },
  { id: 'listening', label: 'Listening (Attentive)', icon: Ear, quote: 'I am hearing your thoughts, Explorer.' },
  { id: 'thinking', label: 'Thinking (Neural Runes)', icon: HelpCircle, quote: 'Analyzing tasks, habits, and optimal horizons...' },
  { id: 'speaking', label: 'Speaking (Mouth Waves)', icon: MessageCircle, quote: 'Velocity achieved! The sanctuary is energized.' },
  { id: 'happy', label: 'Happy (Joyful Glow)', icon: Smile, quote: 'A brilliant spark of progress!' },
  { id: 'celebrating', label: 'Celebrating (Victory Jump)', icon: Award, quote: 'Quest conquered! Glorious momentum!' },
  { id: 'encouraging', label: 'Encouraging (Support)', icon: Sparkles, quote: 'One small move is all it takes. You have this.' },
  { id: 'surprised', label: 'Surprised (Wide Alert)', icon: Eye, quote: 'Whoa! An unexpected shift in the ether.' },
  { id: 'focused', label: 'Focused (Sensory Barrier)', icon: Zap, quote: 'Sensory barriers active. Absolute concentration.' },
  { id: 'tired', label: 'Tired (Low Energy)', icon: BatteryCharging, quote: 'Exertion acknowledged. Even guardians rest.' },
  { id: 'sleeping', label: 'Sleeping (Deep Rest)', icon: Moon, quote: 'zzZ... sanctuary resting.' },
]

export default function CharacterAtelierPage() {
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const {
    config,
    setArchetype,
    setMood,
    setReducedMotion,
    randomize,
    resetConfig,
  } = useCharacterStore()

  const {
    settings,
    lastProvider,
    lastLatencyMs,
    setModel,
    setCostume,
    setColorTheme,
    setAnimationState,
    setAnchor,
    setCustomPosition,
    toggleVoice,
    toggleMinimized,
    speak,
    setProviderTelemetry,
  } = useKyroStore()

  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const setAgentName = useAppStore((s) => s.setAgentName)

  const [activeTab, setActiveTab] = useState<'3d_atelier' | '2d_allies'>('3d_atelier')
  const [testedMood, setTestedMood] = useState<CompanionMood>(config.mood || 'idle')
  const [bubblePreview, setBubblePreview] = useState<string>(
    `I stand with you, Explorer. Let us shape our sanctuary.`
  )

  // Gemini 2.5 Flash Key & Audio states
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isTestingKey, setIsTestingKey] = useState(false)
  const [testResult, setTestResult] = useState<{
    ok: boolean
    provider: string
    latency: number
    message: string
  } | null>(null)
  const [chimesEnabled, setChimesEnabled] = useState(true)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('nexora_gemini_api_key') || ''
      setApiKeyInput(savedKey)
      const savedSound = localStorage.getItem('nexora_sound_enabled')
      setChimesEnabled(savedSound !== 'false')
    }
  }, [])

  const currentArchetype = normalizeArchetype(config.archetype)
  const activeCreature = ORIGINAL_CREATURES[currentArchetype] || ORIGINAL_CREATURES.nyxen

  const handleSaveApiKey = () => {
    if (typeof window === 'undefined') return
    const trimmed = apiKeyInput.trim()
    if (trimmed) {
      localStorage.setItem('nexora_gemini_api_key', trimmed)
      playChime('click')
      toast.success('Gemini 2.5 Flash API Key saved to local device storage!')
    } else {
      localStorage.removeItem('nexora_gemini_api_key')
      toast.info('API key cleared. Using 0ms Local Context Engine.')
    }
  }

  const handleTestConnection = async () => {
    setIsTestingKey(true)
    setTestResult(null)
    try {
      const trimmed = apiKeyInput.trim()
      if (trimmed && typeof window !== 'undefined') {
        localStorage.setItem('nexora_gemini_api_key', trimmed)
      }

      const res = await fetch('/api/kyro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Confirm neural link and report telemetry status.',
          userApiKey: trimmed || undefined,
          context: {
            userName: useAppStore.getState().preferences?.displayName || 'Commander',
            agentName,
          },
        }),
      })

      const data = await res.json()
      setProviderTelemetry(data.provider, data.latencyMs, data.errorReason)

      const replyText = data.speechBubble || data.reply || 'Neural link verified!'
      speak(replyText, 6000)

      if (data.provider === 'gemini-2.5-flash') {
        playChime('celebrate')
        setTestResult({
          ok: true,
          provider: 'gemini-2.5-flash',
          latency: data.latencyMs || 120,
          message: replyText,
        })
        toast.success(`Gemini 2.5 Flash connected (${data.latencyMs}ms)!`)
      } else {
        playChime('click')
        setTestResult({
          ok: false,
          provider: 'local-context-engine',
          latency: data.latencyMs || 1,
          message: data.errorReason
            ? `Fallback to 0ms Local Brain (${data.errorReason}). Reply: "${replyText}"`
            : `0ms Local Context Engine active: "${replyText}"`,
        })
        toast.info('Responded via 0ms Local Context Engine.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection test failed'
      setTestResult({
        ok: false,
        provider: 'error',
        latency: 0,
        message: msg,
      })
      toast.error('Failed to reach /api/kyro endpoint.')
    } finally {
      setIsTestingKey(false)
    }
  }

  const handleGlbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setModel('custom_glb', objectUrl)
    playChime('celebrate')
    speak(`Custom 3D model "${file.name}" loaded into the Sanctuary stage!`, 5000)
    toast.success(`Loaded 3D model: ${file.name}`)
  }

  const handleToggleChimes = () => {
    const next = !chimesEnabled
    setChimesEnabled(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexora_sound_enabled', String(next))
    }
    if (next) {
      playChime('celebrate')
      toast.success('Synthesizer audio chimes enabled!')
    } else {
      toast.info('Synthesizer audio chimes muted.')
    }
  }

  const trigger3DAnimation = (anim: KyroAnimationState, speechText: string) => {
    setAnimationState(anim, 4000, 'IDLE')
    playChime('click')
    speak(speechText, 4500)
  }

  if (!mounted) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="h-20 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
        <div className="h-96 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
      </div>
    )
  }

  const activeThemeObj = KYRO_COLOR_THEMES[settings.colorTheme] || KYRO_COLOR_THEMES.obsidian_gold

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Neural &amp; Aesthetic Customization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gradient-gold">
            Companion Atelier
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Customize Kyro&apos;s 3D WebGL archetype, headgear costumes, luxury color shaders, voice synthesis, and Gemini 2.5 Flash brain.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-stone-900/90 border border-stone-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('3d_atelier')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === '3d_atelier'
                ? 'bg-amber-400 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>3D Kyro Atelier</span>
          </button>
          <button
            onClick={() => setActiveTab('2d_allies')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === '2d_allies'
                ? 'bg-amber-400 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2D Sanctuary Allies</span>
          </button>
        </div>
      </div>

      {activeTab === '3d_atelier' ? (
        <div className="space-y-6">
          {/* ── LIVE TELEMETRY STATUS BAR ── */}
          <div className="p-4 rounded-2xl bg-stone-950/90 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-amber-400/40 shadow-inner"
                style={{ backgroundColor: activeThemeObj.hexBody }}
              >
                <span
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: activeThemeObj.hexAccent,
                    boxShadow: `0 0 12px ${activeThemeObj.hexAccent}`,
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                    {settings.model.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300 font-mono">
                    Gear: {settings.costume.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300 font-mono">
                    Shader: {activeThemeObj.name}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  All changes update the live floating 3D companion in the corner immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (settings.isMinimized) toggleMinimized()
                  setAnimationState('CELEBRATING', 3500)
                  playChime('celebrate')
                  speak('All 3D shaders and gear synchronized, Boss!', 4000)
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(212,168,83,0.3)]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Celebrate &amp; Preview</span>
              </button>

              <button
                onClick={toggleMinimized}
                className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {settings.isMinimized ? (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Show 3D Stage</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>Minimize Stage</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── SECTION 1: 3D ARCHETYPE SELECTOR ── */}
          <section className="world-deck p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-100 font-mono">
                  1. 3D Character Archetype
                </h2>
              </div>
              <span className="text-xs font-mono text-amber-300 font-semibold">
                Active: {settings.model.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ARCHETYPE_CARDS.map((arch) => {
                const isSelected = settings.model === arch.id
                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => {
                      setModel(arch.id)
                      playChime('click')
                      speak(`${arch.name} chassis online and locked in, Boss!`, 4000)
                      toast.success(`Switched 3D archetype to ${arch.name}`)
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-400/15 border-amber-400 shadow-[0_0_25px_rgba(212,168,83,0.2)]'
                        : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{arch.icon}</span>
                        {isSelected ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-mono text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> ACTIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-stone-500 uppercase">{arch.badge}</span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-stone-100">{arch.name}</h3>
                      <p className="text-xs text-stone-400 mt-1 leading-relaxed">{arch.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Custom Blender .GLB Upload */}
            <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Custom Blender 3D Model (.GLB / .GLTF)</span>
                  {settings.model === 'custom_glb' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                      ACTIVE
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Import any rigged or static `.glb` model from Blender to replace the procedural mesh.
                </p>
              </div>
              <div className="shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleGlbUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload .GLB File</span>
                </button>
              </div>
            </div>
          </section>

          {/* ── SECTION 2: 3D COSTUME & HEADGEAR ATELIER ── */}
          <section className="world-deck p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-100 font-mono">
                  2. 3D Costume &amp; Headgear Atelier
                </h2>
              </div>
              <span className="text-xs font-mono text-amber-300 font-semibold">
                Equipped: {settings.costume.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {COSTUME_CARDS.map((item) => {
                const isSelected = settings.costume === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCostume(item.id)
                      playChime('click')
                      speak(
                        item.id === 'none'
                          ? 'Running clean minimalist silhouette, Boss.'
                          : `Equipped ${item.name}! Looking sharp in the Sanctuary.`,
                        3500
                      )
                      toast.success(`Equipped: ${item.name}`)
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-400/15 border-amber-400 shadow-[0_0_20px_rgba(212,168,83,0.2)]'
                        : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">{item.icon}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                      </div>
                      <h3 className="text-xs font-bold text-stone-100">{item.name}</h3>
                      <p className="text-[10px] text-stone-400 mt-1 leading-snug">{item.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── SECTION 3: LUXURY COLOR SHADERS ── */}
          <section className="world-deck p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-100 font-mono">
                  3. Luxury 3D Color Shaders
                </h2>
              </div>
              <span className="text-xs font-mono text-amber-300 font-semibold">
                Shader: {activeThemeObj.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {(Object.keys(KYRO_COLOR_THEMES) as KyroColorTheme[]).map((themeKey) => {
                const theme = KYRO_COLOR_THEMES[themeKey]
                const isSelected = settings.colorTheme === themeKey
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => {
                      setColorTheme(themeKey)
                      playChime('click')
                      toast.success(`Applied ${theme.name} shader`)
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-400/15 border-amber-400 shadow-[0_0_20px_rgba(212,168,83,0.2)]'
                        : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{
                            backgroundColor: theme.hexAccent,
                            boxShadow: `0 0 8px ${theme.hexAccent}`,
                          }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white/10"
                          style={{ backgroundColor: theme.hexGlow }}
                        />
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-stone-100">{theme.name}</h3>
                      <p className="text-[10px] font-mono text-stone-400 mt-0.5 uppercase">
                        {theme.hexAccent}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── SECTION 4: GEMINI 2.5 FLASH BRAIN & API KEY TESTER ── */}
          <section className="world-deck p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-100 font-mono">
                  4. Gemini 2.5 Flash Neural Brain &amp; Live Diagnostics
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {lastProvider === 'gemini-2.5-flash' ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>GEMINI 2.5 FLASH • {lastLatencyMs}ms</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>0ms LOCAL BRAIN FALLBACK</span>
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Enter your free Google AI Studio API Key (`AIzaSy...`) to unlock cloud-powered Gemini 2.5 Flash conversations. Stored locally in your device&apos;s `localStorage` so it works seamlessly on web and inside the Android APK.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy... (Paste Google AI Studio Gemini API Key)"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-400 text-xs text-stone-100 font-mono outline-none pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-stone-400 hover:text-amber-300 cursor-pointer"
                >
                  {showKey ? 'HIDE' : 'SHOW'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                Save Key
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingKey}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(212,168,83,0.3)] shrink-0"
              >
                {isTestingKey ? (
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 fill-stone-950" />
                )}
                <span>{isTestingKey ? 'Testing Link...' : 'Test Connection'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 underline font-medium"
              >
                Get a free Gemini API key from Google AI Studio ↗
              </a>
              {apiKeyInput && (
                <button
                  type="button"
                  onClick={() => {
                    setApiKeyInput('')
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('nexora_gemini_api_key')
                    }
                    setProviderTelemetry('local-context-engine', 0, null)
                    toast.info('API Key cleared from device.')
                  }}
                  className="text-rose-400 hover:text-rose-300 underline cursor-pointer"
                >
                  Clear Saved Key
                </button>
              )}
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono ${
                  testResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="font-bold mb-1">
                  {testResult.ok
                    ? `✓ LIVE GEMINI 2.5 FLASH CONNECTED (${testResult.latency}ms)`
                    : `⚡ ENGINE STATUS: ${testResult.provider.toUpperCase()} (${testResult.latency}ms)`}
                </div>
                <p className="text-stone-300 font-sans text-xs">{testResult.message}</p>
              </div>
            )}
          </section>

          {/* ── SECTION 5: VOICE, AUDIO CHIMES & STAGE CONTROLS ── */}
          <section className="world-deck p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-100 font-mono">
                  5. Voice Synthesis, Audio Chimes &amp; Stage Controls
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Voice Synthesis Toggle */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-stone-100">J.A.R.V.I.S. Voice Synthesis (TTS)</h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Kyro speaks tactical briefings aloud using browser/Android speech synthesis.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      toggleVoice()
                      toast.info(!settings.voiceEnabled ? 'Voice synthesis enabled' : 'Voice synthesis muted')
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      settings.voiceEnabled
                        ? 'bg-amber-400 text-stone-950'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {settings.voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>{settings.voiceEnabled ? 'Voice ON' : 'Voice Muted'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => speak('Voice synthesis online. All sanctuary systems nominal, Boss!', 4000, undefined, true)}
                    className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer"
                  >
                    Test
                  </button>
                </div>
              </div>

              {/* Web Audio Synthesizer Chimes */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-stone-100">Web Audio Harmonic Chimes</h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Crystal acoustic feedback on quest completion, calibration steps, and alerts.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleChimes}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      chimesEnabled
                        ? 'bg-amber-400 text-stone-950'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{chimesEnabled ? 'Chimes ON' : 'Chimes Muted'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => playChime('celebrate')}
                    className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer"
                  >
                    Test
                  </button>
                </div>
              </div>

              {/* Screen Anchor & Position Reset */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-stone-100">Corner Anchor &amp; Snap</h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Anchor Kyro to a screen corner or reset custom drag coordinates.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['bottom-right', 'bottom-left', 'top-right'] as const).map((corner) => (
                    <button
                      key={corner}
                      type="button"
                      onClick={() => {
                        setAnchor(corner)
                        setCustomPosition(null)
                        toast.success(`Anchored to ${corner}`)
                      }}
                      className={`flex-1 py-2 px-2 rounded-xl text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        settings.anchor === corner
                          ? 'bg-amber-400 text-stone-950'
                          : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {corner.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3D Animation State Triggers */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 font-mono mb-2">
                Trigger Live 3D Animation States
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(
                  [
                    { id: 'IDLE', label: 'IDLE', desc: 'Calm Hover & Gaze', speech: 'Standing by in idle hover, Boss.' },
                    { id: 'TALKING', label: 'TALKING', desc: 'Mouth & Hand Wave', speech: 'Active voice pulse and hand gestures engaged!' },
                    { id: 'WALKING', label: 'WALKING', desc: 'Glide & Hop', speech: 'Patrolling the Sanctuary perimeter!' },
                    { id: 'CELEBRATING', label: 'CELEBRATE', desc: 'Backflip & Confetti', speech: 'Victory backflip and golden confetti burst!' },
                    { id: 'FOCUS_MODE', label: 'FOCUS MODE', desc: 'Deep Zen Hover', speech: 'Sensory shields up. Deep focus lock engaged.' },
                  ] as const
                ).map((anim) => (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() => trigger3DAnimation(anim.id, anim.speech)}
                    className="p-3 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-amber-400/40 text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-amber-300 font-mono">{anim.label}</div>
                    <p className="text-[10px] text-stone-400 mt-0.5">{anim.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* ── TAB 2: 2D SANCTUARY ALLIES & STATE MACHINE ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="world-deck p-8 flex flex-col items-center justify-center relative overflow-hidden text-center min-h-[420px]">
              <div
                className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-30"
                style={{
                  background: `radial-gradient(circle at 50% 45%, ${activeCreature.accentColor}55, transparent 70%)`,
                }}
              />
              <div className="my-6 relative z-10">
                <Companion
                  size={165}
                  archetypeOverride={currentArchetype}
                  moodOverride={testedMood}
                  speechTextOverride={bubblePreview}
                  showPlatform={true}
                  showGlow={true}
                />
              </div>
              <div className="relative z-10 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">{activeCreature.title}</span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-foreground mt-1">
                  {activeCreature.name} ({agentName})
                </h2>
                <p className="text-xs text-stone-400 max-w-xs">{activeCreature.lore}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="world-deck p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Companion Callsign &amp; 2D Ally
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={randomize}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Shuffle className="w-3 h-3" /> Randomize
                  </button>
                  <button
                    onClick={resetConfig}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Enter companion callsign..."
                className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-foreground focus:outline-none focus:border-amber-400"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {(Object.keys(ORIGINAL_CREATURES) as CreatureArchetype[]).map((archKey) => {
                  const creature = ORIGINAL_CREATURES[archKey]
                  const isSelected = currentArchetype === archKey
                  return (
                    <div
                      key={creature.id}
                      onClick={() => {
                        setArchetype(creature.id)
                        setBubblePreview(creature.speechGreeting)
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-400/10 border-amber-400 shadow-[0_0_20px_rgba(212,168,83,0.25)]'
                          : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xl">{creature.emblem}</span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-foreground">{creature.name}</h4>
                        <p className="text-[10px] text-amber-300/80 font-semibold mb-1.5">{creature.title}</p>
                        <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-3">{creature.lore}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="world-deck p-5 space-y-4">
              <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                2D Expressive Mood Tester
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MOOD_TESTS.map((m) => {
                  const Icon = m.icon
                  const isCurrent = testedMood === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setTestedMood(m.id)
                        setMood(m.id)
                        setBubblePreview(m.quote)
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-400 text-stone-950 font-bold'
                          : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{m.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-foreground">Reduced Motion Mode</h5>
                  <p className="text-[11px] text-stone-400">
                    Suppresses continuous floating animations on low-power devices.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.isReducedMotion || false}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
