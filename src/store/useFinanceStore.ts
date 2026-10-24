import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format, subDays, startOfMonth, isAfter, parseISO } from 'date-fns'
import { syncExpenseReminderNotification } from '@/lib/nativeNotificationScheduler'

export type CurrencyCode =
  | 'INR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'AED'
  | 'SAR'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'SGD'

export interface CurrencyMeta {
  code: CurrencyCode
  symbol: string
  name: string
  decimals: number
  locale: string
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2, locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, locale: 'en-GB' },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', decimals: 2, locale: 'en-AE' },
  SAR: { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal', decimals: 2, locale: 'en-SA' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, locale: 'ja-JP' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', decimals: 2, locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, locale: 'en-AU' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2, locale: 'en-SG' },
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Groceries',
  'Rent / Bills',
  'Utilities',
  'Education',
  'Shopping',
  'Health',
  'Subscriptions',
  'Entertainment',
  'Personal',
  'Savings / Investment',
  'Other',
] as const

export const INCOME_CATEGORIES = [
  'Salary',
  'Allowance / Pocket Money',
  'Freelance',
  'Refund',
  'Gift',
  'Investment Return',
  'Other Income',
] as const

export type WalletType = 'cash' | 'bank' | 'savings' | 'card' | 'ewallet' | 'custom'
export type TransactionType = 'expense' | 'income' | 'transfer'

export interface WalletAccount {
  id: string
  name: string
  type: WalletType
  currency: CurrencyCode
  openingBalance: number
  color: string
  archived?: boolean
  createdAt: string
  updatedAt: string
}

export interface WalletWithBalance extends WalletAccount {
  currentBalance: number
  totalIncome: number
  totalExpense: number
  transfersIn: number
  transfersOut: number
  isNegative: boolean
}

export interface FinanceTransaction {
  id: string
  type: TransactionType
  amount: number
  currency: CurrencyCode
  category: string
  walletId: string
  toWalletId?: string | null
  toCurrency?: CurrencyCode | null
  convertedAmount?: number | null
  exchangeRate?: number | null
  title: string
  notes?: string | null
  paymentMethod?: string | null
  date: string
  createdAt: string
  updatedAt: string
}

export interface CurrencySummary {
  currency: CurrencyCode
  openingBalance: number
  totalBalance: number
  closingBalance: number
  totalIncome: number
  totalExpense: number
  totalExpenses: number
  netChange: number
  netCashFlow: number
  categoryBreakdown: Record<string, number>
}

export interface ExpenseReminderConfig {
  enabled: boolean
  time: string // HH:mm
}

export interface CommittedBill {
  id: string
  title: string
  amount: number
  dueDate: string // YYYY-MM-DD
  isPaid: boolean
  category: string
}

export interface DiscretionaryExpense {
  id: string
  title: string
  amount: number
  category: string
  date: string
}

export type SurplusPosture = 'debt_reduction' | 'savings_focus'

export function roundCurrencyAmount(
  amount: number,
  currency: CurrencyCode = 'INR'
): number {
  const meta = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR
  const factor = Math.pow(10, meta.decimals)
  return Math.round((Number(amount) + Number.EPSILON) * factor) / factor
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'INR'
): string {
  const meta = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR
  const rounded = roundCurrencyAmount(amount, currency)
  const isNeg = rounded < 0
  const absVal = Math.abs(rounded)

  const formattedNum = absVal.toLocaleString(meta.locale, {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  })

  return `${isNeg ? '-' : ''}${meta.symbol}${formattedNum}`
}

