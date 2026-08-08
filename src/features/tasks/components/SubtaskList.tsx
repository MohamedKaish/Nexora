'use client'

import { useState } from 'react'
import { Database } from '@/types/database.types'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Plus } from 'lucide-react'
import { createSubtask, toggleSubtask, deleteSubtask } from '../actions'

type Subtask = Database['public']['Tables']['subtasks']['Row']

export function SubtaskList({ taskId, initialSubtasks }: { taskId: string, initialSubtasks: Subtask[] }) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks)
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setLoading(true)
    try {
      const subtask = await createSubtask(taskId, newTitle)
      setSubtasks([...subtasks, subtask])
      setNewTitle('')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string, isCompleted: boolean) => {
    // Optimistic
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, is_completed: !isCompleted } : s))
    try {
      await toggleSubtask(id, !isCompleted)
    } catch {
      // Revert on error
      setSubtasks(prev => prev.map(s => s.id === id ? { ...s, is_completed: isCompleted } : s))
    }
  }

  const handleDelete = async (id: string) => {
    const prev = [...subtasks]
    setSubtasks(prev.filter(s => s.id !== id))
    try {
      await deleteSubtask(id)
    } catch {
      window.location.reload()
    }
  }

  const progress = subtasks.length === 0 ? 0 : Math.round((subtasks.filter(s => s.is_completed).length / subtasks.length) * 100)

  return (
    <div className="space-y-4 mt-2 border-t border-border/50 pt-5 pb-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        <span>Subtasks</span>
        <span className={progress === 100 ? 'text-primary' : ''}>{progress}%</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-secondary rounded-full h-2 mb-4 overflow-hidden">
        <div className="bg-primary h-2 rounded-full transition-all duration-500 ease-out relative" style={{ width: `${progress}%` }}>
          <div className="absolute inset-0 bg-background/20 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2.5">
        {subtasks.map(subtask => (
          <div key={subtask.id} className="flex items-center justify-between group p-1.5 -mx-1.5 rounded-lg hover:bg-secondary/40 transition-colors">
            <div className="flex items-center space-x-3">
              <Checkbox 
                checked={subtask.is_completed} 
                onCheckedChange={() => handleToggle(subtask.id, subtask.is_completed)}
                className="h-4 w-4 rounded-[4px] border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className={`text-sm transition-colors ${subtask.is_completed ? 'line-through text-muted-foreground/50' : 'text-foreground/90 group-hover:text-foreground'}`}>
                {subtask.title}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-brand-rose hover:bg-brand-rose/10 rounded-full" 
              onClick={() => handleDelete(subtask.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex items-center space-x-2 mt-4 pt-1">
        <Input 
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new subtask..." 
          className="h-9 text-sm bg-card/50 border-border/80 focus:border-primary transition-colors rounded-lg"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={loading || !newTitle.trim()} className="h-9 px-3 bg-secondary/80 hover:bg-secondary text-foreground">
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
