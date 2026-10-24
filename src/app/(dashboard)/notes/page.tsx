'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  useNoteStore,
  TacticalNote,
  NoteColor,
  NotePriority,
  ChecklistItem,
} from '@/store/useNoteStore'
import { sendNexoraNotification } from '@/utils/notificationBridge'
import { playChime } from '@/utils/soundEngine'
import {
  Search,
  Plus,
  Pin,
  PinOff,
  Bell,
  Clock,
  CheckSquare,
  Square,
  Trash2,
  Edit3,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Filter,
  CheckCircle2,
  Sparkles,
  Zap,
  Tag,
  Share2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

const COLOR_MAP: Record<
  NoteColor,
  { name: string; bg: string; border: string; glow: string; text: string; badge: string }
> = {
  gold: {
    name: 'Sovereign Gold',
    bg: 'bg-stone-950/90',
    border: 'border-amber-500/40 hover:border-amber-400',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.12)]',
    text: 'text-amber-300',
    badge: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  },
  cyan: {
    name: 'Cyber Cyan',
    bg: 'bg-stone-950/90',
    border: 'border-cyan-500/40 hover:border-cyan-400',
    glow: 'shadow-[0_0_25px_rgba(6,182,212,0.12)]',
    text: 'text-cyan-300',
    badge: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30',
  },
  emerald: {
    name: 'Sage Emerald',
    bg: 'bg-stone-950/90',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    glow: 'shadow-[0_0_25px_rgba(16,185,129,0.12)]',
    text: 'text-emerald-300',
    badge: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  },
  rose: {
    name: 'Crimson Rose',
    bg: 'bg-stone-950/90',
    border: 'border-rose-500/40 hover:border-rose-400',
    glow: 'shadow-[0_0_25px_rgba(244,63,94,0.12)]',
    text: 'text-rose-300',
    badge: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
  },
  violet: {
    name: 'Amethyst Violet',
    bg: 'bg-stone-950/90',
    border: 'border-violet-500/40 hover:border-violet-400',
    glow: 'shadow-[0_0_25px_rgba(139,92,246,0.12)]',
    text: 'text-violet-300',
    badge: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
  },
  obsidian: {
    name: 'Obsidian Void',
    bg: 'bg-stone-950/95',
    border: 'border-stone-800 hover:border-stone-700',
    glow: 'shadow-[0_0_25px_rgba(0,0,0,0.4)]',
    text: 'text-stone-300',
    badge: 'bg-stone-800 text-stone-300 border-stone-700',
  },
}

