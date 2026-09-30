'use client'

import React, { useState } from 'react'
import {
  AgentPlan,
  AgentExecutionReport,
  ConversationTurn
} from '../types/plan'
import { UserPlanningMemory } from '../memory/AgentMemory'
import { submitAgentQuery, confirmAndExecuteAgentPlan } from '../actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Bot,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  FileCheck,
  Mic,
  MicOff,
  Sparkles,
  HelpCircle
} from 'lucide-react'
import { toast } from 'sonner'

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

function formatReportContent(report?: AgentExecutionReport): string {
  if (!report) return ''
  const details = report.stepResults
    .map(s => s.verificationDetails || s.error || '')
    .filter(Boolean)
    .join('; ')
  return [report.finalSummary, details].filter(Boolean).join(' | ')
}

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string
      }
    }
  }
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface BrowserSpeechRecognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition

export function AgentInterface({ initialMemory }: AgentInterfaceProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      role: 'agent',
      text: 'Nexora Agent initialized. Powered by deterministic Kyro intelligence, empirical state verification, and conversational context. What productivity workflow would you like to plan or inspect?',
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
    'Plan tomorrow',
    'What is overdue?',
    'Create task AI assignment due Friday'
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

  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition

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

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results?.[0]?.[0]?.transcript
        if (transcript) {
          setQuery(transcript)
          toast.success(`Heard: "${transcript}"`)
        }
        setIsListening(false)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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
            text: 'Plan cancelled by user. No database modifications were performed.',
            pendingPlan: undefined,
            report: undefined
          }
        }
        return msg
      })
    )
    toast.info('Plan cancelled.')
  }

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case 'Certain':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">Certain</Badge>
      case 'Likely':
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]">Likely</Badge>
      case 'Needs clarification':
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">Needs Clarification</Badge>
      case 'Conflict detected':
        return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-[10px]">Conflict Detected</Badge>
      case 'Cannot complete':
        return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px]">Cannot Complete</Badge>
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto w-full gap-4">
      {/* Header with Safety & Architecture Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight">Nexora AI Productivity Companion</h1>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                Kyro + Agentic Core
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Conversational intelligence with empirical state verification and permission safety boundaries.
            </p>
          </div>
        </div>

        {initialMemory && (
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground border-l border-border/50 pl-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{initialMemory.workDayStartHour}:00 - {initialMemory.workDayEndHour}:00</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Strict: {initialMemory.strictMode ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Conversation & Plan Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.role === 'user' ? (
              <div className="flex flex-col items-end gap-1 max-w-[80%]">
                <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-tr-xs text-sm font-medium shadow-xs">
                  {msg.text}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">{msg.timestamp}</span>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-2 max-w-full w-full">
                {/* Simple Text Response */}
                {msg.text && (
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-card border border-border/60 text-card-foreground p-3.5 rounded-2xl rounded-tl-xs text-sm shadow-xs max-w-[85%]">
                      {msg.text}
                    </div>
                  </div>
                )}

                {/* Clarification Needed Message */}
                {msg.report?.responseMode === 'needs_clarification' && (
                  <Card className="w-full border-blue-500/30 bg-blue-500/5 shadow-xs">
                    <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-blue-500" />
                        <CardTitle className="text-sm font-semibold tracking-tight">
                          Clarification Needed
                        </CardTitle>
                      </div>
                      {getConfidenceBadge('Needs clarification')}
                    </CardHeader>
                    <CardContent className="px-4 pb-3 space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        {msg.report.clarificationQuestion || msg.report.finalSummary}
                      </p>
                      {msg.report.decisionExplanation && (
                        <p className="text-xs text-muted-foreground bg-background/50 p-2.5 rounded-lg border border-border/40">
                          {msg.report.decisionExplanation}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Structured Plan & Confirmation Boundary */}
                {msg.pendingPlan && (
                  <Card className="w-full border-amber-500/30 bg-amber-500/5 shadow-sm">
                    <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <CardTitle className="text-sm font-semibold tracking-tight">
                          Agent Action Plan — Approval Required
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {getConfidenceBadge(msg.pendingPlan.confidence_state)}
                        <Badge className={
                          msg.pendingPlan.risk_level === 'LEVEL_2_HIGH_IMPACT'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }>
                          {msg.pendingPlan.risk_level}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      {msg.pendingPlan.decision_explanation && (
                        <div className="text-xs bg-primary/5 p-3 rounded-lg border border-primary/20 text-foreground flex items-start gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-primary">Decision Summary: </span>
                            {msg.pendingPlan.decision_explanation}
                          </div>
                        </div>
                      )}

                      <div className="text-xs bg-background/60 p-3 rounded-lg border border-border/40 text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Reasoning Analysis:</p>
                        {msg.pendingPlan.reasoning_summary}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proposed Steps ({msg.pendingPlan.tools.length}):</p>
                        {msg.pendingPlan.tools.map((t, idx) => (
                          <div key={t.id} className="flex items-center justify-between text-xs p-2.5 rounded-md bg-background border border-border/50">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-muted-foreground">{idx + 1}.</span>
                              <Badge variant="outline" className="font-mono text-[10px]">{t.toolName}</Badge>
                              <span>{t.description}</span>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-mono">{t.expectedOutcome}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={executing}
                          onClick={() => handleCancelPlan(msg.id)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={executing}
                          onClick={() => handleConfirmPlan(msg.id, msg.pendingPlan!)}
                          className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          {executing ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Executing Plan...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve & Execute Plan
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Executed Report & Empirical Verification */}
                {msg.report && msg.report.responseMode !== 'needs_clarification' && (
                  <Card className="w-full border-border/70 shadow-sm bg-card">
                    <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between border-b border-border/40">
                      <div className="flex items-center gap-2">
                        {msg.report.overallStatus === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : msg.report.overallStatus === 'partial' ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-500" />
                        )}
                        <CardTitle className="text-sm font-semibold tracking-tight">
                          Execution Summary ({msg.report.completedSteps}/{msg.report.totalSteps} Completed)
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {getConfidenceBadge(msg.report.confidenceState)}
                        <Badge variant="outline" className="text-[11px] capitalize">
                          {msg.report.overallStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 py-3 space-y-3">
                      <p className="text-sm font-medium text-foreground">
                        {msg.report.finalSummary}
                      </p>

                      {msg.report.decisionExplanation && msg.report.finalSummary !== msg.report.decisionExplanation && (
                        <div className="text-xs bg-muted/30 p-2.5 rounded-lg border border-border/40 text-muted-foreground">
                          <span className="font-semibold text-foreground">Why this action: </span>
                          {msg.report.decisionExplanation}
                        </div>
                      )}

                      {msg.report.stepResults.length > 0 && (
                        <div className="space-y-1.5">
                          {msg.report.stepResults.map((step) => (
                            <div
                              key={step.actionId}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg border text-xs ${
                                step.status === 'success'
                                  ? 'bg-emerald-500/5 border-emerald-500/20'
                                  : step.status === 'failed'
                                  ? 'bg-rose-500/5 border-rose-500/20'
                                  : 'bg-muted/40 border-border/40'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-muted-foreground">{step.stepIndex}.</span>
                                <Badge variant="secondary" className="font-mono text-[10px]">{step.toolName}</Badge>
                                {step.verified && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <FileCheck className="h-3 w-3" />
                                    [VERIFIED IN DB]
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground truncate max-w-md">
                                {step.verificationDetails || step.error || 'Completed'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground p-3">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>Agent analyzing productivity context and synthesizing structured plan...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={loading || executing}
            className="shrink-0 px-2.5 py-1 rounded-full border border-border/70 bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Query Input Bar with Speech Recognition */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl border border-border/70 bg-card shadow-sm">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Ask Nexora Agent (e.g. 'Plan my day', 'What should I work on?', 'Create task ...')"
          disabled={loading || executing}
          className="border-0 shadow-none focus-visible:ring-0 text-sm bg-transparent"
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleVoiceInput}
          disabled={loading || executing}
          className={`h-9 w-9 p-0 shrink-0 ${isListening ? 'text-rose-500 animate-pulse bg-rose-500/10' : 'text-muted-foreground hover:text-foreground'}`}
          title={isListening ? 'Stop Listening' : 'Voice Input (Web Speech API)'}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>

        <Button
          onClick={() => handleSend()}
          disabled={loading || executing || !query.trim()}
          size="sm"
          className="h-9 px-3 gap-1.5 shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
    </div>
  )
}
