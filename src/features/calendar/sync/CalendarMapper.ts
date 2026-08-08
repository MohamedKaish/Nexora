import { ExternalCalendarEvent } from '../types'
import { CalendarBlock } from '@/types/timeline'

export class CalendarMapper {
  static toTimelineBlock(event: ExternalCalendarEvent): CalendarBlock {
    return {
      id: `ext_${event.provider}_${event.id}`,
      type: 'calendar',
      title: `[${event.provider.toUpperCase()}] ${event.title}`,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      isCompleted: false,
      location: event.location,
      meetingLink: event.meetingLink,
      isFixed: true,
      sourceType: 'calendar_event',
      color: event.provider === 'google' ? '#4285F4' : '#0078D4' // Distinct brand colors
    }
  }
}
