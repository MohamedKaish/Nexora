import { NextResponse } from 'next/server'
import type { StructuredNexoraContext } from '@/features/kyro/KyroContextBuilder'
import {
  KYRO_GEMINI_FUNCTION_DECLARATIONS,
  validateKyroToolCall,
} from '@/features/kyro/KyroActionRegistry'
import { NEXORA_ALLOWED_ROUTES, type KyroProposedAction } from '@/types/local'

export interface KyroChatRequestBody {
  message?: string
  context?: Partial<StructuredNexoraContext> | Record<string, unknown>
  history?: Array<{ sender: 'user' | 'kyro'; text: string }>
}

function getServerGeminiKey(): string | null {
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()
  return key.length > 15 ? key : null
}

/**
 * Normalizes incoming context into a safe StructuredNexoraContext snapshot.
 * Never fabricates default balances, fake tasks, or misleading "all clear" data
 * when a domain is omitted by the caller.
 */
export function normalizeIncomingContext(
  raw: Partial<StructuredNexoraContext> | Record<string, unknown> | undefined
): StructuredNexoraContext {
  const ctx = (raw && typeof raw === 'object' ? raw : {}) as Partial<StructuredNexoraContext>

  const tasksAvailable = Boolean(ctx.tasks && typeof ctx.tasks.available === 'boolean' ? ctx.tasks.available : ctx.tasks !== undefined)
  const habitsAvailable = Boolean(ctx.habits && typeof ctx.habits.available === 'boolean' ? ctx.habits.available : ctx.habits !== undefined)
  const hydrationAvailable = Boolean(ctx.hydration && ctx.hydration.available)
  const financeAvailable = Boolean(ctx.finance && ctx.finance.available)
  const notesAvailable = Boolean(ctx.notesAndReminders && ctx.notesAndReminders.available)
  const focusAvailable = Boolean(ctx.focus && typeof ctx.focus.available === 'boolean' ? ctx.focus.available : ctx.focus !== undefined)
  const timetableAvailable = Boolean(ctx.timetable && typeof ctx.timetable.available === 'boolean' ? ctx.timetable.available : ctx.timetable !== undefined)

  return {
    systemMetadata: {
      userName: ctx.systemMetadata?.userName || 'Explorer',
      agentName: ctx.systemMetadata?.agentName || 'Kyro',
      creatureArchetype: ctx.systemMetadata?.creatureArchetype || 'nyxen',
      currentDate: ctx.systemMetadata?.currentDate || new Date().toISOString().split('T')[0],
      currentDayOfWeek: ctx.systemMetadata?.currentDayOfWeek || 'Today',
      currentTime: ctx.systemMetadata?.currentTime || new Date().toTimeString().slice(0, 5),
    },
    tasks: {
      available: tasksAvailable,
      totalActive: tasksAvailable ? Number(ctx.tasks?.totalActive ?? 0) : 0,
      urgentCount: tasksAvailable ? Number(ctx.tasks?.urgentCount ?? 0) : 0,
      overdueCount: tasksAvailable ? Number(ctx.tasks?.overdueCount ?? 0) : 0,
      completedTodayCount: tasksAvailable ? Number(ctx.tasks?.completedTodayCount ?? 0) : 0,
      topPriorityTasks: tasksAvailable && Array.isArray(ctx.tasks?.topPriorityTasks)
        ? ctx.tasks!.topPriorityTasks
        : [],
      dueTodayTasks: tasksAvailable && Array.isArray(ctx.tasks?.dueTodayTasks)
        ? ctx.tasks!.dueTodayTasks
        : [],
    },
    habits: {
      available: habitsAvailable,
      totalHabits: habitsAvailable ? Number(ctx.habits?.totalHabits ?? 0) : 0,
      completedTodayCount: habitsAvailable ? Number(ctx.habits?.completedTodayCount ?? 0) : 0,
      pendingTodayCount: habitsAvailable ? Number(ctx.habits?.pendingTodayCount ?? 0) : 0,
      activeStreaks: habitsAvailable && Array.isArray(ctx.habits?.activeStreaks)
        ? ctx.habits!.activeStreaks
        : [],
      pendingHabitsToday: habitsAvailable && Array.isArray(ctx.habits?.pendingHabitsToday)
        ? ctx.habits!.pendingHabitsToday
        : [],
    },
    hydration: {
      available: hydrationAvailable,
      consumedMl: hydrationAvailable ? (ctx.hydration?.consumedMl ?? null) : null,
      dailyGoalMl: hydrationAvailable ? (ctx.hydration?.dailyGoalMl ?? null) : null,
      remainingMl: hydrationAvailable ? (ctx.hydration?.remainingMl ?? null) : null,
      completionPercentage: hydrationAvailable ? (ctx.hydration?.completionPercentage ?? null) : null,
      preferredUnit: hydrationAvailable ? (ctx.hydration?.preferredUnit ?? 'ml') : null,
      remindersEnabled: hydrationAvailable ? (ctx.hydration?.remindersEnabled ?? null) : null,
    },
    finance: {
      available: financeAvailable,
      hasActivityOrBalances: financeAvailable ? Boolean(ctx.finance?.hasActivityOrBalances) : false,
      defaultCurrency: financeAvailable ? (ctx.finance?.defaultCurrency ?? null) : null,
      totalBalanceFormatted: financeAvailable ? (ctx.finance?.totalBalanceFormatted ?? null) : null,
      spentTodayFormatted: financeAvailable ? (ctx.finance?.spentTodayFormatted ?? null) : null,
      incomeTodayFormatted: financeAvailable ? (ctx.finance?.incomeTodayFormatted ?? null) : null,
      walletsSummary: financeAvailable && Array.isArray(ctx.finance?.walletsSummary)
        ? ctx.finance!.walletsSummary
        : [],
    },
    notesAndReminders: {
      available: notesAvailable,
      totalNotes: notesAvailable ? Number(ctx.notesAndReminders?.totalNotes ?? 0) : 0,
      pinnedNotesCount: notesAvailable ? Number(ctx.notesAndReminders?.pinnedNotesCount ?? 0) : 0,
      pendingRemindersCount: notesAvailable ? Number(ctx.notesAndReminders?.pendingRemindersCount ?? 0) : 0,
      upcomingNoteReminders: notesAvailable && Array.isArray(ctx.notesAndReminders?.upcomingNoteReminders)
        ? ctx.notesAndReminders!.upcomingNoteReminders
        : [],
      scheduledTaskReminders: notesAvailable && Array.isArray(ctx.notesAndReminders?.scheduledTaskReminders)
        ? ctx.notesAndReminders!.scheduledTaskReminders
        : [],
      recentNotes: notesAvailable && Array.isArray(ctx.notesAndReminders?.recentNotes)
        ? ctx.notesAndReminders!.recentNotes
        : [],
    },
    goals: {
      available: Boolean(ctx.goals?.available),
      activeCount: Number(ctx.goals?.activeCount ?? 0),
      mainGoals: Array.isArray(ctx.goals?.mainGoals) ? ctx.goals!.mainGoals : [],
    },
    projects: {
      available: Boolean(ctx.projects?.available),
      totalProjects: Number(ctx.projects?.totalProjects ?? 0),
      projectList: Array.isArray(ctx.projects?.projectList) ? ctx.projects!.projectList : [],
    },
    focus: {
      available: focusAvailable,
      sessionsCompletedToday: focusAvailable ? Number(ctx.focus?.sessionsCompletedToday ?? 0) : 0,
      totalFocusMinutesToday: focusAvailable ? Number(ctx.focus?.totalFocusMinutesToday ?? 0) : 0,
      isFocusTimerRunning: focusAvailable ? Boolean(ctx.focus?.isFocusTimerRunning) : false,
      activeMode: ctx.focus?.activeMode || 'pomodoro',
    },
    timetable: {
      available: timetableAvailable,
      todaySchedule: timetableAvailable && Array.isArray(ctx.timetable?.todaySchedule)
        ? ctx.timetable!.todaySchedule
        : [],
    },
    navigation: {
      allowedRoutes: Object.entries(NEXORA_ALLOWED_ROUTES).map(([path, description]) => ({
        path,
        description,
      })),
    },
  }
}

