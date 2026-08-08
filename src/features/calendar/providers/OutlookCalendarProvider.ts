import { ExternalCalendarEvent, CalendarProvider } from '../types'

export class OutlookCalendarProvider implements CalendarProvider {
  providerName = 'outlook' as const

  async getEvents(startDate: Date, endDate: Date): Promise<ExternalCalendarEvent[]> {
    // Stub implementation for Sprint 4 architecture
    console.log(`[OutlookCalendarProvider] Fetching events from ${startDate} to ${endDate}`)
    return []
  }
}
