'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Target, CheckCircle2, XCircle, Trash2, Plus } from 'lucide-react'
import { Database } from '@/types/database.types'
import { createGoal, updateGoalStatus, deleteGoal } from '../actions'

type Goal = Database['public']['Tables']['goals']['Row']

export function GoalsDashboard({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals)
  const [loading, setLoading] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const handleCreate = async () => {
    if (!newTitle) return
    setLoading(true)
    try {
      const today = new Date()
      const end = new Date()
      if (newType === 'weekly') {
        end.setDate(today.getDate() + 7)
      } else if (newType === 'monthly') {
        end.setMonth(today.getMonth() + 1)
      }

      const goal = await createGoal(
        newTitle, 
        newType, 
        today.toISOString().split('T')[0], 
        end.toISOString().split('T')[0]
      )
      setGoals([goal, ...goals])
      setNewTitle('')
    } catch (err) {
      console.error(err)
      alert('Failed to create goal')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string, status: 'active' | 'completed' | 'failed') => {
    try {
      const updated = await updateGoalStatus(id, status)
      setGoals(goals.map(g => g.id === id ? updated : g))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal(id)
      setGoals(goals.filter(g => g.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const renderGoalList = (type: 'daily' | 'weekly' | 'monthly') => {
    const list = goals.filter(g => g.type === type)
    return (
      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No {type} goals set.</p>
        ) : (
          list.map(g => (
            <div key={g.id} className={`flex items-center justify-between p-3.5 rounded-[12px] border transition-all group ${g.status === 'completed' ? 'bg-secondary/10 border-white/5 opacity-50 grayscale' : 'glass-card hover:bg-card/60 hover:border-white/10 shadow-sm'}`}>
              <div className="flex items-center space-x-3.5">
                {g.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-brand-emerald" />}
                {g.status === 'failed' && <XCircle className="w-5 h-5 text-brand-rose" />}
                {g.status === 'active' && <Target className="w-5 h-5 text-primary" />}
                <span className={`text-[14px] font-semibold tracking-tight transition-colors ${g.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground group-hover:text-primary'}`}>
                  {g.title}
                </span>
              </div>
              
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {g.status === 'active' && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-emerald hover:text-brand-emerald hover:bg-brand-emerald/10 rounded-[8px]" onClick={() => handleUpdate(g.id, 'completed')}>
                      <CheckCircle2 className="w-[18px] h-[18px]" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-rose hover:text-brand-rose hover:bg-brand-rose/10 rounded-[8px]" onClick={() => handleUpdate(g.id, 'failed')}>
                      <XCircle className="w-[18px] h-[18px]" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand-rose hover:bg-brand-rose/10 rounded-[8px]" onClick={() => handleDelete(g.id)}>
                  <Trash2 className="w-[18px] h-[18px]" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Create Goal Form */}
      <Card className="glass-card border-white/5 shadow-sm max-w-4xl rounded-[20px]">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Input 
              placeholder="What do you want to achieve?"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="flex-1 bg-secondary/30 border-white/5 focus:border-primary/50 transition-all duration-300 h-12 rounded-[14px] smooth-ring font-medium"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <Select value={newType} onValueChange={(v) => { if (v) setNewType(v as 'daily' | 'weekly' | 'monthly') }}>
              <SelectTrigger className="w-full sm:w-[180px] h-12 bg-secondary/30 border-white/5 rounded-[14px] smooth-ring font-medium">
                <SelectValue placeholder="Goal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Goal</SelectItem>
                <SelectItem value="weekly">Weekly Goal</SelectItem>
                <SelectItem value="monthly">Monthly Goal</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={loading || !newTitle} className="w-full sm:w-auto h-12 px-8 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all smooth-ring rounded-[14px] font-bold">
              <Plus className="w-[18px] h-[18px] mr-2" /> Add Goal
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-brand-emerald/20 bg-brand-emerald/5 rounded-[20px]">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="flex items-center space-x-3 text-[16px] font-bold tracking-tight">
              <div className="p-2 bg-brand-emerald/10 rounded-[10px]">
                <Target className="w-5 h-5 text-brand-emerald" />
              </div>
              <span className="text-brand-emerald">Daily Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {renderGoalList('daily')}
          </CardContent>
        </Card>

        <Card className="glass-card border-brand-blue/20 bg-brand-blue/5 rounded-[20px]">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="flex items-center space-x-3 text-[16px] font-bold tracking-tight">
              <div className="p-2 bg-brand-blue/10 rounded-[10px]">
                <Target className="w-5 h-5 text-brand-blue" />
              </div>
              <span className="text-brand-blue">Weekly Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {renderGoalList('weekly')}
          </CardContent>
        </Card>

        <Card className="glass-card border-brand-purple/20 bg-brand-purple/5 rounded-[20px]">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="flex items-center space-x-3 text-[16px] font-bold tracking-tight">
              <div className="p-2 bg-brand-purple/10 rounded-[10px]">
                <Target className="w-5 h-5 text-brand-purple" />
              </div>
              <span className="text-brand-purple">Monthly Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {renderGoalList('monthly')}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
