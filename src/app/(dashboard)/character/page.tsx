'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { CompanionAvatar } from '@/features/companion/CompanionAvatar'
import {
  useCharacterStore, CHARACTER_BODIES, CHARACTER_HAIR, CHARACTER_OUTFITS,
  CHARACTER_ACCESSORIES, CHARACTER_GLASSES, CHARACTER_EXPRESSIONS,
  HAIR_COLORS, OUTFIT_COLORS,
} from '@/store/characterStore'
import { useAgentStore } from '@/store/agentStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shuffle, RotateCcw, User, Shirt, Glasses, Sparkles, Palette } from 'lucide-react'
import type { AgentPersonality } from '@/types/local'

export default function CharacterPage() {
  const config = useCharacterStore((s) => s.config)
  const setBody = useCharacterStore((s) => s.setBody)
  const setHair = useCharacterStore((s) => s.setHair)
  const setOutfit = useCharacterStore((s) => s.setOutfit)
  const setAccessory = useCharacterStore((s) => s.setAccessory)
  const setGlasses = useCharacterStore((s) => s.setGlasses)
  const setExpression = useCharacterStore((s) => s.setExpression)
  const setCompanionEnabled = useCharacterStore((s) => s.setCompanionEnabled)
  const setReducedMotion = useCharacterStore((s) => s.setReducedMotion)
  const resetConfig = useCharacterStore((s) => s.resetConfig)
  const agentConfig = useAgentStore((s) => s.config)
  const setAgentName = useAgentStore((s) => s.setName)
  const setPersonality = useAgentStore((s) => s.setPersonality)

  const randomize = () => {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
    setBody(pick(CHARACTER_BODIES).id)
    setHair(pick(CHARACTER_HAIR).id, pick(HAIR_COLORS))
    setOutfit(pick(CHARACTER_OUTFITS).id, pick(OUTFIT_COLORS))
    setAccessory(pick(CHARACTER_ACCESSORIES).id)
    setGlasses(pick(CHARACTER_GLASSES).id)
    setExpression(pick(CHARACTER_EXPRESSIONS).id)
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-5">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-gradient">Customize</h1>
        <p className="text-muted-foreground font-medium mt-1 text-sm">Personalize your companion and agent.</p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-5">
        {/* Preview Panel */}
        <div className="space-y-4">
          <div className="world-card p-6 sticky top-24">
            <div className="flex flex-col items-center">
              <div className="relative p-6 rounded-2xl bg-foreground/[0.02] border border-border/15 mb-4">
                <CompanionAvatar size={180} animate showGlow showPlatform />
              </div>
              <p className="text-lg font-bold text-foreground">{agentConfig.name}</p>
              <p className="text-xs text-muted-foreground font-medium capitalize">{agentConfig.personality} · {config.expression}</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={randomize} className="rounded-xl cursor-pointer gap-1.5 font-semibold border-border/30">
                  <Shuffle className="w-3.5 h-3.5" /> Randomize
                </Button>
                <Button variant="outline" size="sm" onClick={resetConfig} className="rounded-xl cursor-pointer gap-1.5 font-semibold border-border/30">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Options Panel */}
        <div className="space-y-4">
          {/* Agent Identity */}
          <div className="world-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-accent/8"><Sparkles className="w-4 h-4 text-accent" /></div>
              <h2 className="text-sm font-bold text-foreground">Agent Identity</h2>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Agent Name</Label>
              <Input value={agentConfig.name} onChange={e => setAgentName(e.target.value)} className="rounded-xl bg-background/60 border-border/30" placeholder="e.g. Nexora, Nova, Atlas" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Personality</Label>
              <Select value={agentConfig.personality} onValueChange={v => setPersonality(v as AgentPersonality)}>
                <SelectTrigger className="rounded-xl bg-background/60 border-border/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['professional','friendly','calm','energetic','minimal','motivational','loyal'] as AgentPersonality[]).map(p => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Appearance */}
          <div className="world-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-accent/8"><User className="w-4 h-4 text-accent" /></div>
              <h2 className="text-sm font-bold text-foreground">Appearance</h2>
            </div>
            <OptionGroup label="Body">
              {CHARACTER_BODIES.map(b => (
                <OptionButton key={b.id} selected={config.body === b.id} onClick={() => setBody(b.id)} label={b.label} />
              ))}
            </OptionGroup>
            <OptionGroup label="Hair Style">
              {CHARACTER_HAIR.map(h => (
                <OptionButton key={h.id} selected={config.hair === h.id} onClick={() => setHair(h.id)} label={h.label} />
              ))}
            </OptionGroup>
            <OptionGroup label="Hair Color">
              <div className="flex flex-wrap gap-2">
                {HAIR_COLORS.map(c => (
                  <ColorButton key={c} color={c} selected={config.hairColor === c} onClick={() => setHair(config.hair, c)} label={`Hair color ${c}`} />
                ))}
              </div>
            </OptionGroup>
            <OptionGroup label="Expression">
              {CHARACTER_EXPRESSIONS.map(e => (
                <OptionButton key={e.id} selected={config.expression === e.id} onClick={() => setExpression(e.id)} label={e.label} />
              ))}
            </OptionGroup>
          </div>

          {/* Outfit */}
          <div className="world-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-accent/8"><Shirt className="w-4 h-4 text-accent" /></div>
              <h2 className="text-sm font-bold text-foreground">Outfit</h2>
            </div>
            <OptionGroup label="Style">
              {CHARACTER_OUTFITS.map(o => (
                <OptionButton key={o.id} selected={config.outfit === o.id} onClick={() => setOutfit(o.id)} label={o.label} />
              ))}
            </OptionGroup>
            <OptionGroup label="Outfit Color">
              <div className="flex flex-wrap gap-2">
                {OUTFIT_COLORS.map(c => (
                  <ColorButton key={c} color={c} selected={config.outfitColor === c} onClick={() => setOutfit(config.outfit, c)} label={`Outfit color ${c}`} />
                ))}
              </div>
            </OptionGroup>
          </div>

          {/* Accessories */}
          <div className="world-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-accent/8"><Glasses className="w-4 h-4 text-accent" /></div>
              <h2 className="text-sm font-bold text-foreground">Accessories</h2>
            </div>
            <OptionGroup label="Accessory">
              {CHARACTER_ACCESSORIES.map(a => (
                <OptionButton key={a.id} selected={config.accessory === a.id} onClick={() => setAccessory(a.id)} label={a.label} />
              ))}
            </OptionGroup>
            <OptionGroup label="Glasses">
              {CHARACTER_GLASSES.map(g => (
                <OptionButton key={g.id} selected={config.glasses === g.id} onClick={() => setGlasses(g.id)} label={g.label} />
              ))}
            </OptionGroup>
          </div>

          {/* Settings */}
          <div className="world-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-accent/8"><Palette className="w-4 h-4 text-accent" /></div>
              <h2 className="text-sm font-bold text-foreground">Companion Settings</h2>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Show Companion</Label>
              <Switch checked={config.isCompanionEnabled} onCheckedChange={setCompanionEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Reduced Motion</Label>
              <Switch checked={config.isReducedMotion} onCheckedChange={setReducedMotion} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Sub-components ─── */

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function OptionButton({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
        selected
          ? 'bg-accent/10 border-accent/25 text-accent'
          : 'border-border/20 text-muted-foreground hover:text-foreground hover:border-border/40'
      }`}
    >
      {label}
    </button>
  )
}

function ColorButton({ color, selected, onClick, label }: { color: string; selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${selected ? 'border-accent scale-110' : 'border-border/20 hover:scale-105'}`}
      style={{ backgroundColor: color }}
      aria-label={label}
    />
  )
}
