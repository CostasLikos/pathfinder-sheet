import { useState, useRef, useEffect } from 'react'
import PinButton from '../PinButton'
import { CONDITIONS, computeClassTotals, CLASS_DATA } from '../../data/pf1eData'

const DURATION_UNITS = ['rounds', 'minutes', 'hours', 'permanent']
const BUFF_SOURCES   = ['Spell', 'Feat', 'Item', 'Class Ability', 'Racial', 'Other']

const BARD_PERFORMANCES = [
  'Inspire Courage','Inspire Competence','Inspire Greatness','Inspire Heroics',
  'Fascinate','Suggestion','Dirge of Doom','Frightening Tune',
  'Soothing Performance','Mass Suggestion','Other',
]

const STAT_MOD_FIELDS = [
  { key: 'attackRoll', label: 'Attack Roll' }, { key: 'damage',    label: 'Damage' },
  { key: 'ac',        label: 'AC' },           { key: 'initiative',label: 'Initiative' },
  { key: 'fort',      label: 'Fortitude' },    { key: 'ref',       label: 'Reflex' },
  { key: 'will',      label: 'Will' },         { key: 'hp',        label: 'HP' },
  { key: 'cmb',       label: 'CMB' },          { key: 'str',       label: 'STR' },
  { key: 'dex',       label: 'DEX' },          { key: 'con',       label: 'CON' },
  { key: 'int',       label: 'INT' },          { key: 'wis',       label: 'WIS' },
  { key: 'cha',       label: 'CHA' },          { key: 'stealth',   label: 'Stealth' },
]

const emptyMods = () => Object.fromEntries(STAT_MOD_FIELDS.map(f => [f.key, 0]))

const emptyStatBuff = (type = 'buff') => ({
  id: crypto.randomUUID(), name: '', type, active: true, source: 'Spell', mods: emptyMods(), notes: '',
})

const emptyDurationBuff = () => ({
  id: crypto.randomUUID(), name: '', source: 'Spell', duration: 3, unit: 'rounds', remaining: 3, notes: '',
})

// ─── XP thresholds by track ───────────────────────────────────────────────────
const XP_TRACKS = {
  slow:   [0,3000,7500,14000,23000,35000,53000,77000,115000,160000,235000,330000,475000,665000,955000,1350000,1900000,2700000,3850000,5350000],
  medium: [0,2000,5000,9000,15000,23000,35000,51000,75000,105000,155000,220000,315000,445000,635000,890000,1300000,1800000,2550000,3600000],
  fast:   [0,1300,3300,6000,10000,15000,23000,34000,50000,71000,105000,145000,210000,295000,425000,600000,850000,1200000,1700000,2400000],
}
const XP_TRACK_LABELS = { slow: 'Slow', medium: 'Medium', fast: 'Fast' }

function getThresholds(track) { return XP_TRACKS[track] ?? XP_TRACKS.medium }
function xpForLevel(lvl, track) { return getThresholds(track)[Math.min(lvl - 1, 19)] ?? 0 }
function xpToNext(lvl, track)   { return getThresholds(track)[Math.min(lvl, 19)] ?? null }
function fmtMod(v) { return v > 0 ? `+${v}` : `${v}` }

function activeSummary(statBuffs = []) {
  const totals = emptyMods()
  statBuffs.filter(b => b.active).forEach(b => {
    STAT_MOD_FIELDS.forEach(({ key }) => { totals[key] += (b.mods?.[key] ?? 0) * (b.type === 'debuff' ? -1 : 1) })
  })
  return totals
}

