import { getSupabaseClient, getSupabaseSession } from './supabase'
import { useFinanceStore, DiscretionaryExpense, CommittedBill } from '@/store/useFinanceStore'
import { useHydrationStore, HydrationLog } from '@/store/useHydrationStore'
import { useKyroStore } from '@/store/kyroStore'
import { useAppStore } from '@/store/appStore'

let isSyncing = false
let syncListenerInitialized = false

export interface SyncStatus {
  connected: boolean
  lastSyncedAt: Date | null
  userId: string | null
  userEmail: string | null
  syncError: string | null
}

const syncStatusState: SyncStatus = {
  connected: false,
  lastSyncedAt: null,
  userId: null,
  userEmail: null,
  syncError: null,
}

export function getSyncStatus(): SyncStatus {
  return { ...syncStatusState }
}

/**
 * Initializes bidirectional synchronization between Zustand stores and Supabase
 */
export async function initSupabaseSync(): Promise<void> {
  if (typeof window === 'undefined') return
  if (syncListenerInitialized) return
  syncListenerInitialized = true

  const client = getSupabaseClient()

  // Initial pull if session exists
  const { session, user } = await getSupabaseSession()
  if (session && user) {
    syncStatusState.connected = true
    syncStatusState.userId = user.id
    syncStatusState.userEmail = user.email || null
    await pullUserDataFromSupabase(user.id)
  }

  // Subscribe to live auth changes
  client.auth.onAuthStateChange(async (event, newSession) => {
    if (newSession && newSession.user) {
      syncStatusState.connected = true
      syncStatusState.userId = newSession.user.id
      syncStatusState.userEmail = newSession.user.email || null

      // Sync user profile to AppStore
      const email = newSession.user.email || ''
      const name =
        (newSession.user.user_metadata?.full_name as string) ||
        (newSession.user.user_metadata?.name as string) ||
        email.split('@')[0] ||
        'Commander'

      useAppStore.getState().login(email, name)
      await pullUserDataFromSupabase(newSession.user.id)
    } else if (event === 'SIGNED_OUT') {
      syncStatusState.connected = false
      syncStatusState.userId = null
      syncStatusState.userEmail = null
    }
  })

  // 1. Subscribe to Finance Store expenses
  let lastExpensesCount = useFinanceStore.getState().expenses.length
  useFinanceStore.subscribe((state) => {
    if (state.expenses.length > lastExpensesCount) {
      const newest = state.expenses[0]
      if (newest) {
        pushExpenseToSupabase(newest).catch(() => {})
      }
    }
    lastExpensesCount = state.expenses.length
  })

  // 2. Subscribe to Hydration Store logs
  let lastLogsCount = useHydrationStore.getState().logs.length
  useHydrationStore.subscribe((state) => {
    if (state.logs.length > lastLogsCount) {
      const newest = state.logs[0]
      if (newest) {
        pushHydrationLogToSupabase(newest).catch(() => {})
      }
    }
    lastLogsCount = state.logs.length
  })

  // 3. Subscribe to Kyro Companion Preferences
  useKyroStore.subscribe((state, prevState) => {
    if (
      state.selectedArchetype !== prevState.selectedArchetype ||
      state.selectedCostume !== prevState.selectedCostume ||
      state.selectedShader !== prevState.selectedShader ||
      state.voiceEnabled !== prevState.voiceEnabled ||
      state.sfxEnabled !== prevState.sfxEnabled
    ) {
      pushKyroPreferencesToSupabase({
        archetype: state.selectedArchetype,
        costume: state.selectedCostume,
        shader: state.selectedShader,
        voiceEnabled: state.voiceEnabled,
        sfxEnabled: state.sfxEnabled,
      }).catch(() => {})
    }
  })
}

/**
 * Pulls user profile, finance ledger, hydration logs, and Kyro preferences from Supabase
 */
