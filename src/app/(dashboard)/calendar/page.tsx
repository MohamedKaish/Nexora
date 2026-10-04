'use client'

import React, { useState } from 'react'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useGoalStore } from '@/store/useGoalStore'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Target,
  Flame,
  Plus,
} from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const tasks = useTaskStore((s) => s.tasks)
  const completions = useHabitStore((s) => s.completions)
  const habits = useHabitStore((s) => s.habits)
  const goals = useGoalStore((s) => s.goals)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')

  // Find items on selected date
  const dayTasks = tasks.filter((t) => t.dueDate === selectedDateStr)
  const dayCompletions = completions.filter((c) => c.completedDate === selectedDateStr)
  const dayGoals = goals.filter((g) => g.periodEnd === selectedDateStr)

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gradient-gold">
            Sanctuary Calendar
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Visual map of deadlines, habit consistency, and milestone horizons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-2xl p-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-foreground font-mono">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Month Calendar Grid (Left 8 cols) */}
        <div className="lg:col-span-8 world-deck p-6 space-y-4">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-stone-400 uppercase tracking-wider pb-2 border-b border-stone-800/80">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Pad blank days before start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 sm:h-24 rounded-2xl bg-stone-900/20" />
            ))}

            {daysInMonth.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd')
              const isSel = isSameDay(day, selectedDate)
              const isCurrentDay = isToday(day)

              const dayTaskCount = tasks.filter((t) => t.dueDate === dayStr).length
              const dayHabitCount = completions.filter((c) => c.completedDate === dayStr).length
              const dayGoalCount = goals.filter((g) => g.periodEnd === dayStr).length

              return (
                <div
                  key={dayStr}
                  onClick={() => setSelectedDate(day)}
                  className={`h-20 sm:h-24 p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSel
                      ? 'bg-amber-400/15 border-amber-400 shadow-[0_0_15px_rgba(212,168,83,0.25)]'
                      : isCurrentDay
                      ? 'bg-stone-900 border-amber-400/50'
                      : 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono ${
                        isCurrentDay
                          ? 'text-amber-400 bg-amber-400/20 px-1.5 py-0.5 rounded'
                          : 'text-stone-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {dayTaskCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-blue-400" title={`${dayTaskCount} tasks`} />
                    )}
                    {dayHabitCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" title={`${dayHabitCount} habits done`} />
                    )}
                    {dayGoalCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="Milestone Target" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Date Detail Drawer (Right 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="world-deck p-6 space-y-5">
            <div className="border-b border-stone-800 pb-3">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                Selected Horizon
              </span>
              <h3 className="text-xl font-serif font-bold text-foreground mt-0.5">
                {format(selectedDate, 'EEEE, MMM dd')}
              </h3>
            </div>

            {/* Tasks Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                Tasks Due ({dayTasks.length})
              </h4>
              {dayTasks.length === 0 ? (
                <p className="text-xs text-stone-500 py-2">No tasks scheduled for this day.</p>
              ) : (
                <div className="space-y-2">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-xl bg-stone-900/70 border border-stone-800 text-xs flex items-center justify-between"
                    >
                      <span className={t.status === 'done' ? 'line-through text-stone-500' : 'text-stone-200'}>
                        {t.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-amber-400 font-mono">
                        {t.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Habit Check-ins */}
            <div className="space-y-3 pt-2 border-t border-stone-800/80">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Habits Completed ({dayCompletions.length})
              </h4>
              {dayCompletions.length === 0 ? (
                <p className="text-xs text-stone-500 py-2">No habit check-ins recorded.</p>
              ) : (
                <div className="space-y-2">
                  {dayCompletions.map((c) => {
                    const habit = habits.find((h) => h.id === c.habitId)
                    return (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-xl bg-stone-900/70 border border-stone-800 text-xs flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-stone-200">{habit?.name || 'Habit Completed'}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Goal Targets */}
            {dayGoals.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-stone-800/80">
                <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  Target Milestone
                </h4>
                {dayGoals.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs space-y-1"
                  >
                    <p className="font-bold text-amber-300">{g.title}</p>
                    <p className="text-[11px] text-stone-400">{g.progress}% completed</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
