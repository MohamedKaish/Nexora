'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Flame, Check, Trash2 } from 'lucide-react'
import { useHabitStore } from '@/store/useHabitStore'
import type { HabitFrequency } from '@/types/local'
import { format, subDays } from 'date-fns'

const HABIT_COLORS = ['#34D399', '#60A5FA', '#A78BFA', '#FB7185', '#FBBF24', '#F87171', '#2DD4BF']
const FREQ_LABELS: Record<HabitFrequency, string> = { daily: 'Daily', weekly: 'Weekly', weekdays: 'Weekdays' }

export default function HabitsPage() {
  const { habits, addHabit, removeHabit, toggleCompletion } = useHabitStore()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFrequency, setNewFrequency] = useState<HabitFrequency>('daily')
  const [newColor, setNewColor] = useState('#34D399')

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i)), [])

  const isCompletedOnDate = (habit: typeof habits[0], date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return habit.habit_completions?.some(c => {
      const completedDate = c.completedDate || (c as unknown as Record<string, unknown>).completed_date as string
      return completedDate === dateStr
    }) || false
  }

  const handleCreate = () => {
    if (!newName.trim()) return
    addHabit({ name: newName.trim(), frequency: newFrequency, color: newColor })
    setNewName(''); setNewFrequency('daily'); setNewColor('#34D399')
    setIsCreateOpen(false)
  }

  const handleToggle = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    const isCompleted = isCompletedOnDate(habit, new Date())
    toggleCompletion(habitId, todayStr, !isCompleted)
  }

  const activeHabits = habits.filter(h => !h.deletedAt)

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-gradient">Habits</h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm">{activeHabits.length} habits tracked</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-1.5 cursor-pointer shadow-sm" />}>
            <Plus className="w-4 h-4" /> New Habit
          </DialogTrigger>
          <DialogContent className="rounded-2xl world-glass border-border/20">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Track a Habit</DialogTitle>
              <DialogDescription>Build consistency with daily habits.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input
                placeholder="e.g. Read 30 minutes"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
                className="rounded-xl bg-background/60 border-border/30"
              />
              <Select value={newFrequency} onValueChange={v => setNewFrequency(v as HabitFrequency)}>
                <SelectTrigger className="rounded-xl bg-background/60 border-border/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['daily', 'weekly', 'weekdays'] as HabitFrequency[]).map(f => (
                    <SelectItem key={f} value={f}>{FREQ_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Color</p>
                <div className="flex gap-2">
                  {HABIT_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${newColor === c ? 'border-accent scale-110' : 'border-border/30 hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer font-semibold">
                Create Habit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeHabits.length === 0 ? (
        <div className="empty-world rounded-3xl py-16 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-amber/5 flex items-center justify-center mb-4">
            <Flame className="w-6 h-6 text-brand-amber/30" />
          </div>
          <h3 className="text-base font-bold text-foreground">No habits yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Start tracking habits to build consistency.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl cursor-pointer font-semibold gap-1.5">
            <Plus className="w-4 h-4" /> Track a Habit
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {activeHabits.map(habit => {
            const isCompletedToday = isCompletedOnDate(habit, new Date())

            return (
              <div
                key={habit.id}
                className={`group world-card p-4 transition-all duration-200 ${
                  isCompletedToday ? 'border-brand-emerald/15' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Check button */}
                  <button
                    onClick={() => handleToggle(habit.id)}
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isCompletedToday
                        ? 'text-white shadow-sm'
                        : 'border-[1.5px] border-border/40 hover:border-accent/40'
                    }`}
                    style={isCompletedToday ? { backgroundColor: habit.color } : {}}
                    aria-label={isCompletedToday ? 'Unmark habit' : 'Mark habit done'}
                  >
                    {isCompletedToday && <Check className="w-4 h-4" />}
                  </button>

                  {/* Habit info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${isCompletedToday ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {habit.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {habit.streak > 0 && (
                        <span className="text-[10px] font-bold text-brand-amber flex items-center gap-0.5">
                          <Flame className="w-3 h-3" /> {habit.streak}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground font-medium">{FREQ_LABELS[habit.frequency]}</span>
                    </div>
                  </div>

                  {/* 7-day history */}
                  <div className="hidden sm:flex items-center gap-1">
                    {last7Days.map((date, i) => {
                      const completed = isCompletedOnDate(habit, date)
                      const isToday = i === 6
                      return (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <span className="text-[9px] text-muted-foreground/50 font-medium">{format(date, 'EEE').charAt(0)}</span>
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              completed ? '' : isToday ? 'border border-dashed border-border/40' : 'bg-foreground/[0.02]'
                            }`}
                            style={completed ? { backgroundColor: habit.color } : {}}
                          >
                            {completed && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeHabit(habit.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Delete habit"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
