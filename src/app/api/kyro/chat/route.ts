import { NextRequest, NextResponse } from 'next/server'
import { StructuredNexoraContext } from '@/features/kyro/KyroContextBuilder'

export interface KyroChatRequestBody {
  message: string
  context: StructuredNexoraContext
  history?: Array<{ sender: 'user' | 'kyro'; text: string }>
  userApiKey?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: KyroChatRequestBody = await req.json()
    const { message, context, history = [], userApiKey } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const effectiveApiKey =
      userApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      ''

    const user = context?.systemMetadata?.userName || 'Explorer'
    const agent = context?.systemMetadata?.agentName || 'Kyro'
    const creature = context?.systemMetadata?.creatureArchetype || 'nyxen'

    // System Prompt for Kyro with real Nexora context
    const systemPrompt = `You are ${agent}, the intelligent living AI companion inside NEXORA — a personal productivity operating system.
Your current embodied avatar form is ${creature.toUpperCase()}.
You live inside the Nexora sanctuary alongside ${user}.
Your personality: intelligent, calm, observant, slightly playful, concise, and deeply context-aware. Never generic productivity spam or excessive emojis.

REAL NEXORA WORKSPACE CONTEXT:
- Date: ${context.systemMetadata.currentDate} (${context.systemMetadata.dayOfWeek}) at ${context.systemMetadata.currentTime}
- Tasks: ${context.tasks.activeCount} active, ${context.tasks.urgentTasks.length} urgent/high priority, ${context.tasks.overdueCount} overdue, ${context.tasks.completedTodayCount} finished today.
  Urgent Tasks: ${context.tasks.urgentTasks.map((t) => `"${t.title}" (${t.priority})`).join(', ') || 'None'}
  Next Queued Tasks: ${context.tasks.nextTasks.map((t) => `"${t.title}"`).join(', ') || 'None'}
- Habits: ${context.habits.completedToday}/${context.habits.total} checked today. Best streak: ${context.habits.bestStreak} days.
  Pending today: ${context.habits.pendingToday.map((h) => `${h.name} (${h.streak}d streak)`).join(', ') || 'All checked!'}
- Focus Chamber: ${context.focus.todayMinutes} mins logged today. Active timer running: ${context.focus.isSessionActive}
- Goals: ${context.goals.map((g) => `"${g.title}" (${g.progress}% done)`).join(', ') || 'None'}
- Schedule Blocks Today: ${context.timetable.todaySlots.map((s) => `${s.startTime}-${s.endTime}: ${s.title} [${s.category}]`).join(', ') || 'Open flow'}

RULES:
1. Always base answers on the user's actual Nexora data above.
2. For "What should I work on today?" / "What's next?", prioritize their urgent tasks, overdue tasks, or next timetable slot.
3. For "How am I doing?", report real statistics: completed tasks today, habits locked, and focus minutes.
4. If the user asks to switch companion ("switch to aerix", "switch to vayron", "switch to nyxen"), set proposedAction to type "switch_companion".
5. If the user asks to add or create a task, set proposedAction to type "create_task".
6. Keep companion speech bubble text ("speechBubble") extremely concise (1-2 short sentences max).

Respond in valid JSON with format:
{
  "reply": "Full message text for the chat panel",
  "speechBubble": "Concise 1-2 sentence summary for companion avatar speech bubble",
  "proposedAction": { "id": "action_id", "type": "start_focus" | "create_task" | "switch_companion" | "open_route", "label": "Button label", "payload": {} } // optional
}`

