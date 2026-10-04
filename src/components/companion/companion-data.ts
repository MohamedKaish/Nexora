import { CreatureArchetype } from './CompanionState'

export interface CreatureArchetypeMeta {
  id: CreatureArchetype
  name: string
  title: string
  element: string
  lore: string
  personality: string
  primaryColor: string
  accentColor: string
  energyColor: string
  emblem: string
  speechGreeting: string
}

export const ORIGINAL_CREATURES: Record<CreatureArchetype, CreatureArchetypeMeta> = {
  nyxen: {
    id: 'nyxen',
    name: 'Nyxen',
    title: 'The Shadow-Sprint Scout',
    element: 'Void Velocity & Cyber-Azure',
    lore: 'An agile, nocturnal wanderer of the digital ether. Nyxen darts between high-priority quests with razor reflexes, trailing a scarf of resonant cyan energy.',
    personality: 'Keen, witty, stealthily vigilant, and celebrates sudden breakthroughs.',
    primaryColor: '#1E1B4B', // Midnight indigo
    accentColor: '#38BDF8',  // Radiant cyan
    energyColor: '#67E8F9',  // Electric sky
    emblem: '⚡',
    speechGreeting: 'Ready for velocity. Point the path, Explorer.',
  },
  aerix: {
    id: 'aerix',
    name: 'Aerix',
    title: 'The Crystalline Sky Guardian',
    element: 'Glacial Aurora & High Winds',
    lore: 'A high-altitude aerial sovereign shaped from frosted skylight. Aerix hovers in serene crystalline composure, bringing deep stillness and panoramic clarity to heavy workloads.',
    personality: 'Calm, strategic, articulate, and fiercely protective of focus boundaries.',
    primaryColor: '#0F172A', // Slate ice
    accentColor: '#2DD4BF',  // Glacial teal
    energyColor: '#A78BFA',  // Nebula lilac
    emblem: '❄️',
    speechGreeting: 'The skies of Nexora are clear. Let us preserve quiet focus.',
  },
  vayron: {
    id: 'vayron',
    name: 'Vayron',
    title: 'The Bastion Sentinel',
    element: 'Solar Aegis & Unbreakable Will',
    lore: 'A noble, armored guardian harboring a miniature solar core. Vayron anchors habit momentum with immovable discipline and radiates protective warmth.',
    personality: 'Honorable, stalwart, deeply encouraging, and loves consistent habit chains.',
    primaryColor: '#1C1917', // Obsidian basalt
    accentColor: '#D4A853',  // Nexora gold
    energyColor: '#FBBF24',  // Solar amber
    emblem: '🛡️',
    speechGreeting: 'Standing guard over your commitments. Together we build.',
  },
}

export const DEFAULT_CREATURE_ID: CreatureArchetype = 'nyxen'