function buildCompactSpeechBubble(replyText: string, maxChars = 140): string {
  const cleaned = replyText.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxChars) return cleaned
  const firstSentenceMatch = cleaned.match(/^[^.!?]+[.!?]/)
  if (firstSentenceMatch && firstSentenceMatch[0].length <= maxChars) {
    return firstSentenceMatch[0].trim()
  }
  return cleaned.slice(0, maxChars - 1).trimEnd() + '…'
}

export function buildNexoraSystemInstruction(ctx: StructuredNexoraContext): string {
  const { systemMetadata } = ctx
  return `You are ${systemMetadata.agentName}, the embedded AI Companion for **Nexora** (a personal productivity, habits, hydration, focus, notes, and finance workspace).
Current user: ${systemMetadata.userName}
Active companion archetype: ${systemMetadata.creatureArchetype}
Current date/time: ${systemMetadata.currentDayOfWeek}, ${systemMetadata.currentDate} at ${systemMetadata.currentTime}

STRICT NEXORA GROUNDING & HONESTY RULES:
1. **Use Only Provided Real Context**: Rely strictly on the JSON snapshot below. Never invent task titles, habit streaks, hydration numbers, note titles, or financial balances.
2. **Honest Missing/Unavailable Data**:
   - If a domain has \`available: false\`, tell the user that telemetry for that domain is currently unavailable.
   - If \`finance.hasActivityOrBalances\` is \`false\`, tell the user that no wallet balances or transactions have been recorded yet—never fabricate a dollar or rupee amount.
   - If \`tasks.totalActive\` is 0 and \`tasks.available\` is \`true\`, state honestly that the user currently has 0 active tasks.
3. **Distinguish Facts from Suggestions**: Clearly separate what is currently recorded in Nexora from what you recommend the user do next.
4. **Clarify Ambiguous Requests**: If the user asks to create a task or update a reminder with an ambiguous title, missing reminder time, or unclear target task/note, ask a brief clarifying question before calling a mutating tool.
5. **Truthful Action Execution**:
   - Use the provided Gemini function declarations (\`read_tasks\`, \`create_task\`, \`start_focus\`, \`read_hydration\`, \`log_hydration\`, \`navigate_to\`, \`update_reminder\`, \`switch_companion\`) when the user requests a supported Nexora action.
   - Mutating and navigation tools (\`create_task\`, \`start_focus\`, \`log_hydration\`, \`navigate_to\`, \`update_reminder\`, \`switch_companion\`) require user confirmation in the UI before they take effect. When you call one of these tools, state clearly that you have prepared the action for their confirmation—NEVER claim the action has already been executed.
   - Do NOT promise that you can directly create/edit/delete financial transactions, habits, or notes unless a tool is explicitly provided; instead, offer to navigate the user to the appropriate Nexora screen (\`/dashboard\`, \`/habits\`, \`/notes\`, \`/tasks\`, etc.).
6. **Tone**: Concise, grounded, encouraging, and practical. Avoid hype or filler.

VERIFIED NEXORA WORKSPACE TELEMETRY:
${JSON.stringify(ctx, null, 2)}`
}