// ─── Performance Picker ───────────────────────────────────────────────────────
function PerformancePicker({ value, onChange, options = BARD_PERFORMANCES }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const filtered = value ? options.filter(p => p.toLowerCase().includes(value.toLowerCase())) : options
  return (
    <div className="relative mt-0.5" ref={ref}>
      <div className="flex gap-1">
        <input type="text" value={value} onChange={e => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)} placeholder="Type or pick..." className="input-field text-sm flex-1" />
        <button onClick={() => setOpen(x => !x)} className="px-2 rounded text-sm"
          style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}>▾</button>
      </div>
      {open && (
        <div className="absolute z-30 w-full mt-1 rounded-lg overflow-hidden shadow-xl"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--accent)' }}>
          {filtered.map(p => (
            <button key={p} onMouseDown={() => { onChange(p); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm transition-colors"
              style={{ color: value === p ? 'var(--accent)' : 'var(--text)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-border)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              {value === p && '✓ '}{p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── XP Tracker ──────────────────────────────────────────────────────────────
function XPTracker({ character, onChange, pinned, onTogglePin }) {
  const xp    = character.experience ?? 0
  const level = character.level ?? 1
  const track = character.xpTrack ?? 'medium'
  const next  = xpToNext(level, track)
  const curr  = xpForLevel(level, track)
  const pct   = next ? Math.min(100, ((xp - curr) / (next - curr)) * 100) : 100
  const levelUp = next !== null && xp >= next
  const [adding, setAdding] = useState('')

  const applyXP = () => {
    const n = parseInt(adding)
    if (!isNaN(n)) onChange('experience', Math.max(0, xp + n))
    setAdding('')
  }

  // Build the full level table for this track
  const thresholds = getThresholds(track)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="section-title mb-0">⭐ Experience</h2>
          {onTogglePin && <PinButton pinned={pinned} onToggle={onTogglePin} />}
        </div>
        <div className="flex items-center gap-2">
          {levelUp && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full font-bold text-sm animate-pulse"
              style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
              🎉 Level Up! → Level {level + 1}
            </div>
          )}
          {/* Track selector */}
          <select value={track} onChange={e => onChange('xpTrack', e.target.value)}
            className="text-xs px-2 py-1 rounded focus:outline-none"
            style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--accent)', border: '1px solid var(--bg-border)' }}>
            <option value="slow">Slow Track</option>
            <option value="medium">Medium Track</option>
            <option value="fast">Fast Track</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Current XP</div>
          <input type="number" min={0} value={xp}
            onChange={e => onChange('experience', Math.max(0, Number(e.target.value)))}
            className="input-field text-center font-bold text-lg w-32" />
        </div>
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Level</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>{level}</div>
        </div>
        {next !== null ? (
          <div className="text-center">
            <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Next Level at</div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-dim)' }}>{next.toLocaleString()} XP</div>
            <div className="text-xs" style={{ color: 'var(--text-faint)' }}>{Math.max(0, next - xp).toLocaleString()} more needed</div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Level</div>
            <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>Max (20)</div>
          </div>
        )}
      </div>

      {/* XP progress bar */}
      {next !== null && (
        <div className="mb-4">
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-border)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, pct)}%`, backgroundColor: levelUp ? 'var(--accent)' : 'var(--positive)' }} />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
            <span>{curr.toLocaleString()}</span>
            <span>{Math.round(pct)}% to level {level + 1}</span>
            <span>{next.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Add XP */}
      <div className="flex gap-2 items-center mb-4">
        <input type="number" value={adding} onChange={e => setAdding(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyXP()}
          placeholder="+ XP gained..." className="input-field text-sm flex-1" />
        <button onClick={applyXP} className="text-xs px-3 py-1.5 rounded font-bold"
          style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>Add</button>
      </div>

      {/* Level table */}
      <details className="text-xs" style={{ color: 'var(--text-dim)' }}>
        <summary className="cursor-pointer select-none mb-2 font-bold uppercase tracking-wide"
          style={{ color: 'var(--text-faint)', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
          {XP_TRACK_LABELS[track]} Track — Full Table
        </summary>
        <div className="grid grid-cols-4 gap-x-3 gap-y-0.5 mt-2">
          <span className="font-bold" style={{ color: 'var(--text-faint)' }}>Lvl</span>
          <span className="font-bold col-span-2" style={{ color: 'var(--text-faint)' }}>XP Required</span>
          <span className="font-bold" style={{ color: 'var(--text-faint)' }}>To Next</span>
          {thresholds.map((t, i) => {
            const lvl = i + 1
            const isCurrentLevel = lvl === level
            const toNext = thresholds[i + 1] ? (thresholds[i + 1] - t).toLocaleString() : '—'
            return [
              <span key={`l${i}`} className="font-bold" style={{ color: isCurrentLevel ? 'var(--accent)' : 'var(--text-dim)' }}>{lvl}</span>,
              <span key={`x${i}`} className="col-span-2" style={{ color: isCurrentLevel ? 'var(--accent)' : 'var(--text-dim)' }}>{t.toLocaleString()}</span>,
              <span key={`n${i}`} style={{ color: isCurrentLevel ? 'var(--text-dim)' : 'var(--text-faint)' }}>{toNext}</span>,
            ]
          })}
        </div>
      </details>
    </div>
  )
}

// ─── Condition Tracker ────────────────────────────────────────────────────────
function ConditionTracker({ conditions = [], onChange, pinned, onTogglePin }) {
  const [tooltip, setTooltip] = useState(null)
  const toggle = (id) => {
    const next = conditions.includes(id) ? conditions.filter(c => c !== id) : [...conditions, id]
    onChange(next)
  }
  const active = CONDITIONS.filter(c => conditions.includes(c.id))

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="section-title mb-0">🩹 Conditions</h2>
          {onTogglePin && <PinButton pinned={pinned} onToggle={onTogglePin} />}
        </div>
        {active.length > 0 && (
          <button onClick={() => onChange([])} className="text-xs px-2 py-1 rounded border"
            style={{ color: 'var(--text-dim)', borderColor: 'var(--bg-border)' }}>Clear All</button>
        )}
      </div>

      {/* Active conditions summary */}
      {active.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {active.map(c => (
            <div key={c.id} className="flex items-start gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--bg-darker)', border: `1px solid ${c.color}40` }}>
              <span>{c.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="font-bold" style={{ color: c.color }}>{c.label} </span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{c.effect}</span>
              </div>
              <button onClick={() => toggle(c.id)} className="text-xs flex-shrink-0"
                style={{ color: '#ef4444' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Condition grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 relative">
        {CONDITIONS.map(c => {
          const isActive = conditions.includes(c.id)
          return (
            <div key={c.id} className="relative">
              <button
                onClick={() => toggle(c.id)}
                onMouseEnter={() => setTooltip(c.id)}
                onMouseLeave={() => setTooltip(null)}
                className="w-full text-xs py-1.5 px-1 rounded-lg text-center transition-all"
                style={{
                  backgroundColor: isActive ? `${c.color}20` : 'var(--bg-darker)',
                  border: `1px solid ${isActive ? c.color : 'var(--bg-border)'}`,
                  color: isActive ? c.color : 'var(--text-faint)',
                  fontWeight: isActive ? 700 : 400,
                }}>
                <div>{c.icon}</div>
                <div style={{ fontSize: '0.6rem', lineHeight: 1.2, marginTop: '2px' }}>{c.label}</div>
              </button>
              {tooltip === c.id && (
                <div className="absolute z-50 bottom-full mb-1 left-1/2 text-xs rounded-lg p-2 w-44 pointer-events-none"
                  style={{ transform: 'translateX(-50%)', backgroundColor: 'var(--bg-darker)', border: `1px solid ${c.color}`, color: 'var(--text-dim)', boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
                  <div className="font-bold mb-0.5" style={{ color: c.color }}>{c.icon} {c.label}</div>
                  {c.effect}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Initiative Tracker ───────────────────────────────────────────────────────
const emptyCombatant = (name = '', init = 0, isPC = false) => ({
  id: crypto.randomUUID(), name, init, isPC, hp: '', notes: '',
})

function InitiativeTracker({ character, combatants = [], onChange, round, onRoundChange, pinned, onTogglePin }) {
  const [nameInput, setNameInput] = useState('')
  const [initInput, setInitInput] = useState('')
  const sorted = [...combatants].sort((a, b) => b.init - a.init)
  const currentIdx = sorted.findIndex(c => c.id === (character.initiativeCurrent ?? null))

  const addCombatant = () => {
    if (!nameInput.trim()) return
    const init = parseInt(initInput) || 0
    onChange([...combatants, emptyCombatant(nameInput.trim(), init)])
    setNameInput(''); setInitInput('')
  }

  const addSelf = () => {
    const dexMod = Math.floor(((character.abilities?.dex ?? 10) - 10) / 2)
    const initMisc = character.initiative?.misc ?? 0
    const roll = Math.floor(Math.random() * 20) + 1 + dexMod + initMisc
    onChange([...combatants, emptyCombatant(character.name || 'PC', roll, true)])
  }

  const update = (id, key, val) => onChange(combatants.map(c => c.id === id ? { ...c, [key]: val } : c))
  const remove = (id) => {
    onChange(combatants.filter(c => c.id !== id))
    if (character.initiativeCurrent === id) onCurrentChange(null)
  }

  const onCurrentChange = (id) => {
    // stored on character via parent
    onChange(combatants, id)
  }

  const nextTurn = () => {
    if (sorted.length === 0) return
    let next
    if (currentIdx === -1 || currentIdx >= sorted.length - 1) {
      next = sorted[0].id
      if (currentIdx >= sorted.length - 1) onRoundChange(round + 1)
    } else {
      next = sorted[currentIdx + 1].id
    }
    onCurrentChange(next)
  }

  const resetCombat = () => {
    onRoundChange(1)
    onCurrentChange(null)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="section-title mb-0">⚔️ Initiative</h2>
          {onTogglePin && <PinButton pinned={pinned} onToggle={onTogglePin} />}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded"
            style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Round</span>
            <span className="font-bold text-lg" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>{round}</span>
          </div>
          <button onClick={nextTurn} disabled={sorted.length === 0}
            className="text-xs px-3 py-1.5 rounded font-bold"
            style={{ backgroundColor: sorted.length > 0 ? 'var(--accent-dim)' : 'var(--bg-border)', color: sorted.length > 0 ? 'var(--accent)' : 'var(--text-faint)', border: `1px solid ${sorted.length > 0 ? 'var(--accent)' : 'var(--bg-border)'}` }}>
            Next Turn →
          </button>
          <button onClick={resetCombat} className="text-xs px-2 py-1 rounded border"
            style={{ color: 'var(--text-dim)', borderColor: 'var(--bg-border)' }}>↺ Reset</button>
          {combatants.length > 0 && (
            <button onClick={() => { onChange([]); resetCombat() }} className="text-xs px-2 py-1 rounded border"
              style={{ color: '#ef4444', borderColor: '#7f1d1d' }}>Clear All</button>
          )}
        </div>
      </div>

      {/* Combatant list */}
      {sorted.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {sorted.map((c, idx) => {
            const isCurrent = c.id === (character.initiativeCurrent ?? null)
            return (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                style={{
                  backgroundColor: isCurrent ? 'var(--accent-dim)' : 'var(--bg-darker)',
                  border: `1px solid ${isCurrent ? 'var(--accent)' : c.isPC ? 'rgba(201,168,76,0.3)' : 'var(--bg-border)'}`,
                  boxShadow: isCurrent ? '0 0 12px rgba(201,168,76,0.2)' : 'none',
                }}>
                {/* Turn indicator */}
                <div className="flex-shrink-0 w-5 text-center">
                  {isCurrent
                    ? <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>▶</span>
                    : <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{idx + 1}</span>}
                </div>

                {/* Init badge */}
                <input type="number" value={c.init}
                  onChange={e => update(c.id, 'init', Number(e.target.value))}
                  className="w-12 text-center text-sm font-bold rounded px-1 py-0.5 focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--accent)', border: '1px solid var(--bg-border)' }} />

                {/* PC badge */}
                {c.isPC && <span className="text-xs px-1 rounded flex-shrink-0"
                  style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: 'var(--accent)', border: '1px solid rgba(201,168,76,0.3)' }}>PC</span>}

                {/* Name */}
                <input type="text" value={c.name} onChange={e => update(c.id, 'name', e.target.value)}
                  className="flex-1 bg-transparent text-sm font-semibold focus:outline-none min-w-0"
                  style={{ color: isCurrent ? 'var(--accent)' : 'var(--text)' }} />

                {/* HP */}
                <input type="text" value={c.hp} onChange={e => update(c.id, 'hp', e.target.value)}
                  placeholder="HP" className="w-14 text-center text-xs rounded px-1 py-0.5 focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }} />

                <button onClick={() => onCurrentChange(c.id)} title="Set as current turn"
                  className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-faint)', border: '1px solid var(--bg-border)' }}>
                  {isCurrent ? '★' : '☆'}
                </button>
                <button onClick={() => remove(c.id)} className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ color: '#ef4444', border: '1px solid var(--bg-border)' }}>✕</button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-6 mb-3" style={{ color: 'var(--text-faint)' }}>
          <p className="text-sm">No combatants yet. Add enemies or roll for the party.</p>
        </div>
      )}

      {/* Add combatant */}
      <div className="flex gap-2 flex-wrap">
        <input value={initInput} onChange={e => setInitInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCombatant()}
          placeholder="Init" type="number"
          className="w-16 input-field text-sm text-center" />
        <input value={nameInput} onChange={e => setNameInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCombatant()}
          placeholder="Name (enemy/NPC)..."
          className="flex-1 input-field text-sm" />
        <button onClick={addCombatant} className="text-xs px-3 py-1.5 rounded font-bold"
          style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)', border: '1px solid var(--bg-border)' }}>+ Add</button>
        <button onClick={addSelf} className="text-xs px-3 py-1.5 rounded font-bold"
          style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
          title="Roll initiative for your character and add">🎲 Roll Self</button>
      </div>
    </div>
  )
}

// ─── Bardic Performance ───────────────────────────────────────────────────────
const SKALD_SONGS = [
  'Raging Song','Inspired Rage','Song of Marching','Song of Strength',
  'Song of the Dead','Dirge of Doom','Inspire Greatness','Inspire Heroics','Other',
]

function BardicPerformance({ character, onChange, pinned, onTogglePin, isSkald = false }) {
  const perfList = isSkald ? SKALD_SONGS : BARD_PERFORMANCES
  const title    = isSkald ? '🪗 Raging Song' : '🎶 Bardic Performance'
  const level  = character.level ?? 1
  const chaMod = Math.floor(((character.abilities?.cha ?? 10) - 10) / 2)
  const roundsPerDay = 4 + chaMod + (level - 1) * 2
  const bp = character.bardicPerformance ?? {}
  const usedRounds = bp.used ?? 0
  const remainingRounds = Math.max(0, roundsPerDay - usedRounds)
  const isActive = bp.active ?? false
  const currentPerf = bp.currentPerf ?? ''
  const lingeringFeat = bp.lingeringFeat ?? false
  const lingeringRounds = bp.lingeringRounds ?? 0
  const updateBP = (patch) => onChange('bardicPerformance', { ...bp, ...patch })
  const pct = roundsPerDay > 0 ? (remainingRounds / roundsPerDay) * 100 : 0
  const barColor = pct > 50 ? 'var(--positive)' : pct > 25 ? 'var(--warning)' : '#ef4444'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="section-title mb-0">{title}</h2>
          {onTogglePin && <PinButton pinned={pinned} onToggle={onTogglePin} />}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-dim)' }}>
            <input type="checkbox" checked={lingeringFeat} onChange={e => updateBP({ lingeringFeat: e.target.checked })} className="accent-yellow-500" />
            Lingering Performance
          </label>
          <button onClick={() => onChange('bardicPerformance', { ...bp, used: 0, active: false, lingeringRounds: 0 })}
            className="text-xs px-2 py-1 rounded border" style={{ color: 'var(--text-dim)', borderColor: 'var(--bg-border)' }}>↺ New Day</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm" style={{ color: 'var(--text-dim)' }}>Rounds / Day</span>
            <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>{remainingRounds} / {roundsPerDay}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-border)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(0, pct)}%`, backgroundColor: barColor }} />
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Lvl {level} + CHA {chaMod >= 0 ? `+${chaMod}` : chaMod} = {roundsPerDay} rounds/day</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          {isActive ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse inline-block" />
                <span className="font-bold text-sm text-green-400">{currentPerf ? currentPerf.toUpperCase() : 'PERFORMING'}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  if (remainingRounds <= 0) { updateBP({ active: false, lingeringRounds: lingeringFeat ? 2 : 0 }); return }
                  updateBP({ used: usedRounds + 1 })
                }} className="text-sm px-4 py-2 rounded font-bold"
                  style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>▶▶ Continue (−1)</button>
                <button onClick={() => updateBP({ active: false, lingeringRounds: lingeringFeat ? 2 : 0 })}
                  className="text-sm px-4 py-2 rounded font-bold"
                  style={{ backgroundColor: 'var(--bg-darker)', color: '#ef4444', border: '1px solid #ef4444' }}>■ End</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {lingeringRounds > 0 && (
                <div className="text-center">
                  <div className="font-bold text-sm mb-1" style={{ color: 'var(--warning)' }}>✨ Lingering: {lingeringRounds} rounds</div>
                  <button onClick={() => updateBP({ lingeringRounds: Math.max(0, lingeringRounds - 1) })}
                    className="text-xs px-3 py-1 rounded"
                    style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}>− 1 Round</button>
                </div>
              )}
              <button onClick={() => { if (remainingRounds > 0) updateBP({ active: true, lingeringRounds: 0, used: usedRounds + 1 }) }}
                disabled={remainingRounds <= 0}
                className="text-sm px-6 py-2 rounded font-bold"
                style={{ backgroundColor: remainingRounds > 0 ? 'var(--accent-dim)' : 'var(--bg-border)', color: remainingRounds > 0 ? 'var(--accent)' : 'var(--text-faint)', border: `1px solid ${remainingRounds > 0 ? 'var(--accent)' : 'var(--bg-border)'}` }}>
                {remainingRounds > 0 ? '▶ Start' : '✕ No Rounds Left'}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
        <div>
          <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Performance Type</label>
          <PerformancePicker value={currentPerf} onChange={v => updateBP({ currentPerf: v })} options={perfList} />
        </div>
        <div>
          <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Used Rounds</label>
          <input type="number" min={0} max={roundsPerDay} value={usedRounds}
            onChange={e => updateBP({ used: Math.min(roundsPerDay, Math.max(0, Number(e.target.value))) })}
            className="input-field text-sm mt-0.5" />
        </div>
      </div>
    </div>
  )
}

