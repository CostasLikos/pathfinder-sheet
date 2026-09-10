import { useState, useMemo, useRef, useEffect } from 'react'
import PinButton from '../PinButton'
import { abilityMod, formatMod, SPELL_SCHOOLS } from '../../data/pf1eData'
import SpinnerInput from '../SpinnerInput'
import ALL_SPELLS_RAW from '../../data/spells.json'

const CASTING_ABILITIES = { int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }

// ─── Spells Per Day Tables ────────────────────────────────────────────────────
const SPD = {
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

const bonusSpells = (mod, spellLevel) => {
  if (spellLevel === 0 || mod < spellLevel) return 0
  return Math.floor((mod - spellLevel) / 4) + 1
}

// ─── Spells Per Day Reference Panel ──────────────────────────────────────────

function SpellsPerDayPanel({ castingClass, currentLevel, abilityModVal = 0 }) {
  const [open, setOpen] = useState(false)
  const tableKey = resolveTable(castingClass)
  const table = tableKey ? SPD[tableKey] : null
  const headers = tableKey ? LEVEL_HEADERS[tableKey] : []
  const lvl = Math.max(1, Math.min(20, currentLevel || 1))

  return (
    <div>
      <button onClick={() => setOpen(x => !x)}
        className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg w-full"
        style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)', textAlign: 'left' }}>
        <span>📊</span>
        <span className="font-semibold" style={{ color: 'var(--accent)' }}>Spells Per Day Reference</span>
        <span className="ml-1" style={{ color: 'var(--text-faint)' }}>
          {castingClass ? `(${castingClass})` : '— set casting class above'}
        </span>
        <span className="ml-auto" style={{ color: 'var(--accent)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid var(--bg-border)' }}>
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
                      <tr key={i} style={{
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

const normalizeSchool = (s) => {
  if (!s) return 'Universal'
  const map = { transmutation: 'Transmutation', transformation: 'Transmutation', 'see text': 'Universal' }
  const lower = s.toLowerCase()
  if (map[lower]) return map[lower]
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

const parseSpellLevels = (str) => {
  if (!str) return {}
  const result = {}
  str.split(',').forEach(part => {
    const m = part.trim().match(/^(.+?)\s+(\d+)$/)
    if (m) result[m[1].trim().toLowerCase()] = parseInt(m[2])
  })
  return result
}

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

// ─── School Colors ────────────────────────────────────────────────────────────

const SCHOOL_COLORS = {
  Abjuration:    '#60a5fa',
  Conjuration:   '#a78bfa',
  Divination:    '#34d399',
  Enchantment:   '#f472b6',
  Evocation:     '#fb923c',
  Illusion:      '#c084fc',
  Necromancy:    '#4ade80',
  Transmutation: '#facc15',
  Universal:     '#94a3b8',
}

const SCHOOL_ICONS = {
  Abjuration: '🛡', Conjuration: '🌀', Divination: '🔮',
  Enchantment: '💫', Evocation: '⚡', Illusion: '👁',
  Necromancy: '💀', Transmutation: '⚗', Universal: '✨',
}

// ─── Slot Tracker ─────────────────────────────────────────────────────────────

const LEVEL_COLORS = ['#94a3b8','#60a5fa','#a78bfa','#f472b6','#fb923c','#facc15','#4ade80','#34d399','#c084fc','#f43f5e']

function SlotTracker({ level, slots, onUpdate }) {
  const max = slots?.max ?? 0
  const used = slots?.used ?? 0
  const remaining = Math.max(0, max - used)
  const color = LEVEL_COLORS[level] ?? '#C9A84C'

  return (
    <div className="flex flex-col items-center rounded-xl px-2 py-2 gap-1.5"
      style={{ backgroundColor: 'var(--bg-darker)', border: `1px solid ${color}44`, borderTop: `3px solid ${color}`, minWidth: 60 }}>
      <div className="text-xs font-bold" style={{ color }}>
        {level === 0 ? '✨ 0' : `${level}`}
      </div>
      <div className="flex flex-wrap gap-0.5 justify-center" style={{ maxWidth: 52 }}>
        {Array.from({ length: max }).map((_, i) => (
          <button key={i}
            onClick={() => onUpdate({ ...slots, used: i < used ? i : i + 1 })}
            className="w-3 h-3 rounded-full border transition-colors"
            style={{ backgroundColor: i < used ? 'var(--bg-border)' : color, borderColor: color }}
          />
        ))}
        {max === 0 && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>—</span>}
      </div>
      <div className="text-xs font-bold" style={{ color: remaining === 0 && max > 0 ? 'var(--text-faint)' : color }}>
        {remaining}/{max}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onUpdate({ ...slots, max: Math.max(0, max - 1) })} className="w-4 h-4 rounded flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-dim)' }}>−</button>
        <button onClick={() => onUpdate({ ...slots, max: max + 1 })} className="w-4 h-4 rounded flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-dim)' }}>+</button>
      </div>
      <button onClick={() => onUpdate({ ...slots, used: 0 })} className="text-xs leading-none" style={{ color: 'var(--text-faint)' }}>↺</button>
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
      <button onClick={() => setOpen(x => !x)} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
        style={{ backgroundColor: 'var(--bg-darker)', color: dcBonuses.length ? 'var(--accent)' : 'var(--text-dim)', border: `1px solid ${dcBonuses.length ? 'var(--accent)' : 'var(--bg-border)'}` }}>
        🎯 DC Bonuses {dcBonuses.length > 0 && `(${dcBonuses.length})`} {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-xl space-y-2" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>Spell DC Bonuses</span>
            <button onClick={add} className="text-xs px-2 py-0.5 rounded-lg" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid #C9A84C55' }}>+ Add</button>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Spell Focus, school specialization, etc. School-specific bonuses only apply to matching spells.</p>
          {dcBonuses.map(b => (
            <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
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
  const [search, setSearch]           = useState('')
  const [filterClass, setFilterClass] = useState(castingClass?.toLowerCase() ?? '')
  const [filterSchool, setFilterSchool] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [selected, setSelected]       = useState(null)
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', border: '2px solid var(--accent)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--bg-border)', background: 'linear-gradient(135deg, var(--bg-darker) 0%, #C9A84C18 100%)' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>📖 Spell Library</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{SPELL_LIBRARY.length} spells · showing {results.length}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ color: 'var(--text-dim)', backgroundColor: 'var(--bg-border)' }}>✕</button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 flex flex-wrap gap-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-darker)' }}>
          <input
            ref={searchRef}
            type="text" value={search} onChange={e => setSearch(e.target.value)}
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
            {results.map((spell, i) => {
              const schoolColor = SCHOOL_COLORS[spell.school] ?? '#94a3b8'
              const isSelected = selected?.name === spell.name
              return (
                <div key={spell.name + i} onClick={() => setSelected(spell)}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSelected ? '#C9A84C22' : i % 2 === 0 ? 'var(--bg-darker)' : 'var(--bg-surface)',
                    borderBottom: '1px solid var(--bg-border)',
                    borderLeft: `3px solid ${isSelected ? 'var(--accent)' : schoolColor + '66'}`,
                  }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: schoolColor + '22', color: schoolColor, border: `1px solid ${schoolColor}44` }}>
                    {getLevel(spell)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}>{spell.name}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
                      <span style={{ color: schoolColor }}>{spell.school}</span> · {spell.casting_time}
                    </div>
                  </div>
                </div>
              )
            })}
            {results.length === 100 && (
              <div className="text-center py-3 text-xs" style={{ color: 'var(--text-faint)' }}>Showing first 100 — refine your search</div>
            )}
          </div>

          {/* Spell detail */}
          <div className="w-1/2 overflow-y-auto">
            {!selected ? (
              <div className="text-center py-16" style={{ color: 'var(--text-faint)' }}>
                <div className="text-5xl mb-3">📜</div>
                <p className="text-sm">Select a spell to see details</p>
              </div>
            ) : (() => {
              const color = SCHOOL_COLORS[selected.school] ?? '#94a3b8'
              return (
                <div>
                  <div className="px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: `1px solid ${color}33`, background: `linear-gradient(135deg, var(--bg-darker) 0%, ${color}18 100%)` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-lg leading-tight" style={{ color, fontFamily: 'Georgia,serif' }}>{selected.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}>
                            {SCHOOL_ICONS[selected.school]} {selected.school}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>{selected.spell_level}</p>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs rounded-xl p-3"
                      style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
                      {[
                        ['Casting Time', selected.casting_time],
                        ['Components', selected.components],
                        ['Range', selected.range],
                        ['Targets', selected.targets],
                        ['Duration', selected.duration],
                        ['Saving Throw', selected.saving_throw],
                        ['Source', selected.source],
                      ].filter(([, v]) => v).map(([label, val]) => (
                        <div key={label}>
                          <span className="font-bold" style={{ color }}>{label}: </span>
                          <span style={{ color: 'var(--text-dim)' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                    {selected.description && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-faint)' }}>Description</p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{selected.description}</p>
                      </div>
                    )}
                    <button
                      onClick={() => { addSpell(selected); onClose() }}
                      className="w-full py-2 rounded-lg font-bold text-sm transition-colors"
                      style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid #C9A84C55' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--accent-dim)'}>
                      + Add to Spell List
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Spell Card Popup ─────────────────────────────────────────────────────────

function SpellCardPopup({ spellName, onClose }) {
  const data = useMemo(() => SPELL_LIBRARY.find(s => s.name.toLowerCase() === spellName.toLowerCase()), [spellName])
  const color = SCHOOL_COLORS[data?.school] ?? 'var(--accent)'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', border: `2px solid ${color}` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${color}33`, background: `linear-gradient(135deg, var(--bg-darker) 0%, ${color}18 100%)` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-xl leading-tight" style={{ color, fontFamily: 'Georgia,serif' }}>{data?.name ?? spellName}</h2>
              {data && (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}25`, color, border: `1px solid ${color}55` }}>
                    {SCHOOL_ICONS[data.school]} {data.school}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{data.source}</span>
                </div>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ color: 'var(--text-dim)', backgroundColor: 'var(--bg-border)' }}>✕</button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {!data ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📜</div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{spellName}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>No database entry found for this spell.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs rounded-xl p-3" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
                {[['Casting Time', data.casting_time],['Components', data.components],['Range', data.range],['Targets', data.targets],['Duration', data.duration],['Saving Throw', data.saving_throw]].filter(([, v]) => v).map(([label, val]) => (
                  <div key={label}><span className="font-bold" style={{ color }}>{label}: </span><span style={{ color: 'var(--text-dim)' }}>{val}</span></div>
                ))}
              </div>
              {data.spell_level && (
                <div className="text-xs rounded-xl p-3" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
                  <span className="font-bold" style={{ color }}>Spell Level: </span>
                  <span style={{ color: 'var(--text-dim)' }}>{data.spell_level}</span>
                </div>
              )}
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
  const schoolColor = SCHOOL_COLORS[spell.school] ?? '#94a3b8'

  const schoolBonus = dcBonuses.filter(b => b.school === 'All Schools' || b.school === spell.school).reduce((s, b) => s + (b.bonus ?? 0), 0)
  const spellDC     = spell.level === 0 ? null : 10 + spell.level + abilityModVal + schoolBonus
  const usedCount   = spell.used ?? 0
  const prepCount   = spell.prepared ?? 1

  return (
    <div className="rounded-xl overflow-hidden mb-1.5"
      style={{
        backgroundColor: isEven ? 'var(--bg-darker)' : 'var(--bg-surface)',
        border: `1px solid ${schoolColor}33`,
        borderLeft: `3px solid ${schoolColor}`,
      }}>
      <div className="flex items-center gap-2 px-3 py-2">
        {/* School icon + level badge */}
        <div className="flex flex-col items-center flex-shrink-0 gap-0.5">
          <span className="text-base leading-none">{SCHOOL_ICONS[spell.school] ?? '✨'}</span>
          <div className="text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
            style={{ backgroundColor: `${schoolColor}22`, color: schoolColor, border: `1px solid ${schoolColor}44`, minWidth: '1.2rem', textAlign: 'center' }}>
            {spell.level}
          </div>
        </div>

        {/* Name + subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <input
              type="text" value={spell.name}
              onChange={e => onUpdate('name', e.target.value)}
              placeholder="Spell name..."
              className="bg-transparent font-semibold text-sm focus:outline-none flex-1 min-w-0"
              style={{ color: 'var(--text)', borderBottom: '1px solid transparent' }}
              onFocus={e => e.target.style.borderBottomColor = schoolColor}
              onBlur={e => e.target.style.borderBottomColor = 'transparent'}
            />
            {spell.name && (
              <button onClick={() => onShowCard(spell.name)} title="View spell card"
                className="text-xs flex-shrink-0 leading-none opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: schoolColor }}>📖</button>
            )}
          </div>
          <div className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
            <span style={{ color: schoolColor + 'cc' }}>{spell.school}</span>
            {spell.castingTime ? ` · ${spell.castingTime}` : ''}
            {spell.savingThrow ? ` · Save: ${spell.savingThrow}` : ''}
          </div>
        </div>

        {/* DC */}
        {spellDC && (
          <div className="text-center px-2 flex-shrink-0 cursor-help"
            title={`10 + Lvl(${spell.level}) + Mod(${formatMod(abilityModVal)})${schoolBonus ? ` + Bonus(+${schoolBonus})` : ''}`}>
            <div className="text-xs" style={{ color: 'var(--text-faint)' }}>DC</div>
            <div className="font-bold text-sm" style={{ color: schoolBonus > 0 ? 'var(--positive)' : 'var(--text)' }}>{spellDC}</div>
          </div>
        )}

        {/* Prepared pips */}
        {spell.level > 0 && (
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(prepCount, 6) }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full border"
                  style={{ backgroundColor: i < usedCount ? 'var(--bg-border)' : schoolColor, borderColor: schoolColor }} />
              ))}
              {prepCount > 6 && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>+{prepCount - 6}</span>}
            </div>
            <span className="text-xs" style={{ color: usedCount >= prepCount ? 'var(--text-faint)' : schoolColor }}>
              {prepCount - usedCount}/{prepCount}
            </span>
          </div>
        )}

        {/* Cast */}
        <button onClick={onCast} disabled={!canCast}
          className="text-xs font-bold px-3 py-1 rounded-lg flex-shrink-0 transition-colors"
          style={{
            backgroundColor: canCast ? `${schoolColor}22` : 'var(--bg-border)',
            color: canCast ? schoolColor : 'var(--text-faint)',
            border: `1px solid ${canCast ? schoolColor + '55' : 'var(--bg-border)'}`,
            opacity: canCast ? 1 : 0.5,
          }}>
          ✦ Cast
        </button>

        <button onClick={() => setExpanded(x => !x)} className="text-xs px-2 py-1 rounded flex-shrink-0" style={{ color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}>
          {expanded ? '▲' : '▼'}
        </button>
        <button onClick={onRemove} className="text-xs px-2 py-1 rounded flex-shrink-0" style={{ color: '#ef4444', border: '1px solid var(--bg-border)' }}>✕</button>
      </div>

      {expanded && (
        <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-3" style={{ borderTop: `1px solid ${schoolColor}22`, backgroundColor: 'var(--bg-darker)' }}>
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
  const [filterLevel, setFilterLevel] = useState('all')
  const [castResult, setCastResult]   = useState(null)
  const [showLibrary, setShowLibrary] = useState(false)
  const [spellCard, setSpellCard]     = useState(null)

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
    if (spell.level === 0) { setCastResult({ name: spell.name, dc: null, msg: 'Cantrip — unlimited uses', color: SCHOOL_COLORS[spell.school] }); return }
    if ((spell.used ?? 0) < (spell.prepared ?? 1)) {
      updateSpell(i, 'used', (spell.used ?? 0) + 1)
      const bonus = dcBonuses.filter(b => b.school === 'All Schools' || b.school === spell.school).reduce((s, b) => s + b.bonus, 0)
      const dc = 10 + spell.level + abilityModVal + bonus
      setCastResult({
        name: spell.name,
        dc,
        msg: `${(spell.prepared ?? 1) - (spell.used ?? 0) - 1} use(s) left`,
        breakdown: `10 + Lvl(${spell.level}) + Mod(${formatMod(abilityModVal)})${bonus ? ` + Bonus(+${bonus})` : ''} = ${dc}`,
        color: SCHOOL_COLORS[spell.school] ?? 'var(--accent)',
        school: spell.school,
      })
    }
  }

  const rollConc = () => {
    const d20 = Math.floor(Math.random() * 20) + 1
    setCastResult({ name: 'Concentration', dc: null, msg: `d20(${d20}) ${formatMod(concentration)} = ${d20 + concentration}`, color: 'var(--accent)' })
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
      {showLibrary && <SpellLibrary castingClass={spellcasting.class} onAdd={addSpell} onClose={() => setShowLibrary(false)} />}
      {spellCard && <SpellCardPopup spellName={spellCard.name} onClose={() => setSpellCard(null)} />}

      {/* Cast result popup */}
      {castResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setCastResult(null)}>
          <div className="rounded-xl p-8 text-center shadow-2xl max-w-sm w-full mx-4"
            style={{ backgroundColor: 'var(--bg-surface)', border: `2px solid ${castResult.color}`, background: `linear-gradient(135deg, var(--bg-surface) 0%, ${castResult.color}12 100%)` }}
            onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">{castResult.school ? (SCHOOL_ICONS[castResult.school] ?? '✨') : '✨'}</div>
            <div className="font-bold text-xl mb-1" style={{ color: castResult.color, fontFamily: 'Georgia,serif' }}>{castResult.name}</div>
            {castResult.dc && <div className="text-5xl font-bold mb-1" style={{ color: 'var(--text)', fontFamily: 'Georgia,serif' }}>DC {castResult.dc}</div>}
            {castResult.breakdown && <div className="text-sm mb-1" style={{ color: 'var(--text-dim)' }}>{castResult.breakdown}</div>}
            <div className="text-sm" style={{ color: 'var(--text-dim)' }}>{castResult.msg}</div>
            <button onClick={() => setCastResult(null)} className="mt-5 px-8 py-2 rounded-lg font-bold text-sm"
              style={{ backgroundColor: `${castResult.color}22`, color: castResult.color, border: `1px solid ${castResult.color}55` }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Spellcasting Panel ── */}
      <div className="card" style={{ borderTop: '3px solid var(--accent)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🔮</span>
          <h2 className="section-title mb-0">Spellcasting</h2>
          {onTogglePin && <PinButton pinned={pins.spellcasting} onToggle={() => onTogglePin('spellcasting')} />}
        </div>

        {/* Core inputs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Casting Class</label>
            <input type="text" value={spellcasting.class ?? ''} onChange={e => updateSC('class', e.target.value)} placeholder="e.g. Wizard" className="input-field text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Casting Ability</label>
            <select value={castingAbility} onChange={e => updateSC('ability', e.target.value)} className="input-field text-sm mt-1">
              {Object.entries(CASTING_ABILITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Caster Level</label>
            <div className="mt-1">
              <SpinnerInput value={casterLevel} onChange={v => updateSC('casterLevel', Math.max(1, v))} min={1} max={20} />
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-4 text-center cursor-help"
            title={`Base: 10 + Mod(${abilityModVal})${allBonus ? ` + Global(+${allBonus})` : ''}\nActual DC = base + spell level`}
            style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid #a78bfa44', borderTop: '3px solid #a78bfa', background: 'linear-gradient(180deg, #a78bfa0d 0%, transparent 60%)' }}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#a78bfa' }}>🎯 Base Spell DC</div>
            <div className="font-bold" style={{ fontSize: '2.2rem', color: 'var(--text)', fontFamily: 'Georgia,serif', lineHeight: 1 }}>{baseSpellDC}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>+ spell level per cast</div>
          </div>
          <div className="rounded-xl p-4 text-center cursor-pointer transition-opacity hover:opacity-80"
            onClick={rollConc}
            style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid #34d39944', borderTop: '3px solid #34d399', background: 'linear-gradient(180deg, #34d3990d 0%, transparent 60%)' }}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#34d399' }}>🎲 Concentration</div>
            <div className="font-bold" style={{ fontSize: '2.2rem', color: 'var(--text)', fontFamily: 'Georgia,serif', lineHeight: 1 }}>{formatMod(concentration)}</div>
            <div className="text-xs mt-1" style={{ color: '#34d399' }}>Click to roll</div>
          </div>
        </div>

        <div className="space-y-3">
          <DCBonusManager dcBonuses={dcBonuses} onUpdate={v => updateSC('dcBonuses', v)} />
          <SpellsPerDayPanel castingClass={spellcasting.class} currentLevel={casterLevel} abilityModVal={abilityModVal} />
        </div>

        {/* Spell Slots */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Spell Slots</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--bg-border)' }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {spellLevels.map(lvl => (
              <SlotTracker key={lvl} level={lvl} slots={slots[lvl] ?? { max: 0, used: 0 }} onUpdate={v => updateSlot(lvl, v)} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Spell List Panel ── */}
      <div className="card" style={{ borderTop: '3px solid #fb923c' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">📜</span>
            <h2 className="section-title mb-0">Spell List</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: '#fb923c22', color: '#fb923c', border: '1px solid #fb923c44' }}>
              {spells.length}
            </span>
            {onTogglePin && <PinButton pinned={pins.spells} onToggle={() => onTogglePin('spells')} />}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={resetAll} className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: 'var(--text-dim)', border: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-darker)' }}>
              ↺ Rest
            </button>
            <button onClick={() => addSpell(emptySpell())} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ color: 'var(--accent)', border: '1px solid #C9A84C55', backgroundColor: 'var(--accent-dim)' }}>
              + Blank Spell
            </button>
            <button onClick={() => setShowLibrary(true)} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ color: '#fb923c', border: '1px solid #fb923c55', backgroundColor: '#fb923c22' }}>
              📖 Spell Library
            </button>
          </div>
        </div>

        {/* Level filter tabs */}
        <div className="flex gap-1 flex-wrap mb-4">
          {['all', ...spellLevels.map(String)].map(lvl => {
            const active = filterLevel === lvl
            const color = lvl === 'all' ? 'var(--accent)' : LEVEL_COLORS[Number(lvl)] ?? 'var(--accent)'
            return (
              <button key={lvl} onClick={() => setFilterLevel(lvl)}
                className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: active ? (lvl === 'all' ? 'var(--accent-dim)' : `${color}22`) : 'var(--bg-darker)',
                  color: active ? color : 'var(--text-dim)',
                  border: `1px solid ${active ? (lvl === 'all' ? 'var(--accent)' : color + '66') : 'var(--bg-border)'}`,
                }}>
                {lvl === 'all' ? 'All' : lvl === '0' ? '✨ 0' : lvl}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-faint)' }}>
            <div className="text-5xl mb-3">📖</div>
            <p className="text-sm mb-4">No spells yet.</p>
            <button onClick={() => setShowLibrary(true)} className="text-sm px-6 py-2 rounded-lg font-bold"
              style={{ color: '#fb923c', border: '1px solid #fb923c55', backgroundColor: '#fb923c22' }}>
              📖 Browse Spell Library
            </button>
          </div>
        )}

        {filterLevel === 'all'
          ? spellLevels.map(lvl => {
              const lvlSpells = spells.filter(s => s.level === lvl)
              if (!lvlSpells.length) return null
              const lvlColor = LEVEL_COLORS[lvl] ?? '#C9A84C'
              const lvlAllBonus = dcBonuses.filter(b => b.school === 'All Schools').reduce((s, b) => s + b.bonus, 0)
              return (
                <div key={lvl} className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ color: lvlColor, backgroundColor: `${lvlColor}15`, border: `1px solid ${lvlColor}33` }}>
                      {lvl === 0 ? '✨ Cantrips' : `Level ${lvl}`}
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: `${lvlColor}33` }} />
                    {lvl > 0 && (
                      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                        Base DC {10 + lvl + abilityModVal + lvlAllBonus}
                      </span>
                    )}
                  </div>
                  {lvlSpells.map((spell, i) => {
                    const ri = spells.findIndex(s => s.id === spell.id)
                    return <SpellRow key={spell.id} spell={spell} abilityModVal={abilityModVal} dcBonuses={dcBonuses} isEven={i % 2 === 0}
                      onUpdate={(k, v) => updateSpell(ri, k, v)} onRemove={() => removeSpell(ri)} onCast={() => castSpell(ri)} onShowCard={name => setSpellCard({ name })} />
                  })}
                </div>
              )
            })
          : filtered.map((spell, i) => {
              const ri = spells.findIndex(s => s.id === spell.id)
              return <SpellRow key={spell.id} spell={spell} abilityModVal={abilityModVal} dcBonuses={dcBonuses} isEven={i % 2 === 0}
                onUpdate={(k, v) => updateSpell(ri, k, v)} onRemove={() => removeSpell(ri)} onCast={() => castSpell(ri)} onShowCard={name => setSpellCard({ name })} />
            })
        }
      </div>
    </div>
  )
}
