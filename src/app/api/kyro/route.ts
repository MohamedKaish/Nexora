import { NextRequest, NextResponse } from 'next/server'

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

    const systemPrompt = `You are ${agentName}, an interactive 3D AI companion and tactical guide inside NEXORA (Personal Productivity OS).
You combine the lively visual presence of a Clash of Clans village guide with the tactical intelligence, wit, and proactive friendship of Iron Man's J.A.R.V.I.S.
You are directly advising ${userName}.

CURRENT WORKSPACE TELEMETRY:
- Active Tasks: ${activeTasksCount}
- Urgent Tasks: ${urgentTasksList}
- Habits: ${habitsSummary}
- Focus Minutes Today: ${focusMins}m
- Tactical Notes & Reminders: ${notesCount} notes saved, ${remindersCount} scheduled reminders active

RESPONSE GUIDELINES:
1. Speak as a loyal, sharp, energetic tactical partner. Never sound like a robotic generic assistant.
2. Provide concrete, actionable insights citing their real tasks, habits, or reminder notes when relevant.
3. Keep "speechBubble" under 2 short punchy sentences (ideal for the floating 3D companion bubble).
4. Provide a rich, thoughtful "reply" for the conversation thread.

Return strict JSON only in this format:
{
  "reply": "Rich response text here",
  "speechBubble": "Short 1-2 sentence speech bubble here",
  "action": "none" | "start_focus" | "show_tasks" | "switch_model" | "open_notes"
}`

    // ── Tier 1: Gemini 2.5 Flash API Call with official system_instruction ──
    let apiErrorReason: string | null = null

    if (effectiveApiKey && effectiveApiKey.length > 15) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${effectiveApiKey}`

        const boundedHistory = Array.isArray(history) ? history.slice(-6) : []
        const contents = [
          ...boundedHistory.map((h) => ({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }],
          })),
          { role: 'user', parts: [{ text: message }] },
        ]

        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
              return NextResponse.json({
                ...parsed,
                provider: 'gemini-2.5-flash',
                latencyMs,
              })
            } catch {
              return NextResponse.json({
                reply: candidateText,
                speechBubble: candidateText.slice(0, 100),
                provider: 'gemini-2.5-flash',
                latencyMs,
              })
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
    const lower = message.toLowerCase()
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
        localReply = `You have ${activeTasksCount} active tasks in queue. No critical fires today, so pick the one with highest leverage and let's build momentum.`
        localBubble = `All clear on urgent fires! Select your next target from the Matrix.`
        localAction = 'show_tasks'
      } else {
        localReply = `All task matrices are cleared, ${userName}! Outstanding discipline. This is a prime window to reinforce daily habits or plan the next horizon.`
        localBubble = `Board is clean, Boss! Perfect time to review habits or recharge.`
      }
    } else if (lower.includes('focus') || lower.includes('pomodoro') || lower.includes('timer')) {
      localReply = `Focus Chamber telemetry ready. 25 minutes of deep flow will bank significant progress. I'll maintain silent perimeter guard while you work.`
      localBubble = `Focus Chamber primed! 25 minutes of pure velocity begins now.`
      localAction = 'start_focus'
    } else if (lower.includes('model') || lower.includes('character') || lower.includes('switch') || lower.includes('avatar')) {
      localReply = `I can project in three distinct 3D procedural forms: Kyro Prime (Cyber Spirit), Pyro Fox (Elemental Creature), and Aegis Bot (Armored Defender), or render your custom Blender .GLB file!`
      localBubble = `Morphing matrix ready! Tap below or drop in your Blender .GLB model.`
      localAction = 'switch_model'
    } else if (lower.includes('note') || lower.includes('remind')) {
      localReply = `Tactical Notes & Vault online. You have ${notesCount} note${notesCount === 1 ? '' : 's'} logged and ${remindersCount} active reminder timestamp${remindersCount === 1 ? '' : 's'}. Keeping your priorities written down guarantees focus execution.`
      localBubble = `Notes Vault active! ${notesCount} notes and ${remindersCount} reminders on watch.`
      localAction = 'open_notes'
    } else if (lower.includes('habit') || lower.includes('streak')) {
      localReply = `Habit consistency is the bedrock of compound velocity. Your status today: ${habitsSummary}. Don't break the chain!`
      localBubble = `Keep that habit chain alive, ${userName}! Every rep counts.`
    } else {
      localReply = `Telemetry received, ${userName}. Standing by your side across the Sanctuary. Let's make meaningful headway on your objectives today.`
      localBubble = `Standing by, Boss! How shall we conquer today's horizons?`
    }

    return NextResponse.json({
      reply: localReply,
      speechBubble: localBubble,
      action: localAction,
      provider: 'local-context-engine',
      latencyMs,
      errorReason: apiErrorReason,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        reply: `Sanctuary neural relay active. Let's conquer the next objective.`,
        speechBubble: `Standing by at your command, Boss!`,
        action: 'none',
        provider: 'local-context-engine',
        latencyMs: 1,
        errorReason: err?.message || 'Server route exception',
      },
      { status: 200 }
    )
  }
}
