'use client'

import React, { useState } from 'react'
import { useHabitStore } from '@/store/useHabitStore'
import { useCharacterStore } from '@/store/characterStore'
import { HabitFrequency } from '@/types/local'
import { Flame, Plus, CheckCircle2, Trash2, Calendar } from 'lucide-react'
import { format, subDays } from 'date-fns'

export default function HabitsPage() {
  const { habits, completions, addHabit, removeHabit, toggleCompletion } = useHabitStore()
  const celebrate = useCharacterStore((s) => s.celebrate)

  const [showAddModal, setShowAddModal] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newFrequency, setNewFrequency] = useState<HabitFrequency>('daily')
  const [selectedColor, setSelectedColor] = useState('#34D399')

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const past7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i))

  const handleToggle = (habitId: string) => {
    const isCompleted = toggleCompletion(habitId)
    if (isCompleted) {
      celebrate()
    }
  }

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return
    addHabit({
      name: newHabitName.trim(),
      frequency: newFrequency,
      color: selectedColor,
    })
    setNewHabitName('')
    setShowAddModal(false)
  }

  const habitColors = ['#34D399', '#60A5FA', '#A78BFA', '#FBBF24', '#FB7185', '#2DD4BF']

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Habit Momentum</h1>
          <p className="text-stone-400 text-sm">Forge daily consistency and protect your streaks.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(212,168,83,0.3)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Track Habit
        </button>
      </div>

      {/* Habits List with 7-Day Heatmap */}
      <div className="space-y-3">
        {habits.map((habit) => {
          const isDoneToday = completions.some(
            (c) => c.habitId === habit.id && c.completedDate === todayStr
          )

          return (
            <div
              key={habit.id}
              className={`world-deck p-4 sm:p-5 transition-all ${
                isDoneToday ? 'border-emerald-500/30' : 'hover:border-stone-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Check Button & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => handleToggle(habit.id)}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      isDoneToday
                        ? 'bg-emerald-400 border-emerald-400 text-stone-950 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                        : 'border-stone-700 hover:border-amber-400 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 fill-current" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
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
                    </div>
                    <span className="text-[11px] text-stone-400 capitalize">{habit.frequency} frequency</span>
                  </div>
                </div>

                {/* Right: 7-Day Rolling Visual Grid */}
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="flex items-center gap-1.5">
                    {past7Days.map((date, idx) => {
                      const dStr = format(date, 'yyyy-MM-dd')
                      const isComplete = completions.some(
                        (c) => c.habitId === habit.id && c.completedDate === dStr
                      )
                      const isCurrentDay = idx === 6

                      return (
                        <div key={dStr} className="flex flex-col items-center gap-1">
                          <span className="text-[9px] text-stone-500 font-semibold uppercase">
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

                  <button
                    onClick={() => removeHabit(habit.id)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800/60 transition-colors ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {habits.length === 0 && (
          <div className="p-12 text-center world-deck border-dashed border-stone-800">
            <Flame className="w-10 h-10 text-stone-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">No habits tracked yet</h3>
            <p className="text-xs text-stone-400 mt-1">Start tracking daily routines to ignite your momentum.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-stone-950 border border-stone-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-foreground">Track a Daily Habit</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">Habit Name</label>
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g. Read 30 mins, Exercise, Hydrate..."
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">Frequency</label>
                <select
                  value={newFrequency}
                  onChange={(e) => setNewFrequency(e.target.value as HabitFrequency)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-foreground"
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays Only</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-2">Accent Color</label>
                <div className="flex gap-2">
                  {habitColors.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => setSelectedColor(hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        selectedColor === hex ? 'border-amber-400 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHabit}
                disabled={!newHabitName.trim()}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-bold text-xs"
              >
                Start Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
