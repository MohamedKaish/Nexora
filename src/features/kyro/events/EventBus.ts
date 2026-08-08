export type KyroEventType = 
  | 'TaskCreated'
  | 'TaskUpdated'
  | 'TaskCompleted'
  | 'TaskDeleted'
  | 'HabitCompleted'
  | 'CalendarUpdated'
  | 'FocusStarted'
  | 'FocusEnded'
  | 'TimelineChanged'
  | 'KyroReflowRequested'
  | 'SyncCompleted'
  | 'ExternalCalendarSynced'

export interface KyroEvent<T = unknown> {
  type: KyroEventType
  payload?: T
  timestamp: number
}

type EventHandler = (event: KyroEvent) => void

export class KyroEventBus {
  private static instance: KyroEventBus
  private listeners: Map<KyroEventType, Set<EventHandler>>

  private constructor() {
    this.listeners = new Map()
  }

  public static getInstance(): KyroEventBus {
    if (!KyroEventBus.instance) {
      KyroEventBus.instance = new KyroEventBus()
    }
    return KyroEventBus.instance
  }

  public subscribe(type: KyroEventType, handler: EventHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(handler)

    return () => {
      this.listeners.get(type)?.delete(handler)
    }
  }

  public publish<T = unknown>(type: KyroEventType, payload?: T): void {
    const event: KyroEvent<T> = {
      type,
      payload,
      timestamp: Date.now()
    }
    const handlers = this.listeners.get(type)
    if (handlers) {
      handlers.forEach(handler => handler(event))
    }
  }
}

export const eventBus = KyroEventBus.getInstance()
