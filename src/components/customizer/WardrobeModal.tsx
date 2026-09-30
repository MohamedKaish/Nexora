'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCompanionStore } from '@/store/companionStore'
import { CompanionCanvas } from '../canvas/CompanionCanvas'
import { Shirt, Settings } from 'lucide-react'

const SKINS = [
  { id: 'base_maid', label: 'Maid Base' },
  { id: 'base_tech', label: 'Tech Operator' },
  { id: 'base_dark', label: 'Dark Base' },
]

const OUTFITS = [
  { id: 'maid_uniform', label: 'Classic Maid' },
  { id: 'armor_suit', label: 'Power Armor' },
  { id: 'casual_blue', label: 'Casual Blue' },
]

const ACCESSORIES = [
  { id: 'none', label: 'None' },
  { id: 'maid_headband', label: 'Maid Headband' },
  { id: 'tech_headset', label: 'Tech Headset' },
]

const GLASSES = [
  { id: 'none', label: 'None' },
  { id: 'tech_visor', label: 'Tech Visor' },
  { id: 'round_glasses', label: 'Round Glasses' },
]

export function WardrobeModal() {
  const { skin, outfit, accessory, glasses, setSkin, setOutfit, setAccessory, setGlasses } = useCompanionStore()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        <Shirt className="w-4 h-4" />
        Wardrobe
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col overflow-hidden p-0 bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="p-6 border-b border-border/30">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            3D Companion Customizer
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: 3D Preview */}
          <div className="flex-1 border-r border-border/30 relative bg-gradient-to-b from-secondary/10 to-background">
            <CompanionCanvas />
            <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground pointer-events-none">
              Drag to rotate
            </div>
          </div>

          {/* Right: Controls */}
          <div className="w-80 p-6 overflow-y-auto space-y-8">
            {/* Skin */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Base Skin</h4>
              <div className="grid grid-cols-2 gap-2">
                {SKINS.map((s) => (
                  <Button
                    key={s.id}
                    variant={skin === s.id ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => setSkin(s.id)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Outfit */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Outfit</h4>
              <div className="grid grid-cols-2 gap-2">
                {OUTFITS.map((o) => (
                  <Button
                    key={o.id}
                    variant={outfit === o.id ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => setOutfit(o.id)}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Accessories */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Headwear</h4>
              <div className="grid grid-cols-2 gap-2">
                {ACCESSORIES.map((a) => (
                  <Button
                    key={a.id}
                    variant={accessory === a.id ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => setAccessory(a.id)}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Glasses */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Eyewear</h4>
              <div className="grid grid-cols-2 gap-2">
                {GLASSES.map((g) => (
                  <Button
                    key={g.id}
                    variant={glasses === g.id ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => setGlasses(g.id)}
                  >
                    {g.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
