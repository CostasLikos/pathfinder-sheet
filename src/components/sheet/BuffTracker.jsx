import { useState, useRef, useEffect } from 'react'
import PinButton from '../PinButton'

const DURATION_UNITS = ['rounds', 'minutes', 'hours', 'permanent']
const BUFF_SOURCES   = ['Spell', 'Feat', 'Item', 'Class Ability', 'Racial', 'Other']

const BARD_PERFORMANCES = [
  'Inspire Courage','Inspire Competence','Inspire Greatness','Inspire Heroics',
  'Fascinate','Suggestion','Dirge of Doom','Frightening Tune',
  'Soothing Performance','Mass Suggestion','Other',
]

const STAT_MOD_FIELDS = [
  { key: 'attackRoll',  label: 'Attack Roll' },
  { key: 'damage',      label: 'Damage' },
  { key: 'ac',          label: 'AC' },
  { key: 'initiative',  label: 'Initiative' },
  { key: 'fort',        label: 'Fortitude' },
  { key: 'ref',         label: 'Reflex' },
  { key: 'will',        label: 'Will' },
  { key: 'hp',          label: 'HP' },
  { key: 'cmb',         label: 'CMB' },
  { key: 'str',         label: 'STR' },
  { key: 'dex',         label: 'DEX' },
  { key: 'con',         label: 'CON' },
  { key: 'int',         label: 'INT' },
  { key: 'wis',         label: 'WIS' },
  { key: 'cha',         label: 'CHA' },
]

const emptyMods = () => Object.fromEntries(STAT_MOD_FIELDS.map(f => [f.key, 0]))

const emptyStatBuff = (type = 'buff') => ({
  id: crypto.randomUUID(),
  name: '',
  type,   // 'buff' | 'debuff'
  active: true,
  source: 'Spell',
  mods: emptyMods(),
  notes: '',
})

const emptyDurationBuff = () => ({
  id: crypto.randomUUID(),
  name: '',
  source: 'Spell',
  duration: 3,
  unit: 'rounds',
  remaining: 3,
  notes: '',
})

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtMod(v) { return v > 0 ? `+${v}` : `${v}` }

function activeSummary(statBuffs = []) {
  const totals = emptyMods()
  statBuffs.filter(b => b.active).forEach(b => {
    STAT_MOD_FIELDS.forEach(({ key }) => {
      totals[key] += (b.mods?.[key] ?? 0) * (b.type === 'debuff' ? -1 : 1)
    })
  })
  return totals
}

// ─── Performance Picker ───────────────────────────────────────────────────────
function PerformancePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const filtered = value ? BARD_PERFORMANCES.filter(p => p.toLowerCase().includes(value.toLowerCase())) : BARD_PERFORMANCES
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

