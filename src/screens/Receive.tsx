import { useState } from 'react'
import { useApp } from '../context/AppContext' 

function CopyBtn({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${
        copied
          ? 'bg-success/10 text-success'
          : 'bg-primary-50 text-primary hover:bg-primary/10'
      }`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20,6 9,17 4,12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy {label}
        </>
      )}
    </button>
  )
}

function QRPlaceholder({ value }: { value: string }) {
  const size = 120
  const cells = 11
  const cellSize = size / cells

  const seeded = (v: string, r: number, c: number) => {
    let h = 0
    for (let i = 0; i < v.length; i++) {
      h = (Math.imul(31, h) + v.charCodeAt(i)) | 0
    }
    return ((h ^ (r * 17 + c * 31)) & 1) === 0
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
      <rect width={size} height={size} fill="white" />
      {Array.from({ length: cells }, (_, r) =>
        Array.from({ length: cells }, (_, c) => {
          const isFinder =
            (r < 3 && c < 3) ||
            (r < 3 && c >= cells - 3) ||
            (r >= cells - 3 && c < 3)
          const on = isFinder ? true : seeded(value, r, c)
          return on ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#005A2F"
            />
          ) : null
        })
      )}
    </svg>
  )
}

export default function Receive() {
  const { user } = useApp()

  const shareDetails = () => {
    const text = `Send money to me on NairaWave!\n\nAccount Name: ${user.name}\nAccount Number: ${user.accountNumber}\nBank: ${user.bankName}`
    if (navigator.share) {
      navigator.share({ title: 'My NairaWave Account', text })
    }
  }

  // Early loading state if accountNumber isn't yet available
  if (!user.accountNumber) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-border rounded" />
          <div className="h-32 w-80 bg-border rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto pb-8 space-y-5 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-ink font-display">Receive Money</h2>
        <p className="text-muted text-sm mt-0.5">Share your account details to receive funds</p>
      </div>

      {/* Main Account Details Card */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div
          className="px-5 py-3 flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg,#005A2F 0%,#003D20 100%)' }}
        >
          <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
            <span className="text-white text-xs font-bold font-display">NW</span>
          </div>
          <p className="text-white/90 text-xs font-semibold uppercase tracking-widest">
            NairaWave Account
          </p>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">
              Account Name
            </p>
            <p className="text-base font-bold text-ink font-display">{user.name}</p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">
                Account Number (NUBAN)
              </p>
              <p className="text-2xl font-bold text-ink font-mono tracking-widest">
                {user.accountNumber}
              </p>
            </div>
            <CopyBtn value={user.accountNumber} label="Number" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">
                Bank Name
              </p>
              <p className="text-sm font-semibold text-ink">{user.bankName}</p>
            </div>
            <CopyBtn value={user.bankName} label="Bank" />
          </div>

          <div className="text-xs text-muted bg-surface rounded-xl px-3 py-2.5">
            Alternatively, send via phone number:{' '}
            <span className="font-semibold text-ink font-mono">{user.phone}</span>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs text-amber-700">
              All major Nigerian banks can transfer to this account number. Funds reflect instantly.
            </p>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-white border border-border rounded-2xl p-5 flex flex-col items-center gap-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest">Scan to Pay</p>
        <div className="p-3 rounded-xl border-2 border-border">
          <QRPlaceholder value={user.accountNumber} />
        </div>
        <p className="text-xs text-muted text-center">
          Scan with any NairaWave app or compatible payment app
        </p>
      </div>

      {/* Share */}
      <button
        onClick={shareDetails}
        className="w-full py-4 rounded-2xl border-2 border-primary text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share Account Details
      </button>
    </div>
  )
}