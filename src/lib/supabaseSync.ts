import { getSupabaseClient, getSupabaseSession } from './supabase'
import {
  useFinanceStore,
  DiscretionaryExpense,
  CommittedBill,
  WalletAccount,
  FinanceTransaction,
  CurrencyCode,
} from '@/store/useFinanceStore'
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

  // 1. Subscribe to Finance Store wallets and transactions
  let lastTxCount = useFinanceStore.getState().transactions.length
  let lastWalletCount = useFinanceStore.getState().wallets.length
  useFinanceStore.subscribe((state) => {
    if (state.transactions.length > lastTxCount) {
      const newestTx = state.transactions[0]
      if (newestTx) {
        pushTransactionToSupabase(newestTx).catch(() => {})
      }
    }
    if (state.wallets.length > lastWalletCount) {
      const newestWallet = state.wallets[state.wallets.length - 1]
      if (newestWallet) {
        pushWalletToSupabase(newestWallet).catch(() => {})
      }
    }
    lastTxCount = state.transactions.length
    lastWalletCount = state.wallets.length
  })

  // 2. Subscribe to Hydration Store logs & goal changes
  let lastLogsCount = useHydrationStore.getState().logs.length
  let lastGoalMl = useHydrationStore.getState().dailyGoalMl
  useHydrationStore.subscribe((state) => {
    if (state.logs.length > lastLogsCount) {
      const newest = state.logs[0]
      if (newest) {
        pushHydrationLogToSupabase(newest).catch(() => {})
      }
    }
    if (state.dailyGoalMl !== lastGoalMl) {
      pushHydrationSettingsToSupabase().catch(() => {})
    }
    lastLogsCount = state.logs.length
    lastGoalMl = state.dailyGoalMl
  })

  // 3. Subscribe to Kyro Companion Preferences
  useKyroStore.subscribe((state, prevState) => {
    if (
      state.settings.model !== prevState.settings.model ||
      state.settings.costume !== prevState.settings.costume ||
      state.settings.colorTheme !== prevState.settings.colorTheme ||
      state.settings.voiceEnabled !== prevState.settings.voiceEnabled
    ) {
      pushKyroPreferencesToSupabase({
        archetype: state.settings.model,
        costume: state.settings.costume,
        shader: state.settings.colorTheme,
        voiceEnabled: state.settings.voiceEnabled,
        sfxEnabled: state.settings.voiceEnabled,
      }).catch(() => {})
    }
  })
}

/**
 * Pulls user profile, multi-currency wallets/transactions, hydration logs/settings, and Kyro preferences from Supabase
 */
