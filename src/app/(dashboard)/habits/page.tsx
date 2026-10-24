'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useHabitStore } from '@/store/useHabitStore'
import { useCharacterStore } from '@/store/characterStore'
import { HabitFrequency, LocalHabit } from '@/types/local'
import {
  Flame,
  Plus,
  CheckCircle2,
  Trash2,
  Clock,
  Bell,
  Edit3,
  X,
  Check,
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { toast } from 'sonner'
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notificationService'

const WEEKDAYS = [
  { day: 0, label: 'Sun' },
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
]

export default function HabitsPage() {
  const [mounted, setMounted] = useState(false)
  const { habits, completions, addHabit, updateHabit, removeHabit, toggleCompletion } =
    useHabitStore()
  const celebrate = useCharacterStore((s) => s.celebrate)

  const [activeFilter, setActiveFilter] = useState<'all' | 'scheduled' | 'anytime'>('all')
  const [highlightedHabitId, setHighlightedHabitId] = useState<string | null>(null)

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)

  // Habit Form Fields
  const [newHabitName, setNewHabitName] = useState('')
  const [newFrequency, setNewFrequency] = useState<HabitFrequency>('daily')
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [selectedColor, setSelectedColor] = useState('#34D399')
  const [hasTimeRange, setHasTimeRange] = useState(true)
  const [startTime, setStartTime] = useState('06:00')
  const [endTime, setEndTime] = useState('07:00')
  const [enableReminder, setEnableReminder] = useState(true)

  // Notification Permission State
  const [notifPermission, setNotifPermission] = useState<string>('default')

  useEffect(() => {
    setMounted(true)
    setNotifPermission(getNotificationPermission())

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const habitId = params.get('habitId')
      const completeHabitId = params.get('completeHabitId')

      if (completeHabitId) {
        const todayKey = format(new Date(), 'yyyy-MM-dd')
        const alreadyDone = useHabitStore
          .getState()
          .completions.some(
            (c) => c.habitId === completeHabitId && c.completedDate === todayKey
          )
        if (!alreadyDone) {
          useHabitStore.getState().toggleCompletion(completeHabitId)
          toast.success('Habit checked off for today from notification!')
        }
        setHighlightedHabitId(completeHabitId)
      } else if (habitId) {
        setHighlightedHabitId(habitId)
      }
    }
  }, [])

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission()
    setNotifPermission(perm)
    if (perm === 'granted') {
      toast.success(
        'Phone notifications enabled! You will be alerted at your scheduled habit times.'
      )
    } else if (perm === 'denied') {
      toast.error(
        'Permission blocked. Please enable notifications in Android App Settings.'
      )
    }
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const currentTimeStr = format(new Date(), 'HH:mm')
  const past7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i))

  const handleToggle = (habitId: string) => {
    const isCompleted = toggleCompletion(habitId)
    if (isCompleted) {
      celebrate()
      toast.success('Habit completed for today! Today’s remaining reminder suppressed.')
    }
  }

  const openCreateModal = () => {
    setEditingHabitId(null)
    setNewHabitName('')
    setNewFrequency('daily')
    setSelectedDays([1, 2, 3, 4, 5])
    setSelectedColor('#34D399')
    setHasTimeRange(true)
    setStartTime('06:00')
    setEndTime('07:00')
    setEnableReminder(true)
    setShowAddModal(true)
  }

  const openEditModal = (habit: LocalHabit) => {
    setEditingHabitId(habit.id)
    setNewHabitName(habit.name)
    setNewFrequency(habit.frequency)
    setSelectedDays(habit.selectedDays || [1, 2, 3, 4, 5])
    setSelectedColor(habit.color || '#34D399')
    setHasTimeRange(habit.hasTimeRange ?? Boolean(habit.startTime || habit.reminderTime))
    setStartTime(habit.reminderTime || habit.startTime || '06:00')
    setEndTime(habit.endTime || '07:00')
    setEnableReminder(habit.enableReminder ?? true)
    setShowAddModal(true)
  }

  const toggleCustomDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const handleSaveHabit = async () => {
    if (!newHabitName.trim()) return

    if (
      enableReminder &&
      hasTimeRange &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      try {
        const perm = await requestNotificationPermission()
        setNotifPermission(perm)
      } catch {}
    }

    const payload = {
      name: newHabitName.trim(),
      frequency: newFrequency,
      selectedDays: newFrequency === 'custom' ? selectedDays : undefined,
      color: selectedColor,
      hasTimeRange,
      startTime: hasTimeRange ? startTime : null,
      endTime: hasTimeRange ? endTime : null,
      reminderTime: hasTimeRange ? startTime : null,
      enableReminder: hasTimeRange ? enableReminder : false,
    }

    if (editingHabitId) {
      updateHabit(editingHabitId, payload)
      toast.success(
        hasTimeRange && enableReminder
          ? `Habit "${newHabitName.trim()}" updated with ${startTime} Android reminder.`
          : `Habit "${newHabitName.trim()}" updated.`
      )
    } else {
      addHabit(payload)
      toast.success(
        hasTimeRange && enableReminder
          ? `Habit "${newHabitName.trim()}" created! Phone reminder scheduled for ${startTime}.`
          : `Habit "${newHabitName.trim()}" created.`
      )
    }

    setShowAddModal(false)
    setEditingHabitId(null)
  }

  const handleToggleReminderSwitch = async (val: boolean) => {
    setEnableReminder(val)
    if (val && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const perm = await requestNotificationPermission()
        setNotifPermission(perm)
      }
    }
  }

  const filteredHabits = useMemo(() => {
    if (activeFilter === 'scheduled') {
      return habits.filter((h) => h.hasTimeRange || h.reminderTime)
    }
    if (activeFilter === 'anytime') {
      return habits.filter((h) => !h.hasTimeRange && !h.reminderTime)
    }
    return habits
  }, [habits, activeFilter])

  const habitColors = ['#34D399', '#60A5FA', '#A78BFA', '#FBBF24', '#FB7185', '#2DD4BF']

  if (!mounted) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-20 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
        <div className="h-64 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Habit Momentum</h1>
          <p className="text-stone-400 text-sm">
            Forge unbroken routines with scheduled Android notifications &amp; streak tracking.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(212,168,83,0.3)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Track Habit
        </button>
      </div>

      {/* Notification Permission Status Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-stone-900/80 via-stone-950 to-stone-900/60 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                Android Habit Reminder Notifications
              </span>
              {notifPermission === 'granted' ? (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 font-mono">
                  <Check className="w-2.5 h-2.5" /> Active
                </span>
              ) : notifPermission === 'denied' ? (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-400/20 text-rose-300 text-[10px] font-bold font-mono">
                  Permission Denied
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold font-mono">
                  Action Required
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400">
              {notifPermission === 'granted'
                ? 'Scheduled habit notifications appear in your Android notification shade at your chosen time.'
                : notifPermission === 'denied'
                ? 'Notifications are disabled. Enable notifications in Android Settings > Apps > Nexora > Notifications.'
                : 'Allow notification permission so your phone rings and shows habit reminders on time.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          {notifPermission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,168,83,0.3)] transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable Phone Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-stone-800/80 pb-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-amber-400 text-stone-950 font-bold shadow'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          All Habits ({habits.length})
        </button>
        <button
          onClick={() => setActiveFilter('scheduled')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeFilter === 'scheduled'
              ? 'bg-amber-400 text-stone-950 font-bold shadow'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>
            Scheduled Windows ({habits.filter((h) => h.hasTimeRange || h.reminderTime).length})
          </span>
        </button>
        <button
          onClick={() => setActiveFilter('anytime')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'anytime'
              ? 'bg-amber-400 text-stone-950 font-bold shadow'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Anytime Flow ({habits.filter((h) => !h.hasTimeRange && !h.reminderTime).length})
        </button>
      </div>

      {/* Habits List with 7-Day Heatmap & Timing Window Pills */}
      <div className="space-y-3">
        {filteredHabits.map((habit) => {
          const isDoneToday = completions.some(
            (c) => c.habitId === habit.id && c.completedDate === todayStr
          )

          const effectiveStart = habit.reminderTime || habit.startTime
          const hasWindow = Boolean(habit.hasTimeRange && effectiveStart)
          const isWindowActive =
            hasWindow &&
            currentTimeStr >= effectiveStart! &&
            (!habit.endTime || currentTimeStr <= habit.endTime)
          const isWindowUpcoming = hasWindow && currentTimeStr < effectiveStart!
          const isHighlighted = highlightedHabitId === habit.id

          return (
            <div
              key={habit.id}
              className={`world-deck p-4 sm:p-5 transition-all ${
                isDoneToday
                  ? 'border-emerald-500/30'
                  : isHighlighted
                  ? 'border-amber-400 ring-1 ring-amber-400/50'
                  : isWindowActive
                  ? 'border-amber-400/60 ring-1 ring-amber-400/40 bg-amber-500/5'
                  : 'hover:border-stone-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Check Button & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => handleToggle(habit.id)}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      isDoneToday
                        ? 'bg-emerald-400 border-emerald-400 text-stone-950 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                        : 'border-stone-700 hover:border-amber-400 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 fill-current" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm font-bold ${
                          isDoneToday ? 'text-emerald-300' : 'text-foreground'
                        }`}
                      >
                        {habit.name}
                      </h3>

                      {habit.streak > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                          <Flame className="w-3 h-3 fill-current" />
                          {habit.streak} streak
                        </span>
                      )}

                      {/* Timing Window Pill */}
                      {hasWindow && (
                        <span
                          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                            isDoneToday
                              ? 'bg-stone-900 border-stone-800 text-stone-400'
                              : isWindowActive
                              ? 'bg-amber-400/20 border-amber-400/60 text-amber-300 animate-pulse font-bold'
                              : isWindowUpcoming
                              ? 'bg-stone-900 border-stone-800 text-stone-300'
                              : 'bg-stone-900/60 border-stone-800 text-stone-500'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {effectiveStart}
                            {habit.endTime ? ` – ${habit.endTime}` : ''}
                          </span>
                        </span>
                      )}

                      {/* Reminder active indicator */}
                      {hasWindow && habit.enableReminder && (
                        <span
                          className="text-[10px] text-amber-400/80 bg-stone-900 p-1 rounded-md border border-stone-800"
                          title="Scheduled Android reminder active"
                        >
                          <Bell className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[11px] text-stone-400 capitalize">
                        {habit.frequency === 'custom' && habit.selectedDays?.length
                          ? `Custom days (${habit.selectedDays
                              .map((d) => WEEKDAYS.find((w) => w.day === d)?.label)
                              .join(', ')})`
                          : `${habit.frequency} frequency`}
                      </span>
                      {isWindowActive && !isDoneToday && (
                        <span className="text-[11px] text-amber-400 font-semibold">
                          • Window active right now!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: 7-Day Rolling Visual Grid & Actions */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="flex items-center gap-1.5">
                    {past7Days.map((date, idx) => {
                      const dStr = format(date, 'yyyy-MM-dd')
                      const isComplete = completions.some(
                        (c) => c.habitId === habit.id && c.completedDate === dStr
                      )
                      const isCurrentDay = idx === 6

                      return (
                        <div key={dStr} className="flex flex-col items-center gap-1">
                          <span
                            className="text-[9px] text-stone-500 font-semibold uppercase"
                            suppressHydrationWarning
                          >
                            {format(date, 'EEE').charAt(0)}
                          </span>
                          <div
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-bold transition-all ${
                              isComplete
                                ? 'bg-emerald-400/20 border-emerald-400 text-emerald-300'
                                : isCurrentDay
                                ? 'border-dashed border-stone-600 bg-stone-900/40 text-stone-600'
                                : 'border-stone-800 bg-stone-950/40 text-transparent'
                            }`}
                          >
                            {isComplete ? '✓' : ''}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => openEditModal(habit)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-amber-400 hover:bg-stone-800/60 transition-colors ml-1 cursor-pointer"
                    title="Edit habit & timing window"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => {
                      removeHabit(habit.id)
                      toast.info('Habit deleted and scheduled reminders cancelled.')
                    }}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800/60 transition-colors cursor-pointer"
                    title="Delete habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {filteredHabits.length === 0 && (
          <div className="p-12 text-center world-deck border-dashed border-stone-800">
            <Flame className="w-10 h-10 text-stone-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">No habits found in this category</h3>
            <p className="text-xs text-stone-400 mt-1">
              Start tracking daily routines to ignite your momentum.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-stone-950 border border-amber-400/40 p-6 sm:p-7 space-y-4 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800 shrink-0">
              <h3 className="text-xl font-serif font-bold text-foreground">
                {editingHabitId ? 'Configure Habit & Timing' : 'Track a New Daily Habit'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g. Wake Up 06:00 AM, Evening Workout, Meditation..."
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Frequency
                </label>
                <select
                  value={newFrequency}
                  onChange={(e) => setNewFrequency(e.target.value as HabitFrequency)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-foreground"
                >
                  <option value="daily">Daily Habit</option>
                  <option value="weekdays">Weekdays Only (Mon–Fri)</option>
                  <option value="weekly">Weekly Routine</option>
                  <option value="custom">Custom Selected Days</option>
                </select>
              </div>

              {newFrequency === 'custom' && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 mb-1.5">
                    Select Days of Week
                  </label>
                  <div className="flex gap-1.5">
                    {WEEKDAYS.map((w) => {
                      const active = selectedDays.includes(w.day)
                      return (
                        <button
                          key={w.day}
                          type="button"
                          onClick={() => toggleCustomDay(w.day)}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            active
                              ? 'bg-amber-400 text-stone-950 border-amber-400'
                              : 'bg-stone-900 text-stone-400 border-stone-800'
                          }`}
                        >
                          {w.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* PHONE REMINDER TIMING */}
              <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      <span>Phone Reminder Timing (e.g. 06:00 AM)</span>
                    </label>
                    <p className="text-[11px] text-stone-400">
                      Schedules an Android notification shade alert at your exact time
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasTimeRange(!hasTimeRange)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      hasTimeRange ? 'bg-amber-400 justify-end' : 'bg-stone-800 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-stone-950 transition-transform" />
                  </button>
                </div>

                {hasTimeRange && (
                  <div className="space-y-3 pt-3 border-t border-stone-800 animate-in fade-in duration-200">
                    {/* Quick Window Presets */}
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold block mb-1.5">
                        Quick Reminder Presets:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { label: '06:00 Wake Up', icon: '🌅', start: '06:00', end: '07:00' },
                          { label: '08:00 Routine', icon: '☀️', start: '08:00', end: '09:00' },
                          { label: '18:00 Workout', icon: '💪', start: '18:00', end: '19:00' },
                          { label: '22:00 Sleep', icon: '🌙', start: '22:00', end: '23:00' },
                        ].map((p) => (
                          <button
                            type="button"
                            key={p.label}
                            onClick={() => {
                              setStartTime(p.start)
                              setEndTime(p.end)
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                              startTime === p.start && endTime === p.end
                                ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                            }`}
                          >
                            <span>{p.icon}</span>
                            <span>{p.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Time Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-300 mb-1">
                          Remind Me At
                        </label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-amber-400 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-stone-300 mb-1">
                          Window Closes At
                        </label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-amber-400 font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Phone Notification Toggle */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-950 border border-stone-800/80">
                      <div className="flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
                        <div>
                          <span className="text-xs text-stone-200 font-semibold block">
                            Send Android System Notification
                          </span>
                          <span className="text-[10px] text-stone-400">
                            Delivers reminder at {startTime} to your phone notification shade
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableReminder}
                        onChange={(e) => handleToggleReminderSwitch(e.target.checked)}
                        className="accent-amber-400 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2">
                  Accent Color
                </label>
                <div className="flex gap-2">
                  {habitColors.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setSelectedColor(hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-colors ${
                        selectedColor === hex ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveHabit}
                disabled={!newHabitName.trim()}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-bold text-xs cursor-pointer shadow-[0_0_15px_rgba(212,168,83,0.3)]"
              >
                {editingHabitId ? 'Save Changes' : 'Start Tracking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
