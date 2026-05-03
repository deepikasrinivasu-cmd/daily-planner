'use client'
import { useState } from 'react'
import { useGroceries } from '@/hooks/useSupabase'
import type { Store, GroceryItem } from '@/types/database'

const STORE_COLORS = ['#e63946', '#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#0891b2']

function StoreTab({ store, active, onClick }: { store: Store; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 whitespace-nowrap
        ${active ? 'text-white scale-105' : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
      style={active ? { borderColor: store.color, backgroundColor: `${store.color}33`, color: 'white' } : {}}
    >
      {store.name}
    </button>
  )
}

function GroceryItemRow({ item, onToggle, onDelete }: { item: GroceryItem; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 group px-3 py-2 rounded-xl hover:bg-slate-700/50 transition-colors">
      <button
        onClick={onToggle}
        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${item.checked ? 'bg-green-500 border-green-500' : 'border-slate-500 hover:border-green-400'}`}
      >
        {item.checked && <span className="text-white text-sm">✓</span>}
      </button>
      <span className={`flex-1 text-base ${item.checked ? 'line-through text-slate-500' : 'text-white'}`}>
        {item.name}
      </span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-lg transition-opacity px-1"
      >
        ×
      </button>
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

  const activeStore = stores.find((s) => s.id === activeStoreId) ?? stores[0]
  const storeItems = items.filter((i) => i.store_id === activeStore?.id)
  const checkedCount = storeItems.filter((i) => i.checked).length

  const handleAddItem = async () => {
    if (!newItem.trim() || !activeStore) return
    await addItem(activeStore.id, newItem.trim())
    setNewItem('')
  }

  const handleAddStore = async () => {
    if (!newStoreName.trim()) return
    await addStore(newStoreName.trim(), newStoreColor)
    setNewStoreName('')
    setShowAddStore(false)
  }

  const handleWipe = async () => {
    if (!activeStore) return
    if (showWipeConfirm === 'all') await wipeStore(activeStore.id)
    if (showWipeConfirm === 'checked') await wipeChecked(activeStore.id)
    setShowWipeConfirm(null)
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🛒</span> Groceries
        </div>
        <button
          onClick={() => setShowAddStore(!showAddStore)}
          className="text-sm px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 transition-colors"
        >
          + Store
        </button>
      </div>

      {/* Add store form */}
      {showAddStore && (
        <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-800 border border-slate-700 slide-in-right">
          <input
            className="bg-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none border border-slate-600 focus:border-indigo-500"
            placeholder="Store name..."
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStore()}
          />
          <div className="flex gap-2 flex-wrap">
            {STORE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewStoreColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${newStoreColor === c ? 'scale-125 border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddStore} className="flex-1 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-colors">
              Add Store
            </button>
            <button onClick={() => setShowAddStore(false)} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Store tabs */}
      <div className="flex gap-2 flex-wrap">
        {stores.map((s) => (
          <StoreTab
            key={s.id}
            store={s}
            active={activeStore?.id === s.id}
            onClick={() => setActiveStoreId(s.id)}
          />
        ))}
      </div>

      {activeStore && (
        <>
          {/* Add item */}
          <div className="flex gap-2">
            <input
              className="flex-1 bg-slate-700 text-white rounded-xl px-4 py-3 text-base outline-none border border-slate-600 focus:border-indigo-500 placeholder-slate-500"
              placeholder={`Add to ${activeStore.name}...`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <button
              onClick={handleAddItem}
              className="px-5 py-3 rounded-xl font-bold text-white transition-colors"
              style={{ backgroundColor: activeStore.color }}
            >
              +
            </button>
          </div>

          {/* Items list */}
          <div className="flex flex-col gap-1 flex-1 panel-scroll">
            {storeItems.length === 0 && (
              <div className="text-center text-slate-500 py-8 text-sm">
                Nothing on the list yet!<br />Add items above.
              </div>
            )}
            {storeItems.map((item) => (
              <GroceryItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleItem(item.id, item.checked)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </div>

          {/* Wipe controls */}
          <div className="flex gap-2 pt-2 border-t border-slate-700">
            {showWipeConfirm ? (
              <>
                <span className="text-sm text-slate-400 flex-1 flex items-center">
                  {showWipeConfirm === 'all' ? 'Delete ALL items?' : `Delete ${checkedCount} checked?`}
                </span>
                <button onClick={handleWipe} className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 text-sm hover:bg-red-500/30 transition-colors">
                  Yes, delete
                </button>
                <button onClick={() => setShowWipeConfirm(null)} className="px-3 py-2 rounded-xl bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors">
                  Cancel
                </button>
              </>
            ) : (
              <>
                {checkedCount > 0 && (
                  <button
                    onClick={() => setShowWipeConfirm('checked')}
                    className="flex-1 py-2 rounded-xl text-sm text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
                  >
                    Clear {checkedCount} checked
                  </button>
                )}
                <button
                  onClick={() => setShowWipeConfirm('all')}
                  className="flex-1 py-2 rounded-xl text-sm text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  Wipe all
                </button>
                <button
                  onClick={() => deleteStore(activeStore.id)}
                  className="px-3 py-2 rounded-xl text-sm text-slate-400 border border-slate-600 hover:bg-slate-700 transition-colors"
                  title="Delete store"
                >
                  🗑
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
