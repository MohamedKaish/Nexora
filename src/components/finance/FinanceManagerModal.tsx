'use client'

import React, { useState, useMemo } from 'react'
import {
  useFinanceStore,
  SUPPORTED_CURRENCIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CurrencyCode,
  WalletType,
  TransactionType,
  FinanceTransaction,
  WalletAccount,
  formatCurrency,
} from '@/store/useFinanceStore'
import {
  Wallet,
  Plus,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Trash2,
  Edit3,
  X,
  Check,
  Bell,
  AlertTriangle,
  Filter,
  PieChart,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface FinanceManagerModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'transactions' | 'wallets' | 'summaries' | 'reminders'
}

export function FinanceManagerModal({
  isOpen,
  onClose,
  initialTab = 'transactions',
}: FinanceManagerModalProps) {
  const financeStore = useFinanceStore()
  const [activeTab, setActiveTab] = useState<'transactions' | 'wallets' | 'summaries' | 'reminders'>(
    initialTab
  )

  // Transaction Form State
  const [editingTxId, setEditingTxId] = useState<string | null>(null)
  const [txType, setTxType] = useState<TransactionType>('expense')
  const [txAmount, setTxAmount] = useState('')
  const [txWalletId, setTxWalletId] = useState(
    financeStore.defaultWalletId || financeStore.wallets[0]?.id || ''
  )
  const [txToWalletId, setTxToWalletId] = useState(
    financeStore.wallets[1]?.id || financeStore.wallets[0]?.id || ''
  )
  const [txExchangeRate, setTxExchangeRate] = useState('1')
  const [txCategory, setTxCategory] = useState<string>('Food')
  const [txTitle, setTxTitle] = useState('')
  const [txDate, setTxDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  // Wallet Form State
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null)
  const [walletName, setWalletName] = useState('')
  const [walletType, setWalletType] = useState<WalletType>('cash')
  const [walletCurrency, setWalletCurrency] = useState<CurrencyCode>(financeStore.defaultCurrency)
  const [walletOpeningBalance, setWalletOpeningBalance] = useState('')

  // Filters & Summary Period
  const [filterCurrency, setFilterCurrency] = useState<string>('ALL')
  const [filterWalletId, setFilterWalletId] = useState<string>('ALL')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [summaryPeriod, setSummaryPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('monthly')

  const walletsWithBalances = useMemo(
    () => financeStore.getWalletsWithBalances(),
    [financeStore.wallets, financeStore.transactions]
  )

  const summariesByCurrency = useMemo(
    () => financeStore.getSummaryByCurrency(summaryPeriod, new Date()),
    [financeStore.wallets, financeStore.transactions, financeStore.defaultCurrency, summaryPeriod]
  )

  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const selectedSourceWallet =
    financeStore.wallets.find((w) => w.id === txWalletId) || financeStore.wallets[0]
  const selectedDestWallet =
    financeStore.wallets.find((w) => w.id === txToWalletId) || financeStore.wallets[1]
  const isCrossCurrencyTransfer =
    txType === 'transfer' &&
    selectedSourceWallet &&
    selectedDestWallet &&
    selectedSourceWallet.currency !== selectedDestWallet.currency

  const resetTxForm = () => {
    setEditingTxId(null)
    setTxAmount('')
    setTxTitle('')
    setTxExchangeRate('1')
    setTxDate(format(new Date(), 'yyyy-MM-dd'))
  }

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(txAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount greater than 0.')
      return
    }
    if (!selectedSourceWallet) {
      toast.error('Please create or select a wallet first.')
      return
    }

    try {
      if (editingTxId) {
        financeStore.updateTransaction(editingTxId, {
          type: txType,
          amount: amountNum,
          walletId: selectedSourceWallet.id,
          currency: selectedSourceWallet.currency,
          toWalletId: txType === 'transfer' ? txToWalletId : null,
          exchangeRate: isCrossCurrencyTransfer ? parseFloat(txExchangeRate) || 1 : 1,
          category: txType === 'transfer' ? 'Transfer' : txCategory,
          title: txTitle.trim() || txCategory,
          date: new Date(txDate + 'T12:00:00').toISOString(),
        })
        toast.success('Transaction updated and wallet balance recalculated.')
      } else {
        financeStore.addTransaction({
          type: txType,
          amount: amountNum,
          walletId: selectedSourceWallet.id,
          currency: selectedSourceWallet.currency,
          toWalletId: txType === 'transfer' ? txToWalletId : null,
          exchangeRate: isCrossCurrencyTransfer ? parseFloat(txExchangeRate) || 1 : 1,
          category: txType === 'transfer' ? 'Transfer' : txCategory,
          title: txTitle.trim() || txCategory,
          date: new Date(txDate + 'T12:00:00').toISOString(),
        })
        toast.success(
          `${
            txType === 'expense' ? 'Expense' : txType === 'income' ? 'Income' : 'Transfer'
          } of ${formatCurrency(amountNum, selectedSourceWallet.currency)} recorded.`
        )
      }
      resetTxForm()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not save transaction.')
    }
  }

  const handleEditTxClick = (tx: FinanceTransaction) => {
    setEditingTxId(tx.id)
    setTxType(tx.type)
    setTxAmount(String(tx.amount))
    setTxWalletId(tx.walletId)
    if (tx.toWalletId) setTxToWalletId(tx.toWalletId)
    if (tx.exchangeRate) setTxExchangeRate(String(tx.exchangeRate))
    setTxCategory(tx.category)
    setTxTitle(tx.title)
    setTxDate(tx.date.split('T')[0])
    setActiveTab('transactions')
  }

  const handleSaveWallet = (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletName.trim()) {
      toast.error('Please enter a wallet name.')
      return
    }
    const openingNum = parseFloat(walletOpeningBalance || '0')
    if (isNaN(openingNum)) {
      toast.error('Please enter a valid opening balance.')
      return
    }

    if (editingWalletId) {
      financeStore.updateWallet(editingWalletId, {
        name: walletName.trim(),
        type: walletType,
        currency: walletCurrency,
        openingBalance: openingNum,
      })
      toast.success(`Wallet "${walletName.trim()}" updated.`)
      setEditingWalletId(null)
    } else {
      const created = financeStore.addWallet({
        name: walletName.trim(),
        type: walletType,
        currency: walletCurrency,
        openingBalance: openingNum,
      })
      if (!txWalletId) setTxWalletId(created.id)
      toast.success(
        `Created wallet "${created.name}" (${formatCurrency(
          created.openingBalance,
          created.currency
        )}).`
      )
    }
    setWalletName('')
    setWalletOpeningBalance('')
  }

  const handleEditWalletClick = (w: WalletAccount) => {
    setEditingWalletId(w.id)
    setWalletName(w.name)
    setWalletType(w.type)
    setWalletCurrency(w.currency)
    setWalletOpeningBalance(String(w.openingBalance))
  }

  const filteredTransactions = financeStore.transactions.filter((tx) => {
    if (filterCurrency !== 'ALL' && tx.currency !== filterCurrency) return false
    if (
      filterWalletId !== 'ALL' &&
      tx.walletId !== filterWalletId &&
      tx.toWalletId !== filterWalletId
    ) {
      return false
    }
    if (filterType !== 'ALL' && tx.type !== filterType) return false
    return true
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Multi-Currency Wallets and Cash-Flow Ledger"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-4xl rounded-3xl bg-stone-950 border border-emerald-500/35 p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-100">
                Multi-Currency Wallets &amp; Cash-Flow Ledger
              </h2>
              <p className="text-xs text-stone-400">
                Accurate wallet balances, expenses, income, and transfers across INR (₹), USD ($), EUR (€), and more.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] font-mono uppercase text-stone-400">Default:</span>
              <select
                value={financeStore.defaultCurrency}
                onChange={(e) =>
                  financeStore.setDefaultCurrency(e.target.value as CurrencyCode)
                }
                className="bg-transparent text-xs font-mono font-bold text-emerald-300 outline-none cursor-pointer"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code} className="bg-stone-950 text-stone-100">
                    {c.code} ({c.symbol.trim()})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 my-3 rounded-2xl bg-stone-900/90 border border-stone-800 text-xs shrink-0">
          {[
            { id: 'transactions', label: 'Transactions & Log' },
            { id: 'wallets', label: `Wallets (${financeStore.wallets.length})` },
            { id: 'summaries', label: 'Currency Summaries' },
            { id: 'reminders', label: 'Expense Reminders' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-400 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Wallet Quick Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {walletsWithBalances.map((w) => (
              <div
                key={w.id}
                onClick={() => {
                  setTxWalletId(w.id)
                  financeStore.setDefaultWalletId(w.id)
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  financeStore.defaultWalletId === w.id
                    ? 'bg-emerald-950/25 border-emerald-500/45'
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-200 truncate">{w.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 uppercase">
                      {w.currency}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    Opening: {formatCurrency(w.openingBalance, w.currency)}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-mono font-bold block ${
                      w.isNegative ? 'text-rose-400' : 'text-emerald-300'
                    }`}
                  >
                    {formatCurrency(w.currentBalance, w.currency)}
                  </span>
                  {w.isNegative && (
                    <span className="text-[9px] font-mono text-rose-400 flex items-center justify-end gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" /> Overdrawn
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* TAB 1: TRANSACTIONS & LOG */}
          {activeTab === 'transactions' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Form: Record Expense / Income / Transfer */}
              <form
                onSubmit={handleSaveTransaction}
                className="lg:col-span-5 p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-3.5 self-start"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 font-mono">
                    {editingTxId ? 'Edit Transaction' : 'Record Transaction'}
                  </h3>
                  {editingTxId && (
                    <button
                      type="button"
                      onClick={resetTxForm}
                      className="text-[11px] text-stone-400 hover:text-stone-200 underline cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Type Selector */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-stone-950 border border-stone-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('expense')
                      setTxCategory('Food')
                    }}
                    className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      txType === 'expense'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-stone-400'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" /> Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('income')
                      setTxCategory('Salary')
                    }}
                    className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      txType === 'income'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-stone-400'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Income
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('transfer')
                      setTxCategory('Transfer')
                    }}
                    className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      txType === 'transfer'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'text-stone-400'
                    }`}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer
                  </button>
                </div>

                {/* Wallet Selection */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    {txType === 'transfer'
                      ? 'From Wallet'
                      : txType === 'income'
                      ? 'Deposit Into Wallet'
                      : 'Pay From Wallet'}
                  </label>
                  <select
                    value={txWalletId}
                    onChange={(e) => setTxWalletId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 outline-none"
                  >
                    {walletsWithBalances.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.currency}) — Bal: {formatCurrency(w.currentBalance, w.currency)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Wallet for Transfers */}
                {txType === 'transfer' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                        To Destination Wallet
                      </label>
                      <select
                        value={txToWalletId}
                        onChange={(e) => setTxToWalletId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 outline-none"
                      >
                        {walletsWithBalances
                          .filter((w) => w.id !== txWalletId)
                          .map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({w.currency}) — Bal:{' '}
                              {formatCurrency(w.currentBalance, w.currency)}
                            </option>
                          ))}
                      </select>
                    </div>

                    {isCrossCurrencyTransfer && (
                      <div>
                        <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                          Exchange Rate (1 {selectedSourceWallet?.currency} = ?{' '}
                          {selectedDestWallet?.currency})
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={txExchangeRate}
                          onChange={(e) => setTxExchangeRate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-amber-500/40 text-xs text-stone-100 font-mono outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Amount & Date */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      Amount ({selectedSourceWallet?.currency || financeStore.defaultCurrency})
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 250"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 focus:border-emerald-400 text-xs text-stone-100 font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Category */}
                {txType !== 'transfer' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      Category
                    </label>
                    <select
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 outline-none"
                    >
                      {(txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(
                        (cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        )
                      )}
                      {financeStore.customCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Note / Title */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    Description / Note
                  </label>
                  <input
                    type="text"
                    placeholder={
                      txType === 'expense'
                        ? 'e.g. Lunch, Metro Card, Textbooks'
                        : txType === 'income'
                        ? 'e.g. Monthly Stipend, Salary'
                        : 'e.g. ATM Withdrawal to Cash'
                    }
                    value={txTitle}
                    onChange={(e) => setTxTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingTxId ? 'Update Transaction' : 'Save Transaction'}</span>
                </button>
              </form>

              {/* Right Column: Filterable Transaction History */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-200">
                    <Filter className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ledger History ({filteredTransactions.length})</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <select
                      value={filterCurrency}
                      onChange={(e) => setFilterCurrency(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-[11px] text-stone-300 outline-none"
                    >
                      <option value="ALL">All Currencies</option>
                      {Object.keys(SUPPORTED_CURRENCIES).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterWalletId}
                      onChange={(e) => setFilterWalletId(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-[11px] text-stone-300 outline-none"
                    >
                      <option value="ALL">All Wallets</option>
                      {financeStore.wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-[11px] text-stone-300 outline-none"
                    >
                      <option value="ALL">All Types</option>
                      <option value="expense">Expenses</option>
                      <option value="income">Income</option>
                      <option value="transfer">Transfers</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {filteredTransactions.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-stone-900/40 border border-dashed border-stone-800 text-center">
                      <p className="text-xs font-semibold text-stone-300">
                        No transactions recorded yet
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1">
                        Log an expense, income deposit, or wallet transfer on the left.
                      </p>
                    </div>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const wallet = financeStore.wallets.find((w) => w.id === tx.walletId)
                      const destWallet = tx.toWalletId
                        ? financeStore.wallets.find((w) => w.id === tx.toWalletId)
                        : null

                      return (
                        <div
                          key={tx.id}
                          className="p-3 rounded-xl bg-stone-900/70 border border-stone-800/80 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-stone-100 truncate">
                                {tx.title}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 font-mono">
                                {tx.category}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>
                                {tx.type === 'transfer'
                                  ? `${wallet?.name || 'Wallet'} → ${destWallet?.name || 'Wallet'}`
                                  : wallet?.name || 'Wallet'}
                              </span>
                              <span>•</span>
                              <span>{tx.date.split('T')[0]}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-xs font-mono font-bold ${
                                tx.type === 'income'
                                  ? 'text-emerald-400'
                                  : tx.type === 'transfer'
                                  ? 'text-sky-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'}{' '}
                              {formatCurrency(tx.amount, tx.currency)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleEditTxClick(tx)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition-colors cursor-pointer"
                              title="Edit transaction"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                financeStore.deleteTransaction(tx.id)
                                toast.success('Transaction deleted and balance restored.')
                              }}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors cursor-pointer"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WALLETS MANAGEMENT */}
          {activeTab === 'wallets' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <form
                onSubmit={handleSaveWallet}
                className="lg:col-span-5 p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-3.5 self-start"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 font-mono">
                    {editingWalletId ? 'Edit Wallet / Account' : 'Add New Wallet / Account'}
                  </h3>
                  {editingWalletId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingWalletId(null)
                        setWalletName('')
                        setWalletOpeningBalance('')
                      }}
                      className="text-[11px] text-stone-400 hover:text-stone-200 underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    Wallet Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cash in hand, HDFC Bank, USD Travel Card"
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      Account Type
                    </label>
                    <select
                      value={walletType}
                      onChange={(e) => setWalletType(e.target.value as WalletType)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 outline-none"
                    >
                      <option value="cash">Cash in hand</option>
                      <option value="bank">Bank account</option>
                      <option value="savings">Savings account</option>
                      <option value="card">Card / Credit</option>
                      <option value="ewallet">UPI / Digital Wallet</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      Currency
                    </label>
                    <select
                      value={walletCurrency}
                      onChange={(e) => setWalletCurrency(e.target.value as CurrencyCode)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 font-mono outline-none"
                    >
                      {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol.trim()}) — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    Opening Balance ({walletCurrency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 5000"
                    value={walletOpeningBalance}
                    onChange={(e) => setWalletOpeningBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 font-mono outline-none"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Current balance is calculated automatically from Opening Balance + Income − Expenses ± Transfers.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingWalletId ? 'Save Wallet Changes' : 'Create Wallet'}</span>
                </button>
              </form>

              <div className="lg:col-span-7 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300 font-mono">
                  Your Wallets &amp; Derived Balances
                </h3>
                {walletsWithBalances.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-stone-100">{w.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-emerald-300 uppercase">
                          {w.currency}
                        </span>
                        <span className="text-[10px] text-stone-400 capitalize">({w.type})</span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1 font-mono">
                        Opening: {formatCurrency(w.openingBalance, w.currency)} • Current:{' '}
                        <strong className={w.isNegative ? 'text-rose-400' : 'text-emerald-300'}>
                          {formatCurrency(w.currentBalance, w.currency)}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditWalletClick(w)}
                        className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
                        title="Edit opening balance or name"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {financeStore.wallets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete wallet "${w.name}" and its associated transactions? This cannot be undone.`
                              )
                            ) {
                              financeStore.removeWallet(w.id)
                              toast.info(`Removed wallet "${w.name}".`)
                            }
                          }}
                          className="p-2 rounded-xl bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-300 cursor-pointer"
                          title="Delete wallet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CURRENCY SUMMARIES */}
          {activeTab === 'summaries' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200 font-mono">
                    Cash-Flow Summary Separated by Currency
                  </h3>
                </div>
                <div className="flex gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs">
                  {(['daily', 'weekly', 'monthly', 'all'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSummaryPeriod(p)}
                      className={`px-2.5 py-1 rounded-lg capitalize font-semibold cursor-pointer ${
                        summaryPeriod === p
                          ? 'bg-emerald-400 text-stone-950 font-bold'
                          : 'text-stone-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(summariesByCurrency).map((sum) => (
                  <div
                    key={sum.currency}
                    className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                      <span className="text-sm font-bold text-stone-100 font-mono">
                        {sum.currency} ({SUPPORTED_CURRENCIES[sum.currency]?.name})
                      </span>
                      <span className="text-base font-mono font-bold text-emerald-300">
                        Total: {formatCurrency(sum.totalBalance, sum.currency)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
                        <span className="text-[10px] text-stone-400 block">Income ({summaryPeriod})</span>
                        <span className="text-emerald-400 font-bold">
                          +{formatCurrency(sum.totalIncome, sum.currency)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
                        <span className="text-[10px] text-stone-400 block">Spent ({summaryPeriod})</span>
                        <span className="text-rose-400 font-bold">
                          -{formatCurrency(sum.totalExpense, sum.currency)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
                        <span className="text-[10px] text-stone-400 block">Net Flow</span>
                        <span
                          className={`font-bold ${
                            sum.netChange >= 0 ? 'text-emerald-300' : 'text-rose-400'
                          }`}
                        >
                          {sum.netChange >= 0 ? '+' : ''}
                          {formatCurrency(sum.netChange, sum.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    {Object.keys(sum.categoryBreakdown).length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono uppercase text-stone-400">
                          Category Breakdown:
                        </span>
                        {Object.entries(sum.categoryBreakdown).map(([cat, amt]) => (
                          <div
                            key={cat}
                            className="flex items-center justify-between text-xs font-mono text-stone-300"
                          >
                            <span>{cat}</span>
                            <span>{formatCurrency(amt, sum.currency)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EXPENSE REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4 max-w-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-stone-100">
                      Daily Expense Logging Reminder
                    </h3>
                    <p className="text-xs text-stone-400">
                      Receive an Android notification reminding you to log daily expenses.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={financeStore.expenseReminder.enabled}
                  onChange={(e) =>
                    financeStore.setExpenseReminder({ enabled: e.target.checked })
                  }
                  className="accent-emerald-400 w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Reminder Time
                </label>
                <input
                  type="time"
                  value={financeStore.expenseReminder.time}
                  onChange={(e) =>
                    financeStore.setExpenseReminder({ time: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-100 outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