export default function NotesPage() {
  const [mounted, setMounted] = useState(false)
  const {
    notes,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleChecklistItem,
    addChecklistItem,
    removeChecklistItem,
    snoozeReminder,
    convertToTask,
  } = useNoteStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pinned' | 'reminders' | 'urgent' | 'checklists'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<TacticalNote | null>(null)

  // Form State for Create/Edit Modal
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formColor, setFormColor] = useState<NoteColor>('gold')
  const [formPriority, setFormPriority] = useState<NotePriority>('normal')
  const [formRemindAt, setFormRemindAt] = useState('')
  const [formChecklist, setFormChecklist] = useState<Array<{ id: string; text: string; done: boolean }>>([])
  const [newChecklistText, setNewChecklistText] = useState('')
  const [inlineNewItemText, setInlineNewItemText] = useState<Record<string, string>>({})

  const openCreateModal = () => {
    setEditingNote(null)
    setFormTitle('')
    setFormContent('')
    setFormColor('gold')
    setFormPriority('normal')
    setFormRemindAt('')
    setFormChecklist([])
    setNewChecklistText('')
    setModalOpen(true)
  }

  const openEditModal = (note: TacticalNote) => {
    setEditingNote(note)
    setFormTitle(note.title)
    setFormContent(note.content)
    setFormColor(note.color)
    setFormPriority(note.priority)
    setFormRemindAt(note.remindAt || '')
    setFormChecklist(note.checklist)
    setNewChecklistText('')
    setModalOpen(true)
  }

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast.error('Note title is required.')
      return
    }

    if (editingNote) {
      updateNote(editingNote.id, {
        title: formTitle.trim(),
        content: formContent.trim(),
        color: formColor,
        priority: formPriority,
        remindAt: formRemindAt ? formRemindAt : null,
        checklist: formChecklist,
      })
      toast.success('Note updated in Sanctuary Vault.')
    } else {
      addNote({
        title: formTitle.trim(),
        content: formContent.trim(),
        color: formColor,
        priority: formPriority,
        remindAt: formRemindAt ? formRemindAt : null,
        checklist: formChecklist,
      })
    }

    setModalOpen(false)
  }

  const handleAddModalChecklistItem = () => {
    if (!newChecklistText.trim()) return
    setFormChecklist([
      ...formChecklist,
      {
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        text: newChecklistText.trim(),
        done: false,
      },
    ])
    setNewChecklistText('')
  }

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Search
      const q = search.toLowerCase()
      const matchesSearch =
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.checklist.some((c) => c.text.toLowerCase().includes(q))
      if (!matchesSearch) return false

      // Filters
      if (filter === 'pinned') return note.isPinned
      if (filter === 'reminders') return Boolean(note.remindAt)
      if (filter === 'urgent') return note.priority === 'urgent'
      if (filter === 'checklists') return note.checklist.length > 0
      return true
    })
  }, [notes, search, filter])

  // Count metrics
  const pinnedCount = notes.filter((n) => n.isPinned).length
  const remindersCount = notes.filter((n) => n.remindAt && !n.reminderFired).length
  const urgentCount = notes.filter((n) => n.priority === 'urgent').length

  if (!mounted) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 pb-16">
        <div className="h-20 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-16 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
          <div className="h-16 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
          <div className="h-16 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
          <div className="h-16 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* ─── HEADER & PRIMARY ACTION ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400/80 font-bold">
              Tactical Memory Matrix
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gradient-gold mt-1">
            Reminder Notes &amp; Vault
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-xl">
            High-priority briefs, checklist protocols, and custom time-window notifications synchronized with Kyro.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Tactical Note</span>
        </button>
      </div>

      {/* ─── METRIC QUICK STATS STRIP ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-500 uppercase font-mono tracking-wider font-bold block">
              Total Vault Notes
            </span>
            <span className="text-xl font-bold font-mono text-stone-100">{notes.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-500 uppercase font-mono tracking-wider font-bold block">
              Pinned Protocols
            </span>
            <span className="text-xl font-bold font-mono text-amber-300">{pinnedCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
            <Pin className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-500 uppercase font-mono tracking-wider font-bold block">
              Active Reminders
            </span>
            <span className="text-xl font-bold font-mono text-cyan-300">{remindersCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-cyan-400/10 text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-500 uppercase font-mono tracking-wider font-bold block">
              Urgent Alerts
            </span>
            <span className="text-xl font-bold font-mono text-rose-300">{urgentCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER BAR ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, protocols, checklists..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-900/80 border border-stone-800 focus:border-amber-400/60 text-xs text-stone-100 placeholder:text-stone-500 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { key: 'all', label: 'All Notes', count: notes.length },
              { key: 'pinned', label: 'Pinned 📌', count: pinnedCount },
              { key: 'reminders', label: 'Reminders ⏰', count: remindersCount },
              { key: 'urgent', label: 'Urgent 🚨', count: urgentCount },
              { key: 'checklists', label: 'Checklists ✅', count: notes.filter((n) => n.checklist.length > 0).length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key)
                playChime('click')
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === tab.key
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                  : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filter === tab.key ? 'bg-stone-950/20 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── NOTES MASONRY / GRID ─── */}
      {filteredNotes.length === 0 ? (
        <div className="world-deck p-12 text-center space-y-4 border border-dashed border-stone-800">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-stone-200">No Tactical Notes Found</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              {search
                ? `No notes matched your query "${search}". Try a different keyword.`
                : 'Create your first tactical reminder note or checklist to keep objectives in view.'}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Note</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const colorTheme = COLOR_MAP[note.color] || COLOR_MAP.gold
            const completedCount = note.checklist.filter((c) => c.done).length
            const totalCount = note.checklist.length
            const hasChecklist = totalCount > 0
            const isDueSoon =
              note.remindAt &&
              new Date(note.remindAt).getTime() - Date.now() < 3600000 &&
              new Date(note.remindAt).getTime() > Date.now()

            return (
              <div
                key={note.id}
                className={`group relative rounded-2xl ${colorTheme.bg} border ${colorTheme.border} ${colorTheme.glow} p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-xl`}
              >
                {/* Note Top Bar */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {note.isPinned && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold font-mono flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" />
                          <span>PINNED</span>
                        </span>
                      )}

                      {note.priority === 'urgent' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold font-mono flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>URGENT</span>
                        </span>
                      )}

                      {note.priority === 'high' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">
                          HIGH
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${colorTheme.badge}`}>
                        {colorTheme.name}
                      </span>
                    </div>

                    {/* Quick Pin Toggle */}
                    <button
                      onClick={() => togglePin(note.id)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        note.isPinned
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-stone-500 hover:text-stone-300 opacity-60 group-hover:opacity-100'
                      }`}
                      title={note.isPinned ? 'Unpin Note' : 'Pin Note to Top'}
                    >
                      {note.isPinned ? <Pin className="w-4 h-4 fill-amber-400/30" /> : <PinOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className={`text-base font-bold tracking-tight ${colorTheme.text} leading-snug`}>
                    {note.title}
                  </h3>

                  {/* Content body */}
                  {note.content && (
                    <p className="text-xs text-stone-300/90 leading-relaxed whitespace-pre-wrap line-clamp-4">
                      {note.content}
                    </p>
                  )}

                  {/* Interactive Checklist */}
                  {hasChecklist && (
                    <div className="space-y-1.5 pt-2 border-t border-stone-800/80">
                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span className="font-mono text-[10px] uppercase font-bold text-stone-500">
                          Checklist Progress
                        </span>
                        <span className="font-mono font-bold text-amber-400">
                          {completedCount}/{totalCount}
                        </span>
                      </div>

                      {/* Progress mini bar */}
                      <div className="w-full h-1 rounded-full bg-stone-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                          style={{ width: `${(completedCount / totalCount) * 100}%` }}
                        />
                      </div>

                      <div className="space-y-1 pt-1 max-h-44 overflow-y-auto scrollbar-none">
                        {note.checklist.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-stone-900/60 hover:bg-stone-900 border border-stone-800/60 text-xs transition-colors"
                          >
                            <button
                              onClick={() => toggleChecklistItem(note.id, item.id)}
                              className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                            >
                              {item.done ? (
                                <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                              )}
                              <span
                                className={`text-[11px] leading-tight ${
                                  item.done ? 'line-through text-stone-500' : 'text-stone-200'
                                }`}
                              >
                                {item.text}
                              </span>
                            </button>
                            <button
                              onClick={() => removeChecklistItem(note.id, item.id)}
                              className="text-stone-600 hover:text-stone-400 p-0.5 cursor-pointer transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Quick inline checklist add */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          value={inlineNewItemText[note.id] || ''}
                          onChange={(e) =>
                            setInlineNewItemText({ ...inlineNewItemText, [note.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addChecklistItem(note.id, inlineNewItemText[note.id] || '')
                              setInlineNewItemText({ ...inlineNewItemText, [note.id]: '' })
                            }
                          }}
                          placeholder="+ Add checklist task..."
                          className="flex-1 px-2.5 py-1 rounded-lg bg-stone-900/80 border border-stone-800 text-[11px] text-stone-200 placeholder:text-stone-500 outline-none"
                        />
                        <button
                          onClick={() => {
                            addChecklistItem(note.id, inlineNewItemText[note.id] || '')
                            setInlineNewItemText({ ...inlineNewItemText, [note.id]: '' })
                          }}
                          className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reminder Pill & Snooze Button */}
                  {note.remindAt && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-1.5">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold border ${
                          note.reminderFired
                            ? 'bg-stone-900 text-stone-400 border-stone-800'
                            : isDueSoon
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>
                          {note.reminderFired ? 'Fired: ' : 'Remind: '}
                          {note.remindAt.replace('T', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => snoozeReminder(note.id, 15)}
                          className="px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono cursor-pointer transition-colors"
                          title="Snooze reminder by +15 minutes"
                        >
                          +15m
                        </button>
                        <button
                          onClick={() => snoozeReminder(note.id, 60)}
                          className="px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono cursor-pointer transition-colors"
                          title="Snooze reminder by +1 hour"
                        >
                          +1h
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Note Actions Footer */}
                <div className="pt-4 mt-4 border-t border-stone-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => convertToTask(note.id)}
                      className="px-2 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/20 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Convert this note & checklist to a Task"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>To Task</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(note)}
                      className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                      title="Edit Note"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── CREATE / EDIT NOTE MODAL ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-stone-950 border border-stone-800 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-stone-100 font-serif">
                  {editingNote ? 'Edit Tactical Note' : 'Create Tactical Note'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-500 hover:text-stone-300 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. ⚔️ Nexus Horizon Launch Protocol"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-400/60 text-xs text-stone-100 placeholder:text-stone-500 outline-none"
                  autoFocus
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Details &amp; Notes</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Tactical context, research, links, or instructions..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-400/60 text-xs text-stone-100 placeholder:text-stone-500 outline-none resize-none"
                />
              </div>

              {/* Color & Priority Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">Liquid Glass Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(COLOR_MAP) as NoteColor[]).map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setFormColor(c)}
                        className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                          formColor === c ? 'scale-110 ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor:
                            c === 'gold'
                              ? '#D4A853'
                              : c === 'cyan'
                              ? '#06B6D4'
                              : c === 'emerald'
                              ? '#10B981'
                              : c === 'rose'
                              ? '#F43F5E'
                              : c === 'violet'
                              ? '#8B5CF6'
                              : '#292524',
                          borderColor: formColor === c ? '#FFFFFF' : 'transparent',
                        }}
                        title={COLOR_MAP[c].name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">Priority Level</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as NotePriority)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 outline-none cursor-pointer"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent 🚨</option>
                  </select>
                </div>
              </div>

              {/* Reminder Date/Time Picker */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Custom Notification Timestamp (`remindAt`)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={formRemindAt}
                    onChange={(e) => setFormRemindAt(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 outline-none font-mono"
                  />
                  {formRemindAt && (
                    <button
                      type="button"
                      onClick={() => setFormRemindAt('')}
                      className="px-2.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  When reached, fires a native phone notification, plays sound, and Kyro vocalizes the note.
                </p>
              </div>

              {/* Checklist Builder */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1.5">Checklist Items</label>
                <div className="space-y-1.5 mb-2 max-h-32 overflow-y-auto">
                  {formChecklist.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs"
                    >
                      <span className="text-stone-300 text-[11px] truncate">{item.text}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormChecklist(formChecklist.filter((_, i) => i !== idx))
                        }
                        className="text-stone-500 hover:text-stone-300 p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddModalChecklistItem()
                      }
                    }}
                    placeholder="+ Add checklist item..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder:text-stone-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddModalChecklistItem}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  {editingNote ? 'Save Changes' : 'Create Tactical Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