export async function pullUserDataFromSupabase(userId: string): Promise<void> {
  if (isSyncing) return
  isSyncing = true

  const client = getSupabaseClient()

  try {
    // 1. Pull Wallets & Finance Transactions
    try {
      const { data: remoteWallets } = await client
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (remoteWallets && remoteWallets.length > 0) {
        const mappedWallets: WalletAccount[] = remoteWallets.map((w) => ({
          id: w.id,
          name: w.name,
          type: w.type,
          currency: (w.currency as CurrencyCode) || 'INR',
          openingBalance: Number(w.opening_balance),
          color: w.color || '#10B981',
          archived: Boolean(w.archived),
          createdAt: w.created_at,
          updatedAt: w.updated_at,
        }))
        useFinanceStore.setState({ wallets: mappedWallets })
      }

      const { data: remoteTxs } = await client
        .from('finance_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(250)

      if (remoteTxs && remoteTxs.length > 0) {
        const mappedTxs: FinanceTransaction[] = remoteTxs.map((t) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          currency: (t.currency as CurrencyCode) || 'INR',
          category: t.category,
          walletId: t.wallet_id,
          toWalletId: t.to_wallet_id || undefined,
          toCurrency: (t.to_currency as CurrencyCode) || undefined,
          convertedAmount: t.converted_amount ? Number(t.converted_amount) : undefined,
          exchangeRate: t.exchange_rate ? Number(t.exchange_rate) : undefined,
          title: t.title,
          notes: t.notes || undefined,
          paymentMethod: t.payment_method || undefined,
          date: t.date,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }))
        useFinanceStore.setState({ transactions: mappedTxs })
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
        useHydrationStore.setState((prev) => ({
          dailyGoalMl: Number(hydroSettings.daily_goal_ml || prev.dailyGoalMl),
          goalMode: hydroSettings.goal_mode || prev.goalMode,
          baselineWeightKg: Number(hydroSettings.baseline_weight_kg || prev.baselineWeightKg),
          activeCaloriesBurned: Number(
            hydroSettings.active_calories_burned || prev.activeCaloriesBurned
          ),
          ambientTemperatureC: Number(
            hydroSettings.ambient_temperature_c || prev.ambientTemperatureC
          ),
          caffeineCups: Number(hydroSettings.caffeine_cups ?? prev.caffeineCups),
          reminderConfig: hydroSettings.reminder_config
            ? { ...prev.reminderConfig, ...hydroSettings.reminder_config }
            : prev.reminderConfig,
        }))
      }

      const { data: logs } = await client
        .from('hydration_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (logs && logs.length > 0) {
        const mappedLogs: HydrationLog[] = logs.map((l) => ({
          id: l.id,
          amountMl: Number(l.amount_ml),
          beverageType: l.beverage_type,
          timestamp: l.timestamp,
          note: l.note || undefined,
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
        useKyroStore.getState().updateSettings({
          model: kyroPrefs.archetype,
          costume: kyroPrefs.costume,
          colorTheme: kyroPrefs.shader_theme,
          voiceEnabled: Boolean(kyroPrefs.voice_enabled),
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

export async function pushWalletToSupabase(wallet: WalletAccount): Promise<void> {
  const { user } = await getSupabaseSession()
  if (!user) return

  const client = getSupabaseClient()
  try {
    await client.from('wallets').upsert({
      id: wallet.id,
      user_id: user.id,
      name: wallet.name,
      type: wallet.type,
      currency: wallet.currency,
      opening_balance: wallet.openingBalance,
      color: wallet.color,
      archived: wallet.archived || false,
      created_at: wallet.createdAt,
      updated_at: wallet.updatedAt,
    })
  } catch (err) {
    console.warn('Failed to push wallet to Supabase:', err)
  }
}

export async function pushTransactionToSupabase(tx: FinanceTransaction): Promise<void> {
  const { user } = await getSupabaseSession()
  if (!user) return

  const client = getSupabaseClient()
  try {
    await client.from('finance_transactions').upsert({
      id: tx.id,
      user_id: user.id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      category: tx.category,
      wallet_id: tx.walletId,
      to_wallet_id: tx.toWalletId || null,
      to_currency: tx.toCurrency || null,
      converted_amount: tx.convertedAmount ?? null,
      exchange_rate: tx.exchangeRate ?? null,
      title: tx.title,
      notes: tx.notes || null,
      payment_method: tx.paymentMethod || null,
      date: tx.date,
      created_at: tx.createdAt,
      updated_at: tx.updatedAt,
    })
  } catch (err) {
    console.warn('Failed to push transaction to Supabase:', err)
  }
}

/**
 * Legacy helper for pushing discretionary expenses
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

export async function pushHydrationSettingsToSupabase(): Promise<void> {
  const { user } = await getSupabaseSession()
  if (!user) return

  const state = useHydrationStore.getState()
  const client = getSupabaseClient()
  try {
    await client.from('hydration_settings').upsert({
      user_id: user.id,
      daily_goal_ml: state.dailyGoalMl,
      goal_mode: state.goalMode,
      baseline_weight_kg: state.baselineWeightKg,
      active_calories_burned: state.activeCaloriesBurned,
      ambient_temperature_c: state.ambientTemperatureC,
      caffeine_cups: state.caffeineCups,
      reminder_config: state.reminderConfig,
      updated_at: new Date().toISOString(),
    })
  } catch (err) {
    console.warn('Failed to push hydration settings to Supabase:', err)
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
      note: log.note || null,
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