// ─── Bardic Performance ───────────────────────────────────────────────────────
function BardicPerformance({ character, onChange, pinned, onTogglePin }) {
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
          <h2 className="section-title mb-0">🎶 Bardic Performance</h2>
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
          <div className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
            Lvl {level} + CHA {chaMod >= 0 ? `+${chaMod}` : chaMod} = {roundsPerDay} rounds/day
          </div>
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
          <PerformancePicker value={currentPerf} onChange={v => updateBP({ currentPerf: v })} />
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
  const isDebuff   = buff.type === 'debuff'
  const activeColor = isDebuff ? '#ef4444' : 'var(--positive)'
  const nonZero = STAT_MOD_FIELDS.filter(f => (buff.mods?.[f.key] ?? 0) !== 0)

  return (
    <div className="rounded-lg overflow-hidden" style={{
      border: `1px solid ${buff.active ? (isDebuff ? '#7f1d1d' : 'var(--accent-dim)') : 'var(--bg-border)'}`,
      backgroundColor: 'var(--bg-darker)',
      opacity: buff.active ? 1 : 0.5,
    }}>
      {/* header row */}
      <div className="flex items-center gap-2 px-3 py-2">

        {/* toggle */}
        <button onClick={() => onUpdate('active', !buff.active)}
          title={buff.active ? 'Deactivate' : 'Activate'}
          className="flex-shrink-0 w-8 h-5 rounded-full relative transition-colors"
          style={{ backgroundColor: buff.active ? activeColor : 'var(--bg-border)' }}>
          <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
            style={{ left: buff.active ? '14px' : '2px' }} />
        </button>

        {/* type badge */}
        <span className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ backgroundColor: isDebuff ? '#450a0a' : 'var(--accent-dim)', color: isDebuff ? '#f87171' : 'var(--accent)' }}>
          {isDebuff ? 'DEBUFF' : 'BUFF'}
        </span>

        {/* name */}
        <input type="text" value={buff.name} onChange={e => onUpdate('name', e.target.value)}
          placeholder={isDebuff ? 'Debuff name...' : 'Buff name...'}
          className="flex-1 bg-transparent text-sm font-semibold focus:outline-none min-w-0"
          style={{ color: 'var(--text)', borderBottom: '1px solid transparent' }}
          onFocus={e => e.target.style.borderBottomColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderBottomColor = 'transparent'} />

        {/* source */}
        <select value={buff.source} onChange={e => onUpdate('source', e.target.value)}
          className="text-xs px-1 py-0.5 rounded focus:outline-none flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--accent)', border: '1px solid var(--bg-border)' }}>
          {BUFF_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* expand */}
        <button onClick={() => setExpanded(x => !x)}
          className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ color: 'var(--text-faint)', border: '1px solid var(--bg-border)' }}>{expanded ? '▲' : '▼'}</button>

        {/* remove */}
        <button onClick={onRemove}
          className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ color: '#ef4444', border: '1px solid var(--bg-border)' }}>✕</button>
      </div>

      {/* active modifier summary */}
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

      {/* expanded edit panel */}
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
                  onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
                />
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BuffTracker({ character, onChange, pins = {}, onTogglePin }) {
  const buffs     = character.buffs ?? []
  const statBuffs = character.statBuffs ?? []
  const isBard    = (character.class ?? '').toLowerCase() === 'bard'
  const [round, setRound] = useState(character.combatRound ?? 1)

  const addStatBuff   = (type) => onChange('statBuffs', [...statBuffs, emptyStatBuff(type)])
  const updateStatBuff = (i, key, val) => onChange('statBuffs', statBuffs.map((b, idx) => idx === i ? { ...b, [key]: val } : b))
  const removeStatBuff = (i) => onChange('statBuffs', statBuffs.filter((_, idx) => idx !== i))

  const addDurBuff    = () => onChange('buffs', [...buffs, emptyDurationBuff()])
  const updateDurBuff = (i, key, val) => onChange('buffs', buffs.map((b, idx) => idx === i ? { ...b, [key]: val } : b))
  const removeDurBuff = (i) => onChange('buffs', buffs.filter((_, idx) => idx !== i))

  const nextRound = () => {
    const nr = round + 1
    setRound(nr)
    onChange('combatRound', nr)
    onChange('buffs', buffs.map(b => b.unit !== 'rounds' || b.remaining <= 0 ? b : { ...b, remaining: b.remaining - 1 }))
  }

  const summary = activeSummary(statBuffs)
  const activeSummaryFields = STAT_MOD_FIELDS.filter(f => summary[f.key] !== 0)
  const expiredCount = buffs.filter(b => b.unit !== 'permanent' && b.remaining <= 0).length

  return (
    <div className="space-y-4">

      {isBard && (
        <BardicPerformance character={character} onChange={onChange}
          pinned={pins.bardic} onTogglePin={onTogglePin ? () => onTogglePin('bardic') : undefined} />
      )}

      {/* ── STAT BUFF / DEBUFF TRACKER ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="section-title mb-0">⚔️ Buff & Debuff Tracker</h2>
            {onTogglePin && <PinButton pinned={pins.statBuffs} onToggle={() => onTogglePin('statBuffs')} />}
          </div>
          <div className="flex gap-2">
            <button onClick={() => addStatBuff('buff')} className="text-xs px-3 py-1 rounded font-bold transition-colors"
              style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
              + Add Buff
            </button>
            <button onClick={() => addStatBuff('debuff')} className="text-xs px-3 py-1 rounded font-bold transition-colors"
              style={{ backgroundColor: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d' }}>
              + Add Debuff
            </button>
          </div>
        </div>

        {/* active summary bar */}
        {activeSummaryFields.length > 0 && (
          <div className="mb-3 p-2 rounded flex flex-wrap gap-2"
            style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>Net Active:</span>
            {activeSummaryFields.map(f => (
              <span key={f.key} className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: summary[f.key] > 0 ? 'var(--positive)' : '#ef4444',
                  border: '1px solid var(--bg-border)',
                }}>
                {f.label} {fmtMod(summary[f.key])}
              </span>
            ))}
          </div>
        )}

        {statBuffs.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-faint)' }}>
            <div className="text-4xl mb-2">⚔️</div>
            <p className="text-sm">No buffs or debuffs. Add one to track stat changes.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {statBuffs.map((b, i) => (
              <StatBuffCard key={b.id} buff={b}
                onUpdate={(key, val) => updateStatBuff(i, key, val)}
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
              <button onClick={() => setRound(r => Math.max(1, r - 1))}
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
            <button onClick={() => { setRound(1); onChange('combatRound', 1) }}
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
                onUpdate={(key, val) => updateDurBuff(i, key, val)}
                onRemove={() => removeDurBuff(i)} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