const DEFAULT_WALLETS: WalletAccount[] = [
  {
    id: 'wallet-inr-cash',
    name: 'Cash in Hand',
    type: 'cash',
    currency: 'INR',
    openingBalance: 0,
    color: '#10B981',
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wallet-inr-bank',
    name: 'Bank Account',
    type: 'bank',
    currency: 'INR',
    openingBalance: 0,
    color: '#3B82F6',
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wallet-inr-savings',
    name: 'Savings Account',
    type: 'savings',
    currency: 'INR',
    openingBalance: 0,
    color: '#F59E0B',
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export interface FinanceState {
  defaultCurrency: CurrencyCode
  defaultWalletId: string
  wallets: WalletAccount[]
  transactions: FinanceTransaction[]
  customCategories: string[]
  expenseReminder: ExpenseReminderConfig

  // Legacy compatibility properties
  liquidChecking: number
  accountFloor: number
  savingsBuffer: number
  payPeriodDaysRemaining: number
  surplusPosture: SurplusPosture
  committedBills: CommittedBill[]
  expenses: DiscretionaryExpense[]

  // Multi-currency Wallet Actions
  setDefaultCurrency: (currency: CurrencyCode) => void
  setDefaultWalletId: (walletId: string) => void
  addCustomCategory: (category: string) => void
  addWallet: (params: {
    name: string
    type: WalletType
    currency: CurrencyCode
    openingBalance: number
    color?: string
  }) => WalletAccount
  updateWallet: (
    id: string,
    partial: Partial<Pick<WalletAccount, 'name' | 'type' | 'currency' | 'openingBalance' | 'color' | 'archived'>>
  ) => void
  removeWallet: (id: string) => void
  getWalletBalance: (walletId: string) => number
  getWalletsWithBalances: () => WalletWithBalance[]

  // Multi-currency Transaction Actions
  addTransaction: (params: {
    type: TransactionType
    amount: number
    currency?: CurrencyCode
    category?: string
    walletId?: string
    toWalletId?: string | null
    toCurrency?: CurrencyCode | null
    exchangeRate?: number | null
    title: string
    notes?: string | null
    paymentMethod?: string | null
    date?: string
  }) => FinanceTransaction
  updateTransaction: (
    id: string,
    partial: Partial<Omit<FinanceTransaction, 'id' | 'createdAt'>>
  ) => void
  deleteTransaction: (id: string) => void

  // Summaries separated by currency
  getSummaryByCurrency: (
    period?: 'daily' | 'weekly' | 'monthly' | 'all',
    referenceDate?: Date
  ) => Record<CurrencyCode, CurrencySummary>

  // Expense reminder settings
  setExpenseReminder: (partial: Partial<ExpenseReminderConfig>) => void

  // Legacy Actions
  logExpense: (
    title: string,
    amount: number,
    category?: string,
    walletId?: string,
    currency?: CurrencyCode
  ) => void
  removeExpense: (id: string) => void
  addCommittedBill: (title: string, amount: number, dueDate: string, category?: string) => void
  toggleBillPaid: (id: string) => void
  removeBill: (id: string) => void
  setLiquidChecking: (amount: number) => void
  setAccountFloor: (amount: number) => void
  setSavingsBuffer: (amount: number) => void
  setPayPeriodDaysRemaining: (days: number) => void
  setSurplusPosture: (posture: SurplusPosture) => void
  resetDefaults: () => void

  getCalculations: () => {
    primaryCurrency: CurrencyCode
    activeWalletBalance: number
    totalCommittedUnpaid: number
    safeToSpendDaily: number
    projectedAccountLow: number
    isAtRisk: boolean
    deficitAmount: number
    availableCashSurplus: number
    totalSpentToday: number
    totalIncomeToday: number
  }
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      defaultCurrency: 'INR',
      defaultWalletId: 'wallet-inr-cash',
      wallets: DEFAULT_WALLETS,
      transactions: [],
      customCategories: [],
      expenseReminder: {
        enabled: false,
        time: '20:30',
      },

      liquidChecking: 0,
      accountFloor: 0,
      savingsBuffer: 0,
      payPeriodDaysRemaining: 15,
      surplusPosture: 'savings_focus',
      committedBills: [],
      expenses: [],

      setDefaultCurrency: (currency) => {
        set({ defaultCurrency: currency })
        const state = get()
        syncExpenseReminderNotification({
          config: state.expenseReminder,
          defaultCurrency: currency,
        })
      },

      setDefaultWalletId: (walletId) => set({ defaultWalletId: walletId }),

      addCustomCategory: (category) => {
        const clean = category.trim()
        if (!clean) return
        set((state) => ({
          customCategories: state.customCategories.includes(clean)
            ? state.customCategories
            : [...state.customCategories, clean],
        }))
      },

      addWallet: (params) => {
        const nowIso = new Date().toISOString()
        const newWallet: WalletAccount = {
          id: 'wallet_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
          name: params.name.trim() || 'Wallet',
          type: params.type || 'cash',
          currency: params.currency || get().defaultCurrency,
          openingBalance: roundCurrencyAmount(params.openingBalance || 0, params.currency),
          color: params.color || '#10B981',
          archived: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        }
        set((state) => ({
          wallets: [...state.wallets, newWallet],
          defaultWalletId: state.defaultWalletId || newWallet.id,
        }))
        return newWallet
      },

      updateWallet: (id, partial) => {
        set((state) => ({
          wallets: state.wallets.map((w) => {
            if (w.id !== id) return w
            const nextCurrency = partial.currency || w.currency
            const nextOpening =
              partial.openingBalance !== undefined
                ? roundCurrencyAmount(partial.openingBalance, nextCurrency)
                : w.openingBalance
            return {
              ...w,
              ...partial,
              currency: nextCurrency,
              openingBalance: nextOpening,
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      removeWallet: (id) => {
        set((state) => {
          const remaining = state.wallets.filter((w) => w.id !== id)
          return {
            wallets: remaining,
            transactions: state.transactions.filter(
              (tx) => tx.walletId !== id && tx.toWalletId !== id
            ),
            defaultWalletId:
              state.defaultWalletId === id ? remaining[0]?.id || '' : state.defaultWalletId,
          }
        })
      },

      getWalletBalance: (walletId) => {
        const state = get()
        const wallet = state.wallets.find((w) => w.id === walletId)
        if (!wallet) return 0

        let balance = wallet.openingBalance
        for (const tx of state.transactions) {
          if (tx.type === 'expense' && tx.walletId === wallet.id) {
            balance -= tx.amount
          } else if (tx.type === 'income' && tx.walletId === wallet.id) {
            balance += tx.amount
          } else if (tx.type === 'transfer') {
            if (tx.walletId === wallet.id) {
              balance -= tx.amount
            }
            if (tx.toWalletId === wallet.id) {
              const incomingAmt =
                tx.convertedAmount !== undefined && tx.convertedAmount !== null
                  ? tx.convertedAmount
                  : tx.exchangeRate && tx.exchangeRate > 0
                  ? tx.amount * tx.exchangeRate
                  : tx.amount
              balance += incomingAmt
            }
          }
        }
        return roundCurrencyAmount(balance, wallet.currency)
      },

      getWalletsWithBalances: () => {
        const state = get()
        return state.wallets
          .filter((w) => !w.archived)
          .map((w) => {
            let totalIncome = 0
            let totalExpense = 0
            let transfersIn = 0
            let transfersOut = 0

            for (const tx of state.transactions) {
              if (tx.type === 'expense' && tx.walletId === w.id) {
                totalExpense += tx.amount
              } else if (tx.type === 'income' && tx.walletId === w.id) {
                totalIncome += tx.amount
              } else if (tx.type === 'transfer') {
                if (tx.walletId === w.id) {
                  transfersOut += tx.amount
                }
                if (tx.toWalletId === w.id) {
                  const incoming =
                    tx.convertedAmount !== undefined && tx.convertedAmount !== null
                      ? tx.convertedAmount
                      : tx.exchangeRate && tx.exchangeRate > 0
                      ? tx.amount * tx.exchangeRate
                      : tx.amount
                  transfersIn += incoming
                }
              }
            }

            const currentBalance = roundCurrencyAmount(
              w.openingBalance + totalIncome - totalExpense - transfersOut + transfersIn,
              w.currency
            )

            return {
              ...w,
              currentBalance,
              totalIncome: roundCurrencyAmount(totalIncome, w.currency),
              totalExpense: roundCurrencyAmount(totalExpense, w.currency),
              transfersIn: roundCurrencyAmount(transfersIn, w.currency),
              transfersOut: roundCurrencyAmount(transfersOut, w.currency),
              isNegative: currentBalance < 0,
            }
          })
      },

      addTransaction: (params) => {
        const state = get()
        const sourceWallet =
          state.wallets.find((w) => w.id === params.walletId) ||
          state.wallets.find((w) => w.id === state.defaultWalletId) ||
          state.wallets[0]

        if (!sourceWallet) {
          throw new Error('No wallet available for transaction.')
        }

        const currency = params.currency || sourceWallet.currency
        const cleanAmount = roundCurrencyAmount(Math.abs(params.amount), currency)
        if (cleanAmount <= 0) {
          throw new Error('Transaction amount must be greater than zero.')
        }

        const destWallet =
          params.type === 'transfer' && params.toWalletId
            ? state.wallets.find((w) => w.id === params.toWalletId)
            : null

        const toCurrency = destWallet ? destWallet.currency : params.toCurrency || currency
        const rate =
          params.exchangeRate && params.exchangeRate > 0 ? Number(params.exchangeRate) : 1
        const convertedAmount =
          params.type === 'transfer'
            ? roundCurrencyAmount(
                currency === toCurrency ? cleanAmount : cleanAmount * rate,
                toCurrency
              )
            : null

        const nowIso = new Date().toISOString()
        const txDate = params.date || nowIso

        const newTx: FinanceTransaction = {
          id: 'tx_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
          type: params.type,
          amount: cleanAmount,
          currency,
          category:
            params.category ||
            (params.type === 'transfer'
              ? 'Transfer'
              : params.type === 'income'
              ? 'Salary'
              : 'Food'),
          walletId: sourceWallet.id,
          toWalletId: params.type === 'transfer' ? params.toWalletId || null : null,
          toCurrency: params.type === 'transfer' ? toCurrency : null,
          convertedAmount,
          exchangeRate: params.type === 'transfer' ? rate : null,
          title: params.title.trim() || params.category || 'Transaction',
          notes: params.notes || null,
          paymentMethod: params.paymentMethod || sourceWallet.type,
          date: txDate,
          createdAt: nowIso,
          updatedAt: nowIso,
        }

        const legacyExpenses: DiscretionaryExpense[] =
          params.type === 'expense'
            ? [
                {
                  id: newTx.id,
                  title: newTx.title,
                  amount: newTx.amount,
                  category: newTx.category,
                  date: newTx.date,
                },
                ...state.expenses,
              ]
            : state.expenses

        set({
          transactions: [newTx, ...state.transactions],
          expenses: legacyExpenses,
        })

        return newTx
      },

      updateTransaction: (id, partial) => {
        set((state) => {
          const updatedTxs = state.transactions.map((tx) => {
            if (tx.id !== id) return tx
            const nextCurrency = partial.currency || tx.currency
            const nextAmount =
              partial.amount !== undefined
                ? roundCurrencyAmount(Math.abs(partial.amount), nextCurrency)
                : tx.amount
            const nextType = partial.type || tx.type
            const nextRate =
              partial.exchangeRate !== undefined ? partial.exchangeRate : tx.exchangeRate
            const destWallet =
              nextType === 'transfer' && (partial.toWalletId || tx.toWalletId)
                ? state.wallets.find((w) => w.id === (partial.toWalletId || tx.toWalletId))
                : null
            const nextToCurrency = destWallet
              ? destWallet.currency
              : partial.toCurrency || tx.toCurrency || nextCurrency
            const nextConverted =
              nextType === 'transfer'
                ? roundCurrencyAmount(
                    nextCurrency === nextToCurrency
                      ? nextAmount
                      : nextAmount * (nextRate && nextRate > 0 ? nextRate : 1),
                    nextToCurrency
                  )
                : null

            return {
              ...tx,
              ...partial,
              type: nextType,
              currency: nextCurrency,
              amount: nextAmount,
              toCurrency: nextToCurrency,
              convertedAmount: nextConverted,
              updatedAt: new Date().toISOString(),
            }
          })

          const updatedLegacy = state.expenses.map((e) => {
            if (e.id !== id) return e
            const match = updatedTxs.find((t) => t.id === id)
            return match
              ? {
                  ...e,
                  title: match.title,
                  amount: match.amount,
                  category: match.category,
                  date: match.date,
                }
              : e
          })

          return {
            transactions: updatedTxs,
            expenses: updatedLegacy,
          }
        })
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
          expenses: state.expenses.filter((e) => e.id !== id),
        }))
      },

      getSummaryByCurrency: (period = 'monthly', referenceDate = new Date()) => {
        const state = get()
        const walletsWithBalances = state.getWalletsWithBalances()
        const refDayStr = format(referenceDate, 'yyyy-MM-dd')
        const weekStart = subDays(referenceDate, 7)
        const monthStart = startOfMonth(referenceDate)

        const isTxInPeriod = (dateStr: string): boolean => {
          if (period === 'all') return true
          if (period === 'daily') return dateStr.startsWith(refDayStr)
          try {
            const parsed = parseISO(dateStr)
            if (period === 'weekly') return isAfter(parsed, weekStart) || dateStr.startsWith(refDayStr)
            if (period === 'monthly') return isAfter(parsed, monthStart) || dateStr.startsWith(refDayStr)
          } catch {}
          return true
        }

        const result = {} as Record<CurrencyCode, CurrencySummary>

        for (const w of walletsWithBalances) {
          if (!result[w.currency]) {
            result[w.currency] = {
              currency: w.currency,
              openingBalance: 0,
              totalBalance: 0,
              closingBalance: 0,
              totalIncome: 0,
              totalExpense: 0,
              totalExpenses: 0,
              netChange: 0,
              netCashFlow: 0,
              categoryBreakdown: {},
            }
          }
          result[w.currency].openingBalance = roundCurrencyAmount(
            result[w.currency].openingBalance + w.openingBalance,
            w.currency
          )
          result[w.currency].totalBalance = roundCurrencyAmount(
            result[w.currency].totalBalance + w.currentBalance,
            w.currency
          )
          result[w.currency].closingBalance = result[w.currency].totalBalance
        }

        for (const tx of state.transactions) {
          if (!isTxInPeriod(tx.date)) continue
          // Internal transfers do NOT count as income or expense
          if (tx.type === 'transfer') continue

          if (!result[tx.currency]) {
            result[tx.currency] = {
              currency: tx.currency,
              openingBalance: 0,
              totalBalance: 0,
              closingBalance: 0,
              totalIncome: 0,
              totalExpense: 0,
              totalExpenses: 0,
              netChange: 0,
              netCashFlow: 0,
              categoryBreakdown: {},
            }
          }

          const bucket = result[tx.currency]
          if (tx.type === 'income') {
            bucket.totalIncome = roundCurrencyAmount(bucket.totalIncome + tx.amount, tx.currency)
          } else if (tx.type === 'expense') {
            bucket.totalExpense = roundCurrencyAmount(bucket.totalExpense + tx.amount, tx.currency)
            bucket.totalExpenses = bucket.totalExpense
            bucket.categoryBreakdown[tx.category] = roundCurrencyAmount(
              (bucket.categoryBreakdown[tx.category] || 0) + tx.amount,
              tx.currency
            )
          }
          bucket.netChange = roundCurrencyAmount(
            bucket.totalIncome - bucket.totalExpense,
            tx.currency
          )
          bucket.netCashFlow = bucket.netChange
        }

        return result
      },

      setExpenseReminder: (partial) => {
        set((state) => {
          const next = { ...state.expenseReminder, ...partial }
          syncExpenseReminderNotification({
            config: next,
            defaultCurrency: state.defaultCurrency,
          })
          return { expenseReminder: next }
        })
      },

      logExpense: (title, amount, category = 'Food', walletId, currency) => {
        get().addTransaction({
          type: 'expense',
          title,
          amount,
          category,
          walletId: walletId || get().defaultWalletId,
          currency: currency || get().defaultCurrency,
        })
      },

      removeExpense: (id) => {
        get().deleteTransaction(id)
      },

      addCommittedBill: (title, amount, dueDate, category = 'Rent / Bills') => {
        const newBill: CommittedBill = {
          id: 'bill-' + Date.now(),
          title: title.trim() || 'Scheduled Bill',
          amount: Math.abs(amount),
          dueDate,
          isPaid: false,
          category,
        }
        set((state) => ({
          committedBills: [...state.committedBills, newBill],
        }))
      },

      toggleBillPaid: (id) => {
        set((state) => ({
          committedBills: state.committedBills.map((b) =>
            b.id === id ? { ...b, isPaid: !b.isPaid } : b
          ),
        }))
      },

      removeBill: (id) => {
        set((state) => ({
          committedBills: state.committedBills.filter((b) => b.id !== id),
        }))
      },

      setLiquidChecking: (amount) => set({ liquidChecking: Math.max(0, amount) }),
      setAccountFloor: (amount) => set({ accountFloor: Math.max(0, amount) }),
      setSavingsBuffer: (amount) => set({ savingsBuffer: Math.max(0, amount) }),
      setPayPeriodDaysRemaining: (days) =>
        set({ payPeriodDaysRemaining: Math.max(1, Math.min(31, days)) }),
      setSurplusPosture: (posture) => set({ surplusPosture: posture }),

      resetDefaults: () =>
        set({
          defaultCurrency: 'INR',
          defaultWalletId: 'wallet-inr-cash',
          wallets: DEFAULT_WALLETS,
          transactions: [],
          expenses: [],
        }),

      getCalculations: () => {
        const state = get()
        const primaryCurrency = state.defaultCurrency
        const walletsWithBalances = state.getWalletsWithBalances()
        const primaryWallets = walletsWithBalances.filter(
          (w) => w.currency === primaryCurrency
        )

        const activeWalletBalance = roundCurrencyAmount(
          primaryWallets.reduce((sum, w) => sum + w.currentBalance, 0),
          primaryCurrency
        )

        const totalCommittedUnpaid = state.committedBills
          .filter((b) => !b.isPaid)
          .reduce((acc, b) => acc + b.amount, 0)

        const todayPrefix = format(new Date(), 'yyyy-MM-dd')
        const totalSpentToday = roundCurrencyAmount(
          state.transactions
            .filter(
              (tx) =>
                tx.type === 'expense' &&
                tx.currency === primaryCurrency &&
                tx.date.startsWith(todayPrefix)
            )
            .reduce((sum, tx) => sum + tx.amount, 0),
          primaryCurrency
        )

        const totalIncomeToday = roundCurrencyAmount(
          state.transactions
            .filter(
              (tx) =>
                tx.type === 'income' &&
                tx.currency === primaryCurrency &&
                tx.date.startsWith(todayPrefix)
            )
            .reduce((sum, tx) => sum + tx.amount, 0),
          primaryCurrency
        )

        const safeDays = Math.max(1, state.payPeriodDaysRemaining)
        const netDisposable = activeWalletBalance - totalCommittedUnpaid
        const safeToSpendDaily = roundCurrencyAmount(
          Math.max(0, netDisposable / safeDays),
          primaryCurrency
        )

        return {
          primaryCurrency,
          activeWalletBalance,
          totalCommittedUnpaid,
          safeToSpendDaily,
          projectedAccountLow: netDisposable,
          isAtRisk: activeWalletBalance <= 0 || netDisposable < 0,
          deficitAmount: netDisposable < 0 ? Math.abs(netDisposable) : 0,
          availableCashSurplus: Math.max(0, netDisposable),
          totalSpentToday,
          totalIncomeToday,
        }
      },
    }),
    {
      name: 'nexora-finance-storage',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const s = (persistedState as Partial<FinanceState>) || {}
        if (version < 2) {
          return {
            ...s,
            defaultCurrency: s.defaultCurrency || 'INR',
            defaultWalletId: s.defaultWalletId || 'wallet-inr-cash',
            wallets:
              Array.isArray(s.wallets) && s.wallets.length > 0
                ? s.wallets
                : DEFAULT_WALLETS,
            transactions: Array.isArray(s.transactions) ? s.transactions : [],
            expenseReminder: s.expenseReminder || { enabled: false, time: '20:30' },
          }
        }
        return s as FinanceState
      },
    }
  )
)
