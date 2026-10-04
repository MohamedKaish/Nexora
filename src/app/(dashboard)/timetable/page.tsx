'use client'

import React, { useState } from 'react'
import { useTimelineStore } from '@/store/timelineStore'
import {
  CalendarDays,
  Plus,
  Trash2,
  Clock,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react'

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
  { id: 0, name: 'Sunday', short: 'Sun' },
]

const CATEGORIES = [
  { name: 'Work', color: '#60A5FA' },
  { name: 'Study', color: '#A78BFA' },
  { name: 'Health', color: '#34D399' },
  { name: 'Creative', color: '#FBBF24' },
  { name: 'Sanctuary', color: '#D4A853' },
]

export default function TimetablePage() {
  const { slots, addSlot, removeSlot } = useTimelineStore()

  const [selectedDay, setSelectedDay] = useState<number>(1) // Monday
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Form State
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:30')
  const [category, setCategory] = useState('Work')
  const [color, setColor] = useState('#60A5FA')

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    addSlot({
      title: title.trim(),
      dayOfWeek: selectedDay,
      startTime,
      endTime,
      category,
      color,
    })

    setTitle('')
    setIsAddOpen(false)
  }

  // Filter slots for current day
  const daySlots = slots
    .filter((s) => s.dayOfWeek === selectedDay)
    .filter((s) => (filterCategory === 'all' ? true : s.category === filterCategory))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Conflict detection
  const hasConflict = (slotA: typeof slots[0], slotB: typeof slots[0]) => {
    return (
      slotA.id !== slotB.id &&
      slotA.startTime < slotB.endTime &&
      slotA.endTime > slotB.startTime
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gradient-gold">
            Weekly Timetable
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Architect your ideal routine blocks, recurring deep work, and habits across the week.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs transition-all shadow-[0_0_20px_rgba(212,168,83,0.3)] flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Routine Block</span>
        </button>
      </div>

      {/* Day Selector Navigation */}
      <div className="flex gap-2 overflow-x-auto p-1.5 rounded-2xl bg-stone-900/80 border border-stone-800 no-scrollbar">
        {DAYS.map((d) => {
          const isSelected = selectedDay === d.id
          const count = slots.filter((s) => s.dayOfWeek === d.id).length

          return (
            <button
              key={d.id}
              onClick={() => setSelectedDay(d.id)}
              className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-md'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <div className="text-xs font-bold">{d.short}</div>
              <div className="text-[10px] opacity-70 mt-0.5">{count} blocks</div>
            </button>
          )
        })}
      </div>

      {/* Main Schedule Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Day Agenda (Left 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Category Filter Pills */}
          <div className="flex gap-2 items-center overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                onClick={() => setFilterCategory(c.name)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filterCategory === c.name
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Slots List */}
          {daySlots.length === 0 ? (
            <div className="world-surface p-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-stone-600 mx-auto" />
              <h3 className="text-base font-bold text-foreground">No blocks allocated</h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Enjoy open flow or click "New Routine Block" above to plan focused commitments for{' '}
                {DAYS.find((d) => d.id === selectedDay)?.name}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {daySlots.map((slot) => {
                const conflicts = daySlots.filter((other) => hasConflict(slot, other))
                const isConflicted = conflicts.length > 0

                return (
                  <div
                    key={slot.id}
                    className="world-surface p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 transition-all"
                    style={{ borderLeftColor: slot.color || '#D4A853' }}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-stone-950 uppercase tracking-wider"
                          style={{ backgroundColor: slot.color || '#D4A853' }}
                        >
                          {slot.category || 'General'}
                        </span>
                        {isConflicted && (
                          <span className="flex items-center gap-1 text-[10px] text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <AlertTriangle className="w-3 h-3" /> Time Conflict
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-foreground">{slot.title}</h4>

                      <div className="flex items-center gap-1.5 text-xs text-stone-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-mono">{slot.startTime}</span>
                        <span>–</span>
                        <span className="font-mono">{slot.endTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => removeSlot(slot.id)}
                        className="p-2 rounded-xl text-stone-500 hover:text-rose-400 hover:bg-stone-900 transition-colors cursor-pointer"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Day Summary & Overview (Right 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="world-deck p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-amber-400" />
              Day Commitment Overview
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
                <span className="text-stone-400">Total Routine Blocks</span>
                <span className="font-bold text-foreground">{daySlots.length}</span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
                <span className="text-stone-400">Current Day</span>
                <span className="font-bold text-amber-300">
                  {DAYS.find((d) => d.id === selectedDay)?.name}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed pt-2">
              Blocks defined here synchronize into your Kyro context so your companion knows your daily rhythm.
            </p>
          </div>
        </div>
      </div>

      {/* Add Slot Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="world-deck max-w-md w-full p-6 space-y-5 border border-amber-400/30">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <h3 className="text-lg font-bold text-foreground font-serif">Add Routine Block</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">
                  Block Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deep Work Chamber, Studio Session"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-foreground focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-foreground focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value)
                      const cat = CATEGORIES.find((c) => c.name === e.target.value)
                      if (cat) setColor(cat.color)
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-foreground focus:outline-none focus:border-amber-400"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Color Accent
                  </label>
                  <div className="flex items-center gap-2 h-9">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-stone-400">{color}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-400 text-xs hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs hover:bg-amber-300 shadow"
                >
                  Save Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
