import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { type TransactionDTO } from '../api/transactions'

function fmt(n: number) {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function fmtTime(dStr: string) {
  if (!dStr) return ''
  const d = new Date(dStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

// Determines if a transaction is credit or debit relative to the current primary account
const checkIsCredit = (tx: TransactionDTO, primaryAcctNum?: string): boolean => {
  if (!tx) return false
  const cat = tx.category?.toLowerCase()
  const type = tx.type?.toUpperCase()
  if (type === 'DEPOSIT' || cat === 'receive') return true
  if (type === 'TRANSFER' && tx.destinationAccountNumber === primaryAcctNum) {
    return true
  }
  return false
}

function groupByDate(
  txs: TransactionDTO[]
): { label: string; txs: TransactionDTO[] }[] {
  const map = new Map<string, TransactionDTO[]>()
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  for (const tx of txs) {
    const d = tx.createdAt ? new Date(tx.createdAt) : new Date()
    let label: string
    if (isNaN(d.getTime())) {
      label = 'Recent'
    } else if (d.toDateString() === today.toDateString()) {
      label = 'Today'
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday'
    } else {
      label = d.toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' })
    }
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(tx)
  }

  return Array.from(map.entries()).map(([label, txs]) => ({ label, txs }))
}

const CAT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  transfer: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Transfer' },
  airtime: { bg: 'bg-amber-100', text: 'text-amber-600', label: 'Airtime' },
  data: { bg: 'bg-violet-100', text: 'text-violet-600', label: 'Data' },
  electricity: { bg: 'bg-orange-100', text: 'text-orange-600', label: 'Electricity' },
  receive: { bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Credit' },
}

function TxIcon({ cat }: { cat?: string }) {
  const normalizedCat = (cat || 'transfer').toLowerCase()
  const s = CAT_STYLE[normalizedCat] || { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Payment' }

  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg} ${s.text}`}>
      {normalizedCat === 'receive' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
      {normalizedCat === 'transfer' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22,2 15,22 11,13 2,9" />
        </svg>
      )}
      {normalizedCat === 'airtime' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={2.5} />
        </svg>
      )}
      {normalizedCat === 'data' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth={3} />
        </svg>
      )}
      {normalizedCat === 'electricity' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
        </svg>
      )}
    </div>
  )
}

type Filter = 'all' | 'credit' | 'debit' | 'airtime' | 'data' | 'bills' | 'transfer'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'credit', label: 'Credits' },
  { id: 'debit', label: 'Debits' },
  { id: 'transfer', label: 'Transfers' },
  { id: 'airtime', label: 'Airtime' },
  { id: 'data', label: 'Data' },
  { id: 'bills', label: 'Bills' },
]

export default function Transactions() {
  const { 
    transactions, 
    primaryAccount, 
    refreshTransactions,
    hasMoreTransactions, 
    loadMoreTransactions, 
    isLoadingTransactions 
  } = useApp()
  
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)

  //  Always refresh transaction history on screen mount
  useEffect(() => {
    refreshTransactions()
  }, [])

  const activeAccountNum = primaryAccount?.accountNumber

  //  Safe processing of local filters
  const filtered = transactions.filter(tx => {
    if (!tx) return false
    const desc = (tx.description || '').toLowerCase()
    const matchesSearch = desc.includes(search.toLowerCase())
    if (!matchesSearch) return false

    const isCredit = checkIsCredit(tx, activeAccountNum)
    const cat = (tx.category || '').toLowerCase()

    if (filter === 'all') return true
    if (filter === 'credit') return isCredit
    if (filter === 'debit') return !isCredit
    if (filter === 'transfer') return cat === 'transfer'
    if (filter === 'airtime') return cat === 'airtime'
    if (filter === 'data') return cat === 'data'
    if (filter === 'bills') return cat === 'electricity'
    return true
  })

  const groups = groupByDate(filtered)

  const totalCredit = transactions
    .filter(t => checkIsCredit(t, activeAccountNum))
    .reduce((s, t) => s + (t.amount || 0), 0)

  const totalDebit = transactions
    .filter(t => !checkIsCredit(t, activeAccountNum))
    .reduce((s, t) => s + (t.amount || 0), 0)

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      await loadMoreTransactions()
    } finally {
      setLoadingMore(false)
    }
  }

  const getStatusColor = (status?: string) => {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'text-success bg-success/5'
      case 'PENDING':
        return 'text-warning bg-warning/5'
      case 'FAILED':
        return 'text-danger bg-danger/5'
      default:
        return 'text-muted bg-surface'
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto lg:max-w-none pb-8 space-y-5 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-ink font-display">Transaction History</h2>
        <p className="text-muted text-sm mt-0.5">All your NairaWave activity</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Total Credits</p>
          <p className="text-lg font-bold text-emerald-700 font-mono">+₦{fmt(totalCredit)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Total Debits</p>
          <p className="text-lg font-bold text-red-600 font-mono">-₦{fmt(totalDebit)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
              filter === f.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-border text-muted hover:text-ink hover:border-primary/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grouped transactions list */}
      {isLoadingTransactions && transactions.length === 0 ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl py-16 text-center shadow-sm">
          <svg
            className="w-10 h-10 text-subtle mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <p className="text-muted text-sm">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, txs }) => (
            <div key={label} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2.5 px-1">
                {label}
              </p>
              <div className="space-y-2">
                {txs.map(tx => {
                  const isCredit = checkIsCredit(tx, activeAccountNum)
                  const normalizedCat = (tx.category || 'transfer').toLowerCase()
                  const catConfig = CAT_STYLE[normalizedCat] || { label: 'Payment', bg: 'bg-slate-100', text: 'text-slate-600' }
                  
                  return (
                    <div
                      key={tx.id || tx.referenceNumber}
                      className="bg-white border border-border rounded-xl p-3.5 flex items-center gap-3 hover:border-primary/20 transition-all hover:scale-[1.005] duration-150"
                    >
                      <TxIcon cat={tx.category} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{tx.description || 'NairaWave Transaction'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${catConfig.bg} ${catConfig.text}`}>
                            {catConfig.label}
                          </span>
                          <p className="text-xs text-muted">{fmtTime(tx.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-bold font-mono ${
                            isCredit ? 'text-success' : 'text-ink'
                          }`}
                        >
                          {isCredit ? '+' : '-'}₦{fmt(tx.amount || 0)}
                        </p>
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 capitalize ${getStatusColor(tx.status)}`}>
                          {(tx.status || 'COMPLETED').toLowerCase()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Database Pagination Button */}
          {hasMoreTransactions && (
            <div className="pt-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 border border-border rounded-full text-xs font-bold text-ink bg-white hover:border-primary/40 hover:bg-surface transition-all duration-200 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin text-muted" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading more...
                  </>
                ) : (
                  'Show More Transactions'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}