import { useState, useMemo } from 'react'
import PinButton from '../PinButton'
import equipmentData from '../../data/equipment.json'
import magicItemsData from '../../data/magicItems.json'

// ── Encumbrance ───────────────────────────────────────────────────────────────
const ENCUMBRANCE = {
  1:[3,6,10],2:[6,13,20],3:[10,20,30],4:[13,26,40],5:[16,33,50],
  6:[20,40,60],7:[23,46,70],8:[26,53,80],9:[30,60,90],10:[33,66,100],
  11:[38,76,115],12:[43,86,130],13:[50,100,150],14:[58,116,175],15:[66,133,200],
  16:[76,153,230],17:[86,173,260],18:[100,200,300],19:[116,233,350],20:[133,266,400],
  21:[153,306,460],22:[173,346,520],23:[200,400,600],24:[233,466,700],25:[266,533,800],
  26:[306,613,920],27:[346,693,1040],28:[400,800,1200],29:[466,933,1400],30:[533,1066,1600],
}
function getEncumbrance(str, w) {
  const l = ENCUMBRANCE[Math.min(30, Math.max(1, str))] ?? ENCUMBRANCE[10]
  if (w <= l[0]) return { label: 'Light Load',  color: 'var(--positive)', max: l[0] }
  if (w <= l[1]) return { label: 'Medium Load', color: 'var(--warning)',  max: l[1] }
  if (w <= l[2]) return { label: 'Heavy Load',  color: '#f97316',         max: l[2] }
  return           { label: 'Overloaded',    color: '#ef4444',         max: l[2] }
}

// ── Item categories ───────────────────────────────────────────────────────────
const CATEGORIES = ['General', 'Weapon', 'Armor', 'Magic Item', 'Potion', 'Scroll', 'Wand', 'Tool', 'Consumable', 'Valuables', 'Other']
const CATEGORY_ICONS = {
  General:'🎒', Weapon:'⚔️', Armor:'🛡️', 'Magic Item':'✨',
  Potion:'⚗️', Scroll:'📜', Wand:'🪄', Tool:'🔧',
  Consumable:'🍖', Valuables:'💎', Other:'📦',
}

// ── Flatten browsable item database ──────────────────────────────────────────
const BROWSE_ITEMS = [
  ...equipmentData.flatMap(cat => cat.items.map(item => ({ ...item, _src: 'equipment', _cat: cat.category }))),
  ...magicItemsData.flatMap(cat => cat.items.map(item => ({ ...item, _src: 'magic',    _cat: cat.category }))),
]

const BROWSE_FILTERS = [
  { label: 'All',         test: () => true },
  { label: 'Weapons',     test: i => i._cat.toLowerCase().includes('weapon') },
  { label: 'Armor',       test: i => i._cat.toLowerCase().includes('armor') || i._cat.toLowerCase().includes('shield') },
  { label: 'Potions',     test: i => i._cat === 'Potions' },
  { label: 'Rings',       test: i => i._cat === 'Rings' },
  { label: 'Wands/Staves',test: i => i._cat === 'Wands' || i._cat === 'Staves' || i._cat === 'Rods' },
  { label: 'Wondrous',    test: i => i._cat.startsWith('Wondrous') },
  { label: 'Gear',        test: i => i._cat === 'Adventuring Gear' || i._cat === 'Tools & Skill Kits' || i._cat === 'Vehicles & Transport' },
]

// ── Map item → inventory category ────────────────────────────────────────────
function invCategoryFor(item) {
  const cat = item._cat ?? ''
  if (cat.toLowerCase().includes('weapon')) return 'Weapon'
  if (cat.toLowerCase().includes('armor') || cat.toLowerCase().includes('shield')) return 'Armor'
  if (cat === 'Potions') return 'Potion'
  if (cat === 'Wands') return 'Wand'
  if (cat === 'Adventuring Gear' || cat === 'Tools & Skill Kits') return 'Tool'
  if (cat === 'Vehicles & Transport') return 'Other'
  if (item._src === 'magic') return 'Magic Item'
  return 'General'
}

// ── Parse weight string → number ─────────────────────────────────────────────
function parseWeight(w) {
  if (!w || w === '—') return 0
  const m = String(w).match(/([\d.]+)/)
  return m ? parseFloat(m[1]) : 0
}

