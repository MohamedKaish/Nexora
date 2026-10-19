import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useTaskStore } from '@/store/useTaskStore'
import { playChime } from '@/utils/soundEngine'
import { toast } from 'sonner'

export type NoteColor = 'gold' | 'cyan' | 'emerald' | 'rose' | 'violet' | 'obsidian'
export type NotePriority = 'normal' | 'high' | 'urgent'

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface TacticalNote {
  id: string
  title: string
  content: string
  checklist: ChecklistItem[]
  color: NoteColor
  isPinned: boolean
  remindAt: string | null // ISO string or YYYY-MM-DDTHH:mm
  reminderFired: boolean
  priority: NotePriority
  createdAt: string
  updatedAt: string
}

interface NoteState {
  notes: TacticalNote[]
  addNote: (note: {
    title: string
    content?: string
    checklist?: ChecklistItem[]
    color?: NoteColor
    isPinned?: boolean
    remindAt?: string | null
    priority?: NotePriority
  }) => TacticalNote
  updateNote: (id: string, updates: Partial<TacticalNote>) => void
  deleteNote: (id: string) => void
  togglePin: (id: string) => void
  toggleChecklistItem: (noteId: string, itemId: string) => void
  addChecklistItem: (noteId: string, text: string) => void
  removeChecklistItem: (noteId: string, itemId: string) => void
  markReminderFired: (id: string) => void
  snoozeReminder: (id: string, minutes: number) => void
  convertToTask: (id: string) => void
}

const INITIAL_NOTES: TacticalNote[] = [
  {
    id: 'note_horizon_launch',
    title: '⚔️ Nexus Horizon Launch Protocol',
    content: 'Finalize core app assets, test 60 FPS WebGL rendering on mobile WebView, and check high-priority notification channels.',
    checklist: [
      { id: 'c1', text: 'Verify Android POST_NOTIFICATIONS runtime permission', done: true },
      { id: 'c2', text: 'Calibrate Kyro 3D mobile touch drag coordinates', done: true },
      { id: 'c3', text: 'Test 15-minute scheduled reminder window dispatch', done: false },
      { id: 'c4', text: 'Run full tsc --noEmit static integrity audit', done: true },
    ],
    color: 'gold',
    isPinned: true,
    remindAt: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16),
    reminderFired: false,
    priority: 'urgent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note_sanctuary_focus',
    title: '🧘 Deep Focus Sanctuary Protocol',
    content: 'Environmental alignment before entering a 45-minute focus chamber block.',
    checklist: [
      { id: 'c5', text: 'Enable Do Not Disturb on mobile phone', done: true },
      { id: 'c6', text: 'Fill water flask with 500ml hydration', done: true },
      { id: 'c7', text: 'Review top 3 priority objectives with Kyro', done: false },
    ],
    color: 'emerald',
    isPinned: true,
    remindAt: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    reminderFired: false,
    priority: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note_neural_arch',
    title: '🧠 Neural Architecture & Habit Anchors',
    content: 'Anchor new habits right after existing morning rituals: drink water -> review timetable -> 10m tactical stretch.',
    checklist: [
      { id: 'c8', text: 'Morning habit window (06:00 - 11:00)', done: false },
      { id: 'c9', text: 'Evening review window (18:00 - 22:30)', done: false },
    ],
    color: 'cyan',
    isPinned: false,
    remindAt: null,
    reminderFired: false,
    priority: 'normal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: INITIAL_NOTES,

      addNote: (params) => {
        const newNote: TacticalNote = {
          id: 'note_' + Math.random().toString(36).substring(2, 9),
          title: params.title.trim() || 'Untitled Tactical Note',
          content: params.content || '',
          checklist: params.checklist || [],
          color: params.color || 'gold',
          isPinned: params.isPinned || false,
          remindAt: params.remindAt || null,
          reminderFired: false,
          priority: params.priority || 'normal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        playChime('click')
        set((state) => ({ notes: [newNote, ...state.notes] }))
        toast.success(`Note "${newNote.title}" saved to Sanctuary Vault.`)
        return newNote
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  ...updates,
                  reminderFired:
                    updates.remindAt !== undefined && updates.remindAt !== n.remindAt
                      ? false
                      : updates.reminderFired !== undefined
                      ? updates.reminderFired
                      : n.reminderFired,
                  updatedAt: new Date().toISOString(),
                }
              : n
          ),
        }))
      },

      deleteNote: (id) => {
        playChime('click')
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        }))
        toast.info('Note removed from vault.')
      },

      togglePin: (id) => {
        playChime('click')
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n
          ),
        }))
      },

      toggleChecklistItem: (noteId, itemId) => {
        playChime('click')
        set((state) => ({
          notes: state.notes.map((n) => {
            if (n.id !== noteId) return n
            const updatedChecklist = n.checklist.map((c) =>
              c.id === itemId ? { ...c, done: !c.done } : c
            )
            return {
              ...n,
              checklist: updatedChecklist,
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      addChecklistItem: (noteId, text) => {
        if (!text.trim()) return
        set((state) => ({
          notes: state.notes.map((n) => {
            if (n.id !== noteId) return n
            const newItem: ChecklistItem = {
              id: 'c_' + Math.random().toString(36).substring(2, 7),
              text: text.trim(),
              done: false,
            }
            return {
              ...n,
              checklist: [...n.checklist, newItem],
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      removeChecklistItem: (noteId, itemId) => {
        set((state) => ({
          notes: state.notes.map((n) => {
            if (n.id !== noteId) return n
            return {
              ...n,
              checklist: n.checklist.filter((c) => c.id !== itemId),
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      markReminderFired: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, reminderFired: true, updatedAt: new Date().toISOString() } : n
          ),
        }))
      },

      snoozeReminder: (id, minutes) => {
        playChime('click')
        const newRemindAt = new Date(Date.now() + minutes * 60 * 1000)
          .toISOString()
          .slice(0, 16)

        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  remindAt: newRemindAt,
                  reminderFired: false,
                  updatedAt: new Date().toISOString(),
                }
              : n
          ),
        }))
        toast.success(`Reminder snoozed for +${minutes} minutes (${newRemindAt.replace('T', ' ')})`)
      },

      convertToTask: (id) => {
        const note = get().notes.find((n) => n.id === id)
        if (!note) return

        let priorityMap: 'low' | 'medium' | 'high' = 'medium'
        if (note.priority === 'urgent') priorityMap = 'high'
        else if (note.priority === 'normal') priorityMap = 'medium'

        const taskStore = useTaskStore.getState()
        const createdTask = taskStore.addTask({
          title: note.title,
          description: note.content,
          priority: priorityMap,
          dueDate: note.remindAt ? note.remindAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          startTime: note.remindAt ? note.remindAt.slice(11, 16) : null,
          enableReminder: true,
        })

        // Also port checklist items as subtasks
        if (note.checklist.length > 0) {
          note.checklist.forEach((item) => {
            taskStore.addSubtask(createdTask.id, item.text)
          })
        }

        playChime('celebrate')
        toast.success(`Note converted to Task!`, {
          description: `Added "${note.title}" to your active task matrix.`,
        })
      },
    }),
    {
      name: 'nexora_tactical_notes',
    }
  )
)
