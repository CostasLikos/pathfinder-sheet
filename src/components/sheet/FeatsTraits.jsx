import { useState, useMemo, useRef, useEffect } from 'react'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', border: '2px solid var(--accent)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>⚔️ Feat Library</h2>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{ALL_FEATS_RAW.length} feats · showing {results.length}</p>
          </div>
          <button onClick={onClose} className="text-xl" style={{ color: 'var(--text-dim)' }}>✕</button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 flex flex-wrap gap-2" style={{ borderBottom: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-darker)' }}>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search feats, prerequisites..."
            className="input-field text-sm flex-1 min-w-40"
          />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field text-sm" style={{ width: 'auto' }}>
            <option value="">All Types</option>
            {FEAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Feat list */}
          <div className="w-1/2 overflow-y-auto" style={{ borderRight: '1px solid var(--bg-border)' }}>
            {results.length === 0 && (
              <div className="text-center py-10 text-sm" style={{ color: 'var(--text-faint)' }}>No feats found.</div>
            )}
            {results.map((feat, i) => (
              <div key={feat.name + i}
                onClick={() => setSelected(feat)}
                className="flex items-center gap-3 px-4 py-2 cursor-pointer"
                style={{
                  backgroundColor: selected?.name === feat.name ? 'var(--accent-dim)' : i % 2 === 0 ? 'var(--bg-darker)' : 'var(--bg-surface)',
                  borderBottom: '1px solid var(--bg-border)',
                }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: selected?.name === feat.name ? 'var(--accent)' : 'var(--text)' }}>{feat.name}</div>
                  {feat.type && <div className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{feat.type}</div>}
                </div>
              </div>
            ))}
            {results.length === 150 && (
              <div className="text-center py-3 text-xs" style={{ color: 'var(--text-faint)' }}>Showing first 150 — refine your search</div>
            )}
          </div>

          {/* Feat detail */}
          <div className="w-1/2 overflow-y-auto p-5">
            {!selected ? (
              <div className="text-center py-10" style={{ color: 'var(--text-faint)' }}>
                <div className="text-4xl mb-3">⚔️</div>
                <p className="text-sm">Select a feat to see details</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-xl" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>{selected.name}</h3>
                  {selected.type && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}>{selected.type}</span>}
                </div>

                {selected.description && (
                  <p className="text-xs italic" style={{ color: 'var(--text-dim)' }}>{stripHtml(selected.description)}</p>
                )}

                {selected.prerequisite && (
                  <div>
                    <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--accent)' }}>Prerequisites</div>
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{stripHtml(selected.prerequisite)}</p>
                  </div>
                )}

                {selected.benefit && (
                  <div>
                    <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--accent)' }}>Benefit</div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{stripHtml(selected.benefit)}</p>
                  </div>
                )}

                {selected.normal && (
                  <div>
                    <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--text-dim)' }}>Normal</div>
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{stripHtml(selected.normal)}</p>
                  </div>
                )}

                {selected.special && (
                  <div>
                    <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--text-dim)' }}>Special</div>
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{stripHtml(selected.special)}</p>
                  </div>
                )}

                <button
                  onClick={() => addFeat(selected)}
                  className="w-full py-2 rounded font-bold text-sm mt-2"
                  style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--accent-dim)'}
                >
                  + Add to Character
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({ item, index, onUpdate, onRemove, isEven }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: isEven ? 'var(--bg-darker)' : 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <input
          type="text"
          value={item.name}
          onChange={e => onUpdate(index, 'name', e.target.value)}
          placeholder="Name..."
          className="flex-1 bg-transparent font-semibold text-sm focus:outline-none min-w-0"
          style={{ color: 'var(--text)', borderBottom: '1px solid transparent' }}
          onFocus={e => e.target.style.borderBottomColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderBottomColor = 'transparent'}
        />
        <button onClick={() => setExpanded(x => !x)}
          className="text-xs px-2 py-0.5 rounded flex-shrink-0"
          style={{ color: item.desc ? 'var(--accent)' : 'var(--text-faint)', border: `1px solid ${item.desc ? 'var(--accent)' : 'var(--bg-border)'}` }}
          title="View/edit description">
          {expanded ? '▲' : '📝'}
        </button>
        <button onClick={() => onRemove(index)} className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ color: '#ef4444', border: '1px solid var(--bg-border)' }}>✕</button>
      </div>

      {(expanded || item.desc) && (
        <div className="px-3 pb-2" style={{ borderTop: '1px solid var(--bg-border)' }}>
          {expanded ? (
            <textarea
              autoFocus
              value={item.desc}
              onChange={e => onUpdate(index, 'desc', e.target.value)}
              placeholder="Description, effect, prerequisites..."
              rows={4}
              className="w-full text-xs resize-none focus:outline-none mt-2 p-2 rounded"
              style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => { e.target.style.borderColor = 'var(--bg-border)'; if (!item.desc) setExpanded(false) }}
            />
          ) : (
            <p className="text-xs mt-2 cursor-pointer whitespace-pre-line" style={{ color: 'var(--text-dim)' }} onClick={() => setExpanded(true)} title="Click to edit">
              {item.desc}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── List Editor ──────────────────────────────────────────────────────────────

function ListEditor({ title, items, onAdd, onUpdate, onRemove, placeholder, showLibrary }) {
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
        <h3 className="font-bold text-sm" style={{ color: 'var(--accent)' }}>{title}</h3>
        <div className="flex gap-2">
          {showLibrary && (
            <button onClick={showLibrary} className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--accent)', border: '1px solid var(--accent)', backgroundColor: 'var(--accent-dim)' }}>
              ⚔️ Library
            </button>
          )}
          <button onClick={() => setAdding(true)} className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}>
            + Add
          </button>
        </div>
      </div>

      {adding && (
        <div className="rounded-lg p-3 mb-2 space-y-2" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--accent)' }}>
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

      <div className="space-y-1">
        {items.map((item, i) => (
          <ItemRow key={i} item={item} index={i} onUpdate={onUpdate} onRemove={onRemove} isEven={i % 2 === 0} />
        ))}
        {items.length === 0 && <div className="text-xs italic py-2 px-1" style={{ color: 'var(--text-faint)' }}>None added yet</div>}
      </div>
    </div>
  )
}

// ─── Feat List Editor (with search-aware index remapping) ─────────────────────

function FeatListEditor({ feats, search, onAdd, onUpdate, onRemove, showLibrary }) {
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

  const title = `Feats (${feats.length}${q && filtered.length !== feats.length ? ` · ${filtered.length} shown` : ''})`

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h3 className="font-bold text-sm" style={{ color: 'var(--accent)' }}>{title}</h3>
        <div className="flex gap-2">
          <button onClick={showLibrary} className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--accent)', border: '1px solid var(--accent)', backgroundColor: 'var(--accent-dim)' }}>
            ⚔️ Library
          </button>
          <button onClick={() => setAdding(true)} className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}>
            + Add
          </button>
        </div>
      </div>

      {adding && (
        <div className="rounded-lg p-3 mb-2 space-y-2" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--accent)' }}>
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

      <div className="space-y-1">
        {filtered.map((item, i) => (
          <ItemRow key={item._realIndex} item={item} index={i}
            onUpdate={(_, f, v) => onUpdate(item._realIndex, f, v)}
            onRemove={() => onRemove(item._realIndex)}
            isEven={i % 2 === 0} />
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

// ─── Main Component ────────────────────────────────────────────────────────────

export default function FeatsTraits({ character, onChange, pins = {}, onTogglePin }) {
  const [showLibrary, setShowLibrary] = useState(false)
  const [featSearch, setFeatSearch] = useState('')
  const { feats = [], traits = [] } = character

  const addFeat    = (item) => onChange('feats', [...feats, item])
  const removeFeat = (i)    => onChange('feats', feats.filter((_, idx) => idx !== i))
  const updateFeat = (i, f, v) => onChange('feats', feats.map((x, idx) => idx === i ? { ...x, [f]: v } : x))

  const addTrait    = (item) => onChange('traits', [...traits, item])
  const removeTrait = (i)    => onChange('traits', traits.filter((_, idx) => idx !== i))
  const updateTrait = (i, f, v) => onChange('traits', traits.map((x, idx) => idx === i ? { ...x, [f]: v } : x))

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
            showLibrary={() => setShowLibrary(true)}
          />
          <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: '1.5rem' }}>
            <ListEditor
              title={`Traits (${traits.length}/2)`}
              items={traits}
              onAdd={addTrait}
              onUpdate={updateTrait}
              onRemove={removeTrait}
              placeholder="Trait name (e.g. Reactionary)"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
