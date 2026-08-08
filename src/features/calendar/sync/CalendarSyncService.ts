import { CalendarProvider } from '../types'
import { CalendarMapper } from './CalendarMapper'
import { eventBus } from '@/features/kyro/events/EventBus'
import { TimelineBlock } from '@/types/timeline'

export class CalendarSyncService {
  private providers: CalendarProvider[] = []

  registerProvider(provider: CalendarProvider) {
    this.providers.push(provider)
  }

  async syncAll(startDate: Date, endDate: Date): Promise<TimelineBlock[]> {
    console.log(`[CalendarSyncService] Starting sync...`)
    const allBlocks: TimelineBlock[] = []
    
    for (const provider of this.providers) {
      try {
        const events = await provider.getEvents(startDate, endDate)
        const blocks = events.map(CalendarMapper.toTimelineBlock)
        allBlocks.push(...blocks)
      } catch (error) {
        console.error(`[CalendarSyncService] Provider ${provider.providerName} failed:`, error)
      }
    }

    // Emit event to trigger partial Kyro reflow
    eventBus.publish('ExternalCalendarSynced', { blocks: allBlocks, startDate, endDate })

    return allBlocks
  }
}

export const calendarSyncService = new CalendarSyncService()
