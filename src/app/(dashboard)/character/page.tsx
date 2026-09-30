'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">Customize</h1>
        <p className="text-muted-foreground font-medium mt-1">Personalize your companion and agent.</p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Preview Panel */}
        <div className="space-y-4">
          <Card className="border-border/40 bg-card/60 rounded-2xl sticky top-24">
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="bg-background rounded-2xl p-6 border border-border/30 mb-4">
                <CompanionAvatar size={180} />
              </div>
              <p className="text-lg font-bold">{agentConfig.name}</p>
              <p className="text-sm text-muted-foreground capitalize">{agentConfig.personality} · {config.expression}</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={randomize} className="rounded-xl cursor-pointer gap-1.5">
                  <Shuffle className="w-3.5 h-3.5" /> Randomize
                </Button>
                <Button variant="outline" size="sm" onClick={resetConfig} className="rounded-xl cursor-pointer gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Options Panel */}
        <div className="space-y-4">
          {/* Agent Identity */}
          <Card className="border-border/40 bg-card/60 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" /> Agent Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Agent Name</Label>
                <Input value={agentConfig.name} onChange={e => setAgentName(e.target.value)} className="rounded-xl" placeholder="e.g. Nexora, Nova, Atlas" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Personality</Label>
                <Select value={agentConfig.personality} onValueChange={v => setPersonality(v as AgentPersonality)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['professional','friendly','calm','energetic','minimal','motivational','loyal'] as AgentPersonality[]).map(p => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Body & Outfit */}
          <Card className="border-border/40 bg-card/60 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-accent" /> Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Character</Label>
                <div className="flex flex-wrap gap-2">
                  {CHARACTER_BODIES.map(b => (
                    <button key={b.id} onClick={() => setBody(b.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${config.body === b.id ? 'bg-accent/10 border-accent/30 text-accent' : 'border-border/50 text-muted-foreground hover:border-border'}`}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outfit</Label>
                <div className="flex flex-wrap gap-2">
                  {CHARACTER_OUTFITS.map(o => (
                    <button key={o.id} onClick={() => setOutfit(o.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${config.outfit === o.id ? 'bg-accent/10 border-accent/30 text-accent' : 'border-border/50 text-muted-foreground hover:border-border'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Companion Settings */}
          <Card className="border-border/40 bg-card/60 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Palette className="w-4 h-4 text-accent" /> Companion Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Show Companion</Label>
                <Switch checked={config.isCompanionEnabled} onCheckedChange={setCompanionEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Reduced Motion</Label>
                <Switch checked={config.isReducedMotion} onCheckedChange={setReducedMotion} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
