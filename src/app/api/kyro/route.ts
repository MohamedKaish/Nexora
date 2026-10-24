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

export function getGeminiModel(): string {
  const custom = (process.env.GEMINI_MODEL || '').trim()
  return custom || 'gemini-3.8-flash'
}

// ── In-Memory Conservative Usage Guards for Launch ──
interface ClientRateRecord {
  windowStart: number
  count: number
}

const clientRateMap = new Map<string, ClientRateRecord>()
let globalDailyTracker = {
  date: new Date().toISOString().split('T')[0],
  count: 0,
}

export function getUsageLimits() {
  const maxInputChars = Number(process.env.KYRO_MAX_INPUT_CHARS || 1000)
  const clientRpmLimit = Number(process.env.KYRO_RPM_LIMIT || 15)
  const globalDailyLimit = Number(process.env.KYRO_DAILY_LIMIT || 500)
  return { maxInputChars, clientRpmLimit, globalDailyLimit }
}

export function checkUsageGuards(clientKey: string): {
  allowed: boolean
  reason?: string
  status?: number
} {
  const { clientRpmLimit, globalDailyLimit } = getUsageLimits()
  const today = new Date().toISOString().split('T')[0]

  if (globalDailyTracker.date !== today) {
    globalDailyTracker = { date: today, count: 0 }
  }

  if (globalDailyTracker.count >= globalDailyLimit) {
    return {
      allowed: false,
      status: 429,
      reason:
        'Kyro has reached the daily request capacity for this deployment. Please try again tomorrow.',
    }
  }

  const now = Date.now()
  const record = clientRateMap.get(clientKey)
  if (!record || now - record.windowStart > 60_000) {
    clientRateMap.set(clientKey, { windowStart: now, count: 1 })
  } else {
    if (record.count >= clientRpmLimit) {
      return {
        allowed: false,
        status: 429,
        reason:
          'Too many requests sent in a short period. Please wait a moment before sending another message.',
      }
    }
    record.count += 1
  }

  globalDailyTracker.count += 1
  return { allowed: true }
}