// ── Extract buff mods from a magic item by name ───────────────────────────────
function extractBuffMods(name) {
  const n = name ?? ''
  let m

  // Belts
  m = n.match(/Belt of Giant Strength \+(\d+)/);          if (m) return { str: +m[1] }
  m = n.match(/Belt of Incredible Dexterity \+(\d+)/);    if (m) return { dex: +m[1] }
  m = n.match(/Belt of Mighty Constitution \+(\d+)/);     if (m) return { con: +m[1] }
  m = n.match(/Belt of Physical Might \+(\d+)/);          if (m) return { str: +m[1], dex: +m[1] }
  m = n.match(/Belt of Physical Perfection \+(\d+)/);     if (m) return { str: +m[1], dex: +m[1], con: +m[1] }
  // Headbands
  m = n.match(/Headband of Alluring Charisma \+(\d+)/);   if (m) return { cha: +m[1] }
  m = n.match(/Headband of Inspired Wisdom \+(\d+)/);     if (m) return { wis: +m[1] }
  m = n.match(/Headband of Vast Intelligence \+(\d+)/);   if (m) return { int: +m[1] }
  // Saves
  m = n.match(/Cloak of Resistance \+(\d+)/);             if (m) { const v=+m[1]; return { fort:v, ref:v, will:v } }
  // AC
  m = n.match(/Ring of Protection \+(\d+)/);              if (m) return { ac: +m[1] }
  m = n.match(/Amulet of Natural Armor \+(\d+)/);         if (m) return { ac: +m[1] }
  m = n.match(/Bracers of Armor \+(\d+)/);                if (m) return { ac: +m[1] }
  // Gauntlets
  if (n === 'Gauntlets of Ogre Power')                    return { str: 2 }
  // Weapon enhancements
  m = n.match(/^\+(\d+) Enhancement/) && n.startsWith('+') && !n.includes('armor') && !n.includes('shield')
  if (m) return null // too generic — handled separately for weapon items
  return null
}

// ── Extract armor props from armor data item ──────────────────────────────────
function armorPropsFrom(item) {
  if (item.acp === undefined && item.acBonus === undefined) return null
  return {
    checkPenalty: Math.abs(item.acp ?? 0),
    maxDex: item.maxDex !== undefined ? item.maxDex : null,
    spellFailure: parseFloat(String(item.spellFailure ?? '0').replace('%', '')) || 0,
  }
}

