'use client'
import { useState, useEffect, useRef } from 'react'
import { useGroceries } from '@/hooks/useSupabase'
import type { Store, GroceryItem } from '@/types/database'

const STORE_COLORS = ['#e63946','#2563eb','#16a34a','#f59e0b','#8b5cf6','#ec4899','#0891b2']

function StoreTab({ store, active, onClick }: { store: Store; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-2xl text-sm font-black transition-all whitespace-nowrap border-2
        ${active ? 'text-white shadow-md scale-105 border-black' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}
      style={active ? { backgroundColor: store.color } : {}}>
      {store.name}
    </button>
  )
}

function GroceryItemRow({
  item, isNew, isFlashing, onToggle, onDelete,
}: {
  item: GroceryItem
  isNew: boolean
  isFlashing: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div className={`flex items-center gap-3 group px-3 py-3 rounded-2xl border-2 shadow-sm transition-all
      ${isFlashing ? 'grocery-flash' : ''}
      ${isNew && !item.checked ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
      <button onClick={onToggle}
        className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400 bg-white'}`}>
        {item.checked && <span className="text-white font-black text-base">✓</span>}
      </button>
      <span className={`flex-1 text-base font-bold ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {item.name}
      </span>
      {isNew && !item.checked && (
        <span className="new-badge text-xs font-black text-yellow-700 bg-yellow-200 px-2 py-0.5 rounded-full flex-shrink-0">
          NEW ✨
        </span>
      )}
      <button onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-lg font-black transition-all">
        ×
      </button>
    </div>
  )
}

export default function GroceryPanel() {
  const { stores, items, addStore, deleteStore, addItem, toggleItem, deleteItem, wipeStore, wipeChecked } = useGroceries()
  const [activeStoreId,   setActiveStoreId]   = useState<string | null>(null)
  const [newItem,         setNewItem]         = useState('')
  const [showAddStore,    setShowAddStore]    = useState(false)
  const [newStoreName,    setNewStoreName]    = useState('')
  const [newStoreColor,   setNewStoreColor]   = useState(STORE_COLORS[0])
  const [showWipeConfirm, setShowWipeConfirm] = useState<'all' | 'checked' | null>(null)
  const [wiping,          setWiping]          = useState(false)

  // Track which items are "new" (added after this tab was opened)
  const mountedAt    = useRef(new Date().toISOString())
  const prevIds      = useRef<Set<string>>(new Set())
  const [flashIds,   setFlashIds]   = useState<Set<string>>(new Set())

  // Detect items that arrive via realtime while the tab is open
  useEffect(() => {
    const currentIds = new Set(items.map(i => i.id))
    if (prevIds.current.size > 0) {
      // Find IDs that weren't in the previous render
      const arrived = items.filter(i => !prevIds.current.has(i.id)).map(i => i.id)
      if (arrived.length > 0) {
        const arrivedSet = new Set(arrived)
        setFlashIds(prev => new Set([...prev, ...arrivedSet]))
        setTimeout(() => {
          setFlashIds(prev => {
            const next = new Set(prev)
            arrivedSet.forEach(id => next.delete(id))
            return next
          })
        }, 2000)
      }
    }
    prevIds.current = currentIds
  }, [items])

  const activeStore  = stores.find(s => s.id === activeStoreId) ?? stores[0]
  const storeItems   = items.filter(i => i.store_id === activeStore?.id)
  const checkedCount = storeItems.filter(i => i.checked).length

  // Sort: new unchecked items first (newest at top), then old unchecked, then checked
  const isNewItem = (item: GroceryItem) => item.created_at > mountedAt.current
  const newUnchecked = storeItems.filter(i => !i.checked && isNewItem(i))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const oldUnchecked = storeItems.filter(i => !i.checked && !isNewItem(i))
  const checkedItems = storeItems.filter(i => i.checked)
  const sortedItems  = [...newUnchecked, ...oldUnchecked, ...checkedItems]

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
    if (!activeStore || wiping) return
    setWiping(true)
    try {
      if (showWipeConfirm === 'all')     await wipeStore(activeStore.id)
      if (showWipeConfirm === 'checked') await wipeChecked(activeStore.id)
    } finally {
      setWiping(false)
      setShowWipeConfirm(null)
    }
  }

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <div className="text-2xl font-black text-gray-900">Groceries 🛒</div>
          <div className="text-gray-500 text-sm font-semibold">Tap items to check off</div>
        </div>
        <button onClick={() => setShowAddStore(!showAddStore)}
          className="px-4 py-2 rounded-2xl font-black text-sm text-black shadow border-2 border-black"
          style={{ backgroundColor: '#FF9F1C' }}>
          + Store
        </button>
      </div>

      {showAddStore && (
        <div className="flex-shrink-0 flex flex-col gap-2 p-4 rounded-2xl bg-white shadow-lg border-2 border-gray-200 slide-in-right">
          <input className="bg-gray-50 rounded-xl px-3 py-2 text-sm outline-none border-2 border-gray-200 focus:border-orange-400 text-gray-900 font-semibold"
            placeholder="Store name..." value={newStoreName} onChange={e => setNewStoreName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddStore()} />
          <div className="flex gap-2 flex-wrap">
            {STORE_COLORS.map(c => (
              <button key={c} onClick={() => setNewStoreColor(c)}
                className={`w-9 h-9 rounded-full border-4 transition-transform ${newStoreColor === c ? 'scale-125 border-gray-900' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddStore}
              className="flex-1 py-2 rounded-xl font-black text-sm text-black border-2 border-black"
              style={{ backgroundColor: '#FF9F1C' }}>Add Store</button>
            <button onClick={() => setShowAddStore(false)}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-black text-sm border-2 border-gray-200">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-shrink-0 flex gap-2 flex-wrap">
        {stores.map(s => (
          <StoreTab key={s.id} store={s} active={activeStore?.id === s.id} onClick={() => setActiveStoreId(s.id)} />
        ))}
      </div>

      {activeStore && (
        <>
          <div className="flex-shrink-0 flex gap-2">
            <input
              className="flex-1 bg-white rounded-2xl px-4 py-3 text-base outline-none border-2 border-gray-200 focus:border-orange-400 text-gray-800 font-semibold placeholder-gray-400 shadow-sm"
              placeholder={`Add to ${activeStore.name}...`}
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddItem()} />
            <button onClick={handleAddItem}
              className="w-12 h-12 rounded-2xl font-black text-xl text-white shadow-md border-2 border-black flex items-center justify-center"
              style={{ backgroundColor: activeStore.color }}>+</button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto panel-scroll flex flex-col gap-2">
            {sortedItems.length === 0 && (
              <div className="text-center text-gray-400 py-10 bg-white rounded-2xl text-sm border-2 border-dashed border-gray-200 font-semibold">
                Nothing here yet!<br />Add items above.
              </div>
            )}
            {sortedItems.map(item => (
              <GroceryItemRow
                key={item.id}
                item={item}
                isNew={isNewItem(item)}
                isFlashing={flashIds.has(item.id)}
                onToggle={() => toggleItem(item.id, item.checked)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </div>

          <div className="flex-shrink-0 flex gap-2 pt-2 border-t-2 border-gray-200">
            {showWipeConfirm ? (
              <>
                <span className="text-sm text-gray-700 flex-1 flex items-center font-bold">
                  {showWipeConfirm === 'all' ? 'Delete ALL items?' : `Delete ${checkedCount} checked?`}
                </span>
                <button onClick={handleWipe} disabled={wiping}
                  className={`px-4 py-2 rounded-xl font-black text-sm text-white transition-all
                    ${wiping ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 active:scale-95'}`}>
                  {wiping ? '…' : 'Yes'}
                </button>
                <button onClick={() => setShowWipeConfirm(null)} disabled={wiping}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-black text-sm border-2 border-gray-200">No</button>
              </>
            ) : (
              <>
                {checkedCount > 0 && (
                  <button onClick={() => setShowWipeConfirm('checked')}
                    className="flex-1 py-2 rounded-xl text-sm font-black text-black border-2 border-black"
                    style={{ backgroundColor: '#FFD60A' }}>
                    Clear {checkedCount} ✓
                  </button>
                )}
                <button onClick={() => setShowWipeConfirm('all')}
                  className="flex-1 py-2 rounded-xl text-sm font-black text-white bg-red-500 border-2 border-red-600">
                  Wipe all
                </button>
                <button onClick={() => deleteStore(activeStore.id)}
                  className="px-3 py-2 rounded-xl text-sm bg-gray-100 text-gray-600 border-2 border-gray-200 font-bold">
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
