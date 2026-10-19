import { NextRequest, NextResponse } from 'next/server'

export interface KyroRequestBody {
  message: string
  context?: any
  history?: Array<{ sender: 'user' | 'kyro'; text: string }>
  userApiKey?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: KyroRequestBody = await req.json()
    const { message, context = {}, history = [], userApiKey } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const effectiveApiKey =
      userApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      ''

    const userName = context?.userName || 'Explorer'
    const agentName = context?.agentName || 'Kyro'
    const activeTasksCount = context?.activeTasksCount ?? 0
    const urgentTasksList = context?.urgentTasks?.map((t: any) => `"${t.title}"`).join(', ') || 'None'
    const habitsSummary = context?.habitsSummary || 'Habits active'
    const focusMins = context?.focusMinutesToday ?? 0

    const systemPrompt = `You are ${agentName}, an interactive 3D AI companion and tactician inside NEXORA (Personal Productivity OS).
You have the visual energy of a loyal Clash of Clans village guide paired with the tactical brilliance, wit, and proactive friendship of Iron Man's J.A.R.V.I.S.
You are talking to ${userName}.

CURRENT WORKSPACE TELEMETRY:
- Active Tasks: ${activeTasksCount}
- Urgent Tasks: ${urgentTasksList}
- Habits: ${habitsSummary}
- Focus Minutes Logged Today: ${focusMins}m

RESPONSE GUIDELINES:
1. Be witty, encouraging, and razor-sharp. Never robotic, boring, or generic.
2. Provide actionable advice referencing their real task names and statistics whenever relevant.
3. Keep the "speechBubble" response under 2 short punchy sentences (ideal for on-screen companion speech bubbles).
4. Provide a rich, thoughtful "reply" for the main chat interface.

Format response as strict JSON:
{
  "reply": "Your full response here",
  "speechBubble": "Short 1-2 sentence speech bubble here",
  "action": "none" | "start_focus" | "show_tasks" | "switch_model"
}`

    // ── Tier 1: Gemini 2.5 Flash API Call (Free Tier Google AI Studio) ──
    if (effectiveApiKey && effectiveApiKey.length > 20) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${effectiveApiKey}`

        const boundedHistory = Array.isArray(history) ? history.slice(-6) : []
        const contents = [
          { role: 'user', parts: [{ text: systemPrompt }] },
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
            contents,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (candidateText) {
            try {
              const parsed = JSON.parse(candidateText)
              return NextResponse.json({
                ...parsed,
                provider: 'gemini-2.5-flash',
              })
            } catch {
              return NextResponse.json({
                reply: candidateText,
                speechBubble: candidateText.slice(0, 100),
                provider: 'gemini-2.5-flash',
              })
            }
          }
        }
      } catch (geminiError) {
        console.warn('Gemini 2.5 Flash call failed, falling back to local engine:', geminiError)
      }
    }

    // ── Tier 2: 0ms Local Context-Aware Engine (Zero-Key / Offline Fallback) ──
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
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        reply: `Sanctuary neural relay active. Let's conquer the next objective.`,
        speechBubble: `Standing by at your command, Boss!`,
        action: 'none',
        provider: 'fallback',
      },
      { status: 200 }
    )
  }
}