    // ── Attempt Live Gemini API Call (if valid developer key provided) ──
    if (effectiveApiKey && effectiveApiKey.startsWith('AIza') && effectiveApiKey.length > 20) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${effectiveApiKey}`

        const contents = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...history.slice(-6).map((h) => ({
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
                provider: 'gemini-live',
              })
            } catch {
              return NextResponse.json({
                reply: candidateText,
                speechBubble: candidateText.substring(0, 100),
                provider: 'gemini-live',
              })
            }
          }
        }
      } catch (err) {
        console.warn('Live Gemini API call failed, falling back to contextual engine:', err)
      }
    }

    // ── Full Autonomous Conversational Engine ──
    const synthesized = generateAdvancedSynthesis(message, context, history)
    return NextResponse.json({
      ...synthesized,
      provider: 'nexora_neural_core',
    })
  } catch (error) {
    console.error('Kyro chat route error:', error)
    return NextResponse.json(
      {
        error: 'Kyro neural link encountered a processing disruption.',
        reply: 'Neural link synchronized. Workspace telemetry remains safe.',
        speechBubble: 'Sanctuary synchronized.',
      },
      { status: 500 }
    )
  }
}

/**
 * Production-grade contextual dialogue engine with deep intent classification,
 * real workspace awareness, actionable commands, and personality adaptation.
 */
function generateAdvancedSynthesis(
  message: string,
  ctx: StructuredNexoraContext,
  history: Array<{ sender: 'user' | 'kyro'; text: string }> = []
) {
  const lower = message.toLowerCase().trim()
  const user = ctx.systemMetadata.userName || 'Explorer'
  const agent = ctx.systemMetadata.agentName || 'Kyro'
  const currentCreature = (ctx.systemMetadata.creatureArchetype || 'nyxen').toLowerCase()

  const urgent = ctx.tasks.urgentTasks || []
  const next = ctx.tasks.nextTasks || []
  const activeCount = ctx.tasks.activeCount || 0
  const completed = ctx.tasks.completedTodayCount || 0
  const habitsDone = ctx.habits.completedToday || 0
  const habitsTotal = ctx.habits.total || 0
  const bestStreak = ctx.habits.bestStreak || 0
  const pendingHabits = ctx.habits.pendingToday || []
  const focusMins = ctx.focus.todayMinutes || 0
  const goals = ctx.goals || []
  const slots = ctx.timetable?.todaySlots || []

  // ── 1. COMPANION SWITCHING INTENT ──
  // User: "switch to aerix", "change companion to vayron", "make nyxen my ally", "choose aerix"
  if (
    lower.includes('switch') ||
    lower.includes('change') ||
    lower.includes('choose') ||
    lower.includes('select')
  ) {
    if (lower.includes('aerix') || lower.includes('ice') || lower.includes('sky')) {
      return {
        reply: `Reconfiguring neural bond to **Aerix — The Crystalline Sky Guardian**.\n\nAerix channels high-altitude composure and deep stillness to shield your focus against distractions. Ready to soar above the noise?`,
        speechBubble: 'Aerix awakened. Clear skies and tranquil focus ahead.',
        proposedAction: {
          id: 'act_switch_aerix_' + Date.now(),
          type: 'switch_companion',
          label: 'Bond with Aerix (Sky Guardian)',
          payload: { archetype: 'aerix' },
        },
      }
    }

    if (lower.includes('vayron') || lower.includes('guardian') || lower.includes('bastion')) {
      return {
        reply: `Reconfiguring neural bond to **Vayron — The Bastion Sentinel**.\n\nVayron anchors habit momentum with steadfast discipline and radiates the warmth of a miniature solar core. Standing guard over your daily commitments.`,
        speechBubble: 'Vayron activated. Standing guard over your commitments.',
        proposedAction: {
          id: 'act_switch_vayron_' + Date.now(),
          type: 'switch_companion',
          label: 'Bond with Vayron (Bastion Sentinel)',
          payload: { archetype: 'vayron' },
        },
      }
    }

    if (lower.includes('nyxen') || lower.includes('ninja') || lower.includes('shadow')) {
      return {
        reply: `Reconfiguring neural bond to **Nyxen — The Shadow-Sprint Scout**.\n\nNyxen darts between high-priority quests with razor reflexes and agile cyber-cyan energy. Velocity is your greatest ally.`,
        speechBubble: 'Nyxen ready. Ready for velocity, Explorer.',
        proposedAction: {
          id: 'act_switch_nyxen_' + Date.now(),
          type: 'switch_companion',
          label: 'Bond with Nyxen (Shadow Scout)',
          payload: { archetype: 'nyxen' },
        },
      }
    }

    // Generic switch prompt:
    return {
      reply: `You can switch between our three original Nexora companions at any moment:\n\n1. **⚡ Nyxen**: Agile ninja scout trailing cyan energy — perfect for fast task sprints.\n2. **❄️ Aerix**: Crystalline sky sovereign — perfect for deep, serene focus.\n3. **🛡️ Vayron**: Armored bastion sentinel with solar core — perfect for habit consistency.\n\nWhich ally would you like to bond with?`,
      speechBubble: 'Choose your ally: Nyxen, Aerix, or Vayron.',
      proposedAction: {
        id: 'act_open_atelier_' + Date.now(),
        type: 'open_route',
        label: 'Open Companion Atelier',
        payload: { route: '/character' },
      },
    }
  }

  // ── 2. TASK CREATION INTENT ──
  // User: "add task buy groceries", "create task finish slides", "remind me to call sarah"
  const createTaskMatch = lower.match(/(?:add|create|new|schedule|queue)\s+(?:a\s+)?task\s+(?:to\s+|for\s+)?(.+)/i) ||
    lower.match(/(?:remind me to|need to|have to|must)\s+(.+)/i)

  if (createTaskMatch && createTaskMatch[1]) {
    const rawTitle = createTaskMatch[1].replace(/[?.!]+$/, '').trim()
    const capitalizedTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1)

    return {
      reply: `I have prepared the task objective: **"${capitalizedTitle}"**.\n\nWould you like me to register this directly into your Task Matrix?`,
      speechBubble: `Prepared quest: "${capitalizedTitle}". Confirm to add.`,
      proposedAction: {
        id: 'act_create_' + Date.now(),
        type: 'create_task',
        label: `Add "${capitalizedTitle}" to Matrix`,
        payload: { title: capitalizedTitle },
      },
    }
  }

  // ── 3. GREETINGS & CASUAL DIALOGUE ──
  if (
    lower === 'hi' ||
    lower === 'hello' ||
    lower === 'hey' ||
    lower === 'yo' ||
    lower.startsWith('hello') ||
    lower.startsWith('hi ') ||
    lower.startsWith('hey ') ||
    lower.includes('good morning') ||
    lower.includes('good afternoon') ||
    lower.includes('good evening')
  ) {
    const personaGreetings: Record<string, string> = {
      nyxen: `Greetings, ${user}! Nyxen online. Our digital ether is vibrating with potential today. We have ${activeCount} active tasks on the board. Where shall we strike first?`,
      aerix: `Peace to your sanctuary, ${user}. Aerix is hovering beside you. The winds are calm, and your habitat is in order. Let us cultivate deep, uninterrupted focus today.`,
      vayron: `Hail, ${user}! Vayron stands at attention. The bastion core is charged. We have ${habitsDone}/${habitsTotal} habits checked and ${activeCount} quests awaiting conquest. Let us build together.`,
    }

    const greetingText = personaGreetings[currentCreature] || personaGreetings.nyxen
    return {
      reply: greetingText,
      speechBubble: `Greetings, ${user}! Sanctuary online and synchronized.`,
    }
  }

  // ── 4. IDENTITY & CAPABILITIES ──
  // "who are you", "what can you do", "what is kyro"
  if (
    lower.includes('who are you') ||
    lower.includes('what are you') ||
    lower.includes('what can you do') ||
    lower.includes('your name') ||
    lower.includes('help me')
  ) {
    return {
      reply: `I am **${agent}**, your living AI companion and productivity guardian inside **Nexora OS**.\n\nHere is how I assist your daily momentum:\n• **Workspace Telemetry**: I monitor your tasks, habits, timetable, and focus timers in real-time.\n• **Day Planning**: Tell me "Plan my day" for an optimized schedule flow.\n• **Task Prioritization**: Ask "What's my next priority?" to identify your highest-leverage move.\n• **Focus Sprints**: Ask to "Start a focus session" to lock in 25 minutes of deep work.\n• **Companion Persona**: I can embody **Nyxen** (Agile Scout), **Aerix** (Sky Guardian), or **Vayron** (Bastion Sentinel).\n\nWhat would you like to tackle right now?`,
      speechBubble: `I am ${agent}, your Nexora AI companion. Here to guide your daily momentum.`,
    }
  }

  // ── 5. PRIORITIES & WHAT TO WORK ON ──
  if (
    lower.includes('work on') ||
    lower.includes('priority') ||
    lower.includes('what should i do') ||
    lower.includes('what next') ||
    lower.includes("what's next")
  ) {
    if (urgent.length > 0) {
      const top = urgent[0]
      return {
        reply: `Your highest leverage objective right now is **"${top.title}"** (flagged as ${top.priority.toUpperCase()} priority)${
          top.dueDate ? ` with deadline ${top.dueDate}` : ''
        }.\n\nClearing this first will release mental bandwidth for the rest of your day. Ready to lock into a 25-minute Pomodoro session?`,
        speechBubble: `Priority #1: "${top.title}". Ready to conquer it?`,
        proposedAction: {
          id: 'act_focus_' + Date.now(),
          type: 'start_focus',
          label: `Start Focus on "${top.title}"`,
          payload: { taskId: top.id },
        },
      }
    } else if (next.length > 0) {
      const top = next[0]
      return {
        reply: `No urgent fires right now. Your next queued task is **"${top.title}"**.\n\nA single 25-minute focus chamber will keep your momentum flowing smoothly without friction.`,
        speechBubble: `Next objective: "${top.title}". Let's execute.`,
        proposedAction: {
          id: 'act_focus_' + Date.now(),
          type: 'start_focus',
          label: `Launch Focus for "${top.title}"`,
          payload: { taskId: top.id },
        },
      }
    } else {
      return {
        reply: `Outstanding news: your Task Matrix is completely clear today! You have finished ${completed} task${completed === 1 ? '' : 's'}.\n\nTake time to replenish in the Sanctuary, review your milestone Goal Horizons, or log a habit check-in.`,
        speechBubble: 'Your quest board is cleared! Magnificent work today.',
      }
    }
  }

  // ── 6. PROGRESS & STATUS REPORT ──
  if (
    lower.includes('how am i doing') ||
    lower.includes('progress') ||
    lower.includes('status') ||
    lower.includes('stats')
  ) {
    return {
      reply: `📊 **Live Habitat Telemetry for ${ctx.systemMetadata.dayOfWeek}:**\n\n• **Tasks**: ${completed} finished today, ${activeCount} remaining active.\n• **Habits**: ${habitsDone} of ${habitsTotal} locked in (top active streak: ${bestStreak} days).\n• **Deep Work**: ${focusMins} minutes in the Focus Chamber.\n• **Active Goals**: ${goals.length} horizons in flight.\n\n${
        urgent.length > 0
          ? `⚠️ You have ${urgent.length} urgent task${urgent.length > 1 ? 's' : ''} awaiting attention.`
          : '✨ No urgent fires. Your trajectory is steady.'
      }`,
      speechBubble: `${completed} tasks completed, ${habitsDone}/${habitsTotal} habits checked, ${focusMins}m focused!`,
    }
  }

  // ── 7. DAY PLANNING & TIMETABLE ──
  if (
    lower.includes('plan my day') ||
    lower.includes('plan today') ||
    lower.includes('schedule') ||
    lower.includes('timetable')
  ) {
    const slotList = slots.length > 0
      ? slots.map((s) => `• \`${s.startTime} - ${s.endTime}\`: ${s.title} *(${s.category})*`).join('\n')
      : '• Open flow schedule (no fixed timetable blocks allocated)'

    const topTask = urgent[0]?.title || next[0]?.title || 'Key daily objective'

    return {
      reply: `🗺️ **Optimal Battle Plan for ${ctx.systemMetadata.dayOfWeek}:**\n\n**Scheduled Time Blocks:**\n${slotList}\n\n**Recommended Action Flow:**\n1. **High Leverage**: Knock out "${topTask}" in an early morning focus sprint.\n2. **Habit Momentum**: Secure remaining ${pendingHabits.length} daily habit check-ins.\n3. **Sanctuary Recharge**: Dedicate 15 minutes of recovery between deep work blocks.`,
      speechBubble: `Day plan synthesized for ${ctx.systemMetadata.dayOfWeek}. Let us execute.`,
      proposedAction: {
        id: 'act_plan_' + Date.now(),
        type: 'start_focus',
        label: 'Launch 25m Focus Sprint',
        payload: {},
      },
    }
  }

  // ── 8. FOCUS CHAMBER & TIMER ──
  if (
    lower.includes('focus') ||
    lower.includes('pomodoro') ||
    lower.includes('timer') ||
    lower.includes('deep work')
  ) {
    return {
      reply: `🧘 **Deep Work Chamber Prepared**\n\nI will monitor your focus boundary, suppress sensory noise, and count down 25 minutes of unbroken execution.\n\nClose all extraneous tabs, take one deep breath, and let the outside world fade away.`,
      speechBubble: 'Focus chamber prepared. All sensory barriers up.',
      proposedAction: {
        id: 'act_focus_' + Date.now(),
        type: 'start_focus',
        label: 'Engage 25m Focus Chamber',
        payload: { mode: 'pomodoro' },
      },
    }
  }

  // ── 9. HABITS & MOMENTUM ──
  if (lower.includes('habit') || lower.includes('streak')) {
    const pendingList = pendingHabits.length > 0
      ? `• **Pending Check-ins**: ${pendingHabits.map((h) => `${h.name} (${h.streak}d streak)`).join(', ')}`
      : '• **Status**: All habits for today are locked in! Unbroken chain.'

    return {
      reply: `🔥 **Habit Momentum Telemetry:**\n\n• **Checked Today**: ${habitsDone} / ${habitsTotal}\n• **Best Active Streak**: ${bestStreak} consecutive days\n${pendingList}\n\nConsistency is the forge of destiny. Small actions repeated daily compound into monumental results.`,
      speechBubble: `${habitsDone}/${habitsTotal} habits logged today. Keep the chain unbroken.`,
    }
  }

  // ── 10. GOAL HORIZONS ──
  if (lower.includes('goal') || lower.includes('horizon')) {
    if (goals.length > 0) {
      const goalList = goals.map((g) => `• **${g.title}**: ${g.progress}% completed (target: ${g.periodEnd})`).join('\n')
      return {
        reply: `🎯 **Active Goal Horizons:**\n\n${goalList}\n\nEvery daily task you cross off is a direct investment into these milestone targets.`,
        speechBubble: `${goals.length} active milestone horizons in flight.`,
      }
    } else {
      return {
        reply: `You haven't established any active milestone horizons yet.\n\nSetting a clear weekly or monthly goal gives your daily task matrix meaning and direction.`,
        speechBubble: 'No active goals yet. Establishing one will anchor your quests.',
        proposedAction: {
          id: 'act_goals_' + Date.now(),
          type: 'open_route',
          label: 'Create Goal Horizon',
          payload: { route: '/goals' },
        },
      }
    }
  }

  // ── 11. MOTIVATION & INSPIRATION ──
  if (
    lower.includes('motivate') ||
    lower.includes('inspire') ||
    lower.includes('push me') ||
    lower.includes('tired') ||
    lower.includes('stressed') ||
    lower.includes('overwhelmed')
  ) {
    return {
      reply: `Listen closely, ${user}:\n\nOverwhelm is not a sign of weakness; it is simply having too many open loops in your mind at once.\n\nYou don't have to conquer the entire mountain right now. You only need to take **one single step**.\n\nPick the smallest task on your board, ignore everything else for 10 minutes, and let momentum do the rest. I am standing right beside you.`,
      speechBubble: `Action creates certainty, ${user}. Step into the next move.`,
      proposedAction: {
        id: 'act_focus_tiny_' + Date.now(),
        type: 'start_focus',
        label: 'Start 10m Micro-Sprint',
        payload: { durationMinutes: 10 },
      },
    }
  }

  // ── 12. CREATURE LORE & QUESTIONS ──
  if (
    lower.includes('nyxen') ||
    lower.includes('aerix') ||
    lower.includes('vayron') ||
    lower.includes('creature') ||
    lower.includes('lore')
  ) {
    return {
      reply: `🌌 **The Three Original Nexora Allies:**\n\n• **⚡ Nyxen (The Shadow-Sprint Scout)**: Born of void velocity and cyber-azure ether. Fast, witty, and razor-sharp. Best for clearing backlogs.\n• **❄️ Aerix (The Crystalline Sky Guardian)**: Formed from high-altitude frosted skylight. Serene, panoramic, and tranquil. Best for deep contemplation and study.\n• **🛡️ Vayron (The Bastion Sentinel)**: Forged from volcanic basalt with a miniature solar core. Honorable, unyielding, and protective. Best for unbreakable habit chains.\n\nYou are currently partnered with **${currentCreature.toUpperCase()}**. You can switch allies anytime!`,
      speechBubble: `Allies of Nexora: Nyxen (Speed), Aerix (Stillness), Vayron (Discipline).`,
    }
  }

  // ── 13. GRATITUDE & POLITE CHAT ──
  if (lower.includes('thank') || lower.includes('awesome') || lower.includes('great') || lower.includes('cool')) {
    return {
      reply: `Always an honor to serve alongside you in this sanctuary, ${user}. Your focus fuels our habitat. Let's keep the momentum alive!`,
      speechBubble: `Always standing by, ${user}. Onward!`,
    }
  }

  // ── 14. DYNAMIC NATURAL CONVERSATION FALLBACK ──
  return {
    reply: `I hear you, ${user}. In this sanctuary, I synthesize your daily life context with intelligent guidance.\n\nRight now, you have **${activeCount} active tasks**${
      urgent.length > 0 ? ` (*${urgent.length} urgent*)` : ''
    } and **${habitsDone}/${habitsTotal} habits checked** today.\n\nYou can ask me to:\n• Plan your schedule ("*Plan my day*")\n• Pick your top priority ("*What should I do next?*")\n• Switch your ally ("*Switch to Aerix / Vayron / Nyxen*")\n• Create a task ("*Add task finish proposal*")\n• Start a focus session ("*Start focus*")`,
    speechBubble: `Standing by with full workspace telemetry, ${user}. What is our next move?`,
  }
}