// ─── Stat Buff Card ───────────────────────────────────────────────────────────
function StatBuffCard({ buff, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const isDebuff  = buff.type === 'debuff'
  const activeColor = isDebuff ? '#ef4444' : 'var(--positive)'
  const nonZero = STAT_MOD_FIELDS.filter(f => (buff.mods?.[f.key] ?? 0) !== 0)

  return (
    <div className="rounded-lg overflow-hidden" style={{
      border: `1px solid ${buff.active ? (isDebuff ? '#7f1d1d' : 'var(--accent-dim)') : 'var(--bg-border)'}`,
      backgroundColor: 'var(--bg-darker)', opacity: buff.active ? 1 : 0.5,
    }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={() => onUpdate('active', !buff.active)} title={buff.active ? 'Deactivate' : 'Activate'}
          className="flex-shrink-0 w-8 h-5 rounded-full relative transition-colors"
          style={{ backgroundColor: buff.active ? activeColor : 'var(--bg-border)' }}>
          <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
            style={{ left: buff.active ? '14px' : '2px' }} />
        </button>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ backgroundColor: isDebuff ? '#450a0a' : 'var(--accent-dim)', color: isDebuff ? '#f87171' : 'var(--accent)' }}>
          {isDebuff ? 'DEBUFF' : 'BUFF'}
        </span>
        <input type="text" value={buff.name} onChange={e => onUpdate('name', e.target.value)}
          placeholder={isDebuff ? 'Debuff name...' : 'Buff name...'}
          className="flex-1 bg-transparent text-sm font-semibold focus:outline-none min-w-0"
          style={{ color: 'var(--text)', borderBottom: '1px solid transparent' }}
          onFocus={e => e.target.style.borderBottomColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderBottomColor = 'transparent'} />
        <select value={buff.source} onChange={e => onUpdate('source', e.target.value)}
          className="text-xs px-1 py-0.5 rounded focus:outline-none flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--accent)', border: '1px solid var(--bg-border)' }}>
          {BUFF_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setExpanded(x => !x)} className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ color: 'var(--text-faint)', border: '1px solid var(--bg-border)' }}>{expanded ? '▲' : '▼'}</button>
        <button onClick={onRemove} className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ color: '#ef4444', border: '1px solid var(--bg-border)' }}>✕</button>
      </div>
      {!expanded && nonZero.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-2">
          {nonZero.map(f => {
            const v = buff.mods[f.key]
            const display = isDebuff ? -v : v
            return (
              <span key={f.key} className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'var(--bg-surface)', color: display > 0 ? 'var(--positive)' : '#ef4444', border: '1px solid var(--bg-border)' }}>
                {f.label} {fmtMod(display)}
              </span>
            )
          })}
        </div>
      )}
      {expanded && (
        <div className="border-t px-3 py-3" style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
            {STAT_MOD_FIELDS.map(f => (
              <div key={f.key} className="flex flex-col items-center gap-0.5">
                <label className="text-xs" style={{ color: 'var(--text-dim)' }}>{f.label}</label>
                <input type="number" value={buff.mods?.[f.key] ?? 0}
                  onChange={e => onUpdate('mods', { ...buff.mods, [f.key]: Number(e.target.value) })}
                  className="w-full text-center text-xs rounded px-1 py-0.5 focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text)', border: '1px solid var(--bg-border)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--bg-border)'} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Notes</label>
            <input type="text" value={buff.notes ?? ''} onChange={e => onUpdate('notes', e.target.value)}
              placeholder="Description, source, conditions..."
              className="input-field text-xs py-1 mt-0.5 w-full" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Duration Buff Row ────────────────────────────────────────────────────────
function DurationBuffRow({ buff, onUpdate, onRemove }) {
  const isPermanent = buff.unit === 'permanent'
  const isExpired   = !isPermanent && buff.remaining <= 0
  const isLow       = !isPermanent && buff.remaining <= 2 && buff.remaining > 0
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg" style={{
      backgroundColor: 'var(--bg-darker)',
      border: `1px solid ${isExpired ? '#5a2020' : isLow ? 'var(--warning)' : 'var(--bg-border)'}`,
      opacity: isExpired ? 0.5 : 1,
    }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
        backgroundColor: isExpired ? '#5a2020' : isLow ? 'var(--warning)' : 'var(--positive)',
        boxShadow: !isExpired && !isLow ? '0 0 4px var(--positive)' : 'none',
      }} />
      <input type="text" value={buff.name} onChange={e => onUpdate('name', e.target.value)}
        placeholder="Buff name..." className="flex-1 bg-transparent text-sm font-semibold focus:outline-none min-w-0"
        style={{ color: isExpired ? 'var(--text-faint)' : 'var(--text)' }}
        onFocus={e => e.target.style.borderBottom = '1px solid var(--accent)'}
        onBlur={e => e.target.style.borderBottom = 'none'} />
      <select value={buff.source} onChange={e => onUpdate('source', e.target.value)}
        className="text-xs px-1 py-0.5 rounded focus:outline-none"
        style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--accent)', border: '1px solid var(--bg-border)' }}>
        {BUFF_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      {!isPermanent ? (
        <div className="flex items-center gap-1">
          <button onClick={() => onUpdate('remaining', Math.max(0, buff.remaining - 1))}
            className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold"
            style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}>−</button>
          <div className="text-center" style={{ minWidth: '52px' }}>
            <span className="font-bold text-sm" style={{ color: isExpired ? '#ef4444' : isLow ? 'var(--warning)' : 'var(--text)' }}>
              {isExpired ? 'EXPIRED' : buff.remaining}
            </span>
            {!isExpired && <span className="text-xs ml-0.5" style={{ color: 'var(--text-faint)' }}>{buff.unit.slice(0,3)}</span>}
          </div>
          <button onClick={() => onUpdate('remaining', buff.remaining + 1)}
            className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold"
            style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}>+</button>
        </div>
      ) : (
        <div className="text-xs px-2" style={{ color: 'var(--positive)' }}>Permanent</div>
      )}
      <select value={buff.unit} onChange={e => onUpdate('unit', e.target.value)}
        className="text-xs px-1 py-0.5 rounded focus:outline-none"
        style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}>
        {DURATION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
      </select>
      {!isPermanent && (
        <button onClick={() => onUpdate('remaining', buff.duration)}
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ color: 'var(--text-faint)', border: '1px solid var(--bg-border)' }} title="Reset">↺</button>
      )}
      <button onClick={onRemove} className="text-xs px-1.5 py-0.5 rounded"
        style={{ color: '#ef4444', border: '1px solid var(--bg-border)' }}>✕</button>
    </div>
  )
}

