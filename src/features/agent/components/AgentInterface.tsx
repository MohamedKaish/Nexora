'use client'

import React, { useState } from 'react'
import {
  AgentPlan,
  AgentExecutionReport,
} from '../types/plan'
import { UserPlanningMemory } from '../memory/AgentMemory'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Bot, Send, CheckCircle2, AlertTriangle, XCircle, Clock,
  ShieldCheck, RefreshCw, FileCheck, Mic, MicOff, Sparkles, HelpCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useAgentStore } from '@/store/agentStore'
import { CompanionAvatar } from '@/features/companion/CompanionAvatar'

export interface AgentInterfaceProps {
  initialMemory?: UserPlanningMemory
}

interface MessageItem {
  id: string
  role: 'user' | 'agent'
  text?: string
  report?: AgentExecutionReport
  pendingPlan?: AgentPlan
  timestamp: string
}

function generateMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function getTimestampString(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function AgentInterface({ initialMemory }: AgentInterfaceProps) {
  const agentName = useAgentStore((s) => s.config.name)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      role: 'agent',
      text: `Hello! I'm ${agentName}, your digital companion. What would you like to plan or work on today?`,
      timestamp: getTimestampString()
    }
  ])

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, executing])

  const quickPrompts = [
    'Plan my day',
    'What should I work on now?',
    'I only have two hours today',
    "I'm overloaded. Fix my schedule",
    'Plan tomorrow'
  ]

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || query).trim()
    if (!textToSend || loading || executing) return

    const userMsg: MessageItem = {
      id: generateMessageId('usr'),
      role: 'user',
      text: textToSend,
      timestamp: getTimestampString()
    }

    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setLoading(true)

    try {
      // Local-first Mock Agent for Guest Mode
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      let responseText = "I'm running in local-first mode. I've noted your request!"
      let isPlan = false
      
      const lower = textToSend.toLowerCase()
      if (lower.includes('plan')) {
        isPlan = true
      } else if (lower.includes('task')) {
        responseText = "I'll help you manage that task right away."
      }

      if (isPlan) {
        const mockPlan: AgentPlan = {
          id: 'plan_1',
          intent: 'PLAN_DAY',
          rawQuery: textToSend,
          requested_actions: ['schedule tasks'],
          required_context: [],
          expected_results: [],
          createdAt: new Date().toISOString(),
          confidence_state: 'Certain',
          response_mode: 'proposed_plan',
          reasoning_summary: 'Analyzed your schedule and tasks.',
          decision_explanation: 'Here is a proposed plan for your day.',
          risk_level: 'LEVEL_1_REVERSIBLE',
          requires_confirmation: true,
          confirmation_prompt: 'Should I execute this plan?',
          tools: [
            { id: 't1', toolName: 'schedule_tasks', parameters: {}, riskLevel: 'LEVEL_1_REVERSIBLE', description: 'Schedule pending tasks', expectedOutcome: 'Tasks scheduled', isMutation: true }
          ]
        }
        
        setMessages(prev => [...prev, {
          id: generateMessageId('agt'),
          role: 'agent',
          pendingPlan: mockPlan,
          timestamp: getTimestampString()
        }])
      } else {
        setMessages(prev => [...prev, {
          id: generateMessageId('agt'),
          role: 'agent',
          text: responseText,
          timestamp: getTimestampString()
        }])
      }

    } catch (err: unknown) {
      toast.error('Failed to process agent query')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      toast.error('Web Speech API is not supported in this browser. Try Chrome or Edge.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        toast.info('Listening... Speak your command.')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript
        if (transcript) {
          setQuery(transcript)
          toast.success(`Heard: "${transcript}"`)
        }
        setIsListening(false)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        setIsListening(false)
        if (event.error !== 'no-speech') {
          toast.error(`Voice error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (err) {
      console.error(err)
      setIsListening(false)
      toast.error('Microphone could not be started.')
    }
  }

  const handleConfirmPlan = async (messageId: string, plan: AgentPlan) => {
    setExecuting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockReport: AgentExecutionReport = {
        planId: plan.id,
        overallStatus: 'success',
        completedSteps: plan.tools.length,
        totalSteps: plan.tools.length,
        stepResults: plan.tools.map((t, i) => ({
          stepIndex: i + 1,
          actionId: t.id,
          toolName: t.toolName,
          status: 'success',
          inputParams: t.parameters,
          verified: true,
          verificationDetails: 'Verified locally',
          retryCount: 0,
          durationMs: 100
        })),
        finalSummary: 'Plan executed successfully in local environment.',
        requiresUserConfirmation: false,
        timestamp: getTimestampString()
      }

      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              pendingPlan: undefined,
              report: mockReport
            }
          }
          return msg
        })
      )
      toast.success('Confirmed plan executed!')
    } catch (err: unknown) {
      toast.error('Execution failed')
    } finally {
      setExecuting(false)
    }
  }

  const handleCancelPlan = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            text: 'Plan cancelled by user.',
            pendingPlan: undefined,
            report: undefined
          }
        }
        return msg
      })
    )
    toast.info('Plan cancelled.')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] w-full gap-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl world-card">
        <div className="flex items-center gap-4">
          <div className="companion-glow shrink-0 p-1 bg-foreground/[0.02] rounded-full">
            <CompanionAvatar size={48} expression={loading ? 'thinking' : 'happy'} animate={!loading} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-serif font-bold tracking-tight">{agentName}</h1>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-accent bg-accent/10 border-accent/20">
                Agent Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Your digital productivity companion
            </p>
          </div>
        </div>

        {initialMemory && (
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground font-medium border-l border-border/30 pl-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-accent" />
              <span>{initialMemory.workDayStartHour}:00 - {initialMemory.workDayEndHour}:00</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-emerald" />
              <span>Strict: {initialMemory.strictMode ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Conversation */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 py-2">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.role === 'user' ? (
              <div className="flex flex-col items-end gap-1 max-w-[80%]">
                <div className="bg-accent text-accent-foreground px-4 py-3 rounded-3xl rounded-tr-sm text-sm font-medium shadow-md" style={{ boxShadow: '0 4px 20px rgba(212,168,83,0.15)' }}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-muted-foreground px-2 font-medium">{msg.timestamp}</span>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-2 max-w-full w-full">
                {/* Text Response */}
                {msg.text && (
                  <div className="flex items-start gap-3 w-full">
                    <div className="shrink-0 pt-1">
                      <CompanionAvatar size={32} expression="happy" animate={false} />
                    </div>
                    <div className="world-surface border border-border/40 text-foreground px-4 py-3 rounded-3xl rounded-tl-sm text-sm shadow-sm max-w-[85%] font-medium leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                )}

                {/* Clarification */}
                {msg.report?.responseMode === 'needs_clarification' && (
                  <div className="ml-11 w-full max-w-[85%] rounded-2xl bg-brand-blue/5 border border-brand-blue/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="h-4 w-4 text-brand-blue" />
                      <span className="text-sm font-bold text-brand-blue">Clarification Needed</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {msg.report.clarificationQuestion || msg.report.finalSummary}
                    </p>
                  </div>
                )}

                {/* Pending Plan */}
                {msg.pendingPlan && (
                  <div className="ml-11 w-full max-w-[85%] rounded-2xl bg-brand-amber/5 border border-brand-amber/20 overflow-hidden shadow-sm">
                    <div className="bg-brand-amber/10 px-4 py-3 flex items-center justify-between border-b border-brand-amber/20">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-brand-amber" />
                        <span className="text-sm font-bold text-brand-amber">Action Plan Approval</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      <p className="text-sm font-medium text-foreground">{msg.pendingPlan.reasoning_summary}</p>
                      
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Proposed Actions</p>
                        {msg.pendingPlan.tools.map((t, idx) => (
                          <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-foreground/[0.02] border border-border/15">
                            <span className="w-5 h-5 rounded-md bg-brand-amber/10 text-brand-amber flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{t.description}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{t.expectedOutcome}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-2 mt-2 border-t border-border/10">
                        <Button variant="outline" size="sm" disabled={executing} onClick={() => handleCancelPlan(msg.id)} className="rounded-xl h-8 cursor-pointer font-semibold border-border/30">
                          Cancel
                        </Button>
                        <Button size="sm" disabled={executing} onClick={() => handleConfirmPlan(msg.id, msg.pendingPlan!)} className="rounded-xl h-8 bg-brand-amber hover:bg-brand-amber/90 text-amber-950 font-bold cursor-pointer">
                          {executing ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                          Execute Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Execution Report */}
                {msg.report && msg.report.responseMode !== 'needs_clarification' && (
                  <div className="ml-11 w-full max-w-[85%] rounded-2xl bg-brand-emerald/5 border border-brand-emerald/20 overflow-hidden shadow-sm">
                    <div className="bg-brand-emerald/10 px-4 py-3 flex items-center gap-2 border-b border-brand-emerald/20">
                      <CheckCircle2 className="h-4 w-4 text-brand-emerald" />
                      <span className="text-sm font-bold text-brand-emerald">Execution Summary</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-sm font-medium text-foreground">{msg.report.finalSummary}</p>
                      {msg.report.stepResults.length > 0 && (
                        <div className="space-y-1.5">
                          {msg.report.stepResults.map((step) => (
                            <div key={step.actionId} className="flex items-center gap-2 p-2 rounded-xl bg-foreground/[0.02] border border-border/15">
                              <CheckCircle2 className="h-3.5 w-3.5 text-brand-emerald shrink-0" />
                              <span className="text-xs text-muted-foreground truncate flex-1">
                                {step.verificationDetails || step.error || 'Completed'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 w-full">
            <div className="shrink-0 pt-1">
              <CompanionAvatar size={32} expression="thinking" animate />
            </div>
            <div className="world-surface border border-border/40 px-4 py-3 rounded-3xl rounded-tl-sm shadow-sm text-sm font-medium text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent" />
              {agentName} is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={loading || executing}
              className="shrink-0 px-3 py-1.5 rounded-full world-glass border-border/30 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all cursor-pointer whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex items-center p-2 rounded-2xl world-glass shadow-md group border-border/30 focus-within:border-accent/50 focus-within:shadow-glow-sm transition-all">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={`Ask ${agentName}...`}
            disabled={loading || executing}
            className="border-0 shadow-none focus-visible:ring-0 text-sm bg-transparent h-10 placeholder:text-muted-foreground/50 font-medium"
          />

          <Button
            type="button"
            variant="ghost"
            onClick={handleVoiceInput}
            disabled={loading || executing}
            className={`h-10 w-10 rounded-xl cursor-pointer ${isListening ? 'text-brand-rose bg-brand-rose/10' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {isListening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
          </Button>

          <Button
            onClick={() => handleSend()}
            disabled={loading || executing || !query.trim()}
            className="h-10 px-4 ml-1 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer font-bold shadow-sm transition-all"
          >
            <Send className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
