import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext' // Correct context path
import api from '../api/client' // Direct API client for catalog fetching
import { bankTransferApi } from '../api/transactions' // real transfer/resolution calls

interface Bank {
  name: string
  code: string
}

type Tab = 'wallet' | 'bank'

interface ReceiptData {
  referenceNumber: string
  status: string
  amount: number
  fee: number
  destinationAccountName: string
  destinationAccountNumber: string
  bankName: string
  message: string
}

function StatusReceiptView({ result, onClose }: { result: ReceiptData; onClose: () => void }) {
  const isPending = result.status === 'PENDING'
  const isFailed = result.status === 'FAILED'
  const isSuccess = result.status === 'COMPLETED' || result.status === 'SUCCESS'

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center animate-in fade-in zoom-in duration-300">
      {/* Dynamic Status Icon */}
      {isSuccess && (
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-5">
          <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </div>
      )}

      {isPending && (
        <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-5 animate-pulse">
          <svg className="w-10 h-10 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        </div>
      )}

      {isFailed && (
        <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-5">
          <svg className="w-10 h-10 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      )}

      <h2 className="text-2xl font-bold text-ink font-display mb-1">
        {isSuccess && 'Transfer Successful!'}
        {isPending && 'Transfer Processing'}
        {isFailed && 'Transfer Failed'}
      </h2>

      <p className="text-muted text-sm max-w-xs mb-6">
        {isSuccess && `₦${result.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} has been sent successfully.`}
        {isPending && "This NIP bank transfer is currently being processed by the destination bank. We'll update your feed as soon as it clears."}
        {isFailed && "This transaction could not be completed. Any deducted funds have been automatically returned to your wallet."}
      </p>

      {/* Structured Receipt Box */}
      <div className="w-full max-w-sm bg-white border border-border rounded-2xl p-5 text-left space-y-3 shadow-sm mb-6">
        <div className="flex justify-between items-center py-1">
          <span className="text-xs text-muted font-semibold uppercase tracking-wider">Destination</span>
          <span className="text-sm font-bold text-ink truncate max-w-[200px]">{result.destinationAccountName}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-xs text-muted font-semibold uppercase tracking-wider">Account / Bank</span>
          <span className="text-sm font-semibold text-ink font-mono">{result.destinationAccountNumber} · {result.bankName}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-xs text-muted font-semibold uppercase tracking-wider">Amount</span>
          <span className="text-sm font-bold text-ink font-mono">₦{result.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
        {result.fee > 0 && (
          <div className="flex justify-between items-center py-1">
            <span className="text-xs text-muted font-semibold uppercase tracking-wider">Transaction Fee</span>
            <span className="text-sm font-semibold text-ink font-mono text-danger">₦{result.fee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex justify-between items-center py-1 border-t border-border/60 pt-3">
          <span className="text-xs text-muted font-semibold uppercase tracking-wider">Reference</span>
          <span className="text-xs font-semibold text-muted font-mono truncate max-w-[180px] select-all">{result.referenceNumber}</span>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full max-w-xs py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.98] transition-all"
      >
        Go to Dashboard
      </button>
    </div>
  )
}

export default function SendMoney() {
  const { balance, primaryAccount, transfer, refreshAccounts, refreshTransactions, showToast, navigate, user } = useApp()
  const [tab, setTab] = useState<Tab>('wallet')
  const [banks, setBanks] = useState<Bank[]>([])

  // To-wallet state
  const [wPhone, setWPhone] = useState('')
  const [wAmount, setWAmount] = useState('')
  const [wNote, setWNote] = useState('')
  const [wVerifying, setWVerifying] = useState(false)
  const [wName, setWName] = useState('')
  const [wAcctNum, setWAcctNum] = useState('')

  // To-bank state
  const [bBank, setBBank] = useState('') // Stores Bank Code
  const [bAcct, setBAcct] = useState('')
  const [bName, setBName] = useState('')
  const [bVerifying, setBVerifying] = useState(false)
  const [bAmount, setBAmount] = useState('')
  const [bNarration, setBNarration] = useState('')

  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)

  //  Fetch bank catalog dynamically on mount
  useEffect(() => {
    api.get<ApiEnvelope<Bank[]>>('/catalog/banks')
      .then(({ data }) => setBanks(data.data))
      .catch(() => showToast('Failed to load banks directory', 'error'))
  }, [])

  //  Real-time Resolve NairaWave User via Phone
  useEffect(() => {
    if (wPhone.length === 11) {
      if (wPhone === user.phone) {
        showToast('You cannot transfer money to yourself', 'error')
        return
      }
      setWVerifying(true)
      setWName('')
      setWAcctNum('')

      api.get<ApiEnvelope<{ fullName: string; accountNumber: string }>>(`/users/resolve`, {
        params: { phone: wPhone }
      })
      .then(({ data }) => {
        setWName(data.data.fullName)
        setWAcctNum(data.data.accountNumber)
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'NairaWave user not found'
        showToast(msg, 'error')
      })
      .finally(() => setWVerifying(false))
    } else {
      setWName('')
      setWAcctNum('')
    }
  }, [wPhone, user.phone])

  //  Real-time Resolve Bank Account
  useEffect(() => {
    if (bAcct.length === 10 && bBank) {
      setBVerifying(true)
      setBName('')

      bankTransferApi.resolve(bBank, bAcct)
        .then(({ data }) => {
          setBName(data.data.accountName)
        })
        .catch((err) => {
          const msg = err.response?.data?.message || 'Could not verify account name'
          showToast(msg, 'error')
        })
        .finally(() => setBVerifying(false))
    } else {
      setBName('')
    }
  }, [bAcct, bBank])

  // Reset inputs when switching transfer modes
  const handleTabChange = (targetTab: Tab) => {
    setTab(targetTab)
    setWPhone('')
    setWAmount('')
    setWNote('')
    setWName('')
    setWAcctNum('')
    setBBank('')
    setBAcct('')
    setBName('')
    setBAmount('')
    setBNarration('')
  }

  //  Wallet to Wallet Transfer Action
  const handleWalletSend = async () => {
    const amt = parseFloat(wAmount)
    
    if (!primaryAccount) return
    if (!wPhone || wPhone.length < 11) { showToast('Enter a valid phone number', 'error'); return }
    if (!wAcctNum || !wName) { showToast('Verify the recipient first', 'error'); return }
    if (!amt || amt < 100) { showToast('Minimum transfer is ₦100', 'error'); return }
    if (amt > balance) { showToast('Insufficient balance', 'error'); return }

    setLoading(true)

    try {
      const tx = await transfer({
        sourceAccountNumber: primaryAccount.accountNumber,
        destinationAccountNumber: wAcctNum,
        amount: amt,
        description: wNote || `Transfer to ${wName}`,
        category: 'transfer',
      })

      setReceipt({
        referenceNumber: tx.referenceNumber,
        status: tx.status,
        amount: amt,
        fee: 0,
        destinationAccountName: wName,
        destinationAccountNumber: wAcctNum,
        bankName: 'NairaWave',
        message: 'Transfer successful'
      })
      setDone(true)
      showToast('Transfer completed!', 'success')
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Transfer failed. Check network.'
      showToast(errMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  //  Outward NIP Bank Transfer Action
  const handleBankSend = async () => {
    const amt = parseFloat(bAmount)
    const fee = amt > 5000 ? 10.75 : 0
    const totalDebit = amt + fee

    if (!primaryAccount) return
    if (!bBank) { showToast('Select a bank', 'error'); return }
    if (bAcct.length !== 10) { showToast('Enter a valid 10-digit account number', 'error'); return }
    if (!bName) { showToast('Account not verified yet', 'error'); return }
    if (!amt || amt < 100) { showToast('Minimum transfer is ₦100', 'error'); return }
    if (totalDebit > balance) { showToast('Insufficient balance (including ₦10.75 NIP fee)', 'error'); return }

    setLoading(true)

    try {
      const { data } = await bankTransferApi.transfer({
        sourceAccountNumber: primaryAccount.accountNumber,
        bankCode: bBank,
        destinationAccountNumber: bAcct,
        accountName: bName,
        amount: amt,
        narration: bNarration,
        clientReference: crypto.randomUUID()
      })

      const res = data.data
      setReceipt({
        referenceNumber: res.referenceNumber,
        status: res.status,
        amount: res.amount,
        fee: res.fee,
        destinationAccountName: res.destinationAccountName,
        destinationAccountNumber: res.destinationAccountNumber,
        bankName: banks.find(b => b.code === bBank)?.name || res.bankName,
        message: res.message
      })

      // Force refresh data models across the context
      await Promise.all([refreshAccounts(), refreshTransactions()])
      setDone(true)
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Bank transfer failed'
      showToast(errMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (done && receipt) {
    return <StatusReceiptView result={receipt} onClose={() => { setDone(false); navigate('dashboard') }} />
  }

  const inputCls =
    'w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all'

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto pb-8 animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-ink font-display">Send Money</h2>
        <p className="text-muted text-sm mt-0.5">Transfer funds instantly within Nigeria</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface rounded-2xl p-1 mb-6 border border-border">
        {(['wallet', 'bank'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === t
                ? 'bg-white text-ink shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            {t === 'wallet' ? 'To NairaWave' : 'To Bank Account'}
          </button>
        ))}
      </div>

      {tab === 'wallet' ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Recipient Phone Number
            </label>
            <input
              type="tel"
              value={wPhone}
              onChange={e => setWPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              disabled={loading}
              placeholder="08012345678"
              maxLength={11}
              className={`${inputCls} font-mono`}
            />
            {wVerifying && (
              <p className="text-xs text-primary mt-1.5 pl-1 flex items-center gap-1 animate-pulse">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Looking up user...
              </p>
            )}
            {wName && (
              <div className="mt-2 px-3 py-2 bg-primary-50 rounded-xl border border-primary/20 flex items-center gap-2 animate-in slide-in-from-top-1">
                <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-semibold text-primary">{wName}</p>
                  <p className="text-[10px] text-primary/60 font-mono">NUBAN: {wAcctNum}</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Amount (₦)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">₦</span>
              <input
                type="number"
                value={wAmount}
                disabled={loading}
                onChange={e => setWAmount(e.target.value)}
                placeholder="0.00"
                min={100}
                className={`${inputCls} pl-8 font-mono`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Note (Optional)
            </label>
            <input
              type="text"
              value={wNote}
              disabled={loading}
              onChange={e => setWNote(e.target.value)}
              placeholder="What is this for?"
              className={inputCls}
            />
          </div>

          <div className="flex items-center justify-between py-2 px-1">
            <p className="text-xs text-muted">Available Balance</p>
            <p className="text-xs font-semibold text-ink font-mono">
              ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <button
            onClick={handleWalletSend}
            disabled={loading || !wPhone || !wAmount || !wName}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#005A2F 0%,#003D20 100%)' }}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </>
            ) : (
              `Send${wAmount ? ` ₦${parseFloat(wAmount || '0').toLocaleString('en-NG')}` : ''}`
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Select Bank
            </label>
            <select
              value={bBank}
              disabled={loading}
              onChange={e => { setBBank(e.target.value); setBName('') }}
              className={`${inputCls} appearance-none cursor-pointer`}
            >
              <option value="">-- Choose bank --</option>
              {banks.map(b => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={bAcct}
              disabled={loading}
              onChange={e => { setBAcct(e.target.value.replace(/\D/g, '').slice(0, 10)); setBName('') }}
              placeholder="10-digit NUBAN"
              className={`${inputCls} font-mono`}
            />
            {bVerifying && (
              <p className="text-xs text-primary mt-1.5 pl-1 flex items-center gap-1 animate-pulse">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying account...
              </p>
            )}
            {bName && (
              <div className="mt-2 px-3 py-2 bg-primary-50 rounded-xl border border-primary/20 flex items-center gap-2 animate-in slide-in-from-top-1">
                <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                <p className="text-sm font-semibold text-primary">{bName}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Amount (₦)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">₦</span>
              <input
                type="number"
                value={bAmount}
                disabled={loading}
                onChange={e => setBAmount(e.target.value)}
                placeholder="0.00"
                min={100}
                className={`${inputCls} pl-8 font-mono`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Narration (Optional)
            </label>
            <input
              type="text"
              value={bNarration}
              disabled={loading}
              onChange={e => setBNarration(e.target.value)}
              placeholder="Purpose of transfer"
              className={inputCls}
            />
          </div>

          <div className="flex items-center justify-between py-2 px-1">
            <p className="text-xs text-muted">Available Balance</p>
            <p className="text-xs font-semibold text-ink font-mono">
              ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs text-amber-700">
              Bank transfers are processed instantly via NIP. Transfers above ₦5,000 carry a fee of ₦10.75.
            </p>
          </div>

          <button
            onClick={handleBankSend}
            disabled={loading || !bBank || !bName || !bAmount}
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
              `Send to Bank${bAmount ? ` · ₦${parseFloat(bAmount || '0').toLocaleString('en-NG')}` : ''}`
            )}
          </button>
        </div>
      )}
    </div>
  )
}