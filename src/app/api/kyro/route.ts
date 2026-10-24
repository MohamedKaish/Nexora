import { NextRequest, NextResponse } from 'next/server'
import { stripPII } from '@/lib/security'

export interface KyroRequestBody {
  message: string
  context?: any
  history?: Array<{ sender: 'user' | 'kyro'; text: string }>
  userApiKey?: string
}

export async function POST(req: NextRequest) {
  const startTime = performance.now()
  try {
    const body: KyroRequestBody = await req.json()
    const { message, context = {}, history = [], userApiKey } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // ── Security Layer 1: Client-Side & Proxy PII Stripping ──
    const sanitizedMessage = stripPII(message)

    // ── Security Layer 2: Voice Action Gate Interception ──
    const lower = sanitizedMessage.toLowerCase()
    const isSensitiveFinancialMutation =
      (lower.includes('delete') && (lower.includes('transaction') || lower.includes('bill') || lower.includes('account') || lower.includes('floor'))) ||
      (lower.includes('reset') && (lower.includes('floor') || lower.includes('balance') || lower.includes('budget'))) ||
      lower.includes('wipe all') ||
      (lower.includes('transfer') && lower.includes('surplus'))

    if (isSensitiveFinancialMutation) {
      return NextResponse.json(
        {
          reply: `[VOICE ACTION GATE ACTIVATED]: You requested a sensitive mutation to your financial ledger or budget parameters. Per Aura Life OS security protocol, all automated mutations are held in a pending state until confirmed via explicit user interaction.`,
          speechBubble: `Voice Action Gate active: Tap the visual confirmation chip to execute this financial change.`,
          action: 'voice_gate_confirm',
          actionChips: [
            {
              id: 'confirm_gate',
              label: '⚠️ Confirm Sensitive Mutation',
              action: 'custom',
              payload: { actionType: 'voice_gate_confirm', originalRequest: sanitizedMessage },
            },
            {
              id: 'cancel_gate',
              label: '🛡️ Cancel Mutation',
              action: 'custom',
              payload: { actionType: 'voice_gate_cancel' },
            },
          ],
          provider: 'voice-action-gate',
          latencyMs: 1,
        },
        {
          headers: {
            'X-Zero-Data-Retention': '1',
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      )
    }

    const effectiveApiKey =
      userApiKey?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      ''

    const userName = context?.userName || 'Explorer'
    const agentName = context?.agentName || 'Kyro'
    const activeTasksCount = context?.activeTasksCount ?? 0
    const urgentTasksList = context?.urgentTasks?.map((t: any) => `"${t.title}"`).join(', ') || 'None'
    const habitsSummary = context?.habitsSummary || 'Habits active'
    const focusMins = context?.focusMinutesToday ?? 0
    const notesCount = context?.notesCount ?? 0
    const remindersCount = context?.remindersCount ?? 0
    const safeToSpend = context?.safeToSpendDaily ? `$${context.safeToSpendDaily}` : 'Pacing active'
    const hydration = context?.hydrationPercentage ? `${context.hydrationPercentage}%` : 'Hydrated'

    const systemPrompt = `You are ${agentName}, an ambient 3D AI companion and executive operating co-pilot inside AURA LIFE OS (Personal OS).
You combine the lively tactical wit of Iron Man's J.A.R.V.I.S. with calm, positive guidance.
You are directly advising ${userName}.

CURRENT WORKSPACE TELEMETRY:
- Safe-to-Spend Allowance: ${safeToSpend}
- Circadian Hydration: ${hydration}
- Active Tasks: ${activeTasksCount} (Urgent: ${urgentTasksList})
- Habits: ${habitsSummary}
- Focus Minutes Today: ${focusMins}m
- Tactical Notes: ${notesCount} saved, ${remindersCount} scheduled alerts

GOVERNANCE & SECURITY RULES:
1. Speak as a loyal, sharp, executive tactical partner. Never sound robotic or generic.
2. Provide concrete, actionable insights citing their real tasks, safe-to-spend cash, or hydration pacing.
3. Keep "speechBubble" under 2 short punchy sentences (ideal for the floating 3D companion bubble).
4. Provide a rich, thoughtful "reply" for the conversation thread.
5. Never invent fictional financial accounts or balances; stick strictly to telemetry provided.

Return strict JSON only in this format:
{
  "reply": "Rich response text here",
  "speechBubble": "Short 1-2 sentence speech bubble here",
  "action": "none" | "start_focus" | "show_tasks" | "switch_model" | "open_notes" | "open_finance"
}`

    // ── Tier 1: Gemini 2.5 Flash API Call with zero-data-retention ──
    let apiErrorReason: string | null = null

    if (effectiveApiKey && effectiveApiKey.length > 15) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${effectiveApiKey}`

        const boundedHistory = Array.isArray(history) ? history.slice(-6) : []
        const contents = [
          ...boundedHistory.map((h) => ({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: stripPII(h.text) }],
          })),
          { role: 'user', parts: [{ text: sanitizedMessage }] },
        ]

        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Zero-Data-Retention': '1',
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
        })

        const latencyMs = Math.round(performance.now() - startTime)

        if (response.ok) {
          const data = await response.json()
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (candidateText) {
            try {
              const parsed = JSON.parse(candidateText)
              return NextResponse.json(
                {
                  ...parsed,
                  provider: 'gemini-2.5-flash',
                  latencyMs,
                },
                {
                  headers: {
                    'X-Zero-Data-Retention': '1',
                    'X-Content-Type-Options': 'nosniff',
                    'Cache-Control': 'no-store, max-age=0',
                  },
                }
              )
            } catch {
              return NextResponse.json(
                {
                  reply: candidateText,
                  speechBubble: candidateText.slice(0, 100),
                  provider: 'gemini-2.5-flash',
                  latencyMs,
                },
                {
                  headers: {
                    'X-Zero-Data-Retention': '1',
                    'X-Content-Type-Options': 'nosniff',
                    'Cache-Control': 'no-store, max-age=0',
                  },
                }
              )
            }
          }
        } else {
          const errData = await response.json().catch(() => ({}))
          apiErrorReason =
            errData?.error?.message ||
            `Gemini API returned status ${response.status} (${response.statusText})`
          console.warn('Gemini 2.5 Flash API error:', apiErrorReason)
        }
      } catch (geminiError: any) {
        apiErrorReason = geminiError?.message || 'Network fetch to Google AI Studio failed'
        console.warn('Gemini 2.5 Flash call failed:', geminiError)
      }
    } else if (userApiKey && userApiKey.length <= 15) {
      apiErrorReason = 'Provided Gemini API key format is too short or invalid (expected AIzaSy...)'
    }

    // ── Tier 2: 0ms Local Context-Aware Engine Fallback ──
    const latencyMs = Math.round(performance.now() - startTime)
    let localReply = ''
    let localBubble = ''
    let localAction = 'none'

    if (lower.includes('next') || lower.includes('what should i do') || lower.includes('priority')) {
      if (context?.urgentTasks?.length > 0) {
        const top = context.urgentTasks[0]
        localReply = `Analyzing matrix... Your top priority is "${top.title}". It's marked as urgent. Recommend locking in a 25-minute Pomodoro session to clear it immediately.`
        localBubble = `Top objective: "${top.title}". Let's lock in and crush it, Boss!`
        localAction = 'start_focus'
      } else if (activeTasksCount > 0) {
        localReply = `You have ${activeTasksCount} active tasks in flight. Check your Task Matrix and pick the highest-leverage item.`
        localBubble = `${activeTasksCount} tasks queued. Ready when you are, Boss!`
        localAction = 'show_tasks'
      } else {
        localReply = `Task board is clear! Outstanding momentum, ${userName}. Keep building your daily habit streaks or take a deep recharge.`
        localBubble = 'Task board is 100% clear. Outstanding discipline!'
      }
    } else if (lower.includes('money') || lower.includes('spend') || lower.includes('finance') || lower.includes('budget')) {
      localReply = `Safe-to-Spend pacing engine is active. Your daily discretionary allowance is grounded in real checking balances minus unpaid bills. All surpluses automatically smooth across the pay cycle.`
      localBubble = `Safe-to-Spend is calibrated: ${safeToSpend}. All bills remain fully protected.`
      localAction = 'open_finance'
    } else if (lower.includes('water') || lower.includes('drink') || lower.includes('hydration')) {
      localReply = `Dynamic Circadian Hydration model is scaling with your body mass, ambient temperature, and caffeine intake. Current status: ${hydration}.`
      localBubble = `Hydration level: ${hydration}. Replenish with pure water to sustain cognitive velocity!`
    } else if (lower.includes('focus') || lower.includes('pomodoro') || lower.includes('deep work')) {
      localReply = `Focus chamber standing by. Launch a 25-minute Pomodoro block to enter deep cognitive flow.`
      localBubble = 'Chamber ready. Let us initiate 25 minutes of unbroken focus.'
      localAction = 'start_focus'
    } else if (lower.includes('how are you') || lower.includes('status') || lower.includes('hello') || lower.includes('hi')) {
      localReply = `All orbital systems operational, ${userName}! Safe-to-Spend pacing: ${safeToSpend}. Hydration: ${hydration}. Tasks: ${activeTasksCount} active.`
      localBubble = `Sanctuary online and nominal, Boss! What shall we achieve today?`
    } else {
      localReply = `Standing by at your command, ${userName}. I am tracking your tasks, habit horizons, Safe-to-Spend cash pacing, and circadian hydration.`
      localBubble = `Signal received, Boss! Standing by to assist.`
    }

    return NextResponse.json(
      {
        reply: localReply,
        speechBubble: localBubble,
        action: localAction,
        provider: 'local-context-engine',
        latencyMs,
        errorReason: apiErrorReason,
      },
      {
        headers: {
          'X-Zero-Data-Retention': '1',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (err: any) {
    console.error('Kyro API fatal error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
