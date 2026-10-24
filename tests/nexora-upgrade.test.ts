import assert from 'node:assert/strict'
import test from 'node:test'

// Provide an in-memory localStorage & window mock for Node test environment
const memoryStorage = new Map<string, string>()
const localStorageMock = {
  getItem: (key: string) => memoryStorage.get(key) ?? null,
  setItem: (key: string, val: string) => {
    memoryStorage.set(key, String(val))
  },
  removeItem: (key: string) => {
    memoryStorage.delete(key)
  },
  clear: () => {
    memoryStorage.clear()
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

Object.defineProperty(globalThis, 'window', {
  value: {
    localStorage: localStorageMock,
    location: { origin: 'https://nexora-nine-kappa.vercel.app', pathname: '/dashboard' },
    navigator: {},
  },
  writable: true,
})

import {
  useFinanceStore,
  roundCurrencyAmount,
  formatCurrency,
} from '../src/store/useFinanceStore'
import { useHydrationStore } from '../src/store/useHydrationStore'
import { useTaskStore } from '../src/store/useTaskStore'
import { useHabitStore } from '../src/store/useHabitStore'
import { useNoteStore } from '../src/store/useNoteStore'
import { useFocusStore } from '../src/store/useFocusStore'
import { useGoalStore } from '../src/store/useGoalStore'
import { useProjectStore } from '../src/store/useProjectStore'
import { useTimelineStore } from '../src/store/timelineStore'
import {
  getScheduledAlarms,
  syncHydrationNotifications,
  setChannelEnabled,
  getChannelPreferences,
} from '../src/lib/nativeNotificationScheduler'
import { stripPII, generateDedupHash } from '../src/lib/security'

test('PHASE 2: Clean Production Startup State (No Demo Data or Fake Balances)', async (t) => {
  await t.test('1. Initial notes store has 0 hardcoded demo notes', () => {
    assert.equal(useNoteStore.getState().notes.length, 0)
  })

  await t.test('2. Initial finance wallets start with 0 opening balance (no fake sample money)', () => {
    const defaultWallets = useFinanceStore.getState().wallets
    assert.ok(defaultWallets.length >= 1)
    for (const w of defaultWallets) {
      assert.equal(w.openingBalance, 0, `Expected wallet ${w.name} to have 0 openingBalance`)
    }
    assert.equal(useFinanceStore.getState().transactions.length, 0)
  })

  await t.test('3. Initial tasks and habits start empty until user creates or calibrates them', () => {
    assert.equal(useTaskStore.getState().tasks.length, 0)
    assert.equal(useHabitStore.getState().habits.length, 0)
  })
})

test('PHASE 3: Multi-Currency Expense & Wallet Scenarios (1-10)', async (t) => {
  // Reset finance store to clean test state
  useFinanceStore.setState({
    defaultCurrency: 'INR',
    wallets: [],
    transactions: [],
    expenses: [],
  })

  await t.test('1. Create a wallet in INR with opening balance ₹5,000 → balance is ₹5,000', () => {
    const bankWallet = useFinanceStore.getState().addWallet({
      name: 'Bank Account',
      type: 'bank',
      currency: 'INR',
      openingBalance: 5000,
    })
    const balance = useFinanceStore.getState().getWalletBalance(bankWallet.id)
    assert.equal(balance, 5000)
    assert.equal(formatCurrency(balance, 'INR'), '₹5,000.00')
  })

  await t.test('2. Add expense ₹250 for Food from that wallet → balance becomes ₹4,750', () => {
    const bankWallet = useFinanceStore.getState().wallets[0]
    const tx = useFinanceStore.getState().addTransaction({
      type: 'expense',
      amount: 250,
      currency: 'INR',
      category: 'Food',
      walletId: bankWallet.id,
      title: 'South Indian Thali',
    })
    assert.ok(tx.id)
    assert.equal(useFinanceStore.getState().getWalletBalance(bankWallet.id), 4750)
  })

  await t.test('3. Add income ₹1,000 to that wallet → balance becomes ₹5,750', () => {
    const bankWallet = useFinanceStore.getState().wallets[0]
    useFinanceStore.getState().addTransaction({
      type: 'income',
      amount: 1000,
      currency: 'INR',
      category: 'Freelance',
      walletId: bankWallet.id,
      title: 'Design Consultation',
    })
    assert.equal(useFinanceStore.getState().getWalletBalance(bankWallet.id), 5750)
  })

  await t.test('4. Edit the ₹250 expense to ₹300 → balance becomes ₹5,700', () => {
    const bankWallet = useFinanceStore.getState().wallets[0]
    const foodExpense = useFinanceStore
      .getState()
      .transactions.find((tx) => tx.type === 'expense' && tx.amount === 250)
    assert.ok(foodExpense)
    useFinanceStore.getState().updateTransaction(foodExpense.id, { amount: 300 })
    assert.equal(useFinanceStore.getState().getWalletBalance(bankWallet.id), 5700)
  })

  await t.test('5. Delete the ₹300 expense → balance becomes ₹6,000', () => {
    const bankWallet = useFinanceStore.getState().wallets[0]
    const foodExpense = useFinanceStore
      .getState()
      .transactions.find((tx) => tx.type === 'expense' && tx.amount === 300)
    assert.ok(foodExpense)
    useFinanceStore.getState().deleteTransaction(foodExpense.id)
    assert.equal(useFinanceStore.getState().getWalletBalance(bankWallet.id), 6000)
  })

  await t.test(
    '6. Transfer ₹1,500 from Bank account to Cash in hand → Bank decreases by ₹1,500, Cash increases by ₹1,500, net worth unchanged, not counted as expense',
    () => {
      const bankWallet = useFinanceStore.getState().wallets[0]
      const cashWallet = useFinanceStore.getState().addWallet({
        name: 'Cash in Hand',
        type: 'cash',
        currency: 'INR',
        openingBalance: 1000,
      })

      const netWorthBefore =
        useFinanceStore.getState().getWalletBalance(bankWallet.id) +
        useFinanceStore.getState().getWalletBalance(cashWallet.id)
      assert.equal(netWorthBefore, 7000)

      useFinanceStore.getState().addTransaction({
        type: 'transfer',
        amount: 1500,
        currency: 'INR',
        category: 'Transfer',
        walletId: bankWallet.id,
        toWalletId: cashWallet.id,
        title: 'ATM Withdrawal',
      })

      const bankAfter = useFinanceStore.getState().getWalletBalance(bankWallet.id)
      const cashAfter = useFinanceStore.getState().getWalletBalance(cashWallet.id)
      assert.equal(bankAfter, 4500)
      assert.equal(cashAfter, 2500)
      assert.equal(bankAfter + cashAfter, netWorthBefore)

      // Verify internal transfer does NOT inflate expenses or income
      const summaries = useFinanceStore.getState().getSummaryByCurrency('daily')
      const inrSummary = summaries.INR
      assert.ok(inrSummary)
      assert.equal(inrSummary.totalExpenses, 0)
      assert.equal(inrSummary.totalIncome, 1000)
      assert.equal(inrSummary.netCashFlow, 1000)
      assert.equal(inrSummary.closingBalance, 7000)
    }
  )

  await t.test(
    '7. Create a USD wallet with $200 and add a $25 expense → USD wallet becomes $175 while INR wallets remain unaffected',
    () => {
      const usdWallet = useFinanceStore.getState().addWallet({
        name: 'USD Travel Card',
        type: 'card',
        currency: 'USD',
        openingBalance: 200,
      })
      useFinanceStore.getState().addTransaction({
        type: 'expense',
        amount: 25,
        currency: 'USD',
        category: 'Software',
        walletId: usdWallet.id,
        title: 'Cloud Hosting',
      })

      assert.equal(useFinanceStore.getState().getWalletBalance(usdWallet.id), 175)

      // Check INR wallets are completely untouched
      const summaries = useFinanceStore.getState().getSummaryByCurrency('daily')
      const inrSummary = summaries.INR
      const usdSummary = summaries.USD
      assert.ok(inrSummary)
      assert.ok(usdSummary)
      assert.equal(inrSummary.closingBalance, 7000)
      assert.equal(usdSummary.closingBalance, 175)
      assert.equal(usdSummary.totalExpenses, 25)
    }
  )

  await t.test(
    '8. Cross-currency transfer ($25 USD -> INR Bank at 84.0 rate) updates both wallets accurately',
    () => {
      const bankWallet = useFinanceStore
        .getState()
        .wallets.find((w) => w.currency === 'INR' && w.type === 'bank')!
      const usdWallet = useFinanceStore
        .getState()
        .wallets.find((w) => w.currency === 'USD')!

      useFinanceStore.getState().addTransaction({
        type: 'transfer',
        amount: 25,
        currency: 'USD',
        category: 'Transfer',
        walletId: usdWallet.id,
        toWalletId: bankWallet.id,
        toCurrency: 'INR',
        exchangeRate: 84,
        title: 'USD to INR Remittance',
      })

      assert.equal(useFinanceStore.getState().getWalletBalance(usdWallet.id), 150)
      assert.equal(useFinanceStore.getState().getWalletBalance(bankWallet.id), 4500 + 2100)
    }
  )

  await t.test('9. Currency decimal rounding rules (JPY 0 decimals, INR/USD 2 decimals)', () => {
    assert.equal(roundCurrencyAmount(1234.56, 'JPY'), 1235)
    assert.equal(roundCurrencyAmount(99.999, 'INR'), 100)
    assert.equal(roundCurrencyAmount(19.994, 'USD'), 19.99)
  })

  await t.test('10. Persisted state in storage contains all wallets and transactions', () => {
    const raw = localStorageMock.getItem('nexora-finance-storage')
    assert.ok(raw, 'Finance store should persist to localStorage')
    const parsed = JSON.parse(raw)
    assert.equal(parsed.state.wallets.length, 3)
    assert.equal(parsed.state.transactions.length, 4)
  })
})

test('PHASE 4: Personalized Hydration Tracker Scenarios (1-7)', async (t) => {
  // Reset hydration store to clean defaults
  useHydrationStore.setState({
    dailyGoalMl: 2500,
    goalMode: 'custom',
    logs: [],
    lastLogTimestampMs: 0,
  })

  await t.test('1. Default goal is 2,500 ml when user has not set a custom goal', () => {
    const calc = useHydrationStore.getState().calculateCircadianTarget()
    assert.equal(calc.targetHydrationMl, 2500)
    assert.equal(calc.consumedTodayMl, 0)
    assert.equal(calc.remainingMl, 2500)
  })

  await t.test(
    '2. User changes daily goal to 3,200 ml → progress bar and remaining amount update immediately',
    () => {
      useHydrationStore.getState().setDailyGoalMl(3200)
      const calc = useHydrationStore.getState().calculateCircadianTarget()
      assert.equal(calc.targetHydrationMl, 3200)
      assert.equal(calc.remainingMl, 3200)
      assert.equal(calc.completionPercentage, 0)
    }
  )

  await t.test(
    '3. Log 250 ml water → consumed becomes 250 ml, remaining becomes 2,950 ml',
    () => {
      const entry = useHydrationStore.getState().logDrink(250, 'water', { bypassDebounce: true })
      assert.ok(entry)
      const calc = useHydrationStore.getState().calculateCircadianTarget()
      assert.equal(calc.consumedTodayMl, 250)
      assert.equal(calc.remainingMl, 2950)
    }
  )

  await t.test(
    '4. Log 500 ml water → consumed becomes 750 ml, remaining becomes 2,450 ml',
    () => {
      const entry = useHydrationStore.getState().logDrink(500, 'water', { bypassDebounce: true })
      assert.ok(entry)
      const calc = useHydrationStore.getState().calculateCircadianTarget()
      assert.equal(calc.consumedTodayMl, 750)
      assert.equal(calc.remainingMl, 2450)
    }
  )

  await t.test(
    '5. Delete the 250 ml entry → consumed becomes 500 ml, remaining becomes 2,700 ml',
    () => {
      const entry250 = useHydrationStore
        .getState()
        .logs.find((l) => l.amountMl === 250)
      assert.ok(entry250)
      useHydrationStore.getState().removeLog(entry250.id)
      const calc = useHydrationStore.getState().calculateCircadianTarget()
      assert.equal(calc.consumedTodayMl, 500)
      assert.equal(calc.remainingMl, 2700)
    }
  )

  await t.test(
    '6. Enable reminders every 60 minutes from 09:00 to 21:00 → reminders scheduled for upcoming slots',
    () => {
      useHydrationStore.getState().updateReminderConfig({
        enabled: true,
        startTime: '09:00',
        endTime: '21:00',
        intervalMinutes: 60,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        quietHoursEnabled: true,
        quietHoursStart: '22:30',
        quietHoursEnd: '06:30',
        stopWhenGoalReached: true,
      })

      // Test slot generation from 08:30 AM reference date
      const morningRef = new Date()
      morningRef.setHours(8, 30, 0, 0)
      const slots = useHydrationStore.getState().getUpcomingReminderSlots(morningRef)
      assert.ok(slots.length >= 12, `Expected at least 12 hourly slots, got ${slots.length}`)

      // Check shouldFireReminderAt at 11:00 AM (should fire) vs 23:00 PM (quiet hours / outside window)
      const elevenAm = new Date()
      elevenAm.setHours(11, 0, 0, 0)
      assert.equal(useHydrationStore.getState().shouldFireReminderAt(elevenAm), true)

      const elevenPm = new Date()
      elevenPm.setHours(23, 0, 0, 0)
      assert.equal(useHydrationStore.getState().shouldFireReminderAt(elevenPm), false)
    }
  )

  await t.test(
    '7. Disable hydration reminders → future hydration reminders are cancelled',
    () => {
      useHydrationStore.getState().updateReminderConfig({ enabled: false })
      const state = useHydrationStore.getState()
      const progress = state.getDailyProgress()
      syncHydrationNotifications({
        enabled: false,
        upcomingSlotMs: [],
        consumedMl: progress.consumedMl,
        goalMl: progress.goalMl,
      })
      const hydrationAlarms = getScheduledAlarms().filter(
        (a) => a.sourceType === 'hydration' && a.enabled
      )
      assert.equal(hydrationAlarms.length, 0)
    }
  )
})

test('PHASE 2 & 5: Task & Habit Native Notification Scheduling, Rescheduling & Cancellation', async (t) => {
  useTaskStore.setState({ tasks: [], subtasks: [] })
  useHabitStore.setState({ habits: [], completions: [] })

  await t.test('1. Creating a scheduled task schedules an alarm in nexora_tasks', () => {
    const createdTask = useTaskStore.getState().addTask({
      title: 'Study Electrical Machines',
      priority: 'high',
      dueDate: '2099-12-31',
      reminderTime: '18:30',
      enableReminder: true,
    })

    const alarms = getScheduledAlarms().filter(
      (a) => a.sourceType === 'task' && a.sourceId === createdTask.id && a.enabled
    )
    assert.equal(alarms.length, 1)
    assert.equal(alarms[0].channelId, 'nexora_tasks')
    assert.equal(alarms[0].title, 'Nexora — Task Reminder')
    assert.match(alarms[0].body, /Study Electrical Machines/)
  })

  await t.test('2. Editing task reminderTime updates the alarm without creating duplicates', () => {
    const task = useTaskStore.getState().tasks[0]
    useTaskStore.getState().updateTask(task.id, { reminderTime: '19:45' })

    const alarms = getScheduledAlarms().filter(
      (a) => a.sourceType === 'task' && a.sourceId === task.id && a.enabled
    )
    assert.equal(alarms.length, 1)
    const triggerDate = new Date(alarms[0].triggerAtMs)
    assert.equal(triggerDate.getHours(), 19)
    assert.equal(triggerDate.getMinutes(), 45)
  })

  await t.test('3. Marking task complete immediately cancels its scheduled reminder', () => {
    const task = useTaskStore.getState().tasks[0]
    useTaskStore.getState().toggleStatus(task.id)

    const alarms = getScheduledAlarms().filter(
      (a) => a.sourceType === 'task' && a.sourceId === task.id && a.enabled
    )
    assert.equal(alarms.length, 0)
  })

  await t.test('4. Creating and deleting a scheduled habit schedules and cancels nexora_habits alarm', () => {
    const habit = useHabitStore.getState().addHabit({
      name: 'Evening Workout',
      frequency: 'daily',
      hasTimeRange: true,
      startTime: '18:00',
      endTime: '19:00',
      reminderTime: '18:00',
      enableReminder: true,
    })

    const alarmsAfterCreate = getScheduledAlarms().filter(
      (a) => a.sourceType === 'habit' && a.sourceId === habit.id && a.enabled
    )
    assert.equal(alarmsAfterCreate.length, 1)
    assert.equal(alarmsAfterCreate[0].channelId, 'nexora_habits')
    assert.equal(alarmsAfterCreate[0].title, 'Nexora — Habit Time')

    useHabitStore.getState().removeHabit(habit.id)
    const alarmsAfterDelete = getScheduledAlarms().filter(
      (a) => a.sourceType === 'habit' && a.sourceId === habit.id && a.enabled
    )
    assert.equal(alarmsAfterDelete.length, 0)
  })

  await t.test('5. Enabling daily expense reminder schedules nexora_expenses alarm, and muting channel cancels it', () => {
    useFinanceStore.getState().setExpenseReminder({ enabled: true, time: '21:00' })
    const expenseAlarms = getScheduledAlarms().filter(
      (a) => a.sourceType === 'expense' && a.channelId === 'nexora_expenses' && a.enabled
    )
    assert.equal(expenseAlarms.length, 1)

    // Mute the expenses channel
    setChannelEnabled('nexora_expenses', false)
    assert.equal(getChannelPreferences().nexora_expenses, false)
    const alarmsAfterMute = getScheduledAlarms().filter(
      (a) => a.channelId === 'nexora_expenses' && a.enabled
    )
    assert.equal(alarmsAfterMute.length, 0)

    // Restore channel preference
    setChannelEnabled('nexora_expenses', true)
    assert.equal(getChannelPreferences().nexora_expenses, true)
  })
})

test('PHASE 5: Notes Vault, Focus Timer, Goals, Projects, Timetable & Security', async (t) => {
  await t.test('1. Tactical Note creation, checklist toggling, snooze, and conversion to Task with Subtasks', () => {
    useNoteStore.setState({ notes: [] })
    useTaskStore.setState({ tasks: [], subtasks: [] })

    const note = useNoteStore.getState().addNote({
      title: 'Prepare Engineering Presentation',
      content: 'Slides and benchmark charts',
      priority: 'urgent',
      remindAt: '2026-12-15T14:30',
      checklist: [
        { id: 'item_1', text: 'Draft architecture slide', done: false },
        { id: 'item_2', text: 'Export latency metrics', done: false },
      ],
    })

    assert.equal(useNoteStore.getState().notes.length, 1)
    useNoteStore.getState().toggleChecklistItem(note.id, 'item_1')
    assert.equal(useNoteStore.getState().notes[0].checklist[0].done, true)

    useNoteStore.getState().convertToTask(note.id)
    const createdTasks = useTaskStore.getState().tasks
    const createdSubtasks = useTaskStore.getState().subtasks
    assert.equal(createdTasks.length, 1)
    assert.equal(createdTasks[0].title, 'Prepare Engineering Presentation')
    assert.equal(createdTasks[0].priority, 'high')
    assert.equal(createdTasks[0].dueDate, '2026-12-15')
    assert.equal(createdTasks[0].startTime, '14:30')
    assert.equal(createdSubtasks.length, 2)
  })

  await t.test('2. Focus Chamber timer countdown, stopwatch mode, and session completion logging', () => {
    useFocusStore.setState({ sessions: [] })
    useFocusStore.getState().setMode('pomodoro')
    assert.equal(useFocusStore.getState().remainingSeconds, 25 * 60)

    useFocusStore.getState().startTimer()
    assert.equal(useFocusStore.getState().isRunning, true)
    useFocusStore.getState().tick()
    assert.ok(useFocusStore.getState().remainingSeconds < 25 * 60)

    useFocusStore.getState().pauseTimer()
    assert.equal(useFocusStore.getState().isRunning, false)

    useFocusStore.getState().logCompletedSession()
    assert.equal(useFocusStore.getState().sessions.length, 1)
    assert.equal(useFocusStore.getState().sessions[0].mode, 'pomodoro')
  })

  await t.test('3. Goal, Project, and Weekly Timetable CRUD operations', () => {
    useGoalStore.setState({ goals: [] })
    useProjectStore.setState({ projects: [] })
    useTimelineStore.setState({ slots: [] })

    useGoalStore.getState().addGoal({ title: 'Master Power Systems', type: 'monthly' })
    assert.equal(useGoalStore.getState().goals.length, 1)
    const goalId = useGoalStore.getState().goals[0].id
    useGoalStore.getState().updateGoal(goalId, { progress: 75 })
    assert.equal(useGoalStore.getState().goals[0].progress, 75)

    useProjectStore.getState().addProject({ name: 'Nexora v2 Launch', description: 'Production release' })
    assert.equal(useProjectStore.getState().projects.length, 1)

    useTimelineStore.getState().addSlot({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:30',
      title: 'Deep Engineering Block',
      category: 'work',
      color: '#D4A853',
    })
    assert.equal(useTimelineStore.getState().slots.length, 1)
    assert.equal(useTimelineStore.getState().slots[0].title, 'Deep Engineering Block')
  })

  await t.test('4. Security PII redaction and deterministic deduplication hash', async () => {
    const raw = 'Contact user@example.com or call 987-654-3210 regarding card 4532 1111 2222 3333'
    const sanitized = stripPII(raw)
    assert.ok(!sanitized.includes('user@example.com'))
    assert.ok(sanitized.includes('[REDACTED_EMAIL]'))

    const hashA = await generateDedupHash('Metro Superstore', 450.5, '2026-10-24T12:00:00Z')
    const hashB = await generateDedupHash('Metro Superstore', 450.5, '2026-10-24T18:30:00Z')
    assert.equal(hashA, hashB)
  })
})

import { KyroContextBuilder } from '../src/features/kyro/KyroContextBuilder'
import {
  validateKyroToolCall,
  executeKyroAction,
} from '../src/features/kyro/KyroActionRegistry'
import {
  POST as kyroPost,
  GET as kyroGet,
  normalizeIncomingContext,
  buildNexoraSystemInstruction,
  resetUsageGuardsForTesting,
} from '../src/app/api/kyro/route'
import { useKyroStore } from '../src/store/kyroStore'

test('PHASE 6: Kyro AI Companion — Secure Integration, Context Honesty & Real Action Execution', async (t) => {
  await t.test('1. Real task/habit/hydration/finance/note context maps accurately into server request', () => {
    useTaskStore.setState({ tasks: [], subtasks: [] })
    useHabitStore.setState({ habits: [], completions: [] })
    useHydrationStore.setState({ dailyGoalMl: 3000, goalMode: 'custom', logs: [], lastLogTimestampMs: 0 })
    useFinanceStore.setState({ defaultCurrency: 'INR', wallets: [], transactions: [], expenses: [] })
    useNoteStore.setState({ notes: [] })

    useTaskStore.getState().addTask({
      title: 'Review Substation Protection Relay',
      priority: 'urgent',
      dueDate: '2099-12-31',
      reminderTime: '16:00',
      enableReminder: true,
    })
    useHabitStore.getState().addHabit({ name: 'Morning Mobility', frequency: 'daily' })
    useHydrationStore.getState().logDrink(600, 'water', { bypassDebounce: true })
    const wallet = useFinanceStore.getState().addWallet({
      name: 'Primary Checking',
      type: 'bank',
      currency: 'INR',
      openingBalance: 12000,
    })
    useFinanceStore.getState().addTransaction({
      type: 'expense',
      amount: 450,
      currency: 'INR',
      category: 'Food',
      walletId: wallet.id,
      title: 'Team Lunch',
    })
    useNoteStore.getState().addNote({
      title: 'Lab Calibration Checklist',
      priority: 'high',
      remindAt: '2099-12-31T09:30',
      isPinned: true,
    })

    const rawInputs = KyroContextBuilder.collectLiveStoreInputs({ userName: 'Arjun', agentName: 'Kyro' })
    const built = KyroContextBuilder.buildContext(rawInputs)

    assert.equal(built.systemMetadata.userName, 'Arjun')
    assert.equal(built.tasks.available, true)
    assert.equal(built.tasks.totalActive, 1)
    assert.equal(built.tasks.urgentCount, 1)
    assert.equal(built.tasks.topPriorityTasks[0].title, 'Review Substation Protection Relay')

    assert.equal(built.habits.available, true)
    assert.equal(built.habits.totalHabits, 1)
    assert.equal(built.habits.pendingHabitsToday[0], 'Morning Mobility')

    assert.equal(built.hydration.available, true)
    assert.equal(built.hydration.consumedMl, 600)
    assert.equal(built.hydration.dailyGoalMl, 3000)
    assert.equal(built.hydration.remainingMl, 2400)
    assert.equal(built.hydration.completionPercentage, 20)

    assert.equal(built.finance.available, true)
    assert.equal(built.finance.hasActivityOrBalances, true)
    assert.equal(built.finance.totalBalanceFormatted, '₹11,550.00')
    assert.equal(built.finance.spentTodayFormatted, '₹450.00')

    assert.equal(built.notesAndReminders.available, true)
    assert.equal(built.notesAndReminders.totalNotes, 1)
    assert.equal(built.notesAndReminders.pinnedNotesCount, 1)
    assert.equal(built.notesAndReminders.pendingRemindersCount, 2) // 1 note reminder + 1 task reminder

    const systemPrompt = buildNexoraSystemInstruction(built)
    assert.ok(!systemPrompt.includes('AURA LIFE OS'), 'Must not contain stale AURA LIFE OS branding')
    assert.ok(systemPrompt.includes('Nexora'), 'Must identify as Nexora companion')
  })

  await t.test('2. Missing or unconfigured data is represented honestly and never fabricated', () => {
    // Empty finance store with 0 balance and 0 transactions
    useFinanceStore.setState({
      defaultCurrency: 'INR',
      wallets: [
        {
          id: 'w_zero',
          name: 'Empty Wallet',
          type: 'cash',
          currency: 'INR',
          openingBalance: 0,
          color: '#10B981',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      transactions: [],
      expenses: [],
    })

    const rawInputs = KyroContextBuilder.collectLiveStoreInputs({
      hydration: null,
      tasks: null,
    })
    const built = KyroContextBuilder.buildContext(rawInputs)

    assert.equal(built.tasks.available, false)
    assert.equal(built.hydration.available, false)
    assert.equal(built.hydration.consumedMl, null)
    assert.equal(built.finance.available, true)
    assert.equal(built.finance.hasActivityOrBalances, false)
    assert.equal(built.finance.totalBalanceFormatted, null)

    // Also verify server-side normalizeIncomingContext with empty object
    const normalizedEmpty = normalizeIncomingContext({})
    assert.equal(normalizedEmpty.tasks.available, false)
    assert.equal(normalizedEmpty.hydration.available, false)
    assert.equal(normalizedEmpty.finance.available, false)
    assert.equal(normalizedEmpty.finance.totalBalanceFormatted, null)
  })

  await t.test('3. Valid and invalid function arguments are strictly validated', () => {
    // Valid create_task
    const validTask = validateKyroToolCall('create_task', {
      title: 'Finish control systems lab report',
      priority: 'high',
      dueDate: '2026-11-15',
      reminderTime: '17:30',
    })
    assert.equal(validTask.valid, true)
    assert.equal(validTask.proposedAction?.type, 'create_task')
    assert.equal(validTask.proposedAction?.requiresConfirmation, true)
    assert.equal(validTask.proposedAction?.isExecuted, false)

    // Invalid create_task (empty title)
    const emptyTitle = validateKyroToolCall('create_task', { title: '   ' })
    assert.equal(emptyTitle.valid, false)

    // Invalid create_task (malformed date)
    const badDate = validateKyroToolCall('create_task', {
      title: 'Valid title',
      dueDate: 'tomorrow-maybe',
    })
    assert.equal(badDate.valid, false)

    // Valid & invalid log_hydration
    const validHydration = validateKyroToolCall('log_hydration', {
      amountMl: 350,
      beverageType: 'water',
    })
    assert.equal(validHydration.valid, true)

    const outOfRangeHydration = validateKyroToolCall('log_hydration', {
      amountMl: 9500,
    })
    assert.equal(outOfRangeHydration.valid, false)

    // Unknown tool
    const unknownTool = validateKyroToolCall('execute_raw_sql', { query: 'DROP TABLE tasks' })
    assert.equal(unknownTool.valid, false)
  })

  await t.test('4. Invalid or unallowlisted routes are rejected', () => {
    const validNav = validateKyroToolCall('navigate_to', { route: '/tasks' })
    assert.equal(validNav.valid, true)
    assert.equal(validNav.proposedAction?.payload.route, '/tasks')

    const externalUrl = validateKyroToolCall('navigate_to', { route: 'https://evil.example.com' })
    assert.equal(externalUrl.valid, false)

    const unknownRoute = validateKyroToolCall('navigate_to', { route: '/root-shell' })
    assert.equal(unknownRoute.valid, false)

    const execInvalidRoute = executeKyroAction({
      id: 'act_bad_nav',
      type: 'navigate_to',
      label: 'Bad nav',
      payload: { route: 'javascript:alert(1)' },
    })
    assert.equal(execInvalidRoute.ok, false)
  })

  await t.test('5. Confirmation-gated actions do not execute until approved, and update real stores upon confirmation', () => {
    useTaskStore.setState({ tasks: [], subtasks: [] })
    useHydrationStore.setState({ dailyGoalMl: 2500, goalMode: 'custom', logs: [], lastLogTimestampMs: 0 })

    const validated = validateKyroToolCall('create_task', {
      title: 'Prepare inverter PCB layout',
      priority: 'urgent',
      dueDate: '2026-12-01',
    })
    assert.equal(validated.valid, true)
    const action = validated.proposedAction!

    // Before confirmation: task store is still untouched
    assert.equal(useTaskStore.getState().tasks.length, 0)
    assert.equal(action.isExecuted, false)

    // Seed message with proposedAction into useKyroStore
    useKyroStore.setState({
      messages: [
        {
          id: 'msg_test_1',
          sender: 'kyro',
          text: 'I have prepared this task for your confirmation.',
          timestamp: new Date().toISOString(),
          proposedAction: action,
        },
      ],
    })

    // Still 0 tasks before user confirms
    assert.equal(useTaskStore.getState().tasks.length, 0)

    // Now user confirms via executeProposedAction
    const outcome = useKyroStore.getState().executeProposedAction(action.id)
    assert.equal(outcome.ok, true)
    assert.equal(useTaskStore.getState().tasks.length, 1)
    assert.equal(useTaskStore.getState().tasks[0].title, 'Prepare inverter PCB layout')
    assert.equal(useTaskStore.getState().tasks[0].priority, 'urgent')

    // Message state reflects confirmed execution
    const updatedMsg = useKyroStore.getState().messages.find((m) => m.id === 'msg_test_1')
    assert.equal(updatedMsg?.proposedAction?.isExecuted, true)
    assert.equal(updatedMsg?.proposedAction?.executionStatus, 'executed')
  })

  await t.test('6. API key is never read from localStorage or accepted from client request payloads', async () => {
    const prevEnvKey = process.env.GEMINI_API_KEY
    const prevGoogleKey = process.env.GOOGLE_API_KEY
    delete process.env.GEMINI_API_KEY
    delete process.env.GOOGLE_API_KEY

    try {
      // Put a fake key in localStorage and pass userApiKey in request body
      localStorageMock.setItem('nexora_gemini_api_key', 'AIzaSyClientInjectedKey1234567890')

      const req = new Request('http://localhost/api/kyro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What are my tasks?',
          userApiKey: 'AIzaSyClientInjectedKey1234567890',
          context: {},
        }),
      })

      const res = await kyroPost(req)
      const data = await res.json()

      // Must reject/ignore client key and return 503 unavailable because server env key is unset
      assert.equal(res.status, 503)
      assert.equal(data.ok, false)
      assert.equal(data.configured, false)
      assert.equal(data.provider, 'unavailable')
      assert.match(data.errorReason, /GEMINI_API_KEY is not configured on the server/)

      const statusRes = await kyroGet()
      const statusData = await statusRes.json()
      assert.equal(statusData.configured, false)
    } finally {
      if (prevEnvKey !== undefined) process.env.GEMINI_API_KEY = prevEnvKey
      if (prevGoogleKey !== undefined) process.env.GOOGLE_API_KEY = prevGoogleKey
    }
  })

  await t.test('7. Both chat and floating-companion entry points handle Gemini functionCall proposals and errors honestly', async () => {
    const prevEnvKey = process.env.GEMINI_API_KEY
    const prevFetch = globalThis.fetch
    process.env.GEMINI_API_KEY = 'AIzaSyTestServerOnlyEnvironmentKey999999'

    try {
      // Mock global fetch to route /api/kyro to kyroPost and Gemini API to a realistic functionCall response
      globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
        if (url === '/api/kyro') {
          return kyroPost(
            new Request('http://localhost/api/kyro', {
              method: init?.method || 'POST',
              headers: init?.headers,
              body: init?.body,
            })
          )
        }
        if (url.includes('generativelanguage.googleapis.com')) {
          return new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: 'I have prepared a 250 ml water log for your confirmation.',
                      },
                      {
                        functionCall: {
                          name: 'log_hydration',
                          args: { amountMl: 250, beverageType: 'water' },
                        },
                      },
                    ],
                  },
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        }
        throw new Error(`Unexpected fetch URL: ${url}`)
      }

      useHydrationStore.setState({ dailyGoalMl: 2500, goalMode: 'custom', logs: [], lastLogTimestampMs: 0 })
      useKyroStore.setState({ messages: [], hasError: false })

      await useKyroStore.getState().sendMessage('Log 250ml of water please')

      const msgs = useKyroStore.getState().messages
      assert.equal(msgs.length, 2)
      const kyroReply = msgs[1]
      assert.equal(kyroReply.sender, 'kyro')
      assert.ok(kyroReply.proposedAction, 'Expected proposedAction on Kyro reply')
      assert.equal(kyroReply.proposedAction?.type, 'log_hydration')
      assert.equal(kyroReply.proposedAction?.isExecuted, false)

      // Hydration store must still be 0 before confirmation
      assert.equal(useHydrationStore.getState().calculateCircadianTarget().consumedTodayMl, 0)

      // Floating 3D companion speech bubble was also updated
      assert.match(useKyroStore.getState().activeSpeech || '', /250 ml/)

      // Confirm action and verify hydration store updates to 250 ml
      const execOutcome = useKyroStore.getState().executeProposedAction(kyroReply.proposedAction!.id)
      assert.equal(execOutcome.ok, true)
      assert.equal(useHydrationStore.getState().calculateCircadianTarget().consumedTodayMl, 250)

      // Verify tool-execution failure when targeting a non-existent task reminder
      const failedReminderOutcome = executeKyroAction({
        id: 'act_missing_task',
        type: 'update_reminder',
        label: 'Update reminder',
        payload: {
          targetType: 'task',
          targetIdOrTitle: 'NonExistentTaskXYZ',
          reminderTime: '14:00',
        },
      })
      assert.equal(failedReminderOutcome.ok, false)
      assert.match(failedReminderOutcome.message, /Could not find an existing task/)
    } finally {
      globalThis.fetch = prevFetch
      if (prevEnvKey !== undefined) {
        process.env.GEMINI_API_KEY = prevEnvKey
      } else {
        delete process.env.GEMINI_API_KEY
      }
    }
  })

  await t.test('8. Gemini API MVP Release: model recovery, input limits, usage guards & safe errors', async () => {
    const prevEnvKey = process.env.GEMINI_API_KEY
    const prevModel = process.env.GEMINI_MODEL
    const prevFetch = globalThis.fetch
    process.env.GEMINI_API_KEY = 'AIzaSyTestServerOnlyEnvironmentKey999999'
    delete process.env.GEMINI_MODEL
    resetUsageGuardsForTesting()

    try {
      // 1. Verify default model is gemini-3.8-flash via GET endpoint
      const getRes = await kyroGet()
      const getData = await getRes.json()
      assert.equal(getData.ok, true)
      assert.equal(getData.model, 'gemini-3.8-flash')
      assert.equal(getData.provider, 'gemini-3.8-flash')

      // 2. Test Auto-Recovery from Google's exact recommended model message
      // When primary model is set to gemini-2.0-flash and Google returns:
      // "This model models/gemini-2.0-flash is no longer available. Please update your code to use models/gemini-3.8-flash..."
      process.env.GEMINI_MODEL = 'gemini-2.0-flash'
      const requestedUrls: string[] = []
      globalThis.fetch = async (input: string | URL | Request) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
        requestedUrls.push(url)

        if (url.includes('models/gemini-2.0-flash')) {
          return new Response(
            JSON.stringify({
              error: {
                code: 404,
                message:
                  'This model models/gemini-2.0-flash is no longer available. Please update your code to use models/gemini-3.8-flash for the latest features and improvements.',
                status: 'NOT_FOUND',
              },
            }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          )
        }

        if (url.includes('models/gemini-3.8-flash')) {
          return new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [{ text: 'Greetings from gemini-3.8-flash! All systems nominal.' }],
                  },
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        }

        throw new Error(`Unexpected fetch URL: ${url}`)
      }

      const postReq = new Request('http://localhost/api/kyro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello Kyro' }),
      })
      const postRes = await kyroPost(postReq)
      const postData = await postRes.json()

      assert.equal(postRes.status, 200)
      assert.equal(postData.ok, true)
      assert.equal(postData.provider, 'gemini-3.8-flash')
      assert.equal(postData.reply, 'Greetings from gemini-3.8-flash! All systems nominal.')
      assert.ok(requestedUrls.some((u) => u.includes('models/gemini-2.0-flash')))
      assert.ok(requestedUrls.some((u) => u.includes('models/gemini-3.8-flash')))

      // 3. Test Oversized Input Guard (> 1000 chars)
      const oversizedReq = new Request('http://localhost/api/kyro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'A'.repeat(1005) }),
      })
      const oversizedRes = await kyroPost(oversizedReq)
      const oversizedData = await oversizedRes.json()
      assert.equal(oversizedRes.status, 400)
      assert.equal(oversizedData.ok, false)
      assert.match(oversizedData.errorReason, /maximum limit of 1000 characters/)

      // 4. Test Provider Quota / Rate-Limit (HTTP 429) returns friendly message and does not loop
      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            error: {
              code: 429,
              message: 'Resource has been exhausted (e.g. check quota).',
              status: 'RESOURCE_EXHAUSTED',
            },
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )

      const quotaReq = new Request('http://localhost/api/kyro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'What is next?' }),
      })
      const quotaRes = await kyroPost(quotaReq)
      const quotaData = await quotaRes.json()
      assert.equal(quotaRes.status, 400) // returned as client-facing error
      assert.equal(quotaData.ok, false)
      assert.match(quotaData.reply, /Google Gemini API rate limits \(HTTP 429\)/)
      assert.match(quotaData.speechBubble, /quota limit reached/i)

      // 5. Test Usage Guard RPM limit per client
      resetUsageGuardsForTesting()
      process.env.KYRO_RPM_LIMIT = '2'
      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Response OK' }] } }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )

      const makeReq = () =>
        kyroPost(
          new Request('http://localhost/api/kyro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.1' },
            body: JSON.stringify({ message: 'msg' }),
          })
        )

      const r1 = await makeReq()
      assert.equal(r1.status, 200)
      const r2 = await makeReq()
      assert.equal(r2.status, 200)
      // 3rd request from same client exceeds RPM limit 2
      const r3 = await makeReq()
      const d3 = await r3.json()
      assert.equal(r3.status, 429)
      assert.equal(d3.ok, false)
      assert.match(d3.errorReason, /Too many requests sent in a short period/)
    } finally {
      globalThis.fetch = prevFetch
      resetUsageGuardsForTesting()
      delete process.env.KYRO_RPM_LIMIT
      if (prevEnvKey !== undefined) {
        process.env.GEMINI_API_KEY = prevEnvKey
      } else {
        delete process.env.GEMINI_API_KEY
      }
      if (prevModel !== undefined) {
        process.env.GEMINI_MODEL = prevModel
      } else {
        delete process.env.GEMINI_MODEL
      }
    }
  })
})