export function resetUsageGuardsForTesting() {
  clientRateMap.clear()
  globalDailyTracker = { date: new Date().toISOString().split('T')[0], count: 0 }
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
6. **Tone**: Concise, grounded, encouraging, and practical. Keep responses brief (1 to 3 short sentences by default) and focused on immediate productivity. Avoid hype or filler.

VERIFIED NEXORA WORKSPACE TELEMETRY:
${JSON.stringify(ctx, null, 2)}`
}

export async function GET() {
  const apiKey = getServerGeminiKey()
  const model = getGeminiModel()
  return NextResponse.json({
    ok: Boolean(apiKey),
    configured: Boolean(apiKey),
    provider: apiKey ? model : 'unavailable',
    model,
    message: apiKey
      ? `Server-side GEMINI_API_KEY is configured for ${model}.`
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

    const { maxInputChars } = getUsageLimits()
    if (message.length > maxInputChars) {
      return NextResponse.json(
        {
          ok: false,
          configured: Boolean(getServerGeminiKey()),
          error: `Message exceeds the maximum limit of ${maxInputChars} characters.`,
          errorReason: `Message exceeds the maximum limit of ${maxInputChars} characters.`,
          reply: `Your message is too long (${message.length} characters). Please shorten it to under ${maxInputChars} characters.`,
          speechBubble: `Message too long (${message.length} chars).`,
          provider: 'unavailable',
          latencyMs: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    // Client IP or forwarded-for header for per-client rate limit
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous-client'

    const guardResult = checkUsageGuards(clientIp)
    if (!guardResult.allowed) {
      return NextResponse.json(
        {
          ok: false,
          configured: Boolean(getServerGeminiKey()),
          provider: 'unavailable',
          latencyMs: Date.now() - startTime,
          errorReason: guardResult.reason,
          reply: guardResult.reason,
          speechBubble: 'Usage limit reached. Please wait.',
          mood: 'idle',
          animation: 'IDLE',
        },
        { status: guardResult.status || 429 }
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

    const targetModel = getGeminiModel()
    const geminiPayload = {
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
        maxOutputTokens: 350,
      },
    }

    const sendGenerateContent = (modelId: string) =>
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload),
        }
      )

    let activeModel = targetModel
    let geminiRes = await sendGenerateContent(activeModel)

    // Graceful 404 fallback: if the configured model is not found, check Google's recommendation or cascade
    if (geminiRes.status === 404) {
      const errorJson = (await geminiRes.clone().json().catch(() => null)) as {
        error?: { message?: string }
      } | null
      const rawMsg = errorJson?.error?.message || ''
      const recommendedMatch = rawMsg.match(/models\/(gemini-[\w.-]+)/i)
      const recommendedModel = recommendedMatch?.[1]

      const candidateFallbacks = [
        recommendedModel,
        'gemini-3.8-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
      ].filter((m): m is string => Boolean(m && m !== activeModel))

      for (const fallbackModel of candidateFallbacks) {
        const fallbackRes = await sendGenerateContent(fallbackModel)
        if (fallbackRes.ok) {
          geminiRes = fallbackRes
          activeModel = fallbackModel
          break
        }
      }
    }

    if (!geminiRes.ok) {
      const status = geminiRes.status
      const errorJson = (await geminiRes.json().catch(() => null)) as {
        error?: { message?: string; status?: string }
      } | null
      const rawApiError =
        typeof errorJson?.error?.message === 'string'
          ? errorJson.error.message.replace(/key=[^&\s]+/gi, 'key=REDACTED')
          : ''

      let errorReason = `Gemini API returned HTTP ${status}.`
      let reply = `Kyro could not reach Gemini (${activeModel}) (HTTP ${status}). Please try again shortly.`
      let speechBubble = `Gemini service error (HTTP ${status}).`

      if (status === 401) {
        errorReason = `Gemini API authentication failed (HTTP 401). Invalid GEMINI_API_KEY.`
        reply = `Kyro could not authenticate with Google Gemini (HTTP 401). Please check that your server GEMINI_API_KEY is valid.`
        speechBubble = `Gemini authentication error (HTTP 401).`
      } else if (status === 403) {
        errorReason = `Gemini API access forbidden (HTTP 403). ${rawApiError || ''}`.trim()
        reply = `Kyro access was denied by Google Gemini (HTTP 403). Ensure the Generative Language API is enabled for your API key project.`
        speechBubble = `Gemini access forbidden (HTTP 403).`
      } else if (status === 404) {
        errorReason = `Gemini model '${activeModel}' was not found (HTTP 404). ${rawApiError || 'Model not available on v1beta.'}`
        reply = `Kyro could not reach model '${activeModel}' (HTTP 404: Not Found). ${rawApiError ? `Provider reported: "${rawApiError}". ` : ''}Please configure an active model such as gemini-3.8-flash or gemini-2.5-flash via GEMINI_MODEL.`
        speechBubble = `Gemini model not found (HTTP 404).`
      } else if (status === 429) {
        errorReason = `Google Gemini rate limit or quota exceeded (HTTP 429).`
        reply = `Kyro reached the Google Gemini API rate limits (HTTP 429). Service is temporarily resting. Please try again shortly.`
        speechBubble = `Gemini quota limit reached (HTTP 429). Please wait.`
      } else if (status >= 500) {
        errorReason = `Google Gemini service temporarily unavailable (HTTP ${status}).`
        reply = `Google Gemini servers are temporarily unavailable (HTTP ${status}). Please try again shortly.`
        speechBubble = `Gemini server issue (HTTP ${status}).`
      } else if (rawApiError) {
        errorReason = `Gemini API error (HTTP ${status}): ${rawApiError}`
        reply = `Kyro encountered a Gemini API error (HTTP ${status}): ${rawApiError}`
      }

      return NextResponse.json(
        {
          ok: false,
          configured: true,
          provider: 'unavailable',
          latencyMs: Date.now() - startTime,
          errorReason,
          reply,
          speechBubble,
          mood: 'idle',
          animation: 'IDLE',
        },
        { status: status >= 500 ? 502 : 400 }
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
      provider: activeModel,
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
