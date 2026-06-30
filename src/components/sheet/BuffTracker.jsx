import { useState, useRef, useEffect } from 'react'
import PinButton from '../PinButton'

const DURATION_UNITS = ['rounds', 'minutes', 'hours', 'permanent']
const BUFF_SOURCES = ['Spell', 'Feat', 'Item', 'Class Ability', 'Racial', 'Other']

const BARD_PERFORMANCES = [
  'Inspire Courage',
  'Inspire Competence',
  'Inspire Greatness',
  'Inspire Heroics',
  'Fascinate',
  'Suggestion',
  'Dirge of Doom',
  'Frightening Tune',
  'Soothing Performance',
  'Mass Suggestion',
  'Other',
]

const emptyBuff = () => ({
  id: crypto.randomUUID(),
  name: '',
  source: 'Spell',
  duration: 3,
  unit: 'rounds',
  remaining: 3,
  notes: '',
  expired: false,
})

// ─── Performance Picker ───────────────────────────────────────────────────────

function PerformancePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = value
    ? BARD_PERFORMANCES.filter(p => p.toLowerCase().includes(value.toLowerCase()))
    : BARD_PERFORMANCES

  const select = (p) => { onChange(p); setOpen(false) }

  return (
    <div className="relative mt-0.5" ref={ref}>
      <div className="flex gap-1">
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Type or pick from list..."
          className="input-field text-sm flex-1"
        />
        <button
          onClick={() => setOpen(x => !x)}
          className="px-2 rounded text-sm"
          style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
        >▾</button>
      </div>

      {open && (
        <div
          className="absolute z-30 w-full mt-1 rounded-lg overflow-hidden shadow-xl"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--accent)' }}
        >
          {filtered.map(p => (
            <button
              key={p}
              onMouseDown={() => select(p)}
              className="w-full text-left px-3 py-2 text-sm transition-colors"
              style={{ color: value === p ? 'var(--accent)' : 'var(--text)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-border)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {value === p && <span className="mr-2">✓</span>}{p}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm italic" style={{ color: 'var(--text-faint)' }}>
              Press Enter to use "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Bardic Performance ───────────────────────────────────────────────────────

function BardicPerformance({ character, onChange, pinned, onTogglePin }) {
  const level  = character.level ?? 1
  const chaMod = Math.floor(((character.abilities?.cha ?? 10) - 10) / 2)

  // PF1e: 4 + Cha mod at level 1, +2 per level after
  const roundsPerDay    = 4 + chaMod + (level - 1) * 2
  const bp              = character.bardicPerformance ?? {}
  const usedRounds      = bp.used ?? 0
  const remainingRounds = Math.max(0, roundsPerDay - usedRounds)
  const isActive        = bp.active ?? false
  const currentPerf     = bp.currentPerf ?? ''
  const lingeringFeat   = bp.lingeringFeat ?? false
  const lingeringRounds = bp.lingeringRounds ?? 0

  // Always update the whole bp object at once to avoid stale spread overwriting
  const updateBP = (patch) => onChange('bardicPerformance', { ...bp, ...patch })

  const startPerformance = () => {
    if (remainingRounds <= 0) return
    // Spend 1 round to start (PF1e rule: starting costs 1 round)
    updateBP({ active: true, lingeringRounds: 0, used: usedRounds + 1 })
  }

  const continuePerformance = () => {
    if (remainingRounds <= 0) {
      // Out of rounds — auto-stop
      updateBP({ active: false, lingeringRounds: lingeringFeat ? 2 : 0 })
      return
    }
    updateBP({ used: usedRounds + 1 })
  }

  const endPerformance = () => {
    updateBP({ active: false, lingeringRounds: lingeringFeat ? 2 : 0 })
  }

  const tickLingering = () => {
    updateBP({ lingeringRounds: Math.max(0, lingeringRounds - 1) })
  }

  const reset = () => {
    onChange('bardicPerformance', { ...bp, used: 0, active: false, lingeringRounds: 0 })
  }

  const pct      = roundsPerDay > 0 ? (remainingRounds / roundsPerDay) * 100 : 0
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
            <input
              type="checkbox"
              checked={lingeringFeat}
              onChange={e => updateBP({ lingeringFeat: e.target.checked })}
              className="accent-yellow-500"
            />
            Lingering Performance (feat)
          </label>
          <button onClick={reset} className="text-xs px-2 py-1 rounded border" style={{ color: 'var(--text-dim)', borderColor: 'var(--bg-border)' }}>
            ↺ New Day
          </button>
        </div>
      </div>

      {/* Rounds tracker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm" style={{ color: 'var(--text-dim)' }}>Rounds / Day</span>
            <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>
              {remainingRounds} / {roundsPerDay}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-border)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(0, pct)}%`, backgroundColor: barColor }} />
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
            Lvl {level} + CHA {chaMod >= 0 ? `+${chaMod}` : chaMod} = {roundsPerDay} rounds/day
          </div>
        </div>

        {/* Active status */}
        <div className="flex flex-col items-center justify-center gap-2">
          {isActive ? (
            /* ── ACTIVE STATE ── */
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse inline-block" />
                <span className="font-bold text-sm text-green-400">
                  {currentPerf ? currentPerf.toUpperCase() : 'PERFORMING'}
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {remainingRounds} round{remainingRounds !== 1 ? 's' : ''} remaining
              </div>
              <div className="flex gap-2">
                <button
                  onClick={continuePerformance}
                  disabled={remainingRounds <= 0}
                  className="text-sm px-4 py-2 rounded font-bold transition-colors"
                  style={{
                    backgroundColor: remainingRounds > 0 ? 'var(--accent-dim)' : 'var(--bg-border)',
                    color: remainingRounds > 0 ? 'var(--accent)' : 'var(--text-faint)',
                    border: `1px solid ${remainingRounds > 0 ? 'var(--accent)' : 'var(--bg-border)'}`,
                  }}
                >
                  ▶▶ Continue (−1 Round)
                </button>
                <button
                  onClick={endPerformance}
                  className="text-sm px-4 py-2 rounded font-bold transition-colors"
                  style={{ backgroundColor: 'var(--bg-darker)', color: '#ef4444', border: '1px solid #ef4444' }}
                >
                  ■ End Performance
                </button>
              </div>
            </div>
          ) : (
            /* ── INACTIVE STATE ── */
            <div className="flex flex-col items-center gap-3">
              {lingeringRounds > 0 ? (
                <div className="text-center">
                  <div className="font-bold text-sm mb-1" style={{ color: 'var(--warning)' }}>
                    ✨ Lingering: {lingeringRounds} round{lingeringRounds !== 1 ? 's' : ''} left
                  </div>
                  <button
                    onClick={tickLingering}
                    className="text-xs px-3 py-1 rounded"
                    style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
                  >
                    − 1 Round
                  </button>
                </div>
              ) : (
                <div className="text-xs" style={{ color: 'var(--text-faint)' }}>Not performing</div>
              )}
              <button
                onClick={startPerformance}
                disabled={remainingRounds <= 0}
                className="text-sm px-6 py-2 rounded font-bold transition-colors"
                style={{
                  backgroundColor: remainingRounds > 0 ? 'var(--accent-dim)' : 'var(--bg-border)',
                  color: remainingRounds > 0 ? 'var(--accent)' : 'var(--text-faint)',
                  border: `1px solid ${remainingRounds > 0 ? 'var(--accent)' : 'var(--bg-border)'}`,
                }}
              >
                {remainingRounds > 0 ? '▶ Start Performance' : '✕ No Rounds Left'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Performance type + manual used rounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
        <div>
          <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Performance Type</label>
          <PerformancePicker value={currentPerf} onChange={v => updateBP({ currentPerf: v })} />
        </div>
        <div>
          <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Used Rounds (manual override)</label>
          <input
            type="number"
            min={0}
            max={roundsPerDay}
            value={usedRounds}
            onChange={e => updateBP({ used: Math.min(roundsPerDay, Math.max(0, Number(e.target.value))) })}
            className="input-field text-sm mt-0.5"
          />
        </div>
      </div>

      {lingeringFeat && !isActive && lingeringRounds === 0 && (
        <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--warning)', color: 'var(--warning)' }}>
          ✨ <strong>Lingering Performance:</strong> When you click "End Performance", the effect will linger for 2 more rounds automatically.
        </div>
      )}
    </div>
  )
}

// ─── Single Buff Row ──────────────────────────────────────────────────────────

function BuffRow({ buff, onUpdate, onRemove }) {
  const isPermanent = buff.unit === 'permanent'
  const isExpired = !isPermanent && buff.remaining <= 0
  const isLow = !isPermanent && buff.remaining <= 2 && buff.remaining > 0

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg" style={{
      backgroundColor: isExpired ? 'var(--bg-darker)' : 'var(--bg-darker)',
      border: `1px solid ${isExpired ? '#5a2020' : isLow ? 'var(--warning)' : 'var(--bg-border)'}`,
      opacity: isExpired ? 0.5 : 1,
    }}>
      {/* Status dot */}
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
        backgroundColor: isExpired ? '#5a2020' : isLow ? 'var(--warning)' : 'var(--positive)',
        boxShadow: !isExpired && !isLow ? '0 0 4px var(--positive)' : 'none',
      }} />

      {/* Name */}
      <input
        type="text"
        value={buff.name}
        onChange={e => onUpdate('name', e.target.value)}
        placeholder="Buff name..."
        className="flex-1 bg-transparent text-sm font-semibold focus:outline-none min-w-0"
        style={{ color: isExpired ? 'var(--text-faint)' : 'var(--text)', borderBottom: '1px solid transparent' }}
        onFocus={e => e.target.style.borderBottomColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderBottomColor = 'transparent'}
      />

      {/* Source badge */}
      <select
        value={buff.source}
        onChange={e => onUpdate('source', e.target.value)}
        className="text-xs px-1 py-0.5 rounded focus:outline-none"
        style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--accent)', border: '1px solid var(--bg-border)' }}
      >
        {BUFF_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Duration controls */}
      {!isPermanent ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdate('remaining', Math.max(0, buff.remaining - 1))}
            className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold"
            style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}
          >−</button>
          <div className="text-center" style={{ minWidth: '52px' }}>
            <span className="font-bold text-sm" style={{ color: isExpired ? '#ef4444' : isLow ? 'var(--warning)' : 'var(--text)' }}>
              {isExpired ? 'EXPIRED' : buff.remaining}
            </span>
            {!isExpired && <span className="text-xs ml-0.5" style={{ color: 'var(--text-faint)' }}>{buff.unit.slice(0, 3)}</span>}
          </div>
          <button
            onClick={() => onUpdate('remaining', buff.remaining + 1)}
            className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold"
            style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}
          >+</button>
        </div>
      ) : (
        <div className="text-xs px-2" style={{ color: 'var(--positive)' }}>Permanent</div>
      )}

      {/* Unit */}
      <select
        value={buff.unit}
        onChange={e => onUpdate('unit', e.target.value)}
        className="text-xs px-1 py-0.5 rounded focus:outline-none"
        style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
      >
        {DURATION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
      </select>

      {/* Reset to full */}
      {!isPermanent && (
        <button
          onClick={() => onUpdate('remaining', buff.duration)}
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ color: 'var(--text-faint)', border: '1px solid var(--bg-border)' }}
          title="Reset to full duration"
        >↺</button>
      )}

      <button onClick={onRemove} className="text-xs px-1.5 py-0.5 rounded" style={{ color: '#ef4444', border: '1px solid var(--bg-border)' }}>✕</button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BuffTracker({ character, onChange, pins = {}, onTogglePin }) {
  const buffs = character.buffs ?? []
  const isBard = (character.class ?? '').toLowerCase() === 'bard'
  const [round, setRound] = useState(character.combatRound ?? 1)

  const addBuff = () => onChange('buffs', [...buffs, emptyBuff()])

  const updateBuff = (index, key, value) => {
    onChange('buffs', buffs.map((b, i) => i === index ? { ...b, [key]: value } : b))
  }

  const removeBuff = (index) => onChange('buffs', buffs.filter((_, i) => i !== index))

  const nextRound = () => {
    const newRound = round + 1
    setRound(newRound)
    onChange('combatRound', newRound)
    // Tick down all round-based buffs
    onChange('buffs', buffs.map(b => {
      if (b.unit !== 'rounds' || b.remaining <= 0) return b
      return { ...b, remaining: b.remaining - 1 }
    }))
  }

  const clearExpired = () => onChange('buffs', buffs.filter(b => b.unit === 'permanent' || b.remaining > 0))

  const resetCombat = () => {
    setRound(1)
    onChange('combatRound', 1)
  }

  const activeCount = buffs.filter(b => b.unit === 'permanent' || b.remaining > 0).length
  const expiredCount = buffs.filter(b => b.unit !== 'permanent' && b.remaining <= 0).length

  return (
    <div className="space-y-4">
      {/* Bardic Performance — only for Bards */}
      {isBard && (
        <BardicPerformance
          character={character}
          onChange={onChange}
          pinned={pins.bardic}
          onTogglePin={onTogglePin ? () => onTogglePin('bardic') : undefined}
        />
      )}

      {/* Combat Round Counter */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="section-title mb-0">⏱ Buff & Duration Tracker</h2>
              {onTogglePin && <PinButton pinned={pins.buffs} onToggle={() => onTogglePin('buffs')} />}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
              {activeCount} active · {expiredCount} expired
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Round counter */}
            <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
              <button onClick={() => setRound(r => Math.max(1, r - 1))} className="text-sm w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}>−</button>
              <div className="text-center">
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Round</div>
                <div className="font-bold text-lg" style={{ color: 'var(--accent)' }}>{round}</div>
              </div>
              <button onClick={nextRound} className="text-sm px-2 py-1 rounded font-bold" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                Next →
              </button>
            </div>

            {expiredCount > 0 && (
              <button onClick={clearExpired} className="text-xs px-3 py-1 rounded border" style={{ color: '#ef4444', borderColor: '#7f1d1d' }}>
                Clear Expired ({expiredCount})
              </button>
            )}
            <button onClick={resetCombat} className="text-xs px-3 py-1 rounded border" style={{ color: 'var(--text-dim)', borderColor: 'var(--bg-border)' }}>
              ↺ Reset Combat
            </button>
            <button onClick={addBuff} className="btn-primary text-xs py-1 px-3">+ Add Buff</button>
          </div>
        </div>

        {/* Buff list */}
        <div className="mt-4 space-y-1.5">
          {buffs.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--text-faint)' }}>
              <div className="text-4xl mb-2">🛡️</div>
              <p className="text-sm">No active buffs. Add one to start tracking.</p>
              <button onClick={addBuff} className="mt-3 btn-secondary text-xs">Add Buff</button>
            </div>
          )}
          {buffs.map((buff, i) => (
            <BuffRow
              key={buff.id}
              buff={buff}
              onUpdate={(key, value) => updateBuff(i, key, value)}
              onRemove={() => removeBuff(i)}
            />
          ))}
        </div>

        {buffs.length > 0 && (
          <div className="mt-3 pt-3 text-xs" style={{ color: 'var(--text-faint)', borderTop: '1px solid var(--bg-border)' }}>
            💡 Click "Next →" to advance a round — all round-duration buffs tick down automatically. Use +/− to adjust manually.
          </div>
        )}
      </div>
    </div>
  )
}
