'use client'

import React, { useState } from 'react'
import { useGoalStore } from '@/store/useGoalStore'
import { GoalType } from '@/types/local'
import { Target, Plus, CheckCircle2, Trash2 } from 'lucide-react'

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, removeGoal } = useGoalStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<GoalType>('weekly')

  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')

  const handleAdd = () => {
    if (!newTitle.trim()) return
    addGoal({ title: newTitle.trim(), type: newType })
    setNewTitle('')
    setShowAddModal(false)
  }

  const handleProgressChange = (id: string, progress: number) => {
    const status = progress >= 100 ? 'completed' : 'active'
    updateGoal(id, { progress, status })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Goal Horizons</h1>
          <p className="text-stone-400 text-sm">Target long-term objectives and celebrate milestones.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(212,168,83,0.3)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Set Goal
        </button>
      </div>

      {/* Active Goals Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Active Horizons</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeGoals.map((goal) => (
            <div key={goal.id} className="world-deck p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-400/15 text-amber-300">
                    {goal.type}
                  </span>
                </div>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="p-1 text-stone-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h4 className="text-base font-bold text-foreground">{goal.title}</h4>
              </div>

              {/* Progress Slider & Percentage */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Milestone Progress</span>
                  <span className="font-bold text-amber-400">{goal.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={goal.progress}
                  onChange={(e) => handleProgressChange(goal.id, Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          ))}

          {activeGoals.length === 0 && (
            <div className="md:col-span-2 p-12 text-center world-deck border-dashed border-stone-800">
              <Target className="w-10 h-10 text-stone-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">No active goals</h3>
              <p className="text-xs text-stone-400 mt-1">Set a weekly or monthly target to guide your focus.</p>
            </div>
          )}
        </div>
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed Milestones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="world-deck p-4 opacity-70 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold line-through text-stone-400">{goal.title}</h4>
                  <span className="text-[10px] text-emerald-400 font-bold">100% Achieved</span>
                </div>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="p-1 text-stone-500 hover:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-stone-950 border border-stone-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-foreground">Set a New Horizon Goal</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">Goal Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Read 2 books, Run 50km, Ship feature..."
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">Timeframe</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as GoalType)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-foreground"
                >
                  <option value="weekly">Weekly Horizon</option>
                  <option value="monthly">Monthly Horizon</option>
                  <option value="daily">Daily Target</option>
                </select>
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
                onClick={handleAdd}
                disabled={!newTitle.trim()}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-bold text-xs"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
