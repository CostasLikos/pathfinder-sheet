import { useState, useMemo, useRef, useEffect } from 'react'
import PinButton from '../PinButton'
import { abilityMod, formatMod, SPELL_SCHOOLS } from '../../data/pf1eData'
import SpinnerInput from '../SpinnerInput'
import ALL_SPELLS_RAW from '../../data/spells.json'

const CASTING_ABILITIES = { int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }

// ─── Spells Per Day Tables ────────────────────────────────────────────────────
// Columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]  — null = not available
// '∞' = unlimited (cantrips for spontaneous casters)

const SPD = {
  // Full 9-level prepared (Wizard, Witch, Shaman)
  wizard: [
    [3,1,null,null,null,null,null,null,null,null],
    [4,2,null,null,null,null,null,null,null,null],
    [4,2,1,null,null,null,null,null,null,null],
    [4,3,2,1,null,null,null,null,null,null],
    [4,3,2,1,null,null,null,null,null,null],
    [4,3,3,2,1,null,null,null,null,null],
    [4,4,3,2,1,null,null,null,null,null],
    [4,4,3,3,2,1,null,null,null,null],
    [4,4,4,3,2,1,null,null,null,null],
    [4,4,4,3,3,2,1,null,null,null],
    [4,4,4,4,3,2,1,null,null,null],
    [4,4,4,4,3,3,2,1,null,null],
    [4,4,4,4,4,3,2,1,null,null],
    [4,4,4,4,4,3,3,2,1,null],
    [4,4,4,4,4,4,3,2,1,null],
    [4,4,4,4,4,4,3,3,2,1],
    [4,4,4,4,4,4,4,3,2,1],
    [4,4,4,4,4,4,4,3,3,2],
    [4,4,4,4,4,4,4,4,3,3],
    [4,4,4,4,4,4,4,4,4,4],
  ],
  // Full 9-level prepared divine (Cleric, Druid, Oracle base, Shaman)
  cleric: [
    [3,1,null,null,null,null,null,null,null,null],
    [4,2,null,null,null,null,null,null,null,null],
    [4,2,1,null,null,null,null,null,null,null],
    [4,3,2,1,null,null,null,null,null,null],
    [4,3,2,1,null,null,null,null,null,null],
    [4,3,3,2,1,null,null,null,null,null],
    [4,4,3,2,1,null,null,null,null,null],
    [4,4,3,3,2,1,null,null,null,null],
    [4,4,4,3,2,1,null,null,null,null],
    [4,4,4,3,3,2,1,null,null,null],
    [4,4,4,4,3,2,1,null,null,null],
    [4,4,4,4,3,3,2,1,null,null],
    [4,4,4,4,4,3,2,1,null,null],
    [4,4,4,4,4,3,3,2,1,null],
    [4,4,4,4,4,4,3,2,1,null],
    [4,4,4,4,4,4,3,3,2,1],
    [4,4,4,4,4,4,4,3,2,1],
    [4,4,4,4,4,4,4,3,3,2],
    [4,4,4,4,4,4,4,4,3,3],
    [4,4,4,4,4,4,4,4,4,4],
  ],
  // Full 9-level spontaneous (Sorcerer, Oracle, Psychic)
  sorcerer: [
    ['∞',3,null,null,null,null,null,null,null,null],
    ['∞',4,null,null,null,null,null,null,null,null],
    ['∞',5,null,null,null,null,null,null,null,null],
    ['∞',6,3,null,null,null,null,null,null,null],
    ['∞',6,4,null,null,null,null,null,null,null],
    ['∞',6,5,3,null,null,null,null,null,null],
    ['∞',6,6,4,null,null,null,null,null,null],
    ['∞',6,6,5,3,null,null,null,null,null],
    ['∞',6,6,6,4,null,null,null,null,null],
    ['∞',6,6,6,5,3,null,null,null,null],
    ['∞',6,6,6,6,4,null,null,null,null],
    ['∞',6,6,6,6,5,3,null,null,null],
    ['∞',6,6,6,6,6,4,null,null,null],
    ['∞',6,6,6,6,6,5,3,null,null],
    ['∞',6,6,6,6,6,6,4,null,null],
    ['∞',6,6,6,6,6,6,5,3,null],
    ['∞',6,6,6,6,6,6,6,4,null],
    ['∞',6,6,6,6,6,6,6,5,3],
    ['∞',6,6,6,6,6,6,6,6,4],
    ['∞',6,6,6,6,6,6,6,6,6],
  ],
  // 6-level spontaneous (Bard, Skald)
  bard: [
    ['∞',1,null,null,null,null,null],
    ['∞',2,null,null,null,null,null],
    ['∞',3,null,null,null,null,null],
    ['∞',3,1,null,null,null,null],
    ['∞',4,2,null,null,null,null],
    ['∞',4,3,null,null,null,null],
    ['∞',4,3,1,null,null,null],
    ['∞',4,4,2,null,null,null],
    ['∞',4,4,3,null,null,null],
    ['∞',4,4,3,1,null,null],
    ['∞',4,4,4,2,null,null],
    ['∞',4,4,4,3,null,null],
    ['∞',4,4,4,3,1,null],
    ['∞',4,4,4,4,2,null],
    ['∞',4,4,4,4,3,null],
    ['∞',4,4,4,4,3,1],
    ['∞',4,4,4,4,4,2],
    ['∞',4,4,4,4,4,3],
    ['∞',4,4,4,4,4,4],
    ['∞',4,4,4,4,4,4],
  ],
  // 6-level prepared (Magus, Inquisitor, Warpriest)
  magus: [
    [3,1,null,null,null,null,null],
    [4,2,null,null,null,null,null],
    [4,3,null,null,null,null,null],
    [4,3,1,null,null,null,null],
    [4,4,2,null,null,null,null],
    [4,4,3,null,null,null,null],
    [4,4,3,1,null,null,null],
    [4,4,4,2,null,null,null],
    [5,5,4,3,null,null,null],
    [5,5,4,3,1,null,null],
    [5,5,4,4,2,null,null],
    [5,5,5,4,3,null,null],
    [5,5,5,4,3,1,null],
    [5,5,5,4,4,2,null],
    [5,5,5,5,4,3,null],
    [5,5,5,5,4,3,1],
    [5,5,5,5,4,4,2],
    [5,5,5,5,5,4,3],
    [5,5,5,5,5,5,4],
    [5,5,5,5,5,5,5],
  ],
  // 4-level prepared (Paladin, Ranger, Alchemist) — starts at level 4
  paladin: [
    [null,null,null,null,null],
    [null,null,null,null,null],
    [null,null,null,null,null],
    [null,1,null,null,null],
    [null,1,null,null,null],
    [null,1,null,null,null],
    [null,1,1,null,null],
    [null,1,1,null,null],
    [null,2,1,null,null],
    [null,2,1,1,null],
    [null,2,1,1,null],
    [null,2,2,1,null],
    [null,3,2,1,1],
    [null,3,2,1,1],
    [null,3,2,2,1],
    [null,3,3,2,1],
    [null,4,3,2,1],
    [null,4,3,2,2],
    [null,4,3,3,2],
    [null,4,4,3,3],
  ],
}

