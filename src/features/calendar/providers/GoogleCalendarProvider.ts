import { ExternalCalendarEvent, CalendarProvider } from '../types'

export class GoogleCalendarProvider implements CalendarProvider {
  providerName = 'google' as const

  async getEvents(startDate: Date, endDate: Date): Promise<ExternalCalendarEvent[]> {
    // Stub implementation for Sprint 4 architecture
    console.log(`[GoogleCalendarProvider] Fetching events from ${startDate} to ${endDate}`)
    return []
  }
}
