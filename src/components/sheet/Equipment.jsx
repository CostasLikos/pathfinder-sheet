import { useState } from 'react'
import PinButton from '../PinButton'

// PF1e encumbrance limits by STR score
const ENCUMBRANCE = {
  1:  [3,   6,   10],
  2:  [6,   13,  20],
  3:  [10,  20,  30],
  4:  [13,  26,  40],
  5:  [16,  33,  50],
  6:  [20,  40,  60],
  7:  [23,  46,  70],
  8:  [26,  53,  80],
  9:  [30,  60,  90],
  10: [33,  66,  100],
  11: [38,  76,  115],
  12: [43,  86,  130],
  13: [50,  100, 150],
  14: [58,  116, 175],
  15: [66,  133, 200],
  16: [76,  153, 230],
  17: [86,  173, 260],
  18: [100, 200, 300],
  19: [116, 233, 350],
  20: [133, 266, 400],
  21: [153, 306, 460],
  22: [173, 346, 520],
  23: [200, 400, 600],
  24: [233, 466, 700],
  25: [266, 533, 800],
  26: [306, 613, 920],
  27: [346, 693, 1040],
  28: [400, 800, 1200],
  29: [466, 933, 1400],
  30: [533, 1066, 1600],
}

function getEncumbrance(str, totalWeight) {
  const limits = ENCUMBRANCE[Math.min(30, Math.max(1, str))] ?? ENCUMBRANCE[10]
  if (totalWeight <= limits[0]) return { label: 'Light Load',  color: 'var(--positive)', max: limits[0] }
  if (totalWeight <= limits[1]) return { label: 'Medium Load', color: 'var(--warning)',  max: limits[1] }
  if (totalWeight <= limits[2]) return { label: 'Heavy Load',  color: '#f97316',         max: limits[2] }
  return { label: 'Overloaded', color: '#ef4444', max: limits[2] }
}

const CATEGORIES = ['General', 'Weapon', 'Armor', 'Magic Item', 'Potion', 'Scroll', 'Wand', 'Tool', 'Consumable', 'Valuables', 'Other']

const CATEGORY_ICONS = {
  General: '🎒', Weapon: '⚔️', Armor: '🛡️', 'Magic Item': '✨',
  Potion: '⚗️', Scroll: '📜', Wand: '🪄', Tool: '🔧',
  Consumable: '🍖', Valuables: '💎', Other: '📦',
}

const emptyItem = () => ({
  id: crypto.randomUUID(),
  name: '',
  category: 'General',
  qty: 1,
  weight: 0,
  notes: '',
})

function ItemRow({ item, onUpdate, onRemove }) {
  const [showNotes, setShowNotes] = useState(false)
  const totalWeight = (item.qty ?? 1) * (item.weight ?? 0)

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-darker)' }}>
      <div className="flex items-center gap-2 p-2">
        {/* Category icon */}
        <span className="text-lg flex-shrink-0 w-7 text-center">{CATEGORY_ICONS[item.category] ?? '📦'}</span>

        {/* Name */}
        <input
          type="text"
          value={item.name}
          onChange={e => onUpdate('name', e.target.value)}
          placeholder="Item name..."
          className="flex-1 bg-transparent text-sm font-semibold focus:outline-none min-w-0"
          style={{ color: 'var(--text)', borderBottom: '1px solid transparent' }}
          onFocus={e => e.target.style.borderBottomColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderBottomColor = 'transparent'}
        />

        {/* Category */}
        <select
          value={item.category}
          onChange={e => onUpdate('category', e.target.value)}
          className="text-xs px-1 py-0.5 rounded focus:outline-none hidden md:block"
          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Qty */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onUpdate('qty', Math.max(0, (item.qty ?? 1) - 1))}
            className="w-6 h-6 flex items-center justify-center rounded text-sm font-bold"
            style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}
          >−</button>
          <input
            type="number"
            value={item.qty ?? 1}
            min={0}
            onChange={e => onUpdate('qty', Math.max(0, Number(e.target.value)))}
            className="w-10 text-center text-sm font-bold focus:outline-none rounded"
            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--bg-border)' }}
          />
          <button
            onClick={() => onUpdate('qty', (item.qty ?? 1) + 1)}
            className="w-6 h-6 flex items-center justify-center rounded text-sm font-bold"
            style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}
          >+</button>
        </div>

        {/* Weight per item */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            type="number"
            value={item.weight ?? 0}
            min={0}
            step={0.5}
            onChange={e => onUpdate('weight', Number(e.target.value))}
            className="w-14 text-center text-sm focus:outline-none rounded"
            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>lb ea</span>
        </div>

        {/* Total weight for this row */}
        <div className="w-16 text-right text-sm font-bold flex-shrink-0" style={{ color: totalWeight > 0 ? 'var(--text)' : 'var(--text-faint)' }}>
          {totalWeight > 0 ? `${totalWeight} lb` : '—'}
        </div>

        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes(x => !x)}
          className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ color: item.notes ? 'var(--accent)' : 'var(--text-faint)', border: '1px solid var(--bg-border)' }}
          title="Toggle notes"
        >📝</button>

        <button onClick={onRemove} className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: '#ef4444', border: '1px solid var(--bg-border)' }}>✕</button>
      </div>

      {/* Notes row */}
      {showNotes && (
        <div className="px-3 pb-2" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <textarea
            value={item.notes}
            onChange={e => onUpdate('notes', e.target.value)}
            placeholder="Notes about this item..."
            rows={2}
            className="w-full text-xs resize-none focus:outline-none mt-2 p-2 rounded"
            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
          />
        </div>
      )}
    </div>
  )
}