// Map class names typed by user → which table to use
const CLASS_TO_TABLE = {
  wizard: 'wizard', witch: 'wizard', shaman: 'wizard',
  cleric: 'cleric', druid: 'cleric', oracle: 'sorcerer', shaman2: 'cleric',
  sorcerer: 'sorcerer', psychic: 'sorcerer',
  bard: 'bard', skald: 'bard',
  magus: 'magus', inquisitor: 'magus', warpriest: 'magus', bloodrager: 'magus',
  paladin: 'paladin', ranger: 'paladin', alchemist: 'paladin',
  summoner: 'bard',
}

const LEVEL_HEADERS = {
  wizard:   ['0','1','2','3','4','5','6','7','8','9'],
  cleric:   ['0','1','2','3','4','5','6','7','8','9'],
  sorcerer: ['0','1','2','3','4','5','6','7','8','9'],
  bard:     ['0','1','2','3','4','5','6'],
  magus:    ['0','1','2','3','4','5','6'],
  paladin:  ['-','1','2','3','4'],
}

function resolveTable(castingClass) {
  if (!castingClass) return null
  const key = castingClass.toLowerCase().trim()
  return CLASS_TO_TABLE[key] ?? null
}

// ─── Spells Per Day Reference Panel ──────────────────────────────────────────

const bonusSpells = (mod, spellLevel) => {
  if (spellLevel === 0 || mod < spellLevel) return 0
  return Math.floor((mod - spellLevel) / 4) + 1
}

