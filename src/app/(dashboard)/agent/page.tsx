'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useKyroStore } from '@/store/kyroStore'
import { useAppStore } from '@/store/appStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useTimelineStore } from '@/store/timelineStore'
import { useCharacterStore } from '@/store/characterStore'
import { Companion } from '@/components/companion/Companion'
import { CompanionSelector } from '@/components/companion/CompanionSelector'
import { RawContextInputs } from '@/features/kyro/KyroContextBuilder'
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Flame,
  Target,
  RotateCcw,
  Check,
  Cpu,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'

export default function DedicatedAgentPage() {
  const {
    messages,
    isTyping,
    hasError,
    quickPrompts,
    notifyTyping,
    sendMessage,
    retryLastMessage,
    executeProposedAction,
    dismissAction,
    clearHistory,
  } = useKyroStore()

  const userName = useAppStore((s) => s.preferences.displayName) || 'Explorer'
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const charConfig = useCharacterStore((s) => s.config)
  const setArchetype = useCharacterStore((s) => s.setArchetype)
  const router = useRouter()

  const tasks = useTaskStore((s) => s.tasks)
  const habits = useHabitStore((s) => s.habits)
  const completions = useHabitStore((s) => s.completions)
  const goals = useGoalStore((s) => s.goals)
  const projects = useProjectStore((s) => s.projects)
  const focusSessions = useFocusStore((s) => s.sessions)
  const isFocusRunning = useFocusStore((s) => s.isRunning)
  const timetableSlots = useTimelineStore((s) => s.slots)
  const startFocusTimer = useFocusStore((s) => s.startTimer)
  const addTask = useTaskStore((s) => s.addTask)

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayHabitsDone = completions.filter((c) => c.completedDate === todayStr).length
  const activeTasks = tasks.filter((t) => t.status !== 'done')
  const urgentTasks = activeTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high')

  const getContextInputs = (): RawContextInputs => ({
    userName,
    agentName,
    creatureArchetype: charConfig.archetype || 'nyxen',
    tasks,
    habits,
    completions,
    goals,
    projects,
    focusSessions,
    isFocusRunning,
    timetableSlots,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = () => {
    if (!input.trim() || isTyping) return
    const text = input
    setInput('')
    sendMessage(text, getContextInputs())
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    notifyTyping()
  }

  const handleQuickPrompt = (prompt: string) => {
    if (isTyping) return
    sendMessage(prompt, getContextInputs())
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Neural Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gradient-gold">
            {agentName} Neural Core
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Real-time companion intelligence and deep contextual life guidance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Neural Link Active</span>
          </div>
          <button
            onClick={clearHistory}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Real-Time Context Telemetry & Companion (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Living Avatar Unit */}
          <div className="world-deck p-6 flex flex-col items-center text-center space-y-4">
            <Companion
              size={140}
              showPlatform={true}
              showGlow={true}
              speechTextOverride={
                isTyping
                  ? `Analyzing your workspace state...`
                  : `Standing by with full telemetry on your day, ${userName}.`
              }
            />

            <div>
              <h3 className="text-lg font-bold text-foreground font-serif">{agentName}</h3>
              <p className="text-xs text-amber-300/80 font-medium">Personal AI Guardian</p>
            </div>

            {/* Quick Companion Selector */}
            <div className="pt-2 border-t border-stone-800/80 w-full flex flex-col items-center">
              <span className="text-[11px] text-stone-400 font-semibold mb-2">Switch Active Ally:</span>
              <CompanionSelector variant="pills" />
            </div>
          </div>

          {/* Context Telemetry Board */}
          <div className="world-surface p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Live Nexora Telemetry
              </h4>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-900/60 border border-stone-800">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Active Tasks
                </span>
                <span className="font-bold text-foreground font-mono">{activeTasks.length}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-900/60 border border-stone-800">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> High Priority
                </span>
                <span className="font-bold text-amber-400 font-mono">{urgentTasks.length}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-900/60 border border-stone-800">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" /> Habits Checked
                </span>
                <span className="font-bold text-foreground font-mono">
                  {todayHabitsDone} / {habits.length}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-900/60 border border-stone-800">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" /> Active Goals
                </span>
                <span className="font-bold text-foreground font-mono">{goals.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Deep Conversational Console (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="world-deck flex flex-col h-[650px] overflow-hidden">
            {/* Console Messages Viewport */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'kyro' && (
                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-amber-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-amber-400 text-stone-950 font-medium ml-auto shadow-md'
                        : 'bg-stone-900/85 border border-stone-800 text-stone-100'
                    }`}
                  >
                    <p className="whitespace-pre-line text-sm">{msg.text}</p>

                    {/* Action Confirmation Banner */}
                    {msg.proposedAction && !msg.proposedAction.isExecuted && (
                      <div className="mt-3 p-3.5 rounded-xl bg-stone-950/80 border border-amber-400/30 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Proposed Autonomous Action
                        </div>
                        <p className="text-xs text-stone-300 font-medium">
                          {msg.proposedAction.label}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() =>
                              executeProposedAction(msg.proposedAction!.id, (action) => {
                                if (action.type === 'start_focus') {
                                  startFocusTimer()
                                } else if (action.type === 'create_task') {
                                  addTask({ title: (action.payload.title as string) || 'New Task' })
                                } else if (action.type === 'switch_companion') {
                                  setArchetype((action.payload.archetype as any) || 'nyxen')
                                } else if (action.type === 'open_route') {
                                  router.push((action.payload.route as string) || '/dashboard')
                                }
                              })
                            }
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 text-stone-950 text-xs font-bold hover:bg-amber-300 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Confirm & Execute
                          </button>
                          <button
                            onClick={() => dismissAction(msg.proposedAction!.id)}
                            className="px-3 py-1.5 rounded-lg text-stone-400 text-xs font-medium hover:text-stone-200 transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}

                    {msg.proposedAction?.isExecuted && (
                      <div className="mt-2 text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Action successfully applied to your workspace
                      </div>
                    )}

                    <span className="block text-[10px] opacity-40 mt-1.5 text-right font-mono">
                      {format(new Date(msg.timestamp), 'HH:mm')}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2 items-center text-stone-400 text-xs pl-2">
                  <Bot className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>{agentName} is thinking & analyzing your context...</span>
                </div>
              )}

              {hasError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Neural link communication issue.</span>
                  </div>
                  <button
                    onClick={() => retryLastMessage(getContextInputs())}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Command Prompts */}
            <div className="px-5 py-2.5 border-t border-stone-800/80 bg-stone-900/40 overflow-x-auto flex gap-2 no-scrollbar">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isTyping}
                  className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-300 bg-stone-800/60 hover:bg-amber-400/15 hover:text-amber-300 hover:border-amber-400/30 border border-stone-700/60 transition-all cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="p-4 border-t border-stone-800/80 bg-stone-900/60 flex items-center gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={`Ask ${agentName} anything, create tasks, plan day, or switch companion...`}
                disabled={isTyping}
                className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-stone-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-3 rounded-xl bg-amber-400 text-stone-950 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-bold"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