function ArmorPropertiesPanel({ armorProps = {}, onChange }) {
  const checkPenalty = armorProps.checkPenalty ?? 0
  const maxDex       = armorProps.maxDex ?? ''
  const spellFailure = armorProps.spellFailure ?? 0

  const [sfRoll, setSfRoll] = useState(null)

  const rollSpellFailure = () => {
    const roll = Math.ceil(Math.random() * 100)
    setSfRoll({ roll, failed: roll <= spellFailure })
  }

  const set = (key, val) => onChange('armorProps', { ...armorProps, [key]: val })

  return (
    <div className="card">
      <h2 className="section-title mb-3">Worn Armor Properties</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
        These values are read from your equipped armor and automatically affect AC, skill checks, and spell casting.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Armor Check Penalty */}
        <div className="stat-box flex flex-col items-center">
          <div className="text-sm font-bold mb-1" style={{ color: 'var(--accent)' }}>Armor Check Penalty</div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => set('checkPenalty', Math.max(0, checkPenalty - 1))}
              className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold"
              style={{ border: '1px solid var(--bg-border)', color: 'var(--accent)' }}
            >−</button>
            <span className="text-2xl font-bold w-8 text-center" style={{ color: checkPenalty > 0 ? '#ef4444' : 'var(--text)' }}>
              {checkPenalty}
            </span>
            <button
              onClick={() => set('checkPenalty', checkPenalty + 1)}
              className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold"
              style={{ border: '1px solid var(--bg-border)', color: 'var(--accent)' }}
            >+</button>
          </div>
          <div className="text-xs space-y-0.5" style={{ color: 'var(--text-faint)' }}>
            <div className="font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>Penalizes:</div>
            <div>• Acrobatics, Climb, Escape Artist</div>
            <div>• Fly, Ride, Sleight of Hand</div>
            <div>• Stealth</div>
            <div style={{ color: checkPenalty > 0 ? '#f59e0b' : 'var(--text-faint)' }}>• Swim (×2 penalty)</div>
          </div>
        </div>

        {/* Max Dex */}
        <div className="stat-box flex flex-col items-center">
          <div className="text-sm font-bold mb-1" style={{ color: 'var(--accent)' }}>Maximum Dex Bonus</div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => set('maxDex', maxDex === '' ? null : Math.max(0, Number(maxDex) - 1))}
              className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold"
              style={{ border: '1px solid var(--bg-border)', color: 'var(--accent)' }}
            >−</button>
            <span className="text-2xl font-bold w-8 text-center" style={{ color: maxDex === '' || maxDex === null ? 'var(--text-faint)' : 'var(--text)' }}>
              {maxDex === '' || maxDex === null ? '∞' : maxDex}
            </span>
            <button
              onClick={() => set('maxDex', maxDex === '' || maxDex === null ? 0 : Number(maxDex) + 1)}
              className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold"
              style={{ border: '1px solid var(--bg-border)', color: 'var(--accent)' }}
            >+</button>
          </div>
          <button
            onClick={() => set('maxDex', null)}
            className="text-xs px-2 py-0.5 rounded mb-2"
            style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-faint)' }}
          >Reset to ∞ (no cap)</button>
          <div className="text-xs space-y-0.5" style={{ color: 'var(--text-faint)' }}>
            <div className="font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>Affects:</div>
            <div>• Caps DEX bonus applied to AC</div>
            <div>• Does NOT affect saves, skills,</div>
            <div>&nbsp; attack rolls, or initiative</div>
          </div>
        </div>

        {/* Arcane Spell Failure */}
        <div className="stat-box flex flex-col items-center">
          <div className="text-sm font-bold mb-1" style={{ color: 'var(--accent)' }}>Arcane Spell Failure</div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => set('spellFailure', Math.max(0, spellFailure - 5))}
              className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold"
              style={{ border: '1px solid var(--bg-border)', color: 'var(--accent)' }}
            >−</button>
            <span className="text-2xl font-bold w-12 text-center" style={{ color: spellFailure > 0 ? '#ef4444' : 'var(--text)' }}>
              {spellFailure}%
            </span>
            <button
              onClick={() => set('spellFailure', Math.min(100, spellFailure + 5))}
              className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold"
              style={{ border: '1px solid var(--bg-border)', color: 'var(--accent)' }}
            >+</button>
          </div>
          {spellFailure > 0 && (
            <button
              onClick={rollSpellFailure}
              className="text-xs px-3 py-1 rounded font-bold mb-2 w-full"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-darker)' }}
            >Roll d100</button>
          )}
          {sfRoll && (
            <div className="text-xs text-center px-2 py-1 rounded mb-2"
              style={{ backgroundColor: sfRoll.failed ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${sfRoll.failed ? '#ef4444' : 'var(--positive)'}`, color: sfRoll.failed ? '#ef4444' : 'var(--positive)' }}>
              Rolled {sfRoll.roll} — {sfRoll.failed ? '✗ Spell FAILS' : '✓ Spell succeeds'}
            </div>
          )}
          <div className="text-xs space-y-0.5" style={{ color: 'var(--text-faint)' }}>
            <div className="font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>Affects:</div>
            <div>• Arcane spells only (wizard, sorcerer,</div>
            <div>&nbsp; bard, magus, etc.)</div>
            <div>• Roll d100 before casting — fail if ≤ %</div>
            <div>• Divine spells are unaffected</div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function Equipment({ character, onChange, pins = {}, onTogglePin }) {
  const gear = character.gear ?? []
  const currency = character.currency ?? { pp: 0, gp: 0, sp: 0, cp: 0 }
  const str = character.abilities?.str ?? 10
  const [filterCat, setFilterCat] = useState('All')
  const [sortBy, setSortBy] = useState('none')

  const totalWeight = gear.reduce((sum, item) => sum + (item.qty ?? 1) * (item.weight ?? 0), 0)
  const enc = getEncumbrance(str, totalWeight)
  const encPct = Math.min(100, (totalWeight / enc.max) * 100)

  const addItem = () => onChange('gear', [...gear, emptyItem()])

  const updateItem = (index, key, value) => {
    onChange('gear', gear.map((g, i) => i === index ? { ...g, [key]: value } : g))
  }

  const removeItem = (index) => onChange('gear', gear.filter((_, i) => i !== index))

  const updateCurrency = (coin, value) => {
    onChange('currency', { ...currency, [coin]: Math.max(0, Number(value)) })
  }

  const gpTotal = (currency.pp ?? 0) * 10 + (currency.gp ?? 0) + (currency.sp ?? 0) / 10 + (currency.cp ?? 0) / 100

  // Filter + sort
  let displayed = filterCat === 'All' ? gear : gear.filter(g => g.category === filterCat)
  if (sortBy === 'name')   displayed = [...displayed].sort((a, b) => a.name.localeCompare(b.name))
  if (sortBy === 'weight') displayed = [...displayed].sort((a, b) => (b.qty * b.weight) - (a.qty * a.weight))
  if (sortBy === 'qty')    displayed = [...displayed].sort((a, b) => b.qty - a.qty)

  const getRealIndex = (item) => gear.findIndex(g => g.id === item.id)

  return (
    <div className="space-y-4">
      {/* Armor Properties */}
      <ArmorPropertiesPanel
        armorProps={character.armorProps ?? {}}
        onChange={onChange}
      />

      {/* Weight & Encumbrance */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="section-title mb-0">⚖️ Encumbrance</h2>
              {onTogglePin && <PinButton pinned={pins.equipment} onToggle={() => onTogglePin('equipment')} />}
            </div>
            <div className="flex items-end gap-3 mb-2">
              <div>
                <span className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{totalWeight}</span>
                <span className="text-sm ml-1" style={{ color: 'var(--text-dim)' }}>lbs total</span>
              </div>
              <div className="px-3 py-1 rounded font-bold text-sm" style={{ backgroundColor: 'var(--bg-darker)', color: enc.color, border: `1px solid ${enc.color}` }}>
                {enc.label}
              </div>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-border)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${encPct}%`, backgroundColor: enc.color }} />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
              <span>Light ≤ {ENCUMBRANCE[Math.min(30, Math.max(1, str))][0]} lb</span>
              <span>Medium ≤ {ENCUMBRANCE[Math.min(30, Math.max(1, str))][1]} lb</span>
              <span>Heavy ≤ {ENCUMBRANCE[Math.min(30, Math.max(1, str))][2]} lb</span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Based on STR {str}</div>
          </div>

          {/* Currency */}
          <div className="card" style={{ backgroundColor: 'var(--bg-darker)', minWidth: '220px' }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>💰 Currency</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'pp', label: 'Platinum', color: '#e2e8f0' },
                { key: 'gp', label: 'Gold',     color: '#f59e0b' },
                { key: 'sp', label: 'Silver',   color: '#94a3b8' },
                { key: 'cp', label: 'Copper',   color: '#c2855a' },
              ].map(({ key, label, color }) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <label className="text-xs" style={{ color }}>{label}</label>
                  <input
                    type="number"
                    min={0}
                    value={currency[key] ?? 0}
                    onChange={e => updateCurrency(key, e.target.value)}
                    className="w-full text-center rounded text-sm font-bold focus:outline-none py-1"
                    style={{ backgroundColor: 'var(--bg-surface)', color, border: `1px solid var(--bg-border)` }}
                  />
                </div>
              ))}
            </div>
            <div className="text-xs mt-2 text-right" style={{ color: 'var(--text-faint)' }}>
              ≈ {gpTotal.toFixed(2)} gp total
            </div>
          </div>
        </div>
      </div>

      {/* Item List */}
      <div className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="section-title mb-0">🎒 Inventory ({gear.length} items)</h2>
            {onTogglePin && <><PinButton pinned={pins.currency} onToggle={() => onTogglePin('currency')} /><span className="text-xs" style={{color:'var(--text-faint)'}}>currency</span></>}
          </div>
          <button onClick={addItem} className="btn-primary text-xs py-1 px-3">+ Add Item</button>
        </div>

        {/* Filters & Sort */}
        <div className="flex gap-2 flex-wrap mb-3 items-center">
          <div className="flex gap-1 flex-wrap">
            {['All', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className="text-xs px-2 py-0.5 rounded transition-colors"
                style={{
                  backgroundColor: filterCat === cat ? 'var(--accent-dim)' : 'var(--bg-darker)',
                  color: filterCat === cat ? 'var(--accent)' : 'var(--text-dim)',
                  border: `1px solid ${filterCat === cat ? 'var(--accent)' : 'var(--bg-border)'}`,
                }}
              >
                {cat === 'All' ? 'All' : CATEGORY_ICONS[cat]}
                {' '}{cat}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Sort:</span>
            {[['none', 'Default'], ['name', 'Name'], ['weight', 'Weight'], ['qty', 'Qty']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setSortBy(v)}
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  backgroundColor: sortBy === v ? 'var(--accent-dim)' : 'var(--bg-darker)',
                  color: sortBy === v ? 'var(--accent)' : 'var(--text-dim)',
                  border: `1px solid ${sortBy === v ? 'var(--accent)' : 'var(--bg-border)'}`,
                }}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Column headers */}
        {displayed.length > 0 && (
          <div className="flex items-center gap-2 px-2 mb-1 text-xs" style={{ color: 'var(--text-faint)' }}>
            <span className="w-7" />
            <span className="flex-1">Item</span>
            <span className="hidden md:block w-24">Category</span>
            <span className="w-24 text-center">Quantity</span>
            <span className="w-24 text-center">Weight ea</span>
            <span className="w-16 text-right">Total</span>
            <span className="w-6" />
            <span className="w-6" />
          </div>
        )}

        {/* Items */}
        <div className="space-y-1.5">
          {displayed.length === 0 && (
            <div className="text-center py-10" style={{ color: 'var(--text-faint)' }}>
              <div className="text-4xl mb-2">🎒</div>
              <p className="text-sm">{filterCat === 'All' ? 'No items yet.' : `No ${filterCat} items.`}</p>
              <button onClick={addItem} className="mt-3 btn-secondary text-xs">Add Item</button>
            </div>
          )}
          {displayed.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              onUpdate={(key, value) => updateItem(getRealIndex(item), key, value)}
              onRemove={() => removeItem(getRealIndex(item))}
            />
          ))}
        </div>

        {/* Footer totals */}
        {gear.length > 0 && (
          <div className="flex justify-between items-center mt-3 pt-3 text-sm font-bold" style={{ borderTop: '1px solid var(--bg-border)' }}>
            <span style={{ color: 'var(--text-dim)' }}>{gear.length} item{gear.length !== 1 ? 's' : ''} · {gear.reduce((s, g) => s + (g.qty ?? 1), 0)} total pieces</span>
            <span style={{ color: enc.color }}>{totalWeight} lbs — {enc.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}
