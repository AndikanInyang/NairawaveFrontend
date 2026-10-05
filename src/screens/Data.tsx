import { useState } from 'react'
import { useApp } from '../context/AppContext' 

const NETWORKS = [
  { id: 'mtn', name: 'MTN', color: '#FFCC00', textColor: '#333', ring: 'ring-yellow-400' },
  { id: 'airtel', name: 'Airtel', color: '#E40000', textColor: '#fff', ring: 'ring-red-500' },
  { id: 'glo', name: 'Glo', color: '#3B8A2A', textColor: '#fff', ring: 'ring-green-600' },
  { id: '9mobile', name: '9mobile', color: '#00A86B', textColor: '#fff', ring: 'ring-teal-500' },
]

interface DataPlan {
  id: string
  size: string
  price: number
  validity: string
  badge?: string
}

const PLANS: Record<string, DataPlan[]> = {
  mtn: [
    { id: 'm1', size: '500MB', price: 200, validity: '1 day' },
    { id: 'm2', size: '1GB', price: 300, validity: '1 day' },
    { id: 'm3', size: '2GB', price: 500, validity: '7 days' },
    { id: 'm4', size: '5GB', price: 1500, validity: '30 days', badge: 'Popular' },
    { id: 'm5', size: '10GB', price: 2500, validity: '30 days' },
    { id: 'm6', size: '20GB', price: 3000, validity: '30 days', badge: 'Best Value' },
    { id: 'm7', size: '40GB', price: 6000, validity: '30 days' },
    { id: 'm8', size: '100GB', price: 15000, validity: '30 days' },
  ],
  airtel: [
    { id: 'a1', size: '500MB', price: 200, validity: '1 day' },
    { id: 'a2', size: '1.5GB', price: 500, validity: '7 days' },
    { id: 'a3', size: '3GB', price: 1000, validity: '30 days' },
    { id: 'a4', size: '6GB', price: 1500, validity: '30 days', badge: 'Popular' },
    { id: 'a5', size: '10GB', price: 2500, validity: '30 days' },
    { id: 'a6', size: '25GB', price: 4000, validity: '30 days', badge: 'Best Value' },
    { id: 'a7', size: '50GB', price: 8000, validity: '30 days' },
  ],
  glo: [
    { id: 'g1', size: '1GB', price: 200, validity: '1 day' },
    { id: 'g2', size: '2.9GB', price: 500, validity: '7 days' },
    { id: 'g3', size: '5.8GB', price: 1000, validity: '30 days', badge: 'Popular' },
    { id: 'g4', size: '7.7GB', price: 1500, validity: '30 days' },
    { id: 'g5', size: '15.36GB', price: 3000, validity: '30 days', badge: 'Best Value' },
    { id: 'g6', size: '38.4GB', price: 5000, validity: '30 days' },
  ],
  '9mobile': [
    { id: 'e1', size: '500MB', price: 200, validity: '1 day' },
    { id: 'e2', size: '1.5GB', price: 500, validity: '30 days' },
    { id: 'e3', size: '3GB', price: 1000, validity: '30 days', badge: 'Popular' },
    { id: 'e4', size: '5GB', price: 1500, validity: '30 days' },
    { id: 'e5', size: '11.5GB', price: 3000, validity: '30 days', badge: 'Best Value' },
    { id: 'e6', size: '22GB', price: 5000, validity: '30 days' },
  ],
}

export default function Data() {
  const { balance, primaryAccount, makePayment, showToast, navigate, user } = useApp()
  const [network, setNetwork] = useState('mtn')
  const [phone, setPhone] = useState(user.phone)
  const [plan, setPlan] = useState<DataPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const net = NETWORKS.find(n => n.id === network)!
  const plans = PLANS[network] ?? []

  const handleNetworkChange = (id: string) => {
    setNetwork(id)
    setPlan(null)
  }

  const handleSubmit = async () => {
    //  Client-side validations
    if (!primaryAccount) {
      showToast('No active account found. Please try again later.', 'error')
      return
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      showToast('Enter a valid phone number', 'error')
      return
    }
    if (!plan) {
      showToast('Select a data plan', 'error')
      return
    }
    if (plan.price > balance) {
      showToast('Insufficient balance', 'error')
      return
    }

    setLoading(true)

    //  Execute actual payment request to backend
    try {
      await makePayment({
        accountNumber: primaryAccount.accountNumber,
        amount: plan.price,
        category: 'data',
        provider: net.name.toUpperCase(), // MTN, AIRTEL, GLO, 9MOBILE
        recipientId: phone,
        description: `${net.name} ${plan.size} Data bundle top-up for ${phone}`,
      })

      // Success sequence
      setDone(true)
      showToast('Data bundle purchase successful!', 'success')

      setTimeout(() => {
        setDone(false)
        navigate('dashboard')
      }, 2800)
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Transaction failed. Please check connection.'
      showToast(errMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (done && plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-5">
          <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-ink font-display mb-2">Data Activated!</h2>
        <p className="text-muted text-sm max-w-xs">
          {net.name} {plan.size} data plan successfully activated on {phone}. Valid for {plan.validity}.
        </p>
      </div>
    )
  }

  const inputCls =
    'w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all'

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto pb-8 space-y-5 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-ink font-display">Buy Data</h2>
        <p className="text-muted text-sm mt-0.5">Purchase data bundles for any Nigerian network</p>
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
              onClick={() => handleNetworkChange(n.id)}
              disabled={loading}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 disabled:opacity-50 ${
                network === n.id
                  ? `border-current ring-2 ${n.ring} ring-offset-1`
                  : 'border-border bg-white hover:shadow-sm'
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

      {/* Phone */}
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

      {/* Plans */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Select Data Plan
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => setPlan(p)}
              disabled={loading}
              className={`relative flex flex-col gap-0.5 p-3.5 rounded-2xl border-2 text-left transition-all duration-150 ${
                plan?.id === p.id
                  ? 'bg-primary-50 border-primary'
                  : 'bg-white border-border hover:border-primary/40'
              }`}
            >
              {p.badge && (
                <span
                  className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white animate-pulse"
                  style={{ background: net.color, color: net.textColor }}
                >
                  {p.badge}
                </span>
              )}
              <p className={`text-base font-bold font-display ${plan?.id === p.id ? 'text-primary' : 'text-ink'}`}>
                {p.size}
              </p>
              <p className={`text-lg font-bold font-mono ${plan?.id === p.id ? 'text-primary' : 'text-ink'}`}>
                ₦{p.price.toLocaleString('en-NG')}
              </p>
              <p className="text-xs text-muted mt-0.5">{p.validity}</p>
            </button>
          ))}
        </div>
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
        disabled={loading || !plan || !phone}
        className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg,#005A2F 0%,#003D20 100%)' }}
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Purchasing...
          </>
        ) : plan ? (
          `Buy ${net.name} ${plan.size} · ₦${plan.price.toLocaleString('en-NG')}`
        ) : (
          'Select a Plan to Continue'
        )}
      </button>
    </div>
  )
}