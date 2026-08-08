import { describe, it, expect } from 'vitest'
import { CalendarMapper } from '../sync/CalendarMapper'

describe('CalendarMapper', () => {
  it('should map Google Calendar event correctly', () => {
    const block = CalendarMapper.toTimelineBlock({
      id: 'g123',
      provider: 'google',
      title: 'Sync Meeting',
      startTime: '2026-08-05T10:00:00Z',
      endTime: '2026-08-05T11:00:00Z',
      location: 'Zoom'
    })
    
    expect(block.id).toBe('ext_google_g123')
    expect(block.type).toBe('calendar')
    expect(block.title).toBe('[GOOGLE] Sync Meeting')
    expect(block.isFixed).toBe(true)
    expect(block.sourceType).toBe('calendar_event')
    expect(block.color).toBe('#4285F4')
    expect(block.startTime?.getTime()).toBe(new Date('2026-08-05T10:00:00Z').getTime())
  })

  it('should map Outlook Calendar event correctly', () => {
    const block = CalendarMapper.toTimelineBlock({
      id: 'o456',
      provider: 'outlook',
      title: '1:1',
      startTime: '2026-08-06T14:00:00Z',
      endTime: '2026-08-06T14:30:00Z',
    })
    
    expect(block.id).toBe('ext_outlook_o456')
    expect(block.color).toBe('#0078D4')
    expect(block.isFixed).toBe(true)
    expect(block.sourceType).toBe('calendar_event')
  })
})
