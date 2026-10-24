import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  date: string // ISO string or YYYY-MM-DD
}

export type SurplusPosture = 'debt_reduction' | 'savings_focus'

export interface FinanceState {
  liquidChecking: number
  accountFloor: number
  savingsBuffer: number
  payPeriodDaysRemaining: number
  surplusPosture: SurplusPosture
  committedBills: CommittedBill[]
  expenses: DiscretionaryExpense[]

  // Actions
  logExpense: (title: string, amount: number, category?: string) => void
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

  // Telemetry Calculations
  getCalculations: () => {
    totalCommittedUnpaid: number
    safeToSpendDaily: number
    projectedAccountLow: number
    isAtRisk: boolean
    deficitAmount: number
    availableCashSurplus: number
    totalSpentToday: number
  }
}

const INITIAL_BILLS: CommittedBill[] = [
  { id: 'bill-1', title: 'Sanctuary Lease / Mortgage', amount: 1250, dueDate: '2026-11-01', isPaid: false, category: 'Housing' },
  { id: 'bill-2', title: 'Fiber Gigabit Internet', amount: 80, dueDate: '2026-10-28', isPaid: false, category: 'Utilities' },
  { id: 'bill-3', title: 'Cloud Neural Subscription', amount: 45, dueDate: '2026-10-30', isPaid: false, category: 'Tech' },
  { id: 'bill-4', title: 'Tactical Wellness Insurance', amount: 165, dueDate: '2026-10-25', isPaid: true, category: 'Health' },
]

const INITIAL_EXPENSES: DiscretionaryExpense[] = [
  { id: 'exp-1', title: 'Artisan Espresso Roast', amount: 6.5, category: 'Food & Dining', date: new Date().toISOString() },
  { id: 'exp-2', title: 'Botanical Fuel Lunch', amount: 18.25, category: 'Food & Dining', date: new Date().toISOString() },
]

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      liquidChecking: 3450,
      accountFloor: 500,
      savingsBuffer: 250,
      payPeriodDaysRemaining: 12,
      surplusPosture: 'savings_focus',
      committedBills: INITIAL_BILLS,
      expenses: INITIAL_EXPENSES,

      logExpense: (title, amount, category = 'General') => {
        const newExpense: DiscretionaryExpense = {
          id: 'exp-' + Date.now(),
          title: title.trim() || 'Discretionary Expense',
          amount: Math.abs(amount),
          category,
          date: new Date().toISOString(),
        }
        set((state) => ({
          liquidChecking: Math.max(0, state.liquidChecking - Math.abs(amount)),
          expenses: [newExpense, ...state.expenses],
        }))
      },

      removeExpense: (id) => {
        set((state) => {
          const item = state.expenses.find((e) => e.id === id)
          return {
            liquidChecking: item ? state.liquidChecking + item.amount : state.liquidChecking,
            expenses: state.expenses.filter((e) => e.id !== id),
          }
        })
      },

      addCommittedBill: (title, amount, dueDate, category = 'Bills') => {
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
      setPayPeriodDaysRemaining: (days) => set({ payPeriodDaysRemaining: Math.max(1, days) }),
      setSurplusPosture: (posture) => set({ surplusPosture: posture }),

      resetDefaults: () =>
        set({
          liquidChecking: 3450,
          accountFloor: 500,
          savingsBuffer: 250,
          payPeriodDaysRemaining: 12,
          surplusPosture: 'savings_focus',
          committedBills: INITIAL_BILLS,
          expenses: INITIAL_EXPENSES,
        }),

      getCalculations: () => {
        const { liquidChecking, accountFloor, savingsBuffer, payPeriodDaysRemaining, committedBills, expenses } = get()
        const totalCommittedUnpaid = committedBills
          .filter((b) => !b.isPaid)
          .reduce((sum, b) => sum + b.amount, 0)

        const rawAvailable = liquidChecking - totalCommittedUnpaid - accountFloor - savingsBuffer
        const safeToSpendDaily = Math.max(0, Number((rawAvailable / Math.max(1, payPeriodDaysRemaining)).toFixed(2)))
        const projectedAccountLow = liquidChecking - totalCommittedUnpaid
        const isAtRisk = projectedAccountLow < accountFloor
        const deficitAmount = isAtRisk ? accountFloor - projectedAccountLow : 0
        const availableCashSurplus = Math.max(0, projectedAccountLow - accountFloor)

        // Today's total spent
        const todayPrefix = new Date().toISOString().split('T')[0]
        const totalSpentToday = expenses
          .filter((e) => e.date.startsWith(todayPrefix))
          .reduce((sum, e) => sum + e.amount, 0)

        return {
          totalCommittedUnpaid,
          safeToSpendDaily,
          projectedAccountLow,
          isAtRisk,
          deficitAmount,
          availableCashSurplus,
          totalSpentToday,
        }
      },
    }),
    {
      name: 'nexora_safe_to_spend_store',
    }
  )
)
