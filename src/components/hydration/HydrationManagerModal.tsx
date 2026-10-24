'use client'

import React, { useState, useMemo } from 'react'
import { useHydrationStore, BeverageType, HydrationLog } from '@/store/useHydrationStore'
import {
  Droplets,
  Plus,
  Trash2,
  Edit3,
  Bell,
  Clock,
  Calendar,
  X,
  Check,
  Sparkles,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface HydrationManagerModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'log' | 'goal' | 'reminders' | 'history'
}

const GOAL_PRESETS = [1500, 2000, 2500, 3000, 3500]
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function HydrationManagerModal({
  isOpen,
  onClose,
  initialTab = 'log',
}: HydrationManagerModalProps) {
  const hydrationStore = useHydrationStore()
  const [activeTab, setActiveTab] = useState<'log' | 'goal' | 'reminders' | 'history'>(
    initialTab
  )

  const [customMlInput, setCustomMlInput] = useState('300')
  const [selectedBeverage, setSelectedBeverage] = useState<BeverageType>('water')
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editLogAmount, setEditLogAmount] = useState('')
  const [goalInput, setGoalInput] = useState(String(hydrationStore.dailyGoalMl || 2500))

  const todayProgress = useMemo(
    () => hydrationStore.getDailyProgress(),
    [
      hydrationStore.logs,
      hydrationStore.dailyGoalMl,
      hydrationStore.goalMode,
      hydrationStore.baselineWeightKg,
      hydrationStore.activeCaloriesBurned,
      hydrationStore.ambientTemperatureC,
      hydrationStore.caffeineCups,
    ]
  )

  const historyDays = useMemo(
    () => hydrationStore.getHistoryByDate(7),
    [hydrationStore.logs, hydrationStore.dailyGoalMl, hydrationStore.goalMode]
  )

  const upcomingSlots = useMemo(
    () => hydrationStore.getUpcomingReminderSlots(new Date()),
    [hydrationStore.reminderConfig, hydrationStore.logs, hydrationStore.dailyGoalMl]
  )

  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleQuickAdd = (amountMl: number) => {
    const logged = hydrationStore.logDrink(amountMl, selectedBeverage)
    if (logged) {
      toast.success(`Logged +${amountMl} ml (${selectedBeverage}).`)
    }
  }

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(customMlInput, 10)
    if (isNaN(num) || num <= 0) {
      toast.error('Please enter a valid water intake amount in ml.')
      return
    }
    hydrationStore.logDrink(num, selectedBeverage, { bypassDedup: true })
    toast.success(`Logged +${num} ml (${selectedBeverage}).`)
  }

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(goalInput)
    if (isNaN(num) || num <= 0) {
      toast.error('Please enter a valid daily goal.')
      return
    }
    const mlValue = hydrationStore.preferredUnit === 'L' && num <= 15 ? Math.round(num * 1000) : Math.round(num)
    hydrationStore.setDailyGoalMl(mlValue)
    setGoalInput(String(mlValue))
    toast.success(`Daily hydration goal set to ${mlValue.toLocaleString()} ml.`)
  }

  const toggleActiveDay = (dayIdx: number) => {
    const current = hydrationStore.reminderConfig.activeDays || [0, 1, 2, 3, 4, 5, 6]
    const next = current.includes(dayIdx)
      ? current.filter((d) => d !== dayIdx)
      : [...current, dayIdx].sort()
    hydrationStore.setReminderConfig({ activeDays: next })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Personalized Hydration Tracker and Schedule"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-3xl rounded-3xl bg-stone-950 border border-sky-500/35 p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/35 flex items-center justify-center text-sky-400">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-100">
                Personalized Hydration Tracker &amp; Schedule
              </h2>
              <p className="text-xs text-stone-400">
                Custom daily target ({todayProgress.goalMl.toLocaleString()} ml), intake logs, and hourly Android reminders.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Summary Banner */}
        <div className="my-3 p-4 rounded-2xl bg-stone-900/80 border border-sky-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-sky-300 font-bold">
                Today&apos;s Intake ({todayProgress.dateKey})
              </span>
              {todayProgress.goalReached && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  Goal Reached!
                </span>
              )}
            </div>
            <div className="text-2xl font-serif font-bold text-stone-100">
              {todayProgress.consumedMl.toLocaleString()} ml{' '}
              <span className="text-sm font-sans text-stone-400">
                / {todayProgress.goalMl.toLocaleString()} ml ({todayProgress.completionPercentage}%)
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Remaining today:{' '}
              <strong className="text-sky-300 font-mono">
                {todayProgress.remainingMl.toLocaleString()} ml
              </strong>
            </p>
          </div>

          <div className="w-full sm:w-48 h-3 rounded-full bg-stone-950 border border-stone-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-500"
              style={{ width: `${todayProgress.completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 mb-3 rounded-2xl bg-stone-900/90 border border-stone-800 text-xs shrink-0">
          {[
            { id: 'log', label: 'Log & Entries' },
            { id: 'goal', label: 'Daily Goal' },
            { id: 'reminders', label: 'Hourly Reminders' },
            { id: 'history', label: '7-Day History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-sky-400 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* TAB 1: LOG & ENTRIES */}
          {activeTab === 'log' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-200">Quick-Add Serving</span>
                  <div className="flex gap-1.5">
                    {(['water', 'electrolyte', 'tea', 'coffee'] as BeverageType[]).map((bev) => (
                      <button
                        key={bev}
                        type="button"
                        onClick={() => setSelectedBeverage(bev)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize cursor-pointer ${
                          selectedBeverage === bev
                            ? 'bg-sky-400/20 border border-sky-400 text-sky-300'
                            : 'bg-stone-950 border border-stone-800 text-stone-400'
                        }`}
                      >
                        {bev}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[150, 250, 350, 500].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleQuickAdd(size)}
                      className="py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-300 font-mono font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{size} ml</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleCustomAdd} className="flex gap-2 pt-1">
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={customMlInput}
                    onChange={(e) => setCustomMlInput(e.target.value)}
                    placeholder="Custom ml (e.g. 400)"
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-100 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-stone-950 font-bold text-xs cursor-pointer"
                  >
                    + Log Custom ml
                  </button>
                </form>
              </div>

              {/* Today's Entries List with Edit & Delete */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300 font-mono">
                  Today&apos;s Hydration Entries ({todayProgress.logs.length})
                </h3>
                {todayProgress.logs.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-stone-900/40 border border-dashed border-stone-800 text-center text-xs text-stone-400">
                    No water logged yet today. Tap a serving size above to begin!
                  </div>
                ) : (
                  todayProgress.logs.map((entry: HydrationLog) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-xs font-bold text-stone-100 font-mono">
                          +{entry.amountMl} ml
                        </span>
                        <span className="text-[11px] text-stone-400 ml-2 capitalize">
                          ({entry.beverageType})
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono ml-2">
                          {format(new Date(entry.timestamp), 'h:mm a')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {editingLogId === entry.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editLogAmount}
                              onChange={(e) => setEditLogAmount(e.target.value)}
                              className="w-20 px-2 py-1 rounded bg-stone-950 border border-sky-400 text-xs font-mono text-stone-100"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = parseInt(editLogAmount, 10)
                                if (!isNaN(val) && val > 0) {
                                  hydrationStore.updateLog(entry.id, { amountMl: val })
                                  toast.success(`Updated entry to ${val} ml.`)
                                }
                                setEditingLogId(null)
                              }}
                              className="p-1.5 rounded bg-emerald-500/20 text-emerald-300 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLogId(entry.id)
                              setEditLogAmount(String(entry.amountMl))
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-sky-300 hover:bg-stone-800 cursor-pointer"
                            title="Edit amount"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            hydrationStore.removeLog(entry.id)
                            toast.info('Removed hydration entry.')
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PERSONALIZED DAILY GOAL */}
          {activeTab === 'goal' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono">
                  Set Your Personal Daily Hydration Target
                </h3>
                <p className="text-xs text-stone-400">
                  Choose a preset or enter any custom daily target in milliliters (ml). Progress and reminders immediately adjust to your goal.
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {GOAL_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        hydrationStore.setDailyGoalMl(preset)
                        setGoalInput(String(preset))
                        toast.success(`Daily hydration goal set to ${preset.toLocaleString()} ml.`)
                      }}
                      className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                        hydrationStore.dailyGoalMl === preset &&
                        hydrationStore.goalMode === 'custom'
                          ? 'bg-sky-400 text-stone-950 border-sky-400 shadow'
                          : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-sky-400/50'
                      }`}
                    >
                      {preset.toLocaleString()} ml
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSaveGoal} className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      Custom Daily Goal (ml)
                    </label>
                    <input
                      type="number"
                      min="250"
                      max="10000"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-100 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="self-end px-5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-stone-950 font-bold text-xs cursor-pointer"
                  >
                    Save Custom Goal
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: HOURLY / INTERVAL REMINDER CONFIGURATION */}
          {activeTab === 'reminders' && (
            <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-5 h-5 text-sky-400" />
                  <div>
                    <h3 className="text-sm font-bold text-stone-100">
                      Android Hydration Reminder Schedule
                    </h3>
                    <p className="text-xs text-stone-400">
                      Schedules native Android notifications during your active hours.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={hydrationStore.reminderConfig.enabled}
                  onChange={(e) =>
                    hydrationStore.setReminderConfig({ enabled: e.target.checked })
                  }
                  className="accent-sky-400 w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={hydrationStore.reminderConfig.startTime}
                    onChange={(e) =>
                      hydrationStore.setReminderConfig({ startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={hydrationStore.reminderConfig.endTime}
                    onChange={(e) =>
                      hydrationStore.setReminderConfig({ endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    Reminder Interval
                  </label>
                  <select
                    value={hydrationStore.reminderConfig.intervalMinutes}
                    onChange={(e) =>
                      hydrationStore.setReminderConfig({
                        intervalMinutes: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-100"
                  >
                    <option value={30}>Every 30 minutes</option>
                    <option value={60}>Every 1 hour (60 min)</option>
                    <option value={90}>Every 90 minutes</option>
                    <option value={120}>Every 2 hours (120 min)</option>
                    <option value={180}>Every 3 hours (180 min)</option>
                  </select>
                </div>
              </div>

              {/* Active Days */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1.5">
                  Active Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAY_LABELS.map((label, idx) => {
                    const active = hydrationStore.reminderConfig.activeDays.includes(idx)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleActiveDay(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          active
                            ? 'bg-sky-400 text-stone-950'
                            : 'bg-stone-950 border border-stone-800 text-stone-400'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Stop when goal reached & Quiet hours */}
              <div className="space-y-2.5 pt-2 border-t border-stone-800">
                <label className="flex items-center justify-between text-xs text-stone-200 cursor-pointer">
                  <span>Automatically stop reminders when daily goal is reached</span>
                  <input
                    type="checkbox"
                    checked={hydrationStore.reminderConfig.stopWhenGoalReached}
                    onChange={(e) =>
                      hydrationStore.setReminderConfig({
                        stopWhenGoalReached: e.target.checked,
                      })
                    }
                    className="accent-sky-400 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-stone-200 cursor-pointer">
                  <span>
                    Respect Quiet Hours ({hydrationStore.reminderConfig.quietHoursStart} –{' '}
                    {hydrationStore.reminderConfig.quietHoursEnd})
                  </span>
                  <input
                    type="checkbox"
                    checked={hydrationStore.reminderConfig.quietHoursEnabled}
                    onChange={(e) =>
                      hydrationStore.setReminderConfig({
                        quietHoursEnabled: e.target.checked,
                      })
                    }
                    className="accent-sky-400 w-4 h-4"
                  />
                </label>
              </div>

              {upcomingSlots.length > 0 && (
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-400">
                  Next scheduled reminder:{' '}
                  <strong className="text-sky-300">
                    {format(upcomingSlots[0], 'MMM d, h:mm a')}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 7-DAY HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300 font-mono">
                Last 7 Days Hydration History
              </h3>
              {historyDays.map((day) => (
                <div
                  key={day.dateKey}
                  className="p-3.5 rounded-2xl bg-stone-900/70 border border-stone-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-xs font-bold text-stone-100 font-mono">
                      {day.dateKey}
                    </span>
                    <span className="text-xs text-stone-400 ml-3">
                      {day.consumedMl.toLocaleString()} ml / {day.goalMl.toLocaleString()} ml
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-28 h-2 rounded-full bg-stone-950 overflow-hidden">
                      <div
                        className="h-full bg-sky-400"
                        style={{ width: `${day.completionPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-sky-300 w-10 text-right">
                      {day.completionPercentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
