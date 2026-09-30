// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useHabitStore, Habit } from '@/store/useHabitStore'
import { toggleHabitCompletion, deleteHabit } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Flame, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { EditHabitDialog } from './EditHabitDialog'
import { toast } from 'sonner'

export function HabitList({ initialHabits }: { initialHabits: Habit[] }) {
  const { habits, setHabits, toggleCompletion, removeHabit } = useHabitStore()
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    setHabits(initialHabits)
  }, [initialHabits, setHabits])

  const todayDateStr = new Date().toISOString().split('T')[0]

  const handleToggle = async (habitId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    // Optimistic toggle
    toggleCompletion(habitId, todayDateStr, nextStatus)
    try {
      const res = await toggleHabitCompletion(habitId, todayDateStr)
      if (res && typeof res.streak === 'number') {
        // Sync computed streak
        toggleCompletion(habitId, todayDateStr, nextStatus, res.streak)
      }
    } catch (err) {
      console.error(err)
      // Revert optimistic update
      toggleCompletion(habitId, todayDateStr, currentStatus)
      toast.error('Failed to update habit completion')
    }
  }

  const handleDelete = async (id: string) => {
    const prev = [...habits]
    removeHabit(id)
    try {
      await deleteHabit(id)
      toast.success('Habit deleted')
    } catch (err) {
      console.error(err)
      setHabits(prev)
      toast.error('Failed to delete habit')
    }
  }

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setIsEditDialogOpen(true)
  }

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-white/5 rounded-[24px] bg-secondary/20 shadow-inner">
        <div className="h-16 w-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4 border border-white/5 shadow-sm">
          <Flame className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">No habits tracked yet</h3>
        <p className="mt-2 text-[14px] font-medium text-muted-foreground max-w-sm text-center">
          Create a habit to build your routine and maintain consistency.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit) => {
          const isCompletedToday =
            habit.habit_completions?.some((c) => c.completed_date === todayDateStr) ?? false

          return (
            <Card
              key={habit.id}
              className="glass-card border-white/5 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 relative overflow-hidden group rounded-[20px]"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500"
                style={{ backgroundImage: `linear-gradient(to bottom right, transparent, ${habit.color})` }}
              />
              <div
                className="absolute top-0 left-0 w-1.5 h-full transition-transform duration-300 group-hover:scale-y-110"
                style={{ backgroundColor: habit.color }}
              />

              <CardHeader className="pb-4 relative z-10 pl-6 border-b border-white/5">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                      {habit.name}
                    </CardTitle>
                    <span className="text-[11px] text-muted-foreground/80 uppercase font-bold tracking-wider mt-1 block">
                      {habit.frequency}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(habit)}
                      className="h-8 w-8 text-muted-foreground/70 hover:text-primary hover:bg-primary/10 rounded-lg"
                      title="Edit Habit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger
                        className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors h-8 w-8 text-muted-foreground/70 hover:text-brand-rose hover:bg-brand-rose/10"
                        title="Delete Habit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-border bg-card shadow-[0_8px_30px_rgb(0,0,0,0.4)] sm:rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">Delete Habit</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete this habit? You will lose all history and streaks.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-secondary/50 border-border hover:bg-secondary hover:text-foreground">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(habit.id)}
                            className="bg-brand-rose hover:bg-brand-rose/90 text-white border-transparent"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pl-6 pt-4 pb-5 relative z-10">
                <div className="flex items-center justify-between bg-secondary/30 p-3.5 rounded-[12px] border border-white/5 transition-colors group-hover:bg-secondary/50">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`p-1.5 rounded-[8px] transition-transform group-hover:scale-105 ${
                        habit.streak > 0
                          ? 'bg-brand-amber/15 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'bg-secondary/80'
                      }`}
                    >
                      <Flame
                        className={`h-4 w-4 ${
                          habit.streak > 0 ? 'text-brand-amber' : 'text-muted-foreground opacity-50'
                        }`}
                      />
                    </div>
                    <span className="font-bold text-foreground text-[15px]">
                      {habit.streak}{' '}
                      <span className="text-[12px] font-semibold text-muted-foreground/80">
                        day streak
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      {isCompletedToday ? 'Completed' : 'To do'}
                    </span>
                    <Checkbox
                      checked={isCompletedToday}
                      onCheckedChange={() => handleToggle(habit.id, isCompletedToday)}
                      className="h-6 w-6 rounded-full transition-all border-muted-foreground/40 shadow-sm cursor-pointer"
                      style={{
                        borderColor: isCompletedToday ? habit.color : '',
                        backgroundColor: isCompletedToday ? habit.color : '',
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <EditHabitDialog
        habit={editingHabit}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  )
}
