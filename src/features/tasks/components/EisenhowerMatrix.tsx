// @ts-nocheck
'use client'

import { useTaskStore } from '@/store/useTaskStore'
import { useWorkspace } from '@/hooks/useWorkspace'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Database } from '@/types/database.types'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Target, Zap, Coffee } from 'lucide-react'
import { toast } from 'sonner'

type Task = Database['public']['Tables']['tasks']['Row']

export function EisenhowerMatrix() {
  const { tasks } = useTaskStore()
  const { updateTaskStatus } = useWorkspace()

  // Group tasks
  const doFirst = tasks.filter(t => t.is_urgent && t.is_important && t.status !== 'done')
  const schedule = tasks.filter(t => !t.is_urgent && t.is_important && t.status !== 'done')
  const delegate = tasks.filter(t => t.is_urgent && !t.is_important && t.status !== 'done')
  const dontDo = tasks.filter(t => !t.is_urgent && !t.is_important && t.status !== 'done')

  const handleToggle = async (id: string, currentStatus: 'todo' | 'in_progress' | 'done') => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'
    try {
      await updateTaskStatus(id, newStatus)
    } catch {
      toast.error('Failed to update task status')
    }
  }

  const renderTask = (task: Task) => (
    <div key={task.id} className="flex items-start space-x-4 bg-secondary/20 hover:bg-secondary/60 p-3.5 rounded-[12px] border border-white/5 transition-all duration-300 group shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
      <Checkbox 
        checked={task.status === 'done'} 
        onCheckedChange={() => handleToggle(task.id, task.status)}
        className="mt-0.5 h-5 w-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <div className="flex flex-col flex-1">
        <span className="text-[14.5px] font-semibold leading-tight text-foreground/90 group-hover:text-primary transition-colors">{task.title}</span>
        {task.estimated_time_minutes && (
          <span className="text-[12px] font-medium text-muted-foreground mt-1.5 opacity-80 flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5" />
            {task.estimated_time_minutes}m
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      
      {/* Q1: Do First */}
      <Card className="glass-card border-brand-rose/20 bg-brand-rose/5 rounded-[20px] overflow-hidden group hover:border-brand-rose/40">
        <CardHeader className="pb-4 flex flex-row items-center space-x-3 border-b border-white/5 bg-brand-rose/5">
          <div className="p-2 bg-brand-rose/10 rounded-xl group-hover:scale-110 transition-transform">
            <AlertCircle className="w-5 h-5 text-brand-rose" />
          </div>
          <CardTitle className="text-brand-rose text-[16px] font-bold tracking-tight">Do First <span className="opacity-70 font-medium text-[13px] ml-1">(Urgent & Important)</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-5 pb-5 max-h-[350px] overflow-y-auto custom-scrollbar">
          {doFirst.length === 0 ? <p className="text-sm font-medium text-muted-foreground/60">Clear.</p> : doFirst.map(renderTask)}
        </CardContent>
      </Card>

      {/* Q2: Schedule */}
      <Card className="glass-card border-primary/20 bg-primary/5 rounded-[20px] overflow-hidden group hover:border-primary/40">
        <CardHeader className="pb-4 flex flex-row items-center space-x-3 border-b border-white/5 bg-primary/5">
          <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-primary text-[16px] font-bold tracking-tight">Schedule <span className="opacity-70 font-medium text-[13px] ml-1">(Important)</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-5 pb-5 max-h-[350px] overflow-y-auto custom-scrollbar">
          {schedule.length === 0 ? <p className="text-sm font-medium text-muted-foreground/60">Clear.</p> : schedule.map(renderTask)}
        </CardContent>
      </Card>

      {/* Q3: Delegate */}
      <Card className="glass-card border-brand-amber/20 bg-brand-amber/5 rounded-[20px] overflow-hidden group hover:border-brand-amber/40">
        <CardHeader className="pb-4 flex flex-row items-center space-x-3 border-b border-white/5 bg-brand-amber/5">
          <div className="p-2 bg-brand-amber/10 rounded-xl group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-brand-amber" />
          </div>
          <CardTitle className="text-brand-amber text-[16px] font-bold tracking-tight">Delegate <span className="opacity-70 font-medium text-[13px] ml-1">(Urgent)</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-5 pb-5 max-h-[350px] overflow-y-auto custom-scrollbar">
          {delegate.length === 0 ? <p className="text-sm font-medium text-muted-foreground/60">Clear.</p> : delegate.map(renderTask)}
        </CardContent>
      </Card>

      {/* Q4: Eliminate */}
      <Card className="glass-card border-muted-foreground/20 bg-muted-foreground/5 rounded-[20px] overflow-hidden group hover:border-muted-foreground/40">
        <CardHeader className="pb-4 flex flex-row items-center space-x-3 border-b border-white/5 bg-muted-foreground/5">
          <div className="p-2 bg-muted-foreground/10 rounded-xl group-hover:scale-110 transition-transform">
            <Coffee className="w-5 h-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-muted-foreground text-[16px] font-bold tracking-tight">Eliminate <span className="opacity-70 font-medium text-[13px] ml-1">(Neither)</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-5 pb-5 max-h-[350px] overflow-y-auto custom-scrollbar">
          {dontDo.length === 0 ? <p className="text-sm font-medium text-muted-foreground/60">Clear.</p> : dontDo.map(renderTask)}
        </CardContent>
      </Card>

    </div>
  )
}
