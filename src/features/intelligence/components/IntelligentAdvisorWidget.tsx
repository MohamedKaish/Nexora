'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Bot,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react'
import { processNaturalLanguageQuery, executeConfirmedAction } from '../actions'
import type { IntentResponse } from '../intent/intentExecutor'
import { AdvisorReport } from '../advisor/ProductivityAdvisor'
import { toast } from 'sonner'

interface IntelligentAdvisorWidgetProps {
  initialReport?: AdvisorReport | null
}

interface TaskPreviewItem {
  title?: string
  estimatedMinutes?: number
  task?: {
    title?: string
    estimatedMinutes?: number
  }
}

interface OverduePreviewItem {
  title: string
  daysOverdue?: number
}

export function IntelligentAdvisorWidget({ initialReport }: IntelligentAdvisorWidgetProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [response, setResponse] = useState<IntentResponse | null>(null)
  const [pendingAction, setPendingAction] = useState<{
    actionType: string
    payload: Record<string, unknown>
  } | null>(null)

  const quickPrompts = [
    'What should I work on now?',
    'Plan my day',
    'Why is my schedule overloaded?',
    'What is overdue?'
  ]

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || query).trim()
    if (!text) return

    setLoading(true)
    setResponse(null)
    setPendingAction(null)

    try {
      const res = await processNaturalLanguageQuery(text)
      setResponse(res)

      if (res.requiresUserConfirmation && res.data) {
        if (res.intent === 'PLAN_DAY' || res.intent === 'SCHEDULE_IMPORTANT') {
          const dataRecord = res.data as Record<string, unknown>
          const blocks = dataRecord.proposedBlocks
          setPendingAction({
            actionType: 'schedule_reflow',
            payload: { blocks }
          })
        }
      }
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Failed to process request'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAction = async () => {
    if (!pendingAction) return

    setConfirming(true)
    try {
      const res = await executeConfirmedAction(pendingAction)
      toast.success(res.message)
      setResponse({
        success: true,
        intent: 'CONFIRMED',
        message: res.message,
        requiresUserConfirmation: false
      })
      setPendingAction(null)
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Failed to execute confirmed action'
      toast.error(msg)
    } finally {
      setConfirming(false)
    }
  }

  const handleCancelAction = () => {
    setPendingAction(null)
    setResponse({
      success: true,
      intent: 'CANCELLED',
      message: 'Action cancelled. Your schedule remains unchanged.',
      requiresUserConfirmation: false
    })
  }

  return (
    <Card className="glass-card border-white/10 rounded-[24px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
      <CardHeader className="pb-3 border-b border-white/5 bg-secondary/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            Kyro Intelligence & Natural Planning
          </CardTitle>
          <div className="flex items-center gap-2">
            <Link
              href="/agent"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold border border-primary/20 transition-all hover:scale-105"
            >
              <Bot className="h-3.5 w-3.5" />
              <span>Launch Agent</span>
            </Link>
            <Badge variant="outline" className="hidden sm:inline-flex text-xs bg-primary/10 border-primary/20 text-primary font-semibold">
              Deterministic Advisor
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Next Recommended Task Banner */}
        {initialReport?.recommendedNow && !response && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-primary uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Next Best Action
              </span>
              <span className="font-mono text-muted-foreground">Score: {initialReport.recommendedNow.score}</span>
            </div>
            <div className="text-base font-bold text-foreground">
              {initialReport.recommendedNow.task.title}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {initialReport.recommendedNow.reason}
            </p>
          </div>
        )}

        {/* Natural Language Query Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Kyro: 'Plan my day', 'What should I work on?', 'I have 2 hours free'..."
            className="h-11 bg-secondary/30 border-white/10 rounded-xl placeholder:text-muted-foreground/60 text-sm focus-visible:ring-primary"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="h-11 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shrink-0"
          >
            {loading ? (
              <span className="inline-block animate-spin">⟳</span>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setQuery(p)
                handleSend(p)
              }}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg bg-secondary/40 hover:bg-secondary/70 border border-white/5 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5"
            >
              <span>{p}</span>
              <ArrowRight className="w-3 h-3 opacity-50" />
            </button>
          ))}
        </div>

        {/* Response / Proposed Plan Display */}
        {response && (
          <div className="mt-4 p-4 rounded-2xl bg-secondary/20 border border-white/10 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              {response.requiresUserConfirmation ? (
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
              <span>{response.message}</span>
            </div>

            {/* Confirmation Box for Mutating Actions */}
            {Boolean(response.requiresUserConfirmation && pendingAction) && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-start gap-2 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {response.confirmationPrompt || 'Please confirm before persisting these changes to your database.'}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelAction}
                    disabled={confirming}
                    className="rounded-lg text-xs border-white/10 hover:bg-secondary/40"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleConfirmAction}
                    disabled={confirming}
                    className="rounded-lg text-xs bg-amber-500 text-black hover:bg-amber-400 font-bold"
                  >
                    {confirming ? 'Applying...' : 'Confirm & Apply Schedule'}
                  </Button>
                </div>
              </div>
            )}

            {/* Read-Only Structured Data Preview */}
            {Boolean(!response.requiresUserConfirmation && response.data) && (
              <div className="text-xs text-muted-foreground space-y-1.5 pt-1">
                {Boolean(typeof response.data === 'object' && response.data !== null && 'tasks' in response.data && Array.isArray((response.data as { tasks: unknown[] }).tasks)) && (
                  <ul className="space-y-1 mt-2">
                    {((response.data as { tasks: TaskPreviewItem[] }).tasks).map((item, i) => (
                      <li key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-white/5">
                        <span className="font-semibold text-foreground">{item.task?.title || item.title}</span>
                        <span className="font-mono text-primary">{item.task?.estimatedMinutes || item.estimatedMinutes}m</span>
                      </li>
                    ))}
                  </ul>
                )}
                {Boolean(Array.isArray(response.data)) && (
                  <ul className="space-y-1 mt-2">
                    {((response.data as OverduePreviewItem[])).map((item, i) => (
                      <li key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-white/5">
                        <span className="font-semibold text-foreground">{item.title}</span>
                        <span className="text-rose-400">{item.daysOverdue ? `${item.daysOverdue}d overdue` : ''}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
