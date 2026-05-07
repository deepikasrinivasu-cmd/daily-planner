'use client'
import { useState } from 'react'

export default function PinModal({
  onSuccess,
  onClose,
  passcode = '8689',
  title = '🔒 Parent Settings',
}: {
  onSuccess: () => void
  onClose: () => void
  passcode?: string
  title?: string
}) {
  const [entered, setEntered] = useState('')
  const [shake,   setShake]   = useState(false)

  const handleDigit = (d: string) => {
    if (entered.length >= 4) return
    const next = entered + d
    setEntered(next)
    if (next.length === 4) {
      if (next === passcode) {
        setTimeout(() => onSuccess(), 150)
      } else {
        setShake(true)
        setTimeout(() => { setEntered(''); setShake(false) }, 600)
      }
    }
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className={`bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-8 w-80 flex flex-col items-center gap-6 bounce-in ${shake ? 'wiggle' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-2xl font-black text-white">{title}</div>
        <div className="text-slate-400 text-sm">Enter passcode</div>

        <div className="flex gap-4">
          {[0,1,2,3].map((i) => (
            <div key={i}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${i < entered.length ? 'bg-indigo-500 border-indigo-400 scale-110' : 'border-slate-600'}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 w-full">
          {KEYS.map((k, idx) => (
            k === '' ? <div key={idx} /> :
            k === '⌫' ? (
              <button key={idx} onClick={() => setEntered(p => p.slice(0, -1))}
                className="h-16 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-2xl font-bold transition-colors active:scale-95 flex items-center justify-center">
                {k}
              </button>
            ) : (
              <button key={idx} onClick={() => handleDigit(k)}
                className="h-16 rounded-2xl bg-slate-700 hover:bg-indigo-600 text-white text-2xl font-bold transition-colors active:scale-95">
                {k}
              </button>
            )
          ))}
        </div>

        <button onClick={onClose} className="text-slate-500 text-sm hover:text-slate-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