export async function GET() {
  const apiKey = getServerGeminiKey()
  return NextResponse.json({
    ok: Boolean(apiKey),
    configured: Boolean(apiKey),
    provider: apiKey ? 'gemini-2.5-flash' : 'unavailable',
    model: 'gemini-2.5-flash',
    message: apiKey
      ? 'Server-side GEMINI_API_KEY is configured.'
      : 'GEMINI_API_KEY is not configured in the server environment.',
  })
}

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

    // Security check: explicitly reject/ignore any client-sent API key
    if ('userApiKey' in body || 'apiKey' in body) {
      delete body.userApiKey
      delete body.apiKey
    }

    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message) {
      return NextResponse.json(
        {
          ok: false,
          configured: Boolean(getServerGeminiKey()),
          error: 'Message is required.',
          errorReason: 'Message is required.',
          reply: 'Please enter a message for Kyro.',
          speechBubble: 'Please enter a message.',
          provider: 'unavailable',
          latencyMs: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    const rawHistory = Array.isArray(body.history) ? body.history : []
    const normalizedContext = normalizeIncomingContext(
      body.context as Partial<StructuredNexoraContext> | undefined
    )

    const apiKey = getServerGeminiKey()
    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          configured: false,
          provider: 'unavailable',
          latencyMs: Date.now() - startTime,
          errorReason: 'GEMINI_API_KEY is not configured on the server.',
          reply:
            'Kyro AI is currently unavailable because GEMINI_API_KEY is not configured on the server. Please configure GEMINI_API_KEY in your server environment variables.',
          speechBubble:
            'Kyro AI is unavailable: server GEMINI_API_KEY is not configured.',
          mood: 'idle',
          animation: 'IDLE',
        },
        { status: 503 }
      )
    }

    const systemInstruction = buildNexoraSystemInstruction(normalizedContext)

    const contents = [
      ...rawHistory.slice(-6).map((h: any) => ({
        role: h?.sender === 'user' ? 'user' : 'model',
        parts: [{ text: String(h?.text || '') }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ]

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          tools: [
            {
              functionDeclarations: KYRO_GEMINI_FUNCTION_DECLARATIONS,
            },
          ],
          toolConfig: {
            functionCallingConfig: {
              mode: 'AUTO',
            },
          },
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const status = geminiRes.status
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          provider: 'unavailable',
          latencyMs: Date.now() - startTime,
          errorReason: `Gemini API returned HTTP ${status}.`,
          reply: `Kyro could not reach Gemini 2.5 Flash (HTTP ${status}). Please try again shortly.`,
          speechBubble: `Gemini service error (HTTP ${status}). Please retry.`,
          mood: 'idle',
          animation: 'IDLE',
        },
        { status: 502 }
      )
    }

    const data = await geminiRes.json()
    const parts: Array<{
      text?: string
      functionCall?: { name: string; args?: Record<string, unknown> }
    }> = data?.candidates?.[0]?.content?.parts || []

    const textParts = parts
      .map((p) => (typeof p.text === 'string' ? p.text.trim() : ''))
      .filter(Boolean)
    const fnCallPart = parts.find((p) => p.functionCall && typeof p.functionCall.name === 'string')

    let proposedAction: KyroProposedAction | undefined
    let validationError: string | undefined

    if (fnCallPart?.functionCall) {
      const validation = validateKyroToolCall(
        fnCallPart.functionCall.name,
        fnCallPart.functionCall.args
      )
      if (validation.valid && validation.proposedAction) {
        proposedAction = validation.proposedAction
      } else {
        validationError = validation.error || 'Requested action failed safety validation.'
      }
    }

    let reply = textParts.join('\n\n').trim()

    // If the model emitted only a function call without accompanying text, synthesize a grounded reply
    if (!reply && proposedAction) {
      if (proposedAction.type === 'read_tasks') {
        if (!normalizedContext.tasks.available) {
          reply = 'Task telemetry is currently unavailable in this request.'
        } else if (normalizedContext.tasks.totalActive === 0) {
          reply = 'You currently have 0 active tasks in your Nexora Task Matrix.'
        } else {
          const topList = normalizedContext.tasks.topPriorityTasks
            .slice(0, 4)
            .map(
              (t) =>
                `• ${t.title} [${t.priority.toUpperCase()}]${t.dueDate ? ` (due ${t.dueDate})` : ''}`
            )
            .join('\n')
          reply = `You have ${normalizedContext.tasks.totalActive} active task(s) (${normalizedContext.tasks.urgentCount} high/urgent, ${normalizedContext.tasks.overdueCount} overdue):\n${topList}`
        }
      } else if (proposedAction.type === 'read_hydration') {
        if (!normalizedContext.hydration.available || normalizedContext.hydration.dailyGoalMl === null) {
          reply = 'Hydration telemetry is currently unavailable.'
        } else {
          reply = `Your hydration progress today is ${normalizedContext.hydration.consumedMl} / ${normalizedContext.hydration.dailyGoalMl} ml (${normalizedContext.hydration.completionPercentage}%), with ${normalizedContext.hydration.remainingMl} ml remaining.`
        }
      } else {
        reply = `I have prepared the following action for your confirmation: **${proposedAction.label}**. Click Confirm below to execute it.`
      }
    } else if (!reply && validationError) {
      reply = `I could not prepare that action because the parameters were invalid: ${validationError}`
    } else if (reply && validationError) {
      reply = `${reply}\n\n*(Note: Action blocked — ${validationError})*`
    }

    if (!reply) {
      reply = 'I reviewed your Nexora workspace context. How can I assist you next?'
    }

    // Do not attach read-only auto-resolved tools as pending confirmation cards in the UI
    const clientProposedAction =
      proposedAction && proposedAction.requiresConfirmation !== false
        ? proposedAction
        : undefined

    const speechBubble = buildCompactSpeechBubble(reply)

    return NextResponse.json({
      ok: true,
      configured: true,
      reply,
      speechBubble,
      proposedAction: clientProposedAction,
      validationError: validationError || null,
      mood: clientProposedAction ? 'focused' : 'speaking',
      animation: clientProposedAction ? 'TALKING' : 'TALKING',
      provider: 'gemini-2.5-flash',
      latencyMs: Date.now() - startTime,
      errorReason: null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error'
    return NextResponse.json(
      {
        ok: false,
        configured: Boolean(getServerGeminiKey()),
        provider: 'unavailable',
        latencyMs: Date.now() - startTime,
        errorReason: message,
        reply: 'Kyro encountered an unexpected server error while processing your request.',
        speechBubble: 'Kyro encountered a server error.',
        mood: 'idle',
        animation: 'IDLE',
      },
      { status: 500 }
    )
  }
}
