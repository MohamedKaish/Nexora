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

