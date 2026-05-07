'use client'
import { useState, useCallback } from 'react'
import { useActivities, useBounties, useCoins } from '@/hooks/useSupabase'

const ICONS = ['⭐','🪥','🛏️','🥞','👕','📚','📖','🧹','🛁','😴','🏃','🎨','🎮','🐶','🌳','💊','🥗','🧘','🎵','🚿']
const BOUNTY_ICONS   = ['📱','🍫','⚽','🎬','🏆','🍕','🎠','🍦','🎯','🛹','🎸','🃏']
const BOUNTY_COLORS  = ['#3b82f6','#f59e0b','#22c55e','#ec4899','#8b5cf6','#e63946','#0891b2']

// ── Activities tab ────────────────────────────────────────────────────────────
function ActivitiesTab() {
  const { activities, addActivity, toggleActivity, deleteActivity } = useActivities()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('⭐')
  const [busy, setBusy] = useState(false)

  const handleAdd = useCallback(async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    await addActivity(name.trim(), icon)
    setName('')
    setIcon('⭐')
    setBusy(false)
  }, [name, icon, busy, addActivity])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
        <div className="text-sm font-black text-gray-500 uppercase tracking-wider">Add New Activity</div>
        <div className="flex gap-2 flex-wrap">
          {ICONS.map((i) => (
            <button key={i} onClick={() => setIcon(i)}
              className={`text-2xl w-11 h-11 rounded-xl transition-all border-2 ${icon === i ? 'border-indigo-500 bg-indigo-100 scale-110' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
              {i}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white text-gray-900 rounded-xl px-4 py-3 outline-none border-2 border-gray-200 focus:border-indigo-400 font-semibold"
            placeholder="Activity name…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button onClick={handleAdd} disabled={busy || !name.trim()}
            className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-black transition-colors">
            {busy ? '…' : 'Add'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {activities.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm">
            <span className="text-2xl">{a.icon}</span>
            <span className={`flex-1 text-base font-bold ${a.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{a.name}</span>
            <button onClick={() => toggleActivity(a.id, a.is_active)}
              className={`px-3 py-1.5 rounded-lg text-sm font-black transition-colors border-2 ${a.is_active ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
              {a.is_active ? 'Active' : 'Hidden'}
            </button>
            <button onClick={() => deleteActivity(a.id)}
              className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-lg font-black hover:bg-red-200 transition-colors">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bounties tab ──────────────────────────────────────────────────────────────
function BountiesTab() {
  const { bounties, addBounty, updateBountyThreshold, deleteBounty } = useBounties()
  const [name,      setName]      = useState('')
  const [icon,      setIcon]      = useState('🏆')
  const [threshold, setThreshold] = useState(50)
  const [color,     setColor]     = useState(BOUNTY_COLORS[0])
  const [busy,      setBusy]      = useState(false)
  const [editId,    setEditId]    = useState<string | null>(null)
  const [editVal,   setEditVal]   = useState(50)

  const handleAdd = useCallback(async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    await addBounty({ name: name.trim(), icon, threshold, color })
    setName(''); setIcon('🏆'); setThreshold(50)
    setBusy(false)
  }, [name, icon, threshold, color, busy, addBounty])

  const startEdit = (id: string, current: number) => {
    setEditId(id); setEditVal(current)
  }
  const saveEdit = async () => {
    if (!editId) return
    await updateBountyThreshold(editId, editVal)
    setEditId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
        <div className="text-sm font-black text-gray-500 uppercase tracking-wider">Add New Bounty</div>
        <div className="flex gap-2 flex-wrap">
          {BOUNTY_ICONS.map((i) => (
            <button key={i} onClick={() => setIcon(i)}
              className={`text-2xl w-11 h-11 rounded-xl transition-all border-2 ${icon === i ? 'border-yellow-500 bg-yellow-100 scale-110' : 'border-gray-200 bg-white hover:border-yellow-300'}`}>
              {i}
            </button>
          ))}
        </div>
        <input
          className="bg-white text-gray-900 rounded-xl px-4 py-3 outline-none border-2 border-gray-200 focus:border-yellow-400 font-semibold"
          placeholder="Reward name (e.g. 30 min Screen Time)…"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-600 whitespace-nowrap">Unlock at:</span>
          <input type="range" min={10} max={100} step={5} value={threshold}
            onChange={e => setThreshold(Number(e.target.value))} className="flex-1 accent-yellow-500" />
          <span className="font-black text-yellow-600 text-lg w-12 text-right">{threshold}%</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {BOUNTY_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-9 h-9 rounded-full border-4 transition-transform ${color === c ? 'scale-125 border-gray-900' : 'border-transparent'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <button onClick={handleAdd} disabled={busy || !name.trim()}
          className="py-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-black font-black transition-colors border-2 border-yellow-500">
          {busy ? 'Adding…' : 'Add Bounty'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {bounties.map((b) => (
          <div key={b.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border-2 shadow-sm" style={{ borderColor: `${b.color}66` }}>
            <span className="text-2xl">{b.icon}</span>
            <span className="flex-1 text-base font-bold text-gray-900">{b.name}</span>

            {/* Editable threshold */}
            {editId === b.id ? (
              <div className="flex items-center gap-2">
                <input type="range" min={10} max={100} step={5} value={editVal}
                  onChange={e => setEditVal(Number(e.target.value))}
                  className="w-24 accent-yellow-500" />
                <span className="text-sm font-black" style={{ color: b.color }}>{editVal}%</span>
                <button onClick={saveEdit} className="px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-black">✓</button>
                <button onClick={() => setEditId(null)} className="px-2 py-1 rounded-lg bg-gray-200 text-gray-600 text-xs font-black">✕</button>
              </div>
            ) : (
              <button onClick={() => startEdit(b.id, b.threshold)}
                className="text-sm px-3 py-1 rounded-lg font-black border-2 hover:scale-105 transition-transform"
                style={{ backgroundColor: `${b.color}22`, color: b.color, borderColor: `${b.color}44` }}>
                {b.threshold}%
              </button>
            )}

            <button onClick={() => deleteBounty(b.id)}
              className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-lg font-black hover:bg-red-200 transition-colors">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Resets tab ────────────────────────────────────────────────────────────────
function ResetsTab() {
  const { totalCoins, diamonds, resetCoins, resetDiamonds } = useCoins()
  const [confirmCoins,    setConfirmCoins]    = useState(false)
  const [confirmDiamonds, setConfirmDiamonds] = useState(false)
  const [doneCoins,    setDoneCoins]    = useState(false)
  const [doneDiamonds, setDoneDiamonds] = useState(false)

  const handleResetCoins = async () => {
    await resetCoins(); setConfirmCoins(false); setDoneCoins(true)
    setTimeout(() => setDoneCoins(false), 2500)
  }
  const handleResetDiamonds = async () => {
    await resetDiamonds(); setConfirmDiamonds(false); setDoneDiamonds(true)
    setTimeout(() => setDoneDiamonds(false), 2500)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500 font-semibold px-1">Reset earned totals — e.g. after testing or a fresh start.</p>

      {[
        { label: '🪙 Coins',    current: totalCoins, unit: 'coins',    bg: 'amber',
          confirm: confirmCoins, done: doneCoins, setConfirm: setConfirmCoins, handle: handleResetCoins },
        { label: '💎 Diamonds', current: diamonds, unit: 'diamonds',  bg: 'cyan',
          confirm: confirmDiamonds, done: doneDiamonds, setConfirm: setConfirmDiamonds, handle: handleResetDiamonds },
      ].map(row => (
        <div key={row.label} className={`flex items-center justify-between p-4 rounded-2xl bg-${row.bg}-50 border-2 border-${row.bg}-200`}>
          <div>
            <div className="font-black text-gray-900">{row.label}</div>
            <div className="text-sm text-gray-500 font-semibold">Current: <span className={`font-black text-${row.bg}-700`}>{row.current}</span></div>
          </div>
          {row.done ? (
            <span className="px-4 py-2 rounded-xl bg-green-100 text-green-700 font-black text-sm border-2 border-green-300">✓ Reset!</span>
          ) : row.confirm ? (
            <div className="flex gap-2">
              <button onClick={() => row.setConfirm(false)} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 font-black text-sm border-2 border-gray-200">Cancel</button>
              <button onClick={row.handle} className="px-3 py-2 rounded-xl bg-red-500 text-white font-black text-sm border-2 border-red-600">Yes, reset</button>
            </div>
          ) : (
            <button onClick={() => row.setConfirm(true)}
              className={`px-4 py-2 rounded-xl bg-${row.bg}-400 text-black font-black text-sm border-2 border-${row.bg}-500`}>
              Reset to 0
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ── PIN tab ───────────────────────────────────────────────────────────────────
function PinTab({ currentPin }: { currentPin: string }) {
  const { changePin } = useCoins()
  const [step,     setStep]     = useState<'verify' | 'new' | 'done'>('verify')
  const [current,  setCurrent]  = useState('')
  const [newPin,   setNewPin]   = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState(false)

  const handleVerify = () => {
    if (current === currentPin) { setStep('new'); setError('') }
    else { setError('Incorrect PIN'); setCurrent('') }
  }
  const handleSave = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setError('PIN must be 4 digits'); return }
    if (newPin !== confirm) { setError('PINs do not match'); return }
    setBusy(true)
    await changePin(newPin)
    setStep('done'); setBusy(false)
  }

  if (step === 'done') return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="text-5xl bounce-in">✅</div>
      <div className="text-xl font-black text-green-700">PIN changed!</div>
      <button onClick={() => { setStep('verify'); setCurrent(''); setNewPin(''); setConfirm('') }}
        className="px-6 py-2 rounded-xl bg-indigo-500 text-white font-black text-sm">Change again</button>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500 font-semibold">Change the 4-digit parent passcode.</p>

      {step === 'verify' && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
          <div className="text-sm font-black text-gray-600">Enter current PIN</div>
          <input
            type="password" inputMode="numeric" maxLength={4}
            className="bg-white text-gray-900 rounded-xl px-4 py-3 outline-none border-2 border-gray-200 focus:border-indigo-400 font-black text-2xl tracking-widest text-center"
            placeholder="••••" value={current} onChange={e => setCurrent(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
          <button onClick={handleVerify} disabled={current.length !== 4}
            className="py-3 rounded-xl bg-indigo-500 disabled:opacity-40 text-white font-black transition-colors">
            Verify →
          </button>
        </div>
      )}

      {step === 'new' && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
          <div className="text-sm font-black text-gray-600">New PIN</div>
          <input
            type="password" inputMode="numeric" maxLength={4}
            className="bg-white text-gray-900 rounded-xl px-4 py-3 outline-none border-2 border-gray-200 focus:border-indigo-400 font-black text-2xl tracking-widest text-center"
            placeholder="••••" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <div className="text-sm font-black text-gray-600">Confirm new PIN</div>
          <input
            type="password" inputMode="numeric" maxLength={4}
            className="bg-white text-gray-900 rounded-xl px-4 py-3 outline-none border-2 border-gray-200 focus:border-indigo-400 font-black text-2xl tracking-widest text-center"
            placeholder="••••" value={confirm} onChange={e => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
          <button onClick={handleSave} disabled={busy || newPin.length !== 4 || confirm.length !== 4}
            className="py-3 rounded-xl bg-green-500 disabled:opacity-40 text-white font-black transition-colors">
            {busy ? 'Saving…' : '💾 Save new PIN'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────
type AdminTab = 'activities' | 'bounties' | 'resets' | 'pin'

export default function AdminModal({ onClose, pin }: { onClose: () => void; pin: string }) {
  const [tab, setTab] = useState<AdminTab>('activities')

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'activities', label: '📋 Activities' },
    { id: 'bounties',   label: '🏆 Bounties' },
    { id: 'resets',     label: '🔄 Resets' },
    { id: 'pin',        label: '🔒 PIN' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col" onClick={onClose}>
      <div className="flex-1" />
      <div className="w-full bg-white rounded-t-3xl shadow-2xl flex flex-col bounce-in"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-gray-100 flex-shrink-0">
          <div className="text-xl font-black text-gray-900">⚙️ Parent Settings</div>
          <button onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xl flex items-center justify-center font-black transition-colors">×</button>
        </div>

        {/* Tab bar — scrollable on small screens */}
        <div className="flex gap-2 px-5 py-3 border-b-2 border-gray-100 flex-shrink-0 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-black transition-colors border-2
                ${tab === t.id ? 'bg-indigo-500 text-white border-indigo-500' : 'text-gray-500 border-gray-200 bg-gray-50 hover:border-indigo-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto panel-scroll p-5">
          {tab === 'activities' && <ActivitiesTab />}
          {tab === 'bounties'   && <BountiesTab />}
          {tab === 'resets'     && <ResetsTab />}
          {tab === 'pin'        && <PinTab currentPin={pin} />}
        </div>
      </div>
    </div>
  )
}
