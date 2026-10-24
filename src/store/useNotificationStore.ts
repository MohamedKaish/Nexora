import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationCategoryType =
  | 'habit'
  | 'kyro'
  | 'focus'
  | 'task'
  | 'hydration'
  | 'expense'

export interface SanctuaryNotification {
  id: string
  title: string
  message: string
  type: NotificationCategoryType
  timestamp: string
  isRead: boolean
  link?: string
}

interface NotificationState {
  notifications: SanctuaryNotification[]
  addNotification: (params: {
    title: string
    message: string
    type: NotificationCategoryType
    link?: string
  }) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  toggleRead: (id: string) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const INITIAL_NOTIFICATIONS: SanctuaryNotification[] = []

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: INITIAL_NOTIFICATIONS,

      addNotification: (params) => {
        const item: SanctuaryNotification = {
          id: 'notif_' + Math.random().toString(36).substring(2, 9),
          title: params.title,
          message: params.message,
          type: params.type,
          timestamp: new Date().toISOString(),
          isRead: false,
          link: params.link,
        }
        set((state) => ({
          notifications: [item, ...state.notifications],
        }))
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }))
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }))
      },

      toggleRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: !n.isRead } : n
          ),
        }))
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },

      clearAll: () => {
        set({ notifications: [] })
      },
    }),
    {
      name: 'nexora_notifications_storage',
    }
  )
)