// ── Create a weapon entry from equipment data ─────────────────────────────────
function weaponFromData(item) {
  const isRanged = (item._cat ?? '').toLowerCase().includes('ranged')
  const dmgStr   = item.dmg ?? '1d6'
  const critStr  = item.crit ?? '×2'
  const critRange = critStr.match(/([\d–-]+)\//)?.[1]?.replace('–','-') ?? '20'
  const critMult  = critStr.match(/×(\d)$/)?.[0] ?? '×2'
  return {
    id: crypto.randomUUID(),
    name: item.name ?? '',
    attackType: isRanged ? 'Ranged' : 'Melee',
    ability: isRanged ? 'dex' : 'str',
    dmgAbility: 'str',
    attackMisc: 0,
    dmgDice: dmgStr.split('/')[0],
    dmgMisc: 0,
    critRange,
    critMult,
    damageType: (item.type ?? 'S').split(' ')[0].replace(' or','').trim(),
    notes: item.properties ?? '',
    tempAttack: 0,
    tempDamage: 0,
    activePresets: [],
    extraDice: [],
  }
}

const emptyItem = () => ({
  id: crypto.randomUUID(),
  name: '',
  category: 'General',
  qty: 1,
  weight: 0,
  notes: '',
})

// ── Item Detail Panel (shared by browser + popup) ─────────────────────────────
function ItemDetail({ item }) {
  if (!item) return (
    <div className="flex flex-col items-center justify-center h-full py-16" style={{ color: 'var(--text-faint)' }}>
      <div className="text-5xl mb-3">🎒</div>
      <p className="text-sm">Select an item to see details</p>
    </div>
  )
  const hasBuff  = !!extractBuffMods(item.name)
  const isWeapon = invCategoryFor(item) === 'Weapon'
  const isArmor  = invCategoryFor(item) === 'Armor'
  const mods     = extractBuffMods(item.name)
  const statLabels = { str:'STR', dex:'DEX', con:'CON', int:'INT', wis:'WIS', cha:'CHA', ac:'AC', fort:'Fort', ref:'Ref', will:'Will', attackRoll:'Attack', damage:'Damage' }

  return (
    <div className="space-y-4">
      {/* Name + badges */}
      <div>
        <h3 className="font-bold text-xl leading-tight" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>{item.name}</h3>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-dim)' }}>{item._cat}</span>
          {hasBuff  && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: 'var(--positive)', border: '1px solid var(--positive)' }}>✨ +stat</span>}
          {isWeapon && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>⚔️ weapon</span>}
          {isArmor  && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(100,116,139,0.2)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}>🛡️ armor</span>}
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
        {item.cost    && <div><span className="font-bold" style={{ color: 'var(--accent)' }}>Cost: </span><span style={{ color: '#f59e0b' }}>{item.cost}</span></div>}
        {item.weight  && <div><span className="font-bold" style={{ color: 'var(--accent)' }}>Weight: </span><span style={{ color: 'var(--text-dim)' }}>{item.weight}</span></div>}
        {item.dmg     && <div><span className="font-bold" style={{ color: 'var(--accent)' }}>Damage: </span><span style={{ color: 'var(--text)' }}>{item.dmg}</span></div>}
        {item.crit    && <div><span className="font-bold" style={{ color: 'var(--accent)' }}>Crit: </span><span style={{ color: 'var(--text-dim)' }}>{item.crit}</span></div>}
        {item.type    && <div><span className="font-bold" style={{ color: 'var(--accent)' }}>Type: </span><span style={{ color: 'var(--text-dim)' }}>{item.type}</span></div>}
        {item.range   && <div><span className="font-bold" style={{ color: 'var(--accent)' }}>Range: </span><span style={{ color: 'var(--text-dim)' }}>{item.range}</span></div>}
        {item.acBonus !== undefined && <div><span className="font-bold" style={{ color: 'var(--accent)' }}>AC Bonus: </span><span style={{ color: 'var(--positive)' }}>+{item.acBonus}</span></div>}
        {item.acp     !== undefined && <div><span className="font-bold" style={{ color: 'var(--accent)' }}>ACP: </span><span style={{ color: item.acp < 0 ? '#ef4444' : 'var(--text-dim)' }}>{item.acp}</span></div>}
        {item.maxDex  !== undefined && <div><span className="font-bold" style={{ color: 'var(--accent)' }}>Max Dex: </span><span style={{ color: 'var(--text-dim)' }}>{item.maxDex ?? '∞'}</span></div>}
        {item.spellFailure            && <div><span className="font-bold" style={{ color: 'var(--accent)' }}>Spell Fail: </span><span style={{ color: '#f97316' }}>{item.spellFailure}</span></div>}
        {item.speed   && <div><span className="font-bold" style={{ color: 'var(--accent)' }}>Speed: </span><span style={{ color: 'var(--text-dim)' }}>{item.speed}</span></div>}
        {item.cl      && <div><span className="font-bold" style={{ color: 'var(--accent)' }}>Caster Level: </span><span style={{ color: 'var(--text-dim)' }}>{item.cl}</span></div>}
        {item.slot    && <div><span className="font-bold" style={{ color: 'var(--accent)' }}>Slot: </span><span style={{ color: 'var(--text-dim)' }}>{item.slot}</span></div>}
        {item.aura    && <div className="col-span-2"><span className="font-bold" style={{ color: 'var(--accent)' }}>Aura: </span><span style={{ color: 'var(--text-dim)' }}>{item.aura}</span></div>}
      </div>

      {/* Stat bonuses */}
      {mods && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <div className="text-xs font-bold mb-2" style={{ color: 'var(--positive)' }}>✨ Stat Bonuses (auto-applied)</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(mods).filter(([,v]) => v).map(([k, v]) => (
              <span key={k} className="text-xs px-2 py-0.5 rounded font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: 'var(--positive)', border: '1px solid rgba(34,197,94,0.4)' }}>
                {statLabels[k] ?? k} +{v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Properties */}
      {item.properties && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-faint)' }}>Properties</div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>{item.properties}</p>
        </div>
      )}

      {/* Description */}
      {item.description && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-faint)' }}>Description</div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{item.description}</p>
        </div>
      )}
    </div>
  )
}