// ─── Level Up Helper ──────────────────────────────────────────────────────────

const FEAT_LEVELS = new Set([1,3,5,7,9,11,13,15,17,19])
const BUMP_LEVELS = new Set([4,8,12,16,20])

function LevelUpHelper({ character, onChange }) {
  const [open, setOpen] = useState(false)
  const hasClasses = (character.classes ?? []).length > 0
  const ct         = computeClassTotals(character.classes ?? [])
  const totalLevel = hasClasses ? ct.totalLevel : (character.level || 1)
  const lus        = character.levelUpState ?? {}
  const hasPending = (lus.pendingRanks ?? 0) > 0 || lus.pendingFeat || lus.pendingAbilityBump

  const nextFeat = [...FEAT_LEVELS].find(l => l > totalLevel)
  const nextBump = [...BUMP_LEVELS].find(l => l > totalLevel)

  const clearItem = (key, val = false) =>
    onChange('levelUpState', { ...lus, [key]: val })

  return (
    <div className="card">
      <button onClick={() => setOpen(x => !x)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>📈 Level Up Helper</span>
          {hasPending && (
            <span className="level-up-pulse text-xs px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e66' }}>
              {[
                (lus.pendingRanks ?? 0) > 0 && 'ranks',
                lus.pendingFeat && 'feat',
                lus.pendingAbilityBump && '+1 stat',
              ].filter(Boolean).join(' · ')} pending
            </span>
          )}
        </div>
        <span style={{ color: 'var(--text-faint)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {/* Current level info */}
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
            <span className="font-semibold" style={{ color: 'var(--text)' }}>Level {totalLevel}</span>
            {hasClasses && (
              <span className="ml-1">
                — {character.classes.map(c => `${c.className} ${c.level}`).join(' / ')}
              </span>
            )}
          </div>

          {/* Pending tasks */}
          {hasPending ? (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#22c55e' }}>
                ✨ Pending at Level {lus.forLevel ?? totalLevel}
              </div>

              {(lus.pendingRanks ?? 0) > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid #22c55e44' }}>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                      📚 Skill Ranks — {lus.pendingRanks} remaining
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                      Go to the Skills tab and add ranks
                    </div>
                  </div>
                  <button onClick={() => clearItem('pendingRanks', 0)}
                    className="text-xs px-2 py-1 rounded flex-shrink-0"
                    style={{ color: 'var(--text-faint)', border: '1px solid var(--bg-border)' }}>
                    ✓ Done
                  </button>
                </div>
              )}

              {lus.pendingFeat && (
                <div className="flex items-center justify-between p-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid #22c55e44' }}>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                      ⚔️ New Feat available
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                      Go to Feats & Traits tab and add it
                    </div>
                  </div>
                  <button onClick={() => clearItem('pendingFeat')}
                    className="text-xs px-2 py-1 rounded flex-shrink-0"
                    style={{ color: 'var(--text-faint)', border: '1px solid var(--bg-border)' }}>
                    ✓ Done
                  </button>
                </div>
              )}

              {lus.pendingAbilityBump && (
                <div className="flex items-center justify-between p-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid #22c55e44' }}>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                      💪 Ability Score +1
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                      Go to Overview and raise one ability score
                    </div>
                  </div>
                  <button onClick={() => clearItem('pendingAbilityBump')}
                    className="text-xs px-2 py-1 rounded flex-shrink-0"
                    style={{ color: 'var(--text-faint)', border: '1px solid var(--bg-border)' }}>
                    ✓ Done
                  </button>
                </div>
              )}

              <button
                onClick={() => onChange('levelUpState', { ...lus, pendingRanks: 0, pendingFeat: false, pendingAbilityBump: false })}
                className="w-full text-xs py-1 rounded"
                style={{ color: 'var(--text-faint)', border: '1px solid var(--bg-border)' }}>
                Dismiss all
              </button>
            </div>
          ) : (
            <div className="text-xs py-2" style={{ color: 'var(--text-faint)' }}>
              Nothing pending — all caught up!
            </div>
          )}

          {/* Coming up */}
          {(nextFeat || nextBump) && (
            <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: '0.75rem' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>
                Coming Up
              </div>
              <div className="space-y-1 text-xs" style={{ color: 'var(--text-faint)' }}>
                {nextFeat && <div>⚔️ Next feat — Level {nextFeat}</div>}
                {nextBump && <div>💪 Ability score bump — Level {nextBump}</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Size Changer ─────────────────────────────────────────────────────────────
const SIZE_CATEGORIES = [
  { id: 'fine',        label: 'Fine',        icon: '🔬', space: '½ ft',  reach: '0',    acAtk: +8,  cmb: -8, stealth: +16, fly: +8  },
  { id: 'diminutive',  label: 'Diminutive',  icon: '🐜', space: '1 ft',  reach: '0',    acAtk: +4,  cmb: -4, stealth: +12, fly: +6  },
  { id: 'tiny',        label: 'Tiny',        icon: '🐭', space: '2½ ft', reach: '0',    acAtk: +2,  cmb: -2, stealth: +8,  fly: +4  },
  { id: 'small',       label: 'Small',       icon: '🧒', space: '5 ft',  reach: '5 ft', acAtk: +1,  cmb: -1, stealth: +4,  fly: +2  },
  { id: 'medium',      label: 'Medium',      icon: '🧍', space: '5 ft',  reach: '5 ft', acAtk:  0,  cmb:  0, stealth: 0,   fly: 0   },
  { id: 'large',       label: 'Large',       icon: '🧌', space: '10 ft', reach: '10ft', acAtk: -1,  cmb: +1, stealth: -4,  fly: -2  },
  { id: 'huge',        label: 'Huge',        icon: '🦖', space: '15 ft', reach: '15ft', acAtk: -2,  cmb: +2, stealth: -8,  fly: -4  },
  { id: 'gargantuan',  label: 'Gargantuan',  icon: '🐉', space: '20 ft', reach: '20ft', acAtk: -4,  cmb: +4, stealth: -12, fly: -6  },
  { id: 'colossal',    label: 'Colossal',    icon: '🌋', space: '30 ft', reach: '30ft', acAtk: -8,  cmb: +8, stealth: -16, fly: -8  },
]

const SIZE_STR_DEX = {
  fine:       { str: -8, dex: +8 },
  diminutive: { str: -4, dex: +4 },
  tiny:       { str: -2, dex: +2 },
  small:      { str: -2, dex: +2 },
  medium:     { str: 0,  dex: 0  },
  large:      { str: +8, dex: -2 },
  huge:       { str: +16, dex: -4 },
  gargantuan: { str: +24, dex: -4 },
  colossal:   { str: +32, dex: -4 },
}

const SIZE_BUFF_ID = '__size_change__'

function SizeChanger({ character, onChange, pinned, onTogglePin }) {
  const current  = character.sizeCategory ?? 'medium'
  const size     = SIZE_CATEGORIES.find(s => s.id === current) ?? SIZE_CATEGORIES[4]
  const isMedium = current === 'medium'
  const strDex   = SIZE_STR_DEX[current] ?? { str: 0, dex: 0 }
  const medIdx   = SIZE_CATEGORIES.findIndex(s => s.id === 'medium')

  const acColor  = size.acAtk > 0 ? 'var(--positive)' : size.acAtk < 0 ? '#ef4444' : 'var(--text-dim)'
  const cmbColor = size.cmb   > 0 ? 'var(--positive)' : size.cmb   < 0 ? '#ef4444' : 'var(--text-dim)'
  const steColor = size.stealth > 0 ? 'var(--positive)' : size.stealth < 0 ? '#ef4444' : 'var(--text-dim)'

  const applySize = (sizeId) => {
    const sData   = SIZE_CATEGORIES.find(s => s.id === sizeId)
    const sd      = SIZE_STR_DEX[sizeId] ?? { str: 0, dex: 0 }
    const current = character.statBuffs ?? []
    const without = current.filter(b => b.id !== SIZE_BUFF_ID)

    onChange('sizeCategory', sizeId)

    if (sizeId === 'medium') {
      onChange('statBuffs', without)
      return
    }

    const sizeBuff = {
      id: SIZE_BUFF_ID,
      name: `Size: ${sData.label}`,
      type: 'buff',
      active: true,
      source: 'Other',
      notes: `Size modifier — AC/Atk ${sData.acAtk > 0 ? '+' : ''}${sData.acAtk}, CMB ${sData.cmb > 0 ? '+' : ''}${sData.cmb}`,
      mods: {
        ...emptyMods(),
        ac:          sData.acAtk,
        attackRoll:  sData.acAtk,
        cmb:         sData.cmb,
        str:         sd.str,
        dex:         sd.dex,
        stealth:     sData.stealth,
        fly:         sData.fly,
      },
    }
    onChange('statBuffs', [...without, sizeBuff])
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="section-title mb-0">📏 Size Category</h2>
          {onTogglePin && <PinButton pinned={pinned} onToggle={onTogglePin} />}
        </div>
        {!isMedium && (
          <button onClick={() => applySize('medium')}
            className="text-xs px-3 py-1 rounded font-bold"
            style={{ color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}>
            ↺ Reset to Medium
          </button>
        )}
      </div>

      {/* Size selector — single row, buttons stretch to fill */}
      <div className="flex gap-1 mb-4">
        {SIZE_CATEGORIES.map((s, i) => {
          const isActive   = s.id === current
          const isMed      = s.id === 'medium'
          const smaller    = i < medIdx
          const labelColor = isActive ? 'var(--accent)' : isMed ? 'var(--text-dim)' : smaller ? '#60a5fa' : '#f97316'
          return (
            <button key={s.id} onClick={() => applySize(s.id)}
              className="flex flex-col items-center gap-0.5 py-2 rounded-lg transition-all"
              style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: isActive ? 'var(--accent-dim)' : 'var(--bg-darker)',
                border: `2px solid ${isActive ? 'var(--accent)' : 'var(--bg-border)'}`,
              }}>
              <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
              <span style={{ fontSize: '0.55rem', fontWeight: isActive ? 700 : 400, color: labelColor, lineHeight: 1.2, textAlign: 'center', wordBreak: 'break-word' }}>
                {s.label}
              </span>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: s.acAtk > 0 ? 'var(--positive)' : s.acAtk < 0 ? '#ef4444' : 'var(--text-faint)' }}>
                {s.acAtk === 0 ? '—' : s.acAtk > 0 ? `+${s.acAtk}` : s.acAtk}
              </span>
            </button>
          )
        })}
      </div>

      {/* Stats panel */}
      {!isMedium ? (
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--accent)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span style={{ fontSize: '2rem' }}>{size.icon}</span>
            <div>
              <div className="font-bold text-lg" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>{size.label}</div>
              <div className="text-xs" style={{ color: 'var(--text-faint)' }}>Space: {size.space} · Reach: {size.reach}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatBadge label="AC / Atk"  value={size.acAtk}    color={acColor} />
            <StatBadge label="CMB / CMD" value={size.cmb}       color={cmbColor} />
            <StatBadge label="Stealth"   value={size.stealth}   color={steColor} />
            {strDex.str !== 0 && <StatBadge label="STR" value={strDex.str} color={strDex.str > 0 ? 'var(--positive)' : '#ef4444'} />}
            {strDex.dex !== 0 && <StatBadge label="DEX" value={strDex.dex} color={strDex.dex > 0 ? 'var(--positive)' : '#ef4444'} />}
            <StatBadge label="Fly"       value={size.fly}       color={size.fly > 0 ? 'var(--positive)' : '#ef4444'} />
          </div>
          <div className="mt-3 text-xs px-1" style={{ color: 'var(--positive)' }}>
            ✓ Modifiers applied — check Stat Buffs to see or edit.
          </div>
        </div>
      ) : (
        <div className="text-center py-4 rounded-lg" style={{ color: 'var(--text-faint)', backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
          <p className="text-sm">Medium — no modifiers active.</p>
        </div>
      )}
    </div>
  )
}

function StatBadge({ label, value, color }) {
  const display = value > 0 ? `+${value}` : `${value}`
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded flex-shrink-0"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span className="font-bold text-sm" style={{ color }}>{display}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BuffTracker({ character, onChange, pins = {}, onTogglePin }) {
  const buffs      = character.buffs ?? []
  const statBuffs  = character.statBuffs ?? []
  const conditions = character.conditions ?? []
  const combatants = character.initiativeCombatants ?? []
  const performanceClasses = ['bard', 'skald']
  const mainClass  = (character.class ?? '').toLowerCase()
  const classNames = (character.classes ?? []).map(c => c.className?.toLowerCase())
  const isBard     = performanceClasses.includes(mainClass) || classNames.some(c => performanceClasses.includes(c))
  const isSkald    = mainClass === 'skald' || classNames.includes('skald')
  const round      = character.combatRound ?? 1

  const addStatBuff    = (type) => onChange('statBuffs', [...statBuffs, emptyStatBuff(type)])
  const updateStatBuff = (i, k, v) => onChange('statBuffs', statBuffs.map((b, idx) => idx === i ? { ...b, [k]: v } : b))
  const removeStatBuff = (i) => onChange('statBuffs', statBuffs.filter((_, idx) => idx !== i))
  const addDurBuff     = () => onChange('buffs', [...buffs, emptyDurationBuff()])
  const updateDurBuff  = (i, k, v) => onChange('buffs', buffs.map((b, idx) => idx === i ? { ...b, [k]: v } : b))
  const removeDurBuff  = (i) => onChange('buffs', buffs.filter((_, idx) => idx !== i))

  const nextRound = () => {
    const nr = round + 1
    onChange('combatRound', nr)
    onChange('buffs', buffs.map(b => b.unit !== 'rounds' || b.remaining <= 0 ? b : { ...b, remaining: b.remaining - 1 }))
  }

  const updateCombatants = (next, currentId) => {
    onChange('initiativeCombatants', next)
    if (currentId !== undefined) onChange('initiativeCurrent', currentId)
  }

  const summary = activeSummary(statBuffs)
  const activeSummaryFields = STAT_MOD_FIELDS.filter(f => summary[f.key] !== 0)
  const expiredCount = buffs.filter(b => b.unit !== 'permanent' && b.remaining <= 0).length

  return (
    <div className="space-y-4">

      <LevelUpHelper character={character} onChange={onChange} />

      <SizeChanger character={character} onChange={onChange}
        pinned={pins.size} onTogglePin={onTogglePin ? () => onTogglePin('size') : undefined} />

      <XPTracker character={character} onChange={onChange}
        pinned={pins.xp} onTogglePin={onTogglePin ? () => onTogglePin('xp') : undefined} />

      <ConditionTracker conditions={conditions}
        onChange={next => onChange('conditions', next)}
        pinned={pins.conditions} onTogglePin={onTogglePin ? () => onTogglePin('conditions') : undefined} />

      <InitiativeTracker character={character} combatants={combatants}
        onChange={updateCombatants}
        round={round}
        onRoundChange={r => onChange('combatRound', r)}
        pinned={pins.initiative} onTogglePin={onTogglePin ? () => onTogglePin('initiative') : undefined} />

      {isBard && (
        <BardicPerformance character={character} onChange={onChange} isSkald={isSkald}
          pinned={pins.bardic} onTogglePin={onTogglePin ? () => onTogglePin('bardic') : undefined} />
      )}

      {/* ── STAT BUFF / DEBUFF ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="section-title mb-0">⚡ Stat Buffs & Debuffs</h2>
            {onTogglePin && <PinButton pinned={pins.statBuffs} onToggle={() => onTogglePin('statBuffs')} />}
          </div>
          <div className="flex gap-2">
            <button onClick={() => addStatBuff('buff')} className="text-xs px-3 py-1 rounded font-bold"
              style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>+ Buff</button>
            <button onClick={() => addStatBuff('debuff')} className="text-xs px-3 py-1 rounded font-bold"
              style={{ backgroundColor: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d' }}>+ Debuff</button>
          </div>
        </div>
        {activeSummaryFields.length > 0 && (
          <div className="mb-3 p-2 rounded flex flex-wrap gap-2"
            style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>Net Active:</span>
            {activeSummaryFields.map(f => (
              <span key={f.key} className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'var(--bg-surface)', color: summary[f.key] > 0 ? 'var(--positive)' : '#ef4444', border: '1px solid var(--bg-border)' }}>
                {f.label} {fmtMod(summary[f.key])}
              </span>
            ))}
          </div>
        )}
        {statBuffs.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-faint)' }}>
            <div className="text-4xl mb-2">⚡</div>
            <p className="text-sm">No buffs or debuffs yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {statBuffs.map((b, i) => (
              <StatBuffCard key={b.id} buff={b}
                onUpdate={(k, v) => updateStatBuff(i, k, v)}
                onRemove={() => removeStatBuff(i)} />
            ))}
          </div>
        )}
      </div>

      {/* ── DURATION TRACKER ── */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="section-title mb-0">⏱ Duration Tracker</h2>
            {onTogglePin && <PinButton pinned={pins.buffs} onToggle={() => onTogglePin('buffs')} />}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1 rounded"
              style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
              <button onClick={() => onChange('combatRound', Math.max(1, round - 1))}
                className="text-sm w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}>−</button>
              <div className="text-center">
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Round</div>
                <div className="font-bold" style={{ color: 'var(--accent)' }}>{round}</div>
              </div>
              <button onClick={nextRound} className="text-sm px-2 py-1 rounded font-bold"
                style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>Next →</button>
            </div>
            {expiredCount > 0 && (
              <button onClick={() => onChange('buffs', buffs.filter(b => b.unit === 'permanent' || b.remaining > 0))}
                className="text-xs px-2 py-1 rounded border" style={{ color: '#ef4444', borderColor: '#7f1d1d' }}>
                Clear Expired ({expiredCount})
              </button>
            )}
            <button onClick={() => onChange('combatRound', 1)}
              className="text-xs px-2 py-1 rounded border" style={{ color: 'var(--text-dim)', borderColor: 'var(--bg-border)' }}>↺ Reset</button>
            <button onClick={addDurBuff} className="btn-primary text-xs py-1 px-3">+ Add</button>
          </div>
        </div>
        {buffs.length === 0 ? (
          <div className="text-center py-6" style={{ color: 'var(--text-faint)' }}>
            <p className="text-sm">No duration buffs. Add one to track rounds/minutes.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {buffs.map((b, i) => (
              <DurationBuffRow key={b.id} buff={b}
                onUpdate={(k, v) => updateDurBuff(i, k, v)}
                onRemove={() => removeDurBuff(i)} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
