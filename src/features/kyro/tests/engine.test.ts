import { describe, it, expect } from 'vitest'
import { KyroEngine } from '../core/KyroEngine'
import { PriorityEngine, GapDetector } from '../engine'
import { KyroContext } from '../types'
import { TimelineBlock } from '@/types/timeline'

describe('Kyro Deterministic Engines', () => {
  it('PriorityEngine should sort by Eisenhower matrix and due dates', () => {
    const engine = new PriorityEngine()
    const sorted = engine.sort([
      { id: '1', title: 'Low Priority', priority: 'low', estimatedMinutes: 30, dueDate: null },
      { id: '2', title: 'Urgent', priority: 'urgent', estimatedMinutes: 30, dueDate: null },
      { id: '3', title: 'High Priority', priority: 'high', estimatedMinutes: 30, dueDate: null }
    ])
    
    expect(sorted[0].id).toBe('2') // Urgent (100 pts)
    expect(sorted[1].id).toBe('3') // High (50 pts)
    expect(sorted[2].id).toBe('1') // Low (5 pts)
  })

  it('GapDetector should find free intervals accurately', () => {
    const engine = new GapDetector()
    const blocks: TimelineBlock[] = [
      { id: 'cal1', type: 'calendar', title: 'Meeting', startTime: new Date('2026-08-05T10:00:00Z'), endTime: new Date('2026-08-05T11:00:00Z'), isCompleted: false }
    ]
    
    const dayStart = new Date('2026-08-05T09:00:00Z').getTime()
    const dayEnd = new Date('2026-08-05T12:00:00Z').getTime()
    
    const gaps = engine.findGaps(blocks, dayStart, dayEnd)
    
    expect(gaps.length).toBe(2)
    expect(gaps[0].start).toBe(dayStart) // 9:00 to 10:00
    expect(gaps[0].end).toBe(new Date('2026-08-05T10:00:00Z').getTime())
    
    expect(gaps[1].start).toBe(new Date('2026-08-05T11:00:00Z').getTime()) // 11:00 to 12:00
    expect(gaps[1].end).toBe(dayEnd)
  })

  it('KyroEngine should initialize and return an array of blocks', async () => {
    const engine = new KyroEngine()
    
    const context: KyroContext = {
      tasks: [],
      habits: [],
      calendarEvents: []
    }

    const blocks = await engine.schedule(context)
    
    expect(Array.isArray(blocks)).toBe(true)
    expect(blocks.length).toBe(0)
  })
})
