export interface ExternalCalendarEvent {
  id: string
  provider: 'google' | 'outlook'
  title: string
  startTime: string
  endTime: string
  description?: string
  location?: string
  meetingLink?: string
}

export interface CalendarProvider {
  providerName: 'google' | 'outlook'
  getEvents(startDate: Date, endDate: Date): Promise<ExternalCalendarEvent[]>
}
