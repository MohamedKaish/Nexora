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
import { RawContextInputs } from '@/features/kyro/KyroContextBuilder'
import { Companion } from '@/components/companion/Companion'
import { CompanionSelector } from '@/components/companion/CompanionSelector'
import {
  Bot,
  Send,
  Sparkles,
  X,
  Check,
  RotateCcw,
  Minimize2,
  Maximize2,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'

export function KyroChatPanel() {
  const {
    isOpen,
    isTyping,
    hasError,
    messages,
    quickPrompts,
    setOpen,
    toggleOpen,
    notifyTyping,
    sendMessage,
    retryLastMessage,
    executeProposedAction,
    dismissAction,
    clearHistory,
  } = useKyroStore()

  const userName = useAppStore((s) => s.preferences.displayName) || 'Explorer'
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const characterConfig = useCharacterStore((s) => s.config)
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
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const getContextInputs = (): RawContextInputs => ({
    userName,
    agentName,
    creatureArchetype: characterConfig.archetype || 'nyxen',
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
    <>
      {/* ── Floating Launcher Orb (when closed) ── */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-stone-900/95 border border-amber-400/40 text-amber-200 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-amber-400 hover:scale-105 transition-all duration-200 backdrop-blur-md cursor-pointer group"
          aria-label={`Open ${agentName} companion chat`}
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-amber-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-foreground">
            {agentName}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {/* ── Kyro Conversational Interface (when open) ── */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 shadow-[0_16px_48px_rgba(0,0,0,0.6)] border border-amber-400/30 rounded-3xl bg-stone-950/95 backdrop-blur-xl flex flex-col overflow-hidden ${
            isExpanded
              ? 'inset-4 md:inset-10'
              : 'bottom-20 right-4 left-4 sm:left-auto sm:w-[440px] h-[580px] max-h-[75vh] lg:bottom-6 lg:right-6 lg:max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-stone-800/80 flex flex-col gap-2.5 bg-stone-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/30 overflow-hidden shrink-0">
                  <Companion
                    size={32}
                    showPlatform={false}
                    showGlow={false}
                    interactive={false}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground">{agentName}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 font-semibold uppercase tracking-wider">
                      AI Ally
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400">Context Synchronized</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors cursor-pointer"
                  title={isExpanded ? 'Minimize' : 'Expand'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={clearHistory}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800/60 transition-colors cursor-pointer"
                  title="Clear chat history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* In-Chat Creature Switcher Bar */}
            <div className="flex items-center justify-between pt-1 border-t border-stone-800/60">
              <span className="text-[11px] font-semibold text-stone-400">Persona:</span>
              <CompanionSelector variant="compact" />
            </div>
          </div>

          {/* Messages Flow */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'kyro' && (
                  <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-stone-950 font-medium ml-auto shadow-sm'
                      : 'bg-stone-900/90 text-stone-100 border border-stone-800'
                  }`}
                >
                  <p className="whitespace-pre-line text-sm">{msg.text}</p>

                  {/* Proposed Action Card with Confirmation Requirement */}
                  {msg.proposedAction && !msg.proposedAction.isExecuted && (
                    <div className="mt-3 p-3 rounded-xl bg-stone-950/80 border border-amber-400/30 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Proposed Action
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
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 text-stone-950 text-xs font-bold hover:bg-amber-300 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirm & Run
                        </button>
                        <button
                          onClick={() => dismissAction(msg.proposedAction!.id)}
                          className="px-2.5 py-1 rounded-lg text-stone-400 text-xs font-medium hover:text-stone-200 transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.proposedAction?.isExecuted && (
                    <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Action executed
                    </div>
                  )}

                  <span className="block text-[10px] opacity-40 mt-1 text-right font-mono">
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
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Kyro connection issue.</span>
                </div>
                <button
                  onClick={() => retryLastMessage(getContextInputs())}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompts */}
          <div className="px-4 py-2 border-t border-stone-800/60 bg-stone-900/30 overflow-x-auto flex gap-1.5 no-scrollbar">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isTyping}
                className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium text-stone-300 bg-stone-800/60 hover:bg-amber-400/15 hover:text-amber-300 hover:border-amber-400/30 border border-stone-700/60 transition-all cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="p-3 border-t border-stone-800/80 bg-stone-900/50 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={`Message ${agentName}... (e.g. "what's next", "switch to aerix")`}
              disabled={isTyping}
              autoFocus
              className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-stone-500 focus:outline-none focus:border-amber-400/60 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2.5 rounded-xl bg-amber-400 text-stone-950 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-bold"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
