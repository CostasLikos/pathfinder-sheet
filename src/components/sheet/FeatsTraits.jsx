import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import PinButton from '../PinButton'
import ALL_FEATS_RAW from '../../data/feats.json'

// Strip HTML tags that might remain in descriptions
const stripHtml = (str) => (str || '').replace(/<[^>]+>/g, '').trim()

const FEAT_TYPES = [...new Set(ALL_FEATS_RAW.map(f => f.type).filter(Boolean))].sort()

// ─── Feat Library ─────────────────────────────────────────────────────────────

function FeatLibrary({ onAdd, onClose }) {
  const [search, setSearch]     = useState('')
  const [filterType, setFilterType] = useState('')
  const [selected, setSelected] = useState(null)
  const searchRef = useRef()

  useEffect(() => { searchRef.current?.focus() }, [])

  const results = useMemo(() => {
    let list = ALL_FEATS_RAW
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        (f.prerequisite || '').toLowerCase().includes(q) ||
        (f.benefit || '').toLowerCase().includes(q)
      )
    }
    if (filterType) list = list.filter(f => f.type === filterType)
    return list.slice(0, 150)
  }, [search, filterType])

  const addFeat = (feat) => {
    onAdd({
      name: feat.name,
      desc: [
        feat.prerequisite ? `Prerequisites: ${stripHtml(feat.prerequisite)}` : '',
        stripHtml(feat.benefit),
        feat.normal ? `Normal: ${stripHtml(feat.normal)}` : '',
        feat.special ? `Special: ${stripHtml(feat.special)}` : '',
      ].filter(Boolean).join('\n\n'),
    })
    onClose()
  }

  const TYPE_COLORS = {
    'Combat': '#ef4444', 'General': '#22c55e', 'Metamagic': '#a855f7',
    'Item Creation': '#f59e0b', 'Teamwork': '#3b82f6', 'Critical': '#f97316',
  }
  const typeColor = selected ? (TYPE_COLORS[selected.type] ?? 'var(--accent)') : 'var(--accent)'

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-4xl flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '90vh', backgroundColor: 'var(--bg-darker)', border: '2px solid var(--accent)44', boxShadow: '0 0 60px rgba(0,0,0,0.8), 0 0 30px #C9A84C22' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ background: 'linear-gradient(135deg, #C9A84C22, transparent)', borderBottom: '1px solid var(--bg-border)' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '1.5rem' }}>📖</span>
            <div>
              <h2 className="font-bold text-lg leading-none" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>Feat Library</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{ALL_FEATS_RAW.length} feats · {results.length} shown</p>
            </div>
          </div>
          <button onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-all"
            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ef444433'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--bg-border)' }}>
            ✕
          </button>
        </div>

        {/* Search + filter */}
        <div className="px-4 py-3 flex gap-2 flex-wrap" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--bg-border)' }}>
          <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search by name, prerequisite, benefit..."
            className="input-field text-sm flex-1 min-w-40" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="input-field text-sm" style={{ width: 'auto' }}>
            <option value="">All Types</option>
            {FEAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {(search || filterType) && (
            <button onClick={() => { setSearch(''); setFilterType('') }}
              className="text-xs px-2 py-1 rounded"
              style={{ color: 'var(--text-faint)', border: '1px solid var(--bg-border)' }}>
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {/* Feat list */}
          <div className="overflow-y-auto" style={{ width: '42%', borderRight: '1px solid var(--bg-border)' }}>
            {results.length === 0 && (
              <div className="text-center py-10 text-sm" style={{ color: 'var(--text-faint)' }}>No feats found.</div>
            )}
            {results.map((feat, i) => {
              const isSelected = selected?.name === feat.name
              const fc = TYPE_COLORS[feat.type] ?? '#C9A84C'
              return (
                <div key={feat.name + i} onClick={() => setSelected(feat)} className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-all"
                  style={{
                    backgroundColor: isSelected ? '#C9A84C18' : 'transparent',
                    borderBottom: '1px solid var(--bg-border)',
                    borderLeft: `3px solid ${isSelected ? fc : 'transparent'}`,
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-surface)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}>{feat.name}</div>
                    {feat.type && (
                      <span className="text-xs px-1.5 py-0 rounded-full" style={{ backgroundColor: `${fc}18`, color: fc, border: `1px solid ${fc}44`, fontSize: '0.6rem' }}>
                        {feat.type}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            {results.length === 150 && (
              <div className="text-center py-3 text-xs" style={{ color: 'var(--text-faint)' }}>Showing first 150 — refine search</div>
            )}
          </div>

          {/* Feat detail */}
          <div className="flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-faint)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px', opacity: 0.4 }}>📖</div>
                <p className="text-sm">Select a feat from the list</p>
              </div>
            ) : (
              <div>
                {/* Detail header */}
                <div className="px-5 py-4" style={{ background: `linear-gradient(135deg, ${typeColor}18, transparent)`, borderBottom: '1px solid var(--bg-border)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-xl leading-tight" style={{ color: typeColor, fontFamily: 'Georgia,serif' }}>{selected.name}</h3>
                      {selected.type && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ backgroundColor: `${typeColor}22`, color: typeColor, border: `1px solid ${typeColor}55` }}>
                          {selected.type}
                        </span>
                      )}
                    </div>
                    <button onClick={() => addFeat(selected)}
                      className="flex-shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all"
                      style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--bg-darker)' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)' }}>
                      + Add
                    </button>
                  </div>
                </div>

                {/* Detail body */}
                <div className="px-5 py-4 space-y-4">
                  {selected.description && (
                    <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-dim)' }}>{stripHtml(selected.description)}</p>
                  )}
                  {[
                    { label: 'Prerequisites', value: selected.prerequisite, color: '#f59e0b' },
                    { label: 'Benefit',       value: selected.benefit,      color: typeColor },
                    { label: 'Normal',        value: selected.normal,       color: 'var(--text-dim)' },
                    { label: 'Special',       value: selected.special,      color: 'var(--text-dim)' },
                  ].filter(s => s.value).map(({ label, value, color: c }) => (
                    <div key={label} className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-surface)', borderLeft: `3px solid ${c}55` }}>
                      <div className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: c }}>{label}</div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{stripHtml(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  )
}

// ─── Info Card (click-triggered portal) ──────────────────────────────────────

function InfoCard({ name, desc, color, anchorRef, onClose, onEdit }) {
  const tipRef = useRef()
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!anchorRef.current || !tipRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const vw   = window.innerWidth
    const vh   = window.innerHeight
    const tipW = 300
    const tipH = tipRef.current.offsetHeight || 180
    const spaceRight = vw - rect.right - 12
    const spaceLeft  = rect.left - 12
    let left, top
    if (spaceRight >= tipW) {
      left = rect.right + 10
      top  = rect.top + rect.height / 2 - tipH / 2
    } else if (spaceLeft >= tipW) {
      left = rect.left - tipW - 10
      top  = rect.top + rect.height / 2 - tipH / 2
    } else {
      left = Math.max(8, Math.min(vw - tipW - 8, rect.left))
      top  = rect.bottom + 8
    }
    top  = Math.max(8, Math.min(vh - tipH - 8, top))
    left = Math.max(8, Math.min(vw - tipW - 8, left))
    setPos({ top, left })
  }, [anchorRef])

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (tipRef.current && !tipRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    return () => { document.removeEventListener('mousedown', handle); document.removeEventListener('touchstart', handle) }
  }, [onClose, anchorRef])

  // Close on Escape
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  return createPortal(
    <div ref={tipRef}
      className="fixed rounded-xl shadow-2xl"
      style={{
        top: pos.top, left: pos.left, width: 300, zIndex: 10000,
        backgroundColor: 'var(--bg-darker)',
        border: `1px solid ${color}55`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.75), 0 0 0 1px ${color}22`,
      }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2"
        style={{ borderBottom: desc ? `1px solid ${color}22` : 'none' }}>
        <div className="font-bold text-sm leading-snug" style={{ color, fontFamily: 'Georgia, serif' }}>{name}</div>
        <button onClick={onClose} className="text-xs w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
          style={{ color: 'var(--text-faint)', border: '1px solid var(--bg-border)' }}>✕</button>
      </div>
      {/* Body */}
      {desc && (
        <div className="px-3 py-2 max-h-48 overflow-y-auto">
          <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-dim)' }}>{desc}</p>
        </div>
      )}
      {!desc && (
        <p className="px-3 pb-2 text-xs italic" style={{ color: 'var(--text-faint)' }}>No description yet.</p>
      )}
      {/* Footer */}
      <div className="px-3 pb-3 pt-1 flex justify-end">
        <button onClick={() => { onClose(); onEdit() }}
          className="text-xs px-2.5 py-1 rounded font-semibold"
          style={{ color, border: `1px solid ${color}55`, backgroundColor: `${color}11` }}>
          ✎ Edit
        </button>
      </div>
    </div>,
    document.body
  )
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({ item, index, onUpdate, onRemove, onReorder, color = 'var(--accent)' }) {
  const [showInfo, setShowInfo] = useState(false)
  const [editing, setEditing]   = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const rowRef   = useRef()
  const pressRef = useRef(null)

  const cancelPress = () => { if (pressRef.current) { clearTimeout(pressRef.current); pressRef.current = null } }

  const longFired   = useRef(false)
  const didScroll   = useRef(false)
  const touchStart  = useRef({ x: 0, y: 0 })
  const justDragged = useRef(false)

  const startPress2 = (e) => {
    longFired.current = false
    didScroll.current = false
    if (e?.touches?.[0]) { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
    pressRef.current = setTimeout(() => {
      pressRef.current = null
      if (didScroll.current) return
      longFired.current = true
      setEditing(true)
    }, 750)
  }
  const onTouchMove = (e) => {
    if (!pressRef.current) return
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = e.touches[0].clientY - touchStart.current.y
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) { didScroll.current = true; cancelPress() }
  }
  // Only use onClick (not onTouchEnd) — avoids the ghost-click double-fire on mobile
  const handleClick = () => {
    if (justDragged.current) { justDragged.current = false; return }
    cancelPress()
    if (longFired.current) { longFired.current = false; return }
    if (didScroll.current) return
    if (!editing && item.name) setShowInfo(v => !v)
  }

  return (
    <div ref={rowRef}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); const from = Number(e.dataTransfer.getData('text/plain')); if (from !== index) onReorder?.(from, index) }}
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: dragOver ? `${color}11` : 'var(--bg-darker)',
        borderTop:    `1px solid ${editing ? color : dragOver ? color : 'var(--bg-border)'}`,
        borderRight:  `1px solid ${editing ? color : dragOver ? color : 'var(--bg-border)'}`,
        borderBottom: `1px solid ${editing ? color : dragOver ? color : 'var(--bg-border)'}`,
        borderLeft: `3px solid ${color}66`,
        borderRadius: '0.5rem',
        overflow: 'hidden',
        transition: 'border-color 0.15s, background-color 0.1s',
      }}>

      {showInfo && item.name && (
        <InfoCard
          name={item.name} desc={item.desc} color={color}
          anchorRef={rowRef}
          onClose={() => setShowInfo(false)}
          onEdit={() => setEditing(true)}
        />
      )}

      {/* ── View row (not editing) ── */}
      {!editing && (
        <div className="flex items-center gap-1 px-2 py-2 cursor-pointer select-none"
          onMouseDown={startPress2}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress2}
          onTouchMove={onTouchMove}
          onClick={handleClick}
          onDoubleClick={e => { e.stopPropagation(); cancelPress(); setShowInfo(false); setEditing(true) }}>
          <span
            draggable={!!onReorder}
            onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(index)) }}
            onDragEnd={() => { setDragOver(false); justDragged.current = true; setTimeout(() => { justDragged.current = false }, 200) }}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-base leading-none px-1"
            style={{ color: 'var(--text-faint)', opacity: 0.4, userSelect: 'none' }}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
          >⠿</span>
          <span className="flex-1 text-sm font-semibold truncate" style={{ color: item.name ? 'var(--text)' : 'var(--text-faint)' }}>
            {item.name || 'Unnamed…'}
          </span>
          <button
            onClick={e => { e.stopPropagation(); cancelPress(); onRemove(index) }}
            className="text-xs w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0"
            style={{ color: '#ef444488', border: '1px solid #ef444433' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = '#ef444422' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#ef444488'; e.currentTarget.style.backgroundColor = 'transparent' }}>
            ✕
          </button>
        </div>
      )}

      {/* ── Edit row ── */}
      {editing && (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input autoFocus
              type="text"
              value={item.name}
              onChange={e => onUpdate(index, 'name', e.target.value)}
              placeholder="Name..."
              className="flex-1 bg-transparent font-semibold text-sm focus:outline-none min-w-0 px-1"
              style={{ color: 'var(--text)', borderBottom: `1px solid ${color}55` }}
            />
            <button onClick={() => setEditing(false)}
              className="text-xs px-2 py-0.5 rounded font-bold flex-shrink-0"
              style={{ color, border: `1px solid ${color}55`, backgroundColor: `${color}11` }}>
              Done
            </button>
          </div>
          <textarea
            value={item.desc}
            onChange={e => onUpdate(index, 'desc', e.target.value)}
            placeholder="Description, effect, prerequisites..."
            rows={4}
            className="w-full text-xs resize-none focus:outline-none p-2 rounded"
            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-dim)', border: `1px solid ${color}33` }}
            onFocus={e => e.target.style.borderColor = color}
            onBlur={e => e.target.style.borderColor = `${color}33`}
          />
        </div>
      )}
    </div>
  )
}

// ─── List Editor ──────────────────────────────────────────────────────────────

function ListEditor({ title, icon, items, onAdd, onUpdate, onRemove, onReorder, placeholder, showLibrary, color = 'var(--accent)' }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const handleAdd = () => {
    if (!newName.trim()) return
    onAdd({ name: newName.trim(), desc: newDesc.trim() })
    setNewName(''); setNewDesc(''); setAdding(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <h3 className="font-bold text-sm" style={{ color, fontFamily: 'Georgia, serif' }}>{title}</h3>
          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}44` }}>
            {items.length}
          </span>
        </div>
        <div className="flex gap-2">
          {showLibrary && (
            <button onClick={showLibrary} className="text-xs px-2 py-0.5 rounded font-bold"
              style={{ color: 'var(--accent)', border: '1px solid var(--accent)', backgroundColor: 'var(--accent-dim)' }}>
              📖 Library
            </button>
          )}
          <button onClick={() => setAdding(true)} className="text-xs px-2 py-1 rounded-lg font-bold"
            style={{ color, border: `1px solid ${color}55`, backgroundColor: `${color}0d` }}>
            + Add
          </button>
        </div>
      </div>

      {adding && (
        <div className="rounded-lg p-3 mb-2 space-y-2" style={{ backgroundColor: 'var(--bg-darker)', border: `1px solid ${color}` }}>
          <input autoFocus type="text" placeholder={placeholder || 'Name'} value={newName}
            onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            className="input-field text-sm" />
          <textarea placeholder="Description, effect, prerequisites... (optional)" value={newDesc}
            onChange={e => setNewDesc(e.target.value)} rows={2} className="input-field text-sm resize-none" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary text-xs py-1 px-3">Save</button>
            <button onClick={() => setAdding(false)} className="btn-secondary text-xs py-1 px-3">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {items.map((item, i) => (
          <ItemRow key={i} item={item} index={i} onUpdate={onUpdate} onRemove={onRemove} onReorder={onReorder} color={color} />
        ))}
        {items.length === 0 && <div className="text-xs italic py-2 px-1" style={{ color: 'var(--text-faint)' }}>None added yet</div>}
      </div>
    </div>
  )
}

// ─── Feat List Editor (with search-aware index remapping) ─────────────────────

function FeatListEditor({ feats, search, onAdd, onUpdate, onRemove, onReorder, showLibrary, pendingFeat = false }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const q = search.trim().toLowerCase()
  const filtered = q
    ? feats.map((f, i) => ({ ...f, _realIndex: i })).filter(f =>
        f.name.toLowerCase().includes(q) || (f.desc || '').toLowerCase().includes(q))
    : feats.map((f, i) => ({ ...f, _realIndex: i }))

  const handleAdd = () => {
    if (!newName.trim()) return
    onAdd({ name: newName.trim(), desc: newDesc.trim() })
    setNewName(''); setNewDesc(''); setAdding(false)
  }

  const color = '#C9A84C'
  const countLabel = q && filtered.length !== feats.length ? `${filtered.length} / ${feats.length}` : `${feats.length}`

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">⚔️</span>
          <h3 className="font-bold text-sm" style={{ color, fontFamily: 'Georgia, serif' }}>Feats</h3>
          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}44` }}>
            {countLabel}
          </span>
          {pendingFeat && (
            <span className="level-up-pulse text-xs px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e66' }}>
              feat!
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={showLibrary} className="text-xs px-2 py-0.5 rounded font-bold"
            style={{ color: 'var(--accent)', border: '1px solid var(--accent)', backgroundColor: 'var(--accent-dim)' }}>
            📖 Library
          </button>
          <button onClick={() => setAdding(true)} className="text-xs px-2 py-1 rounded-lg font-bold"
            style={{ color, border: `1px solid ${color}55`, backgroundColor: `${color}0d` }}>
            {pendingFeat ? <span className="level-up-pulse" style={{ color: '#22c55e' }}>+ Add</span> : '+ Add'}
          </button>
        </div>
      </div>

      {adding && (
        <div className="rounded-lg p-3 mb-2 space-y-2" style={{ backgroundColor: 'var(--bg-darker)', border: `1px solid ${color}` }}>
          <input autoFocus type="text" placeholder="Feat name (e.g. Power Attack)" value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            className="input-field text-sm" />
          <textarea placeholder="Description, effect, prerequisites... (optional)" value={newDesc}
            onChange={e => setNewDesc(e.target.value)} rows={2} className="input-field text-sm resize-none" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary text-xs py-1 px-3">Save</button>
            <button onClick={() => setAdding(false)} className="btn-secondary text-xs py-1 px-3">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map((item, i) => (
          <ItemRow key={item._realIndex} item={item} index={item._realIndex}
            onUpdate={(_, f, v) => onUpdate(item._realIndex, f, v)}
            onRemove={() => onRemove(item._realIndex)}
            onReorder={!q ? onReorder : undefined}
            color={color} />
        ))}
        {filtered.length === 0 && (
          <div className="text-xs italic py-2 px-1" style={{ color: 'var(--text-faint)' }}>
            {q ? 'No feats match your search.' : 'None added yet'}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Drawback Editor (reuses ItemRow with red color) ─────────────────────────

function DrawbackEditor({ drawbacks, onAdd, onUpdate, onRemove, onReorder }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const color = '#ef4444'

  const handleAdd = () => {
    if (!newName.trim()) return
    onAdd({ name: newName.trim(), desc: newDesc.trim() })
    setNewName(''); setNewDesc(''); setAdding(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <h3 className="font-bold text-sm" style={{ color, fontFamily: 'Georgia, serif' }}>Drawbacks</h3>
          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}44` }}>
            {drawbacks.length}
          </span>
        </div>
        <button onClick={() => setAdding(true)} className="text-xs px-2 py-1 rounded-lg font-bold"
          style={{ color, border: `1px solid ${color}55`, backgroundColor: `${color}0d` }}>
          + Add
        </button>
      </div>

      {adding && (
        <div className="rounded-lg p-3 mb-2 space-y-2" style={{ backgroundColor: 'var(--bg-darker)', border: `1px solid ${color}` }}>
          <input autoFocus type="text" placeholder="Drawback name (e.g. Dependent)" value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            className="input-field text-sm" />
          <textarea placeholder="Description, penalty, effect... (optional)" value={newDesc}
            onChange={e => setNewDesc(e.target.value)} rows={2} className="input-field text-sm resize-none" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary text-xs py-1 px-3">Save</button>
            <button onClick={() => setAdding(false)} className="btn-secondary text-xs py-1 px-3">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {drawbacks.map((item, i) => (
          <ItemRow key={i} item={item} index={i} onUpdate={onUpdate} onRemove={onRemove} onReorder={onReorder} color={color} />
        ))}
        {drawbacks.length === 0 && <div className="text-xs italic py-2 px-1" style={{ color: 'var(--text-faint)' }}>No drawbacks</div>}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function FeatsTraits({ character, onChange, pins = {}, onTogglePin, pendingFeat = false }) {
  const [showLibrary, setShowLibrary] = useState(false)
  const [featSearch, setFeatSearch] = useState('')
  const { feats = [], traits = [], drawbacks = [], features = [] } = character

  const reorder = (key, list) => (from, to) => {
    const arr = [...list]; const [m] = arr.splice(from, 1); arr.splice(to, 0, m); onChange(key, arr)
  }

  const addFeat    = (item) => onChange('feats', [...feats, item])
  const removeFeat = (i)    => onChange('feats', feats.filter((_, idx) => idx !== i))
  const updateFeat = (i, f, v) => onChange('feats', feats.map((x, idx) => idx === i ? { ...x, [f]: v } : x))

  const addTrait    = (item) => onChange('traits', [...traits, item])
  const removeTrait = (i)    => onChange('traits', traits.filter((_, idx) => idx !== i))
  const updateTrait = (i, f, v) => onChange('traits', traits.map((x, idx) => idx === i ? { ...x, [f]: v } : x))

  const addDrawback    = (item) => onChange('drawbacks', [...drawbacks, item])
  const removeDrawback = (i)    => onChange('drawbacks', drawbacks.filter((_, idx) => idx !== i))
  const updateDrawback = (i, f, v) => onChange('drawbacks', drawbacks.map((x, idx) => idx === i ? { ...x, [f]: v } : x))

  const addFeature    = (item) => onChange('features', [...features, item])
  const removeFeature = (i)    => onChange('features', features.filter((_, idx) => idx !== i))
  const updateFeature = (i, f, v) => onChange('features', features.map((x, idx) => idx === i ? { ...x, [f]: v } : x))

  return (
    <div className="space-y-4">
      {showLibrary && <FeatLibrary onAdd={addFeat} onClose={() => setShowLibrary(false)} />}

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Feats & Traits</h2>
          <div className="flex items-center gap-3">
            {onTogglePin && <><PinButton pinned={pins.feats} onToggle={() => onTogglePin('feats')} /><span className="text-xs" style={{color:'var(--text-faint)'}}>feats</span>
            <PinButton pinned={pins.traits} onToggle={() => onTogglePin('traits')} /><span className="text-xs" style={{color:'var(--text-faint)'}}>traits</span></>}
          </div>
        </div>
        <div className="space-y-6">
          {feats.length > 4 && (
            <input
              type="text"
              value={featSearch}
              onChange={e => setFeatSearch(e.target.value)}
              placeholder={`Search ${feats.length} feats...`}
              className="input-field text-sm mb-2"
            />
          )}
          <FeatListEditor
            feats={feats}
            search={featSearch}
            onAdd={addFeat}
            onUpdate={updateFeat}
            onRemove={removeFeat}
            onReorder={reorder('feats', feats)}
            showLibrary={() => setShowLibrary(true)}
            pendingFeat={pendingFeat}
          />
          <div style={{ borderTop: '1px solid #60a5fa33', paddingTop: '1.5rem' }}>
            <ListEditor
              title="Traits"
              icon="✨"
              color="#60a5fa"
              items={traits}
              onAdd={addTrait}
              onUpdate={updateTrait}
              onRemove={removeTrait}
              onReorder={reorder('traits', traits)}
              placeholder="Trait name (e.g. Reactionary)"
            />
          </div>
          <div style={{ borderTop: '1px solid #22c55e33', paddingTop: '1.5rem' }}>
            <ListEditor
              title="Features"
              icon="🌟"
              color="#22c55e"
              items={features}
              onAdd={addFeature}
              onUpdate={updateFeature}
              onRemove={removeFeature}
              onReorder={reorder('features', features)}
              placeholder="Feature name (e.g. Bardic Performance)"
            />
          </div>
          <div style={{ borderTop: '1px solid #ef444433', paddingTop: '1.5rem' }}>
            <DrawbackEditor
              drawbacks={drawbacks}
              onAdd={addDrawback}
              onUpdate={updateDrawback}
              onRemove={removeDrawback}
              onReorder={reorder('drawbacks', drawbacks)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