// ── Item Card Popup (for equipped items) ──────────────────────────────────────
function ItemCardPopup({ itemName, onClose }) {
  const data = useMemo(() => BROWSE_ITEMS.find(i => i.name.toLowerCase() === itemName.toLowerCase()), [itemName])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', border: '2px solid var(--accent)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-darker)' }}>
          <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>📖 Item Details</span>
          <button onClick={onClose} style={{ color: 'var(--text-dim)' }}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {data
            ? <ItemDetail item={data} />
            : (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{itemName}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>No database entry found for this item.</p>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}

// ── Item Browser ──────────────────────────────────────────────────────────────
function ItemBrowser({ character, onChange, onClose }) {
  const [query, setQuery]         = useState('')
  const [browseFilter, setBrowse] = useState('All')
  const [selected, setSelected]   = useState(null)
  const [added, setAdded]         = useState({})

  const results = useMemo(() => {
    const q    = query.toLowerCase().trim()
    const fObj = BROWSE_FILTERS.find(f => f.label === browseFilter) ?? BROWSE_FILTERS[0]
    return BROWSE_ITEMS
      .filter(fObj.test)
      .filter(i => !q || i.name.toLowerCase().includes(q) || (i._cat ?? '').toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q))
      .slice(0, 100)
  }, [query, browseFilter])

  const doAddItem = (item) => {
    const gear = character.gear ?? []
    const invCat = invCategoryFor(item)
    const weight  = parseWeight(item.weight)
    onChange('gear', [...gear, {
      id: crypto.randomUUID(), name: item.name, category: invCat,
      qty: 1, weight, notes: item.description ?? item.properties ?? '', cost: item.cost ?? '',
    }])
    if (invCat === 'Weapon') {
      onChange('weapons', [...(character.weapons ?? []), weaponFromData(item)])
    }
    if (invCat === 'Armor') {
      const ap = armorPropsFrom(item)
      if (ap) onChange('armorProps', { ...(character.armorProps ?? {}), ...ap })
    }
    const mods = extractBuffMods(item.name)
    if (mods && Object.keys(mods).length > 0) {
      const allMods = { attackRoll:0, damage:0, ac:0, initiative:0, fort:0, ref:0, will:0, hp:0, cmb:0, str:0, dex:0, con:0, int:0, wis:0, cha:0 }
      Object.assign(allMods, mods)
      onChange('statBuffs', [...(character.statBuffs ?? []), { id: crypto.randomUUID(), name: item.name, type: 'buff', active: true, mods: allMods }])
    }
    setAdded(prev => ({ ...prev, [item.name]: true }))
    setTimeout(() => setAdded(prev => { const n = {...prev}; delete n[item.name]; return n }), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', border: '2px solid var(--accent)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>🎒 Item Browser</h2>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{BROWSE_ITEMS.length} items · showing {results.length}</p>
          </div>
          <button onClick={onClose} className="text-xl" style={{ color: 'var(--text-dim)' }}>✕</button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 flex flex-wrap gap-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-darker)' }}>
          <div className="relative flex-1 min-w-48">
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)} autoFocus
              placeholder="Search weapons, armor, rings, potions..."
              className="input-field text-sm w-full"
              style={{ paddingLeft: '2rem' }}
            />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-faint)' }}>🔍</span>
            {query && <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-faint)' }}>✕</button>}
          </div>
          <div className="flex flex-wrap gap-1">
            {BROWSE_FILTERS.map(f => (
              <button key={f.label} onClick={() => setBrowse(f.label)} className="text-xs px-2 py-1 rounded transition-colors"
                style={{ backgroundColor: browseFilter === f.label ? 'var(--accent-dim)' : 'var(--bg-surface)', color: browseFilter === f.label ? 'var(--accent)' : 'var(--text-dim)', border: `1px solid ${browseFilter === f.label ? 'var(--accent)' : 'var(--bg-border)'}` }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Two-panel body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: list */}
          <div className="w-1/2 overflow-y-auto" style={{ borderRight: '1px solid var(--bg-border)' }}>
            {results.length === 0 && <div className="text-center py-10 text-sm" style={{ color: 'var(--text-faint)' }}>No items found.</div>}
            {results.map((item, i) => {
              const isAdded  = added[item.name]
              const hasBuff  = !!extractBuffMods(item.name)
              const isWeapon = invCategoryFor(item) === 'Weapon'
              const isArmor  = invCategoryFor(item) === 'Armor'
              const isSel    = selected?.name === item.name
              return (
                <div key={`${item._cat}-${item.name}-${i}`}
                  onClick={() => setSelected(item)}
                  className="flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors"
                  style={{ backgroundColor: isSel ? 'var(--accent-dim)' : i % 2 === 0 ? 'var(--bg-darker)' : 'var(--bg-surface)', borderBottom: '1px solid var(--bg-border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-sm font-semibold truncate" style={{ color: isSel ? 'var(--accent)' : 'var(--text)' }}>{item.name}</span>
                      {hasBuff  && <span className="text-xs px-1 rounded" style={{ color: 'var(--positive)', border: '1px solid var(--positive)' }}>+stat</span>}
                      {isWeapon && <span className="text-xs px-1 rounded" style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}>⚔️</span>}
                      {isArmor  && <span className="text-xs px-1 rounded" style={{ color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}>🛡️</span>}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>
                      {item._cat}{item.cost ? ` · ${item.cost}` : ''}{item.dmg ? ` · ${item.dmg}` : ''}{item.acBonus !== undefined ? ` · AC+${item.acBonus}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); doAddItem(item) }}
                    className="text-xs px-2 py-1 rounded flex-shrink-0 font-bold"
                    style={{ backgroundColor: isAdded ? 'var(--positive)' : 'var(--accent)', color: 'var(--bg-darker)', minWidth: 48 }}
                  >{isAdded ? '✓' : '+ Add'}</button>
                </div>
              )
            })}
            {results.length === 100 && <div className="text-center py-3 text-xs" style={{ color: 'var(--text-faint)' }}>Showing first 100 — refine your search</div>}
          </div>

          {/* Right: detail */}
          <div className="w-1/2 overflow-y-auto p-5">
            <ItemDetail item={selected} />
            {selected && (
              <button
                onClick={() => { doAddItem(selected); onClose() }}
                className="w-full py-2 rounded font-bold text-sm mt-4 transition-colors"
                style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--accent-dim)'}
              >+ Add to Inventory</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Inventory row ─────────────────────────────────────────────────────────────
function ItemRow({ item, onUpdate, onRemove, onShowCard }) {
  const [showNotes, setShowNotes] = useState(false)
  const totalWeight = (item.qty ?? 1) * (item.weight ?? 0)
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-darker)' }}>
      <div className="flex items-center gap-2 p-2">
        <span className="text-lg flex-shrink-0 w-7 text-center">{CATEGORY_ICONS[item.category] ?? '📦'}</span>
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
        <select
          value={item.category}
          onChange={e => onUpdate('category', e.target.value)}
          className="text-xs px-1 py-0.5 rounded focus:outline-none hidden md:block"
          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onUpdate('qty', Math.max(0, (item.qty ?? 1) - 1))} className="w-6 h-6 flex items-center justify-center rounded text-sm font-bold" style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}>−</button>
          <input
            type="number" value={item.qty ?? 1} min={0}
            onChange={e => onUpdate('qty', Math.max(0, Number(e.target.value)))}
            className="w-10 text-center text-sm font-bold focus:outline-none rounded"
            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--bg-border)' }}
          />
          <button onClick={() => onUpdate('qty', (item.qty ?? 1) + 1)} className="w-6 h-6 flex items-center justify-center rounded text-sm font-bold" style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}>+</button>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            type="number" value={item.weight ?? 0} min={0} step={0.5}
            onChange={e => onUpdate('weight', Number(e.target.value))}
            className="w-14 text-center text-sm focus:outline-none rounded"
            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>lb ea</span>
        </div>
        <div className="w-16 text-right text-sm font-bold flex-shrink-0" style={{ color: totalWeight > 0 ? 'var(--text)' : 'var(--text-faint)' }}>
          {totalWeight > 0 ? `${totalWeight} lb` : '—'}
        </div>
        {item.name && (
          <button onClick={() => onShowCard(item.name)} title="View item details" className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ color: 'var(--accent)', border: '1px solid var(--bg-border)', opacity: 0.7 }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
          >📖</button>
        )}
        <button
          onClick={() => setShowNotes(x => !x)}
          className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ color: item.notes ? 'var(--accent)' : 'var(--text-faint)', border: '1px solid var(--bg-border)' }}
        >📝</button>
        <button onClick={onRemove} className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: '#ef4444', border: '1px solid var(--bg-border)' }}>✕</button>
      </div>
      {showNotes && (
        <div className="px-3 pb-2" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <textarea
            value={item.notes} onChange={e => onUpdate('notes', e.target.value)}
            placeholder="Notes..." rows={2}
            className="w-full text-xs resize-none focus:outline-none mt-2 p-2 rounded"
            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
          />
        </div>
      )}
    </div>
  )
}

// ── Armor Properties Panel ────────────────────────────────────────────────────
function ArmorPropertiesPanel({ armorProps = {}, onChange }) {
  const checkPenalty = armorProps.checkPenalty ?? 0
  const maxDex       = armorProps.maxDex ?? ''
  const spellFailure = armorProps.spellFailure ?? 0
  const [sfRoll, setSfRoll] = useState(null)
  const rollSF = () => { const r = Math.ceil(Math.random()*100); setSfRoll({ roll:r, failed: r<=spellFailure }) }
  const set = (key, val) => onChange('armorProps', { ...armorProps, [key]: val })

  return (
    <div className="card">
      <h2 className="section-title mb-3">Worn Armor Properties</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
        These values are read from your equipped armor and automatically affect AC, skill checks, and spell casting.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-box flex flex-col items-center">
          <div className="text-sm font-bold mb-1" style={{ color: 'var(--accent)' }}>Armor Check Penalty</div>
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => set('checkPenalty', Math.max(0, checkPenalty-1))} className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold" style={{ border:'1px solid var(--bg-border)', color:'var(--accent)' }}>−</button>
            <span className="text-2xl font-bold w-8 text-center" style={{ color: checkPenalty>0 ? '#ef4444' : 'var(--text)' }}>{checkPenalty}</span>
            <button onClick={() => set('checkPenalty', checkPenalty+1)} className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold" style={{ border:'1px solid var(--bg-border)', color:'var(--accent)' }}>+</button>
          </div>
          <div className="text-xs space-y-0.5" style={{ color: 'var(--text-faint)' }}>
            <div className="font-semibold mb-1" style={{ color: 'var(--text-dim)' }}>Penalizes:</div>
            <div>• Acrobatics, Climb, Escape Artist</div>
            <div>• Fly, Ride, Sleight of Hand</div>
            <div>• Stealth</div>
            <div style={{ color: checkPenalty>0 ? '#f59e0b' : 'var(--text-faint)' }}>• Swim (×2 penalty)</div>
          </div>
        </div>
        <div className="stat-box flex flex-col items-center">
          <div className="text-sm font-bold mb-1" style={{ color: 'var(--accent)' }}>Maximum Dex Bonus</div>
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => set('maxDex', maxDex===''||maxDex===null ? null : Math.max(0, Number(maxDex)-1))} className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold" style={{ border:'1px solid var(--bg-border)', color:'var(--accent)' }}>−</button>
            <span className="text-2xl font-bold w-8 text-center" style={{ color: maxDex===''||maxDex===null ? 'var(--text-faint)' : 'var(--text)' }}>{maxDex===''||maxDex===null ? '∞' : maxDex}</span>
            <button onClick={() => set('maxDex', maxDex===''||maxDex===null ? 0 : Number(maxDex)+1)} className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold" style={{ border:'1px solid var(--bg-border)', color:'var(--accent)' }}>+</button>
          </div>
          <button onClick={() => set('maxDex', null)} className="text-xs px-2 py-0.5 rounded mb-2" style={{ backgroundColor:'var(--bg-border)', color:'var(--text-faint)' }}>Reset to ∞</button>
          <div className="text-xs space-y-0.5" style={{ color:'var(--text-faint)' }}>
            <div className="font-semibold mb-1" style={{ color:'var(--text-dim)' }}>Affects:</div>
            <div>• Caps DEX bonus applied to AC</div>
            <div>• Does NOT affect saves, skills,</div>
            <div>&nbsp; attack rolls, or initiative</div>
          </div>
        </div>
        <div className="stat-box flex flex-col items-center">
          <div className="text-sm font-bold mb-1" style={{ color: 'var(--accent)' }}>Arcane Spell Failure</div>
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => set('spellFailure', Math.max(0, spellFailure-5))} className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold" style={{ border:'1px solid var(--bg-border)', color:'var(--accent)' }}>−</button>
            <span className="text-2xl font-bold w-12 text-center" style={{ color: spellFailure>0 ? '#ef4444' : 'var(--text)' }}>{spellFailure}%</span>
            <button onClick={() => set('spellFailure', Math.min(100, spellFailure+5))} className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold" style={{ border:'1px solid var(--bg-border)', color:'var(--accent)' }}>+</button>
          </div>
          {spellFailure > 0 && <button onClick={rollSF} className="text-xs px-3 py-1 rounded font-bold mb-2 w-full" style={{ backgroundColor:'var(--accent)', color:'var(--bg-darker)' }}>Roll d100</button>}
          {sfRoll && (
            <div className="text-xs text-center px-2 py-1 rounded mb-2" style={{ backgroundColor: sfRoll.failed ? 'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)', border:`1px solid ${sfRoll.failed ? '#ef4444':'var(--positive)'}`, color: sfRoll.failed ? '#ef4444':'var(--positive)' }}>
              Rolled {sfRoll.roll} — {sfRoll.failed ? '✗ Spell FAILS' : '✓ Spell succeeds'}
            </div>
          )}
          <div className="text-xs space-y-0.5" style={{ color:'var(--text-faint)' }}>
            <div className="font-semibold mb-1" style={{ color:'var(--text-dim)' }}>Affects:</div>
            <div>• Arcane spells only</div>
            <div>• Roll d100 before casting — fail if ≤ %</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Equipment Component ──────────────────────────────────────────────────
export default function Equipment({ character, onChange, pins = {}, onTogglePin }) {
  const gear     = character.gear ?? []
  const currency = character.currency ?? { pp:0, gp:0, sp:0, cp:0 }
  const str      = character.abilities?.str ?? 10
  const [filterCat, setFilterCat]   = useState('All')
  const [sortBy, setSortBy]         = useState('none')
  const [invSearch, setInvSearch]   = useState('')
  const [showBrowser, setShowBrowser] = useState(false)
  const [itemCard, setItemCard]     = useState(null)

  const totalWeight = gear.reduce((sum, g) => sum + (g.qty??1)*(g.weight??0), 0)
  const enc    = getEncumbrance(str, totalWeight)
  const encPct = Math.min(100, (totalWeight / enc.max) * 100)

  const addItem = () => onChange('gear', [...gear, emptyItem()])

  const updateItem = (index, key, value) =>
    onChange('gear', gear.map((g, i) => i === index ? { ...g, [key]: value } : g))

  const removeItem = (index) => onChange('gear', gear.filter((_, i) => i !== index))

  const updateCurrency = (coin, val) =>
    onChange('currency', { ...currency, [coin]: Math.max(0, Number(val)) })

  const gpTotal = (currency.pp??0)*10 + (currency.gp??0) + (currency.sp??0)/10 + (currency.cp??0)/100

  let displayed = gear
  if (filterCat !== 'All') displayed = displayed.filter(g => g.category === filterCat)
  if (invSearch.trim())    displayed = displayed.filter(g => g.name.toLowerCase().includes(invSearch.toLowerCase()))
  if (sortBy === 'name')   displayed = [...displayed].sort((a,b) => a.name.localeCompare(b.name))
  if (sortBy === 'weight') displayed = [...displayed].sort((a,b) => (b.qty*b.weight)-(a.qty*a.weight))
  if (sortBy === 'qty')    displayed = [...displayed].sort((a,b) => b.qty-a.qty)

  const getRealIndex = (item) => gear.findIndex(g => g.id === item.id)

  return (
    <div className="space-y-4">
      <ArmorPropertiesPanel armorProps={character.armorProps??{}} onChange={onChange} />

      {/* Encumbrance + Currency */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="section-title mb-0">⚖️ Encumbrance</h2>
              {onTogglePin && <PinButton pinned={pins.equipment} onToggle={() => onTogglePin('equipment')} />}
            </div>
            <div className="flex items-end gap-3 mb-2">
              <div>
                <span className="text-3xl font-bold" style={{ color:'var(--text)' }}>{totalWeight}</span>
                <span className="text-sm ml-1" style={{ color:'var(--text-dim)' }}>lbs total</span>
              </div>
              <div className="px-3 py-1 rounded font-bold text-sm" style={{ backgroundColor:'var(--bg-darker)', color:enc.color, border:`1px solid ${enc.color}` }}>{enc.label}</div>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor:'var(--bg-border)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width:`${encPct}%`, backgroundColor:enc.color }} />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color:'var(--text-faint)' }}>
              <span>Light ≤ {ENCUMBRANCE[Math.min(30,Math.max(1,str))][0]} lb</span>
              <span>Medium ≤ {ENCUMBRANCE[Math.min(30,Math.max(1,str))][1]} lb</span>
              <span>Heavy ≤ {ENCUMBRANCE[Math.min(30,Math.max(1,str))][2]} lb</span>
            </div>
            <div className="text-xs mt-1" style={{ color:'var(--text-faint)' }}>Based on STR {str}</div>
          </div>
          <div className="card" style={{ backgroundColor:'var(--bg-darker)', minWidth:'220px' }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color:'var(--accent)' }}>💰 Currency</div>
            <div className="grid grid-cols-2 gap-2">
              {[{key:'pp',label:'Platinum',color:'#e2e8f0'},{key:'gp',label:'Gold',color:'#f59e0b'},{key:'sp',label:'Silver',color:'#94a3b8'},{key:'cp',label:'Copper',color:'#c2855a'}].map(({key,label,color}) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <label className="text-xs" style={{ color }}>{label}</label>
                  <input type="number" min={0} value={currency[key]??0} onChange={e => updateCurrency(key,e.target.value)} className="w-full text-center rounded text-sm font-bold focus:outline-none py-1" style={{ backgroundColor:'var(--bg-surface)', color, border:'1px solid var(--bg-border)' }} />
                </div>
              ))}
            </div>
            <div className="text-xs mt-2 text-right" style={{ color:'var(--text-faint)' }}>≈ {gpTotal.toFixed(2)} gp total</div>
          </div>
        </div>
      </div>

      {/* Item Browser modal */}
      {showBrowser && <ItemBrowser character={character} onChange={onChange} onClose={() => setShowBrowser(false)} />}

      {/* Item card popup */}
      {itemCard && <ItemCardPopup itemName={itemCard} onClose={() => setItemCard(null)} />}

      {/* Inventory */}
      <div className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="section-title mb-0">🎒 Inventory ({gear.length} items)</h2>
            {onTogglePin && <><PinButton pinned={pins.currency} onToggle={() => onTogglePin('currency')} /><span className="text-xs" style={{color:'var(--text-faint)'}}>currency</span></>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBrowser(true)}
              className="text-xs py-1 px-3 rounded font-bold"
              style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
            >📖 Browse Items</button>
            <button onClick={addItem} className="btn-primary text-xs py-1 px-3">+ Custom Item</button>
          </div>
        </div>

        {/* Inventory search + filters */}
        <div className="flex flex-col gap-2 mb-3">
          <div className="relative">
            <input
              type="text"
              value={invSearch}
              onChange={e => setInvSearch(e.target.value)}
              placeholder="Search inventory..."
              className="w-full text-sm px-3 py-1.5 rounded focus:outline-none"
              style={{ backgroundColor:'var(--bg-surface)', color:'var(--text)', border:'1px solid var(--bg-border)', paddingLeft:'2rem' }}
            />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color:'var(--text-faint)' }}>🔍</span>
            {invSearch && <button onClick={() => setInvSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color:'var(--text-faint)' }}>✕</button>}
          </div>

          <div className="flex gap-1 flex-wrap items-center">
            {['All', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className="text-xs px-2 py-0.5 rounded transition-colors"
                style={{
                  backgroundColor: filterCat===cat ? 'var(--accent-dim)' : 'var(--bg-darker)',
                  color:           filterCat===cat ? 'var(--accent)'     : 'var(--text-dim)',
                  border:`1px solid ${filterCat===cat ? 'var(--accent)' : 'var(--bg-border)'}`,
                }}
              >{cat === 'All' ? 'All' : `${CATEGORY_ICONS[cat]} ${cat}`}</button>
            ))}
            <div className="ml-auto flex items-center gap-1">
              <span className="text-xs" style={{ color:'var(--text-faint)' }}>Sort:</span>
              {[['none','Default'],['name','Name'],['weight','Weight'],['qty','Qty']].map(([v,l]) => (
                <button key={v} onClick={() => setSortBy(v)} className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor:sortBy===v?'var(--accent-dim)':'var(--bg-darker)', color:sortBy===v?'var(--accent)':'var(--text-dim)', border:`1px solid ${sortBy===v?'var(--accent)':'var(--bg-border)'}` }}
                >{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Column headers */}
        {displayed.length > 0 && (
          <div className="flex items-center gap-2 px-2 mb-1 text-xs" style={{ color:'var(--text-faint)' }}>
            <span className="w-7" />
            <span className="flex-1">Item</span>
            <span className="hidden md:block w-24">Category</span>
            <span className="w-24 text-center">Quantity</span>
            <span className="w-24 text-center">Weight ea</span>
            <span className="w-16 text-right">Total</span>
            <span className="w-6" /><span className="w-6" />
          </div>
        )}

        <div className="space-y-1.5">
          {displayed.length === 0 && (
            <div className="text-center py-10" style={{ color:'var(--text-faint)' }}>
              <div className="text-4xl mb-2">🎒</div>
              <p className="text-sm">{gear.length === 0 ? 'No items yet.' : 'No matching items.'}</p>
              <div className="flex gap-2 justify-center mt-3">
                <button onClick={() => setShowBrowser(true)} className="btn-secondary text-xs">Browse Items</button>
                <button onClick={addItem} className="btn-secondary text-xs">Custom Item</button>
              </div>
            </div>
          )}
          {displayed.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              onUpdate={(key, value) => updateItem(getRealIndex(item), key, value)}
              onRemove={() => removeItem(getRealIndex(item))}
              onShowCard={setItemCard}
            />
          ))}
        </div>

        {gear.length > 0 && (
          <div className="flex justify-between items-center mt-3 pt-3 text-sm font-bold" style={{ borderTop:'1px solid var(--bg-border)' }}>
            <span style={{ color:'var(--text-dim)' }}>{gear.length} item{gear.length!==1?'s':''} · {gear.reduce((s,g)=>s+(g.qty??1),0)} total pieces</span>
            <span style={{ color:enc.color }}>{totalWeight} lbs — {enc.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}