export async function pullUserDataFromSupabase(userId: string): Promise<void> {
  if (isSyncing) return
  isSyncing = true

  const client = getSupabaseClient()

  try {
    // 1. Pull Finance Settings & Committed Bills
    try {
      const { data: financeSettings } = await client
        .from('finance_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (financeSettings) {
        useFinanceStore.setState({
          liquidChecking: Number(financeSettings.liquid_checking),
          accountFloor: Number(financeSettings.account_floor),
          savingsBuffer: Number(financeSettings.savings_buffer),
          payPeriodDaysRemaining: Number(financeSettings.pay_period_days_remaining),
          surplusPosture: financeSettings.surplus_posture,
        })
      }

      const { data: bills } = await client
        .from('committed_bills')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true })

      if (bills && bills.length > 0) {
        const mappedBills: CommittedBill[] = bills.map((b) => ({
          id: b.id,
          title: b.title,
          amount: Number(b.amount),
          dueDate: b.due_date,
          isPaid: Boolean(b.is_paid),
          category: b.category,
        }))
        useFinanceStore.setState({ committedBills: mappedBills })
      }

      const { data: expenses } = await client
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(100)

      if (expenses && expenses.length > 0) {
        const mappedExpenses: DiscretionaryExpense[] = expenses.map((e) => ({
          id: e.id,
          title: e.title,
          amount: Number(e.amount),
          category: e.category,
          date: e.date,
        }))
        useFinanceStore.setState({ expenses: mappedExpenses })
      }
    } catch (finErr) {
      console.warn('Supabase finance sync notice:', finErr)
    }

    // 2. Pull Hydration Logs & Settings
    try {
      const { data: hydroSettings } = await client
        .from('hydration_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (hydroSettings) {
        useHydrationStore.setState({
          baselineWeightKg: Number(hydroSettings.baseline_weight_kg),
          activeCaloriesBurned: Number(hydroSettings.active_calories_burned),
          ambientTemperatureC: Number(hydroSettings.ambient_temperature_c),
          caffeineCups: Number(hydroSettings.caffeine_cups),
        })
      }

      const { data: logs } = await client
        .from('hydration_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50)

      if (logs && logs.length > 0) {
        const mappedLogs: HydrationLog[] = logs.map((l) => ({
          id: l.id,
          amountMl: Number(l.amount_ml),
          beverageType: l.beverage_type,
          timestamp: l.timestamp,
        }))
        useHydrationStore.setState({ logs: mappedLogs })
      }
    } catch (hydroErr) {
      console.warn('Supabase hydration sync notice:', hydroErr)
    }

    // 3. Pull Kyro 3D Companion Preferences
    try {
      const { data: kyroPrefs } = await client
        .from('kyro_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (kyroPrefs) {
        useKyroStore.setState({
          selectedArchetype: kyroPrefs.archetype,
          selectedCostume: kyroPrefs.costume,
          selectedShader: kyroPrefs.shader_theme,
          voiceEnabled: Boolean(kyroPrefs.voice_enabled),
          sfxEnabled: Boolean(kyroPrefs.sfx_enabled),
        })
      }
    } catch (kyroErr) {
      console.warn('Supabase Kyro sync notice:', kyroErr)
    }

    syncStatusState.lastSyncedAt = new Date()
    syncStatusState.syncError = null
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync failed'
    syncStatusState.syncError = msg
  } finally {
    isSyncing = false
  }
}

/**
 * Pushes a newly logged expense to Supabase
 */
export async function pushExpenseToSupabase(expense: DiscretionaryExpense): Promise<void> {
  const { user } = await getSupabaseSession()
  if (!user) return

  const client = getSupabaseClient()
  try {
    await client.from('expenses').upsert({
      id: expense.id,
      user_id: user.id,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
    })
  } catch (err) {
    console.warn('Failed to push expense to Supabase:', err)
  }
}

/**
 * Pushes a hydration intake log to Supabase
 */
export async function pushHydrationLogToSupabase(log: HydrationLog): Promise<void> {
  const { user } = await getSupabaseSession()
  if (!user) return

  const client = getSupabaseClient()
  try {
    await client.from('hydration_logs').upsert({
      id: log.id,
      user_id: user.id,
      amount_ml: log.amountMl,
      beverage_type: log.beverageType,
      timestamp: log.timestamp,
    })
  } catch (err) {
    console.warn('Failed to push hydration log to Supabase:', err)
  }
}

/**
 * Pushes Kyro customization preferences to Supabase
 */
export async function pushKyroPreferencesToSupabase(prefs: {
  archetype: string
  costume: string
  shader: string
  voiceEnabled: boolean
  sfxEnabled: boolean
}): Promise<void> {
  const { user } = await getSupabaseSession()
  if (!user) return

  const client = getSupabaseClient()
  try {
    await client.from('kyro_preferences').upsert({
      user_id: user.id,
      archetype: prefs.archetype,
      costume: prefs.costume,
      shader_theme: prefs.shader,
      voice_enabled: prefs.voiceEnabled,
      sfx_enabled: prefs.sfxEnabled,
      updated_at: new Date().toISOString(),
    })
  } catch (err) {
    console.warn('Failed to push Kyro preferences to Supabase:', err)
  }
}
