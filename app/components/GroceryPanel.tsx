'use client'
import { useState } from 'react'
import { useGroceries } from '@/hooks/useSupabase'
import type { Store, GroceryItem } from '@/types/database'

const STORE_COLORS = ['#e63946','#2563eb','#16a34a','#f59e0b','#8b5cf6','#ec4899','#0891b2']

function StoreTab({ store, active, onClick }: { store: Store; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border-2
        ${active ? 'text-white shadow-md scale-105' : 'bg-white/60 border-transparent text-gray-500 hover:text-gray-700'}`}
      style={active ? { backgroundColor: store.color, borderColor: store.color } : {}}>
      {store.name}
    </button>
  )
}

function GroceryItemRow({ item, onToggle, onDelete }: { item: GroceryItem; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 group px-3 py-3 rounded-2xl bg-white/70 hover:bg-white shadow-sm transition-all">
      <button onClick={onToggle}
        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${item.checked ? 'bg-green-400 border-green-400' : 'border-gray-300 hover:border-green-400'}`}>
        {item.checked && <span className="text-white font-bold text-sm">✓</span>}
      </button>
      <span className={`flex-1 text-base font-semibold ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.name}</span>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-100 text-red-400 hover:bg-red-200 flex items-center justify-center text-lg transition-all">×</button>
    </div>
  )
}

export default function GroceryPanel() {
  const { stores, items, addStore, deleteStore, addItem, toggleItem, deleteItem, wipeStore, wipeChecked } = useGroceries()
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState('')
  const [showAddStore, setShowAddStore] = useState(false)
  const [newStoreName, setNewStoreName] = useState('')
  const [newStoreColor, setNewStoreColor] = useState(STORE_COLORS[0])
  const [showWipeConfirm, setShowWipeConfirm] = useState<'all' | 'checked' | null>(null)

  const activeStore = stores.find(s => s.id === activeStoreId) ?? stores[0]
  const storeItems = items.filter(i => i.store_id === activeStore?.id)
  const checkedCount = storeItems.filter(i => i.checked).length

  const handleAddItem = async () => {
    if (!newItem.trim() || !activeStore) return
    await addItem(activeStore.id, newItem.trim())
    setNewItem('')
  }

  const handleAddStore = async () => {
    if (!newStoreName.trim()) return
    await addStore(newStoreName.trim(), newStoreColor)
    setNewStoreName(''); setShowAddStore(false)
  }

  const handleWipe = async () => {
    if (!activeStore) return
    if (showWipeConfirm === 'all') await wipeStore(activeStore.id)
    if (showWipeConfirm === 'checked') await wipeChecked(activeStore.id)
    setShowWipeConfirm(null)
  }

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <div className="text-2xl font-black text-violet-800">Groceries 🛒</div>
          <div className="text-violet-500 text-sm font-medium">Tap items to check off</div>
        </div>
        <button onClick={() => setShowAddStore(!showAddStore)}
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold text-sm shadow hover:shadow-lg transition-all">
          + Store
        </button>
      </div>

      {showAddStore && (
        <div className="flex-shrink-0 flex flex-col gap-2 p-4 rounded-2xl bg-white/80 shadow-lg slide-in-right border border-violet-100">
          <input className="bg-white rounded-xl px-3 py-2 text-sm outline-none border border-violet-200 focus:border-violet-400 text-gray-800"
            placeholder="Store name..." value={newStoreName} onChange={e => setNewStoreName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddStore()} />
          <div className="flex gap-2 flex-wrap">
            {STORE_COLORS.map(c => (
              <button key={c} onClick={() => setNewStoreColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${newStoreColor === c ? 'scale-125 border-gray-800' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddStore} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold text-sm">Add Store</button>
            <button onClick={() => setShowAddStore(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-shrink-0 flex gap-2 flex-wrap">
        {stores.map(s => <StoreTab key={s.id} store={s} active={activeStore?.id === s.id} onClick={() => setActiveStoreId(s.id)} />)}
      </div>

      {activeStore && (
        <>
          <div className="flex-shrink-0 flex gap-2">
            <input className="flex-1 bg-white rounded-2xl px-4 py-3 text-base outline-none border-2 border-transparent focus:border-violet-300 shadow text-gray-700 placeholder-gray-400"
              placeholder={`Add to ${activeStore.name}...`} value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddItem()} />
            <button onClick={handleAddItem}
              className="w-12 h-12 rounded-2xl font-black text-xl text-white shadow hover:shadow-lg transition-all flex items-center justify-center"
              style={{ backgroundColor: activeStore.color }}>+</button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto panel-scroll flex flex-col gap-2">
            {storeItems.length === 0 && (
              <div className="text-center text-gray-400 py-8 bg-white/50 rounded-2xl text-sm">Nothing here yet!<br />Add items above.</div>
            )}
            {storeItems.map(item => (
              <GroceryItemRow key={item.id} item={item} onToggle={() => toggleItem(item.id, item.checked)} onDelete={() => deleteItem(item.id)} />
            ))}
          </div>

          <div className="flex-shrink-0 flex gap-2 pt-2 border-t border-white/60">
            {showWipeConfirm ? (
              <>
                <span className="text-sm text-gray-500 flex-1 flex items-center font-medium">
                  {showWipeConfirm === 'all' ? 'Delete ALL items?' : `Delete ${checkedCount} checked?`}
                </span>
                <button onClick={handleWipe} className="px-3 py-2 rounded-xl bg-red-100 text-red-500 font-bold text-sm hover:bg-red-200 transition-colors">Yes</button>
                <button onClick={() => setShowWipeConfirm(null)} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm">No</button>
              </>
            ) : (
              <>
                {checkedCount > 0 && (
                  <button onClick={() => setShowWipeConfirm('checked')}
                    className="flex-1 py-2 rounded-xl text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors">
                    Clear {checkedCount} ✓
                  </button>
                )}
                <button onClick={() => setShowWipeConfirm('all')}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                  Wipe all
                </button>
                <button onClick={() => deleteStore(activeStore.id)}
                  className="px-3 py-2 rounded-xl text-sm bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">🗑</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
