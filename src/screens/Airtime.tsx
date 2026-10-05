import { useState } from 'react'
import { useApp } from '../context/AppContext' 

const NETWORKS = [
  { id: 'mtn', name: 'MTN', color: '#FFCC00', textColor: '#333', ring: 'ring-yellow-400' },
  { id: 'airtel', name: 'Airtel', color: '#E40000', textColor: '#fff', ring: 'ring-red-500' },
  { id: 'glo', name: 'Glo', color: '#3B8A2A', textColor: '#fff', ring: 'ring-green-600' },
  { id: '9mobile', name: '9mobile', color: '#00A86B', textColor: '#fff', ring: 'ring-teal-500' },
]

const PRESETS = [100, 200, 500, 1000, 2000, 5000]

export default function Airtime() {
  //  primaryAccount and makePayment 
  const { balance, primaryAccount, makePayment, showToast, navigate, user } = useApp()
  
  const [network, setNetwork] = useState('mtn')
  const [phone, setPhone] = useState(user.phone)
  const [amount, setAmount] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const net = NETWORKS.find(n => n.id === network)!

  const handleSubmit = async () => {
    const amt = Number(amount)
    
    // Client-side validations
    if (!primaryAccount) {
      showToast('No active account found. Please try again later.', 'error')
      return
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      showToast('Enter a valid phone number', 'error')
      return
    }
    if (!amt || amt < 50) {
      showToast('Minimum airtime is ₦50', 'error')
      return
    }
    if (amt > balance) {
      showToast('Insufficient balance', 'error')
      return
    }

    setLoading(true)

    //  Real API Request via AppContext
    try {
      await makePayment({
        accountNumber: primaryAccount.accountNumber,
        amount: amt,
        category: 'airtime',
        provider: net.name.toUpperCase(), // e.g. "MTN", "AIRTEL"
        recipientId: phone,
        description: `${net.name} Airtime top up for ${phone}`,
      })

      // Success sequence
      setDone(true)
      showToast('Airtime purchase successful!', 'success')
      
      setTimeout(() => {
        setDone(false)
        navigate('dashboard')
      }, 2800)
    } catch (err: any) {
      // Pull error message from backend response envelope
      const errMsg = err.response?.data?.message || 'Transaction failed. Please try again.'
      showToast(errMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center animate-in fade-in zoom-in duration-300">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5 text-white font-bold text-xl font-display"
          style={{ background: net.color, color: net.textColor }}
        >
          {net.name.slice(0, 2)}
        </div>
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-5 -mt-8 ml-10">
          <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-ink font-display mb-2">Airtime Delivered!</h2>
        <p className="text-muted text-sm max-w-xs">
          ₦{Number(amount).toLocaleString('en-NG')} {net.name} airtime successfully sent to {phone}
        </p>
      </div>
    )
  }

  const inputCls =
    'w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all'

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto pb-8 space-y-5 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-ink font-display">Buy Airtime</h2>
        <p className="text-muted text-sm mt-0.5">Top up any Nigerian network instantly</p>
      </div>

      {/* Network picker */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Select Network
        </label>
        <div className="grid grid-cols-4 gap-2">
          {NETWORKS.map(n => (
            <button
              key={n.id}
              onClick={() => setNetwork(n.id)}
              disabled={loading}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 disabled:opacity-50 ${
                network === n.id
                  ? `border-current ring-2 ${n.ring} ring-offset-1`
                  : 'border-border bg-white hover:border-border/60 hover:shadow-sm'
              }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold font-display"
                style={{ background: n.color, color: n.textColor }}
              >
                {n.name.slice(0, 3).toUpperCase()}
              </div>
              <span className={`text-xs font-semibold ${network === n.id ? 'text-ink' : 'text-muted'}`}>
                {n.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Phone number */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Phone Number
          </label>
          <button
            onClick={() => setPhone(user.phone)}
            disabled={loading}
            className="text-xs text-primary font-semibold hover:underline disabled:opacity-50"
          >
            Use mine
          </button>
        </div>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="08012345678"
          maxLength={11}
          disabled={loading}
          className={`${inputCls} font-mono`}
        />
      </div>

      {/* Amount presets */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Amount (₦)
        </label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              disabled={loading}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150 ${
                amount === p
                  ? 'bg-primary-50 border-primary text-primary'
                  : 'bg-white border-border text-ink hover:border-primary/40'
              }`}
            >
              ₦{p.toLocaleString('en-NG')}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')}
          placeholder="Or enter custom amount"
          min={50}
          disabled={loading}
          className={`${inputCls} font-mono`}
        />
      </div>

      {/* Balance row */}
      <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border">
        <p className="text-xs text-muted">Wallet Balance</p>
        <p className="text-xs font-bold text-ink font-mono">
          ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !amount || !phone}
        className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg,#005A2F 0%,#003D20 100%)' }}
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : (
          `Buy ${net.name} Airtime${amount ? ` · ₦${Number(amount).toLocaleString('en-NG')}` : ''}`
        )}
      </button>
    </div>
  )
}