function SpellsPerDayPanel({ castingClass, currentLevel, abilityModVal = 0 }) {
  const [open, setOpen] = useState(false)
  const tableKey = resolveTable(castingClass)
  const table = tableKey ? SPD[tableKey] : null
  const headers = tableKey ? LEVEL_HEADERS[tableKey] : []
  const lvl = Math.max(1, Math.min(20, currentLevel || 1))

  return (
    <div>
      <button onClick={() => setOpen(x => !x)}
        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded w-full"
        style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)', textAlign: 'left' }}>
        <span style={{ color: 'var(--accent)' }}>📊</span>
        <span className="font-semibold" style={{ color: 'var(--accent)' }}>Spells Per Day Reference</span>
        <span className="ml-1" style={{ color: 'var(--text-faint)' }}>
          {castingClass ? `(${castingClass})` : '— set casting class above'}
        </span>
        <span className="ml-auto">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--bg-border)' }}>
          {!table ? (
            <div className="p-4 text-xs text-center" style={{ color: 'var(--text-faint)', backgroundColor: 'var(--bg-darker)' }}>
              No table found for "<strong>{castingClass}</strong>". Try: wizard, sorcerer, cleric, druid, oracle, bard, magus, inquisitor, warpriest, paladin, ranger, alchemist, witch, skald, bloodrager, summoner.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ backgroundColor: 'var(--bg-darker)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--accent)' }}>
                    <th className="px-3 py-2 text-left font-bold" style={{ color: 'var(--accent)', minWidth: 48 }}>Lvl</th>
                    {headers.map(h => (
                      <th key={h} className="px-2 py-2 text-center font-bold" style={{ color: h === '-' ? 'var(--text-faint)' : 'var(--accent)', minWidth: 32 }}>
                        {h === '-' ? '—' : `${h}th`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.map((row, i) => {
                    const isCurrentLevel = i + 1 === lvl
                    return (
                      <tr key={i}
                        style={{
                          backgroundColor: isCurrentLevel ? 'var(--accent-dim)' : i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-darker)',
                          borderBottom: '1px solid var(--bg-border)',
                          outline: isCurrentLevel ? '1px solid var(--accent)' : 'none',
                        }}>
                        <td className="px-3 py-1.5 font-bold" style={{ color: isCurrentLevel ? 'var(--accent)' : 'var(--text-dim)' }}>
                          {i + 1}{isCurrentLevel && ' ◀'}
                        </td>
                        {row.map((slots, j) => {
                          const spellLvl = parseInt(headers[j])
                          const bonus = isCurrentLevel && slots !== null && slots !== '∞' ? bonusSpells(abilityModVal, spellLvl) : 0
                          const total = slots !== null && slots !== '∞' ? slots + bonus : slots
                          return (
                            <td key={j} className="px-2 py-1.5 text-center" style={{
                              color: slots === null ? 'var(--text-faint)' : slots === '∞' ? 'var(--positive)' : isCurrentLevel ? 'var(--text)' : 'var(--text-dim)',
                              fontWeight: isCurrentLevel && slots !== null ? 'bold' : 'normal',
                            }}>
                              {slots === null ? '—' : slots === '∞' ? '∞' : isCurrentLevel ? (
                                <span>
                                  {total}
                                  {bonus > 0 && <span className="text-xs ml-0.5" style={{ color: 'var(--positive)' }}>({slots}+{bonus})</span>}
                                </span>
                              ) : slots}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-faint)', borderTop: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}>
                Your level row shows base + bonus from ability modifier ({formatMod(abilityModVal)}) · Cleric/Druid add +1 domain spell per level on top
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const CLASSES_LIST = [
  'bard','cleric/oracle','druid','inquisitor','magus','paladin','ranger',
  'sorcerer/wizard','summoner','witch','alchemist','bloodrager','skald',
  'shaman','warpriest','occultist','psychic','spiritualist','mesmerist',
]

// Normalize school names from the JSON
const normalizeSchool = (s) => {
  if (!s) return 'Universal'
  const map = { transmutation: 'Transmutation', transformation: 'Transmutation', 'see text': 'Universal' }
  const lower = s.toLowerCase()
  if (map[lower]) return map[lower]
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

// Parse "sorcerer/wizard 3, bard 2" → { 'sorcerer/wizard': 3, 'bard': 2 }
const parseSpellLevels = (str) => {
  if (!str) return {}
  const result = {}
  str.split(',').forEach(part => {
    const m = part.trim().match(/^(.+?)\s+(\d+)$/)
    if (m) result[m[1].trim().toLowerCase()] = parseInt(m[2])
  })
  return result
}

// Build normalized spell library once
const SPELL_LIBRARY = ALL_SPELLS_RAW.map(s => ({
  ...s,
  school: normalizeSchool(s.school),
  levels: parseSpellLevels(s.spell_level),
}))

const emptySpell = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: '',
  level: 0,
  school: 'Evocation',
  castingTime: '1 standard action',
  range: '',
  duration: '',
  savingThrow: '',
  components: '',
  description: '',
  prepared: 1,
  used: 0,
  ...overrides,
})

const emptyDCBonus = () => ({ id: crypto.randomUUID(), name: '', bonus: 1, school: 'All Schools' })

// ─── Slot Tracker ─────────────────────────────────────────────────────────────

function SlotTracker({ level, slots, onUpdate }) {
  const max = slots?.max ?? 0
  const used = slots?.used ?? 0
  const remaining = Math.max(0, max - used)
  return (
    <div className="stat-box flex flex-col items-center gap-1 min-w-[64px]">
      <div className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
        {level === 0 ? 'Cantrip' : `Lvl ${level}`}
      </div>
      <div className="flex flex-wrap gap-0.5 justify-center" style={{ maxWidth: 56 }}>
        {Array.from({ length: max }).map((_, i) => (
          <button key={i}
            onClick={() => onUpdate({ ...slots, used: i < used ? i : i + 1 })}
            className="w-3 h-3 rounded-full border transition-colors"
            style={{ backgroundColor: i < used ? 'var(--text-faint)' : 'var(--accent)', borderColor: 'var(--accent)' }}
          />
        ))}
        {max === 0 && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>—</span>}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onUpdate({ ...slots, max: Math.max(0, max - 1) })} className="w-4 h-4 rounded flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-dim)' }}>−</button>
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{remaining}/{max}</span>
        <button onClick={() => onUpdate({ ...slots, max: max + 1 })} className="w-4 h-4 rounded flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-dim)' }}>+</button>
      </div>
      <button onClick={() => onUpdate({ ...slots, used: 0 })} className="text-xs" style={{ color: 'var(--text-faint)' }}>↺</button>
    </div>
  )
}

// ─── DC Bonus Manager ─────────────────────────────────────────────────────────

function DCBonusManager({ dcBonuses, onUpdate }) {
  const [open, setOpen] = useState(false)
  const add    = () => onUpdate([...dcBonuses, emptyDCBonus()])
  const remove = (id) => onUpdate(dcBonuses.filter(b => b.id !== id))
  const update = (id, f, v) => onUpdate(dcBonuses.map(b => b.id === id ? { ...b, [f]: v } : b))
  return (
    <div>
      <button onClick={() => setOpen(x => !x)} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded"
        style={{ backgroundColor: 'var(--bg-darker)', color: dcBonuses.length ? 'var(--accent)' : 'var(--text-dim)', border: `1px solid ${dcBonuses.length ? 'var(--accent)' : 'var(--bg-border)'}` }}>
        🎯 DC Bonuses {dcBonuses.length > 0 && `(${dcBonuses.length})`} {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-lg space-y-2" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>Spell DC Bonuses</span>
            <button onClick={add} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>+ Add</button>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Spell Focus, school specialization, etc. School-specific bonuses only apply to matching spells.</p>
          {dcBonuses.map(b => (
            <div key={b.id} className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
              <input type="text" value={b.name} onChange={e => update(b.id, 'name', e.target.value)} placeholder="e.g. Spell Focus" className="flex-1 text-xs focus:outline-none px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text)', border: '1px solid var(--bg-border)' }} />
              <select value={b.school} onChange={e => update(b.id, 'school', e.target.value)} className="text-xs px-1 py-1 rounded focus:outline-none" style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}>
                <option value="All Schools">All Schools</option>
                {SPELL_SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <SpinnerInput value={b.bonus ?? 1} onChange={v => update(b.id, 'bonus', v)} width="w-10" />
              <button onClick={() => remove(b.id)} className="text-xs px-1.5 py-0.5 rounded" style={{ color: '#ef4444', border: '1px solid var(--bg-border)' }}>✕</button>
            </div>
          ))}
          {dcBonuses.length === 0 && <p className="text-xs text-center py-2" style={{ color: 'var(--text-faint)' }}>No DC bonuses.</p>}
        </div>
      )}
    </div>
  )
}

// ─── Spell Library Browser ────────────────────────────────────────────────────

function SpellLibrary({ castingClass, onAdd, onClose }) {
  const [search, setSearch]     = useState('')
  const [filterClass, setFilterClass] = useState(castingClass?.toLowerCase() ?? '')
  const [filterSchool, setFilterSchool] = useState('')
  const [filterLevel, setFilterLevel]   = useState('')
  const [selected, setSelected] = useState(null)
  const searchRef = useRef()

  useEffect(() => { searchRef.current?.focus() }, [])

  const results = useMemo(() => {
    let list = SPELL_LIBRARY
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q))
    }
    if (filterSchool) list = list.filter(s => s.school === filterSchool)
    if (filterClass)  list = list.filter(s => Object.keys(s.levels).some(k => k.includes(filterClass.toLowerCase())))
    if (filterLevel !== '') list = list.filter(s => {
      if (filterClass) return Object.entries(s.levels).some(([k, v]) => k.includes(filterClass.toLowerCase()) && v === parseInt(filterLevel))
      return Object.values(s.levels).includes(parseInt(filterLevel))
    })
    return list.slice(0, 100)
  }, [search, filterSchool, filterClass, filterLevel])

  const getLevel = (spell) => {
    if (!filterClass) return Object.values(spell.levels)[0] ?? '?'
    const entry = Object.entries(spell.levels).find(([k]) => k.includes(filterClass.toLowerCase()))
    return entry ? entry[1] : '?'
  }

  const addSpell = (spell) => {
    const lvl = getLevel(spell)
    onAdd(emptySpell({
      name: spell.name,
      level: typeof lvl === 'number' ? lvl : 0,
      school: spell.school,
      castingTime: spell.casting_time ?? '1 standard action',
      range: spell.range ?? '',
      duration: spell.duration ?? '',
      savingThrow: spell.saving_throw ?? '',
      components: spell.components ?? '',
      description: spell.description ?? '',
      prepared: 1,
      used: 0,
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '2px solid var(--accent)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>📖 Spell Library</h2>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{SPELL_LIBRARY.length} spells · showing {results.length}</p>
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
            placeholder="Search spells..."
            className="input-field text-sm flex-1 min-w-40"
          />
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="input-field text-sm" style={{ width: 'auto' }}>
            <option value="">All Classes</option>
            {CLASSES_LIST.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
          <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)} className="input-field text-sm" style={{ width: 'auto' }}>
            <option value="">All Schools</option>
            {SPELL_SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="input-field text-sm" style={{ width: 'auto' }}>
            <option value="">All Levels</option>
            {[0,1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>{l === 0 ? 'Cantrip (0)' : `Level ${l}`}</option>)}
          </select>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Spell list */}
          <div className="w-1/2 overflow-y-auto" style={{ borderRight: '1px solid var(--bg-border)' }}>
            {results.length === 0 && (
              <div className="text-center py-10 text-sm" style={{ color: 'var(--text-faint)' }}>No spells found.</div>
            )}
            {results.map((spell, i) => (
              <div
                key={spell.name + i}
                onClick={() => setSelected(spell)}
                className="flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors"
                style={{
                  backgroundColor: selected?.name === spell.name ? 'var(--accent-dim)' : i % 2 === 0 ? 'var(--bg-darker)' : 'var(--bg-surface)',
                  borderBottom: '1px solid var(--bg-border)',
                }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: 'var(--bg-border)', color: 'var(--accent)' }}>
                  {getLevel(spell)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: selected?.name === spell.name ? 'var(--accent)' : 'var(--text)' }}>{spell.name}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>{spell.school} · {spell.casting_time}</div>
                </div>
              </div>
            ))}
            {results.length === 100 && (
              <div className="text-center py-3 text-xs" style={{ color: 'var(--text-faint)' }}>Showing first 100 results — refine your search</div>
            )}
          </div>

          {/* Spell detail */}
          <div className="w-1/2 overflow-y-auto p-5">
            {!selected ? (
              <div className="text-center py-10" style={{ color: 'var(--text-faint)' }}>
                <div className="text-4xl mb-3">📜</div>
                <p className="text-sm">Select a spell to see details</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-xl" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>{selected.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{selected.school} · {selected.spell_level}</p>
                </div>

                {[
                  ['Casting Time', selected.casting_time],
                  ['Components', selected.components],
                  ['Range', selected.range],
                  ['Duration', selected.duration],
                  ['Saving Throw', selected.saving_throw],
                  ['Targets', selected.targets],
                  ['Source', selected.source],
                ].filter(([, v]) => v).map(([label, val]) => (
                  <div key={label} className="flex gap-2 text-xs">
                    <span className="font-bold flex-shrink-0" style={{ color: 'var(--accent)', minWidth: 80 }}>{label}:</span>
                    <span style={{ color: 'var(--text-dim)' }}>{val}</span>
                  </div>
                ))}

                {selected.description && (
                  <div className="pt-2" style={{ borderTop: '1px solid var(--bg-border)' }}>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{selected.description}</p>
                  </div>
                )}

                <button
                  onClick={() => { addSpell(selected); onClose() }}
                  className="w-full py-2 rounded font-bold text-sm mt-2 transition-colors"
                  style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--accent-dim)'}
                >
                  + Add to Spell List
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Spell Card Popup ─────────────────────────────────────────────────────────

const SCHOOL_COLORS = {
  Abjuration:    '#60a5fa', Conjuration:   '#a78bfa', Divination:    '#34d399',
  Enchantment:   '#f472b6', Evocation:     '#fb923c', Illusion:      '#c084fc',
  Necromancy:    '#4ade80', Transmutation: '#facc15', Universal:     '#94a3b8',
}

function SpellCardPopup({ spellName, onClose }) {
  const data = useMemo(() => SPELL_LIBRARY.find(s => s.name.toLowerCase() === spellName.toLowerCase()), [spellName])
  const color = SCHOOL_COLORS[data?.school] ?? 'var(--accent)'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', border: `2px solid ${color}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${color}33`, background: `linear-gradient(135deg, var(--bg-darker) 0%, ${color}18 100%)` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-xl leading-tight" style={{ color, fontFamily: 'Georgia,serif' }}>
                {data?.name ?? spellName}
              </h2>
              {data && (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}25`, color, border: `1px solid ${color}55` }}>
                    {data.school}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{data.source}</span>
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-lg flex-shrink-0 mt-0.5" style={{ color: 'var(--text-dim)' }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!data ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📜</div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{spellName}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>No database entry found for this spell.</p>
            </div>
          ) : (
            <>
              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs rounded-lg p-3" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
                {[
                  ['Casting Time', data.casting_time],
                  ['Components',   data.components],
                  ['Range',        data.range],
                  ['Targets',      data.targets],
                  ['Duration',     data.duration],
                  ['Saving Throw', data.saving_throw],
                ].filter(([, v]) => v).map(([label, val]) => (
                  <div key={label}>
                    <span className="font-bold" style={{ color }}>{label}: </span>
                    <span style={{ color: 'var(--text-dim)' }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Spell levels */}
              {data.spell_level && (
                <div className="text-xs rounded-lg p-3" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
                  <span className="font-bold" style={{ color }}>Spell Level: </span>
                  <span style={{ color: 'var(--text-dim)' }}>{data.spell_level}</span>
                </div>
              )}

              {/* Description */}
              {data.description && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-faint)' }}>Description</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{data.description}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Spell Row ────────────────────────────────────────────────────────────────

function SpellRow({ spell, abilityModVal, dcBonuses, onUpdate, onRemove, onCast, onShowCard, isEven }) {
  const [expanded, setExpanded] = useState(false)
  const canCast = spell.level === 0 || (spell.used ?? 0) < (spell.prepared ?? 1)

  const schoolBonus = dcBonuses.filter(b => b.school === 'All Schools' || b.school === spell.school).reduce((s, b) => s + (b.bonus ?? 0), 0)
  const spellDC     = spell.level === 0 ? null : 10 + spell.level + abilityModVal + schoolBonus

  return (
    <div className="rounded-lg overflow-hidden mb-1" style={{ backgroundColor: isEven ? 'var(--bg-darker)' : 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Level badge */}
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}>
          {spell.level}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={spell.name}
              onChange={e => onUpdate('name', e.target.value)}
              placeholder="Spell name..."
              className="bg-transparent font-semibold text-sm focus:outline-none flex-1 min-w-0"
              style={{ color: 'var(--text)', borderBottom: '1px solid transparent' }}
              onFocus={e => e.target.style.borderBottomColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderBottomColor = 'transparent'}
            />
            {spell.name && (
              <button onClick={() => onShowCard(spell.name)} title="View spell card" className="text-xs flex-shrink-0 leading-none" style={{ color: 'var(--accent)', opacity: 0.7 }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
              >📖</button>
            )}
          </div>
          <div className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>
            {spell.school} · {spell.castingTime || '—'} {spell.savingThrow ? `· Save: ${spell.savingThrow}` : ''}
          </div>
        </div>

        {/* DC */}
        {spellDC && (
          <div className="text-center px-2 flex-shrink-0" title={`10 + Lvl(${spell.level}) + Mod(${formatMod(abilityModVal)})${schoolBonus ? ` + Bonus(+${schoolBonus})` : ''}`}
            style={{ cursor: 'help' }}>
            <div className="text-xs" style={{ color: 'var(--text-faint)' }}>DC</div>
            <div className="font-bold text-sm" style={{ color: schoolBonus > 0 ? 'var(--positive)' : 'var(--text)' }}>{spellDC}</div>
          </div>
        )}

        {/* Prepared pips */}
        {spell.level > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(spell.prepared ?? 1, 6) }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full border" style={{
                  backgroundColor: i < (spell.used ?? 0) ? 'var(--text-faint)' : 'var(--accent)',
                  borderColor: 'var(--accent)',
                }} />
              ))}
              {(spell.prepared ?? 1) > 6 && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>+{(spell.prepared ?? 1) - 6}</span>}
            </div>
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{(spell.prepared ?? 1) - (spell.used ?? 0)}/{spell.prepared ?? 1}</span>
          </div>
        )}

        {/* Cast */}
        <button onClick={onCast} disabled={!canCast}
          className="text-xs font-bold px-3 py-1 rounded flex-shrink-0"
          style={{ backgroundColor: canCast ? 'var(--accent-dim)' : 'var(--bg-border)', color: canCast ? 'var(--accent)' : 'var(--text-faint)', border: `1px solid ${canCast ? 'var(--accent)' : 'var(--bg-border)'}`, opacity: canCast ? 1 : 0.5 }}>
          Cast
        </button>

        <button onClick={() => setExpanded(x => !x)} className="text-xs px-2 py-1 rounded flex-shrink-0" style={{ color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}>
          {expanded ? '▲' : '▼'}
        </button>
        <button onClick={onRemove} className="text-xs px-2 py-1 rounded flex-shrink-0" style={{ color: '#ef4444', border: '1px solid var(--bg-border)' }}>✕</button>
      </div>

      {expanded && (
        <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-3" style={{ borderTop: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-darker)' }}>
          <div>
            <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Level</label>
            <select value={spell.level} onChange={e => onUpdate('level', Number(e.target.value))} className="input-field text-xs mt-0.5">
              {[0,1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>{l === 0 ? 'Cantrip' : l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--text-dim)' }}>School</label>
            <select value={spell.school} onChange={e => onUpdate('school', e.target.value)} className="input-field text-xs mt-0.5">
              {SPELL_SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Casting Time</label>
            <input type="text" value={spell.castingTime ?? ''} onChange={e => onUpdate('castingTime', e.target.value)} className="input-field text-xs mt-0.5" />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Range</label>
            <input type="text" value={spell.range ?? ''} onChange={e => onUpdate('range', e.target.value)} className="input-field text-xs mt-0.5" />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Duration</label>
            <input type="text" value={spell.duration ?? ''} onChange={e => onUpdate('duration', e.target.value)} className="input-field text-xs mt-0.5" />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Saving Throw</label>
            <input type="text" value={spell.savingThrow ?? ''} onChange={e => onUpdate('savingThrow', e.target.value)} className="input-field text-xs mt-0.5" />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Components</label>
            <input type="text" value={spell.components ?? ''} onChange={e => onUpdate('components', e.target.value)} className="input-field text-xs mt-0.5" />
          </div>
          {spell.level > 0 && (
            <div>
              <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Prepared</label>
              <SpinnerInput value={spell.prepared ?? 1} onChange={v => onUpdate('prepared', Math.max(0, v))} min={0} width="w-12" />
            </div>
          )}
          <div className="col-span-2 md:col-span-3">
            <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Description</label>
            <textarea value={spell.description ?? ''} onChange={e => onUpdate('description', e.target.value)} rows={4} className="input-field text-xs mt-0.5 resize-none" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Spells({ character, onChange, pins = {}, onTogglePin }) {
  const { spellcasting = {}, abilities } = character
  const [filterLevel, setFilterLevel]   = useState('all')
  const [castResult, setCastResult]     = useState(null)
  const [showLibrary, setShowLibrary]   = useState(false)
  const [spellCard, setSpellCard]       = useState(null)

  const spells         = spellcasting.spells    ?? []
  const slots          = spellcasting.slots     ?? {}
  const dcBonuses      = spellcasting.dcBonuses ?? []
  const castingAbility = spellcasting.ability   ?? 'int'
  const casterLevel    = spellcasting.casterLevel ?? character.level ?? 1

  const abilityModVal = abilityMod(abilities[castingAbility] ?? 10)
  const allBonus      = dcBonuses.filter(b => b.school === 'All Schools').reduce((s, b) => s + b.bonus, 0)
  const baseSpellDC   = 10 + abilityModVal + allBonus
  const concentration = casterLevel + abilityModVal + (spellcasting.concentrationMisc ?? 0)

  const updateSC    = (k, v)    => onChange('spellcasting', { ...spellcasting, [k]: v })
  const updateSlot  = (lvl, v)  => updateSC('slots', { ...slots, [lvl]: v })
  const addSpell    = (spell)   => updateSC('spells', [...spells, spell])
  const removeSpell = (i)       => updateSC('spells', spells.filter((_, idx) => idx !== i))
  const updateSpell = (i, k, v) => updateSC('spells', spells.map((s, idx) => idx === i ? { ...s, [k]: v } : s))

  const castSpell = (i) => {
    const spell = spells[i]
    if (spell.level === 0) { setCastResult({ name: spell.name, dc: null, msg: 'Cantrip — unlimited uses' }); return }
    if ((spell.used ?? 0) < (spell.prepared ?? 1)) {
      updateSpell(i, 'used', (spell.used ?? 0) + 1)
      const bonus = dcBonuses.filter(b => b.school === 'All Schools' || b.school === spell.school).reduce((s, b) => s + b.bonus, 0)
      const dc = 10 + spell.level + abilityModVal + bonus
      setCastResult({ name: spell.name, dc, msg: `${(spell.prepared ?? 1) - (spell.used ?? 0) - 1} use(s) left`, breakdown: `10 + Lvl(${spell.level}) + Mod(${formatMod(abilityModVal)})${bonus ? ` + Bonus(+${bonus})` : ''} = ${dc}` })
    }
  }

  const rollConc = () => {
    const d20 = Math.floor(Math.random() * 20) + 1
    setCastResult({ name: 'Concentration', dc: null, msg: `d20(${d20}) ${formatMod(concentration)} = ${d20 + concentration}` })
  }

  const resetAll = () => {
    const resetSlots = {}
    Object.keys(slots).forEach(k => { resetSlots[k] = { ...slots[k], used: 0 } })
    onChange('spellcasting', {
      ...spellcasting,
      spells: spells.map(s => ({ ...s, used: 0 })),
      slots: resetSlots,
    })
  }

  const spellLevels = [0,1,2,3,4,5,6,7,8,9]
  const filtered = filterLevel === 'all' ? spells : spells.filter(s => s.level === Number(filterLevel))

  return (
    <div className="space-y-4">
      {/* Library modal */}
      {showLibrary && <SpellLibrary castingClass={spellcasting.class} onAdd={addSpell} onClose={() => setShowLibrary(false)} />}

      {/* Spell card popup */}
      {spellCard && <SpellCardPopup spellName={spellCard} onClose={() => setSpellCard(null)} />}

      {/* Cast popup */}
      {castResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setCastResult(null)}>
          <div className="rounded-xl p-8 text-center shadow-2xl max-w-sm w-full mx-4" style={{ backgroundColor: 'var(--bg-surface)', border: '2px solid var(--accent)' }} onClick={e => e.stopPropagation()}>
            <div className="text-3xl mb-2">✨</div>
            <div className="font-bold text-xl mb-1" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>{castResult.name}</div>
            {castResult.dc && <div className="text-4xl font-bold mb-1" style={{ color: 'var(--text)' }}>DC {castResult.dc}</div>}
            {castResult.breakdown && <div className="text-sm mb-1" style={{ color: 'var(--text-dim)' }}>{castResult.breakdown}</div>}
            <div className="text-sm" style={{ color: 'var(--text-dim)' }}>{castResult.msg}</div>
            <button onClick={() => setCastResult(null)} className="mt-4 btn-secondary text-sm px-6">Close</button>
          </div>
        </div>
      )}

      {/* Spellcasting info */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="section-title mb-0">Spellcasting</h2>
          {onTogglePin && <PinButton pinned={pins.spellcasting} onToggle={() => onTogglePin('spellcasting')} />}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Casting Class</label>
            <input type="text" value={spellcasting.class ?? ''} onChange={e => updateSC('class', e.target.value)} placeholder="e.g. Wizard" className="input-field text-sm mt-0.5" />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Casting Ability</label>
            <select value={castingAbility} onChange={e => updateSC('ability', e.target.value)} className="input-field text-sm mt-0.5">
              {Object.entries(CASTING_ABILITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Caster Level</label>
            <SpinnerInput value={casterLevel} onChange={v => updateSC('casterLevel', Math.max(1, v))} min={1} max={20} />
          </div>
          <div className="stat-box text-center cursor-help" title={`Base: 10 + Mod(${abilityModVal})${allBonus ? ` + Global(+${allBonus})` : ''}\nActual DC = base + spell level`}>
            <div className="text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>Base Spell DC</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{baseSpellDC}</div>
            <div className="text-xs" style={{ color: 'var(--text-faint)' }}>+ spell lvl each spell</div>
          </div>
          <div className="stat-box text-center cursor-pointer hover:opacity-80" onClick={rollConc}>
            <div className="text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>Concentration</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{formatMod(concentration)}</div>
            <div className="text-xs" style={{ color: 'var(--accent)' }}>🎲 Click to roll</div>
          </div>
        </div>
        <DCBonusManager dcBonuses={dcBonuses} onUpdate={v => updateSC('dcBonuses', v)} />
        <div className="mt-3">
          <SpellsPerDayPanel castingClass={spellcasting.class} currentLevel={casterLevel} abilityModVal={abilityModVal} />
        </div>
        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-dim)' }}>Spell Slots</div>
          <div className="flex gap-2 flex-wrap">
            {spellLevels.map(lvl => <SlotTracker key={lvl} level={lvl} slots={slots[lvl] ?? { max: 0, used: 0 }} onUpdate={v => updateSlot(lvl, v)} />)}
          </div>
        </div>
      </div>

      {/* Spell List */}
      <div className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="section-title mb-0">Spell List ({spells.length})</h2>
            {onTogglePin && <PinButton pinned={pins.spells} onToggle={() => onTogglePin('spells')} />}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={resetAll} className="text-xs px-3 py-1 rounded border" style={{ color: 'var(--text-dim)', borderColor: 'var(--bg-border)' }}>↺ Rest</button>
            <button onClick={() => addSpell(emptySpell())} className="btn-secondary text-xs py-1 px-3">+ Blank Spell</button>
            <button onClick={() => setShowLibrary(true)} className="btn-primary text-xs py-1 px-3">📖 Spell Library</button>
          </div>
        </div>

        {/* Level filter */}
        <div className="flex gap-1 flex-wrap mb-3">
          {['all', ...spellLevels.map(String)].map(lvl => (
            <button key={lvl} onClick={() => setFilterLevel(lvl)} className="text-xs px-2 py-1 rounded"
              style={{ backgroundColor: filterLevel === lvl ? 'var(--accent-dim)' : 'var(--bg-darker)', color: filterLevel === lvl ? 'var(--accent)' : 'var(--text-dim)', border: `1px solid ${filterLevel === lvl ? 'var(--accent)' : 'var(--bg-border)'}` }}>
              {lvl === 'all' ? 'All' : lvl === '0' ? 'Cantrips' : `Lvl ${lvl}`}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10" style={{ color: 'var(--text-faint)' }}>
            <div className="text-4xl mb-2">📖</div>
            <p className="text-sm mb-3">No spells yet.</p>
            <button onClick={() => setShowLibrary(true)} className="btn-primary text-sm px-6">📖 Browse Spell Library</button>
          </div>
        )}

        {filterLevel === 'all'
          ? spellLevels.map(lvl => {
              const lvlSpells = spells.filter(s => s.level === lvl)
              if (!lvlSpells.length) return null
              const lvlAllBonus = dcBonuses.filter(b => b.school === 'All Schools').reduce((s, b) => s + b.bonus, 0)
              return (
                <div key={lvl} className="mb-4">
                  <div className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                    <span>{lvl === 0 ? 'Cantrips' : `Level ${lvl}`}</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--bg-border)' }} />
                    {lvl > 0 && <span style={{ color: 'var(--text-faint)' }}>Base DC {10 + lvl + abilityModVal + lvlAllBonus}</span>}
                  </div>
                  {lvlSpells.map((spell, i) => {
                    const ri = spells.findIndex(s => s.id === spell.id)
                    return <SpellRow key={spell.id} spell={spell} abilityModVal={abilityModVal} dcBonuses={dcBonuses} isEven={i % 2 === 0}
                      onUpdate={(k, v) => updateSpell(ri, k, v)} onRemove={() => removeSpell(ri)} onCast={() => castSpell(ri)} onShowCard={setSpellCard} />
                  })}
                </div>
              )
            })
          : filtered.map((spell, i) => {
              const ri = spells.findIndex(s => s.id === spell.id)
              return <SpellRow key={spell.id} spell={spell} abilityModVal={abilityModVal} dcBonuses={dcBonuses} isEven={i % 2 === 0}
                onUpdate={(k, v) => updateSpell(ri, k, v)} onRemove={() => removeSpell(ri)} onCast={() => castSpell(ri)} onShowCard={setSpellCard} />
            })
        }
      </div>
    </div>
  )
}
