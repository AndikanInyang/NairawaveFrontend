import { useState } from 'react'
import { useApp } from '../context/AppContext' 
import { type TransactionDTO } from '../api/transactions' 

function fmt(n: number) {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

// Handles both Date objects and database ISO strings
function timeAgo(dateInput: Date | string) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 172800) return 'Yesterday'
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

const CAT_STYLE: Record<string, { bg: string; text: string }> = {
  transfer: { bg: 'bg-blue-100', text: 'text-blue-600' },
  airtime: { bg: 'bg-amber-100', text: 'text-amber-600' },
  data: { bg: 'bg-violet-100', text: 'text-violet-600' },
  electricity: { bg: 'bg-orange-100', text: 'text-orange-600' },
  receive: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
}

function TxIcon({ cat }: { cat: string }) {
  const s = CAT_STYLE[cat] || { bg: 'bg-gray-100', text: 'text-gray-600' } // safe fallback
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg} ${s.text}`}>
      {cat === 'receive' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
      {cat === 'transfer' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22,2 15,22 11,13 2,9" />
        </svg>
      )}
      {cat === 'airtime' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={2.5} />
        </svg>
      )}
      {cat === 'data' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth={3} />
        </svg>
      )}
      {cat === 'electricity' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
        </svg>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { balance, primaryAccount, transactions, navigate, user, isLoadingTransactions } = useApp()
  const [showBal, setShowBal] = useState(true)

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Fetch the latest 5 transactions from our database context array
  const recent = transactions.slice(0, 5)

  // Determines credit vs debit based on primary user account status
  const checkIsCredit = (tx: TransactionDTO): boolean => {
    if (tx.type === 'DEPOSIT') return true
    if (tx.category === 'receive') return true
    if (tx.type === 'TRANSFER' && tx.destinationAccountNumber === primaryAccount?.accountNumber) {
      return true
    }
    return false
  }

  const QUICK_ACTIONS = [
    {
      label: 'Airtime',
      screen: 'airtime' as const,
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={2.5} />
        </svg>
      ),
    },
    {
      label: 'Data',
      screen: 'data' as const,
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth={3} />
        </svg>
      ),
    },
    {
      label: 'Electricity',
      screen: 'bills' as const,
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
        </svg>
      ),
    },
    {
      label: 'Transfer',
      screen: 'send' as const,
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22,2 15,22 11,13 2,9" />
        </svg>
      ),
    },
    {
      label: 'History',
      screen: 'transactions' as const,
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth={2.5} />
          <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth={2.5} />
          <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth={2.5} />
        </svg>
      ),
    },
  ]

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto lg:max-w-none space-y-6 pb-8 animate-in fade-in duration-300">

      {/* Greeting */}
      <div>
        <p className="text-muted text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold text-ink font-display">
          {user.name.split(' ')[0]} 👋
        </h1>
      </div>

      {/* Balance Card */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 text-white shadow-lg transition-transform duration-300 hover:scale-[1.01]"
        style={{ background: 'linear-gradient(135deg,#005A2F 0%,#003D20 55%,#002517 100%)' }}
      >
        {/* decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5" />
          <div className="absolute bottom-0 -left-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-12 w-20 h-20 rounded-full bg-white/5" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                Wallet Balance
              </p>
              <p className="text-white/40 text-xs mt-0.5 font-mono">
                {user.bankName} · {user.accountNumber || 'Creating Account...'}
              </p>
            </div>
            <button
              onClick={() => setShowBal(v => !v)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                {showBal ? (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                ) : (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                )}
              </svg>
            </button>
          </div>

          <p className="text-4xl font-bold font-display tracking-tight mb-5">
            {showBal ? `₦${fmt(balance)}` : '₦ ···,···.··'}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('send')}
              className="flex-1 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 transition-all rounded-xl py-2.5 text-sm font-semibold text-white active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22,2 15,22 11,13 2,9" />
              </svg>
              Send
            </button>
            <button
              onClick={() => navigate('receive')}
              className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-amber-400 transition-all rounded-xl py-2.5 text-sm font-semibold text-ink active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Receive
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map(({ label, screen, bg, text, icon }) => (
            <button
              key={screen}
              onClick={() => navigate(screen)}
              className="flex flex-col items-center gap-2.5 bg-white border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg} ${text}`}>
                {icon}
              </div>
              <span className="text-xs font-semibold text-ink">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest">
            Recent Transactions
          </p>
          <button
            onClick={() => navigate('transactions')}
            className="text-xs font-semibold text-primary hover:underline"
          >
            See all
          </button>
        </div>

        {isLoadingTransactions ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-xl p-3.5 flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded w-1/3" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/5" />
                </div>
                <div className="h-3.5 bg-slate-100 rounded w-12" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border py-12 text-center">
            <p className="text-muted text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(tx => {
              const isCredit = checkIsCredit(tx)
              return (
                <div
                  key={tx.id}
                  className="bg-white border border-border rounded-xl p-3.5 flex items-center gap-3 hover:border-primary/20 transition-all duration-150"
                >
                  <TxIcon cat={tx.category} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{tx.description}</p>
                    <p className="text-xs text-muted mt-0.5">{timeAgo(tx.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold font-mono ${
                        isCredit ? 'text-success' : 'text-ink'
                      }`}
                    >
                      {isCredit ? '+' : '-'}₦{fmt(tx.amount)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}