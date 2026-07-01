import { useState } from 'react'
import { ABILITY_NAMES, abilityMod, formatMod } from '../../data/pf1eData'
import PinButton from '../PinButton'
import SpinnerInput from '../SpinnerInput'

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha']

const ABILITY_DESC = {
  str: 'Melee attack & damage, carrying capacity',
  dex: 'Ranged attacks, AC, Reflex saves, initiative',
  con: 'Hit points, Fortitude saves',
  int: 'Skill ranks per level, knowledge skills',
  wis: 'Perception, Will saves, divine spellcasting',
  cha: 'Social skills, arcane spellcasting, channel energy',
}

function AbilityCard({ ab, base, buff, onChange }) {
  const [hovered, setHovered] = useState(false)
  const score  = base + buff
  const mod    = abilityMod(score)
  const hasBuff = buff !== 0
  const modColor = mod >= 0 ? 'var(--positive)' : '#ef4444'
  const buffColor = buff > 0 ? 'var(--positive)' : '#ef4444'

  return (
    <div
      className="stat-box flex flex-col items-center gap-1 relative"
      style={{
        cursor: 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        borderColor: hovered ? 'var(--accent)' : undefined,
        boxShadow: hovered ? '0 0 12px rgba(0,0,0,0.4)' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Ability name */}
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
        {ab}
      </span>

      {/* Total score — big */}
      <div className="text-3xl font-bold leading-none" style={{ color: hasBuff ? buffColor : 'var(--text)', fontFamily: 'Georgia, serif' }}>
        {score}
      </div>

      {/* Modifier */}
      <div className="text-base font-bold leading-none" style={{ color: modColor }}>
        {formatMod(mod)}
      </div>

      {/* Base spinner + buff badge */}
      <div className="flex items-center gap-1">
        <SpinnerInput value={base} onChange={v => onChange(ab, Math.max(1, Math.min(30, v)))} min={1} max={30} width="w-10" />
        {hasBuff && (
          <span className="text-xs px-1 rounded font-bold" style={{ color: buffColor, backgroundColor: buff > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${buffColor}` }}>
            {buff > 0 ? `+${buff}` : buff}
          </span>
        )}
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="absolute z-50 rounded-lg p-3 text-xs"
          style={{
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '180px',
            backgroundColor: 'var(--bg-darker)',
            border: '1px solid var(--accent)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            color: 'var(--text-dim)',
            pointerEvents: 'none',
          }}
        >
          {/* Arrow */}
          <div style={{
            position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
            borderTop: '6px solid var(--accent)',
          }} />

          <div className="font-bold mb-2" style={{ color: 'var(--accent)', fontFamily: 'Georgia, serif' }}>
            {ABILITY_NAMES[ab]}
          </div>

          <div className="space-y-1 mb-2">
            <div className="flex justify-between">
              <span>Base score</span>
              <span style={{ color: 'var(--text)' }}>{base}</span>
            </div>
            {hasBuff && (
              <div className="flex justify-between">
                <span>Buff / item</span>
                <span style={{ color: buffColor }}>{buff > 0 ? `+${buff}` : buff}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-1" style={{ borderTop: '1px solid var(--bg-border)' }}>
              <span style={{ color: 'var(--text)' }}>Total</span>
              <span style={{ color: 'var(--text)' }}>{score}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span style={{ color: 'var(--text)' }}>Modifier</span>
              <span style={{ color: modColor }}>{formatMod(mod)}</span>
            </div>
          </div>

          <div style={{ color: 'var(--text-faint)', fontSize: '0.65rem', lineHeight: 1.4, borderTop: '1px solid var(--bg-border)', paddingTop: '6px' }}>
            {ABILITY_DESC[ab]}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AbilityScores({ abilities, onChange, pinned, onTogglePin, buffTotals = {} }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title mb-0">Ability Scores</h2>
        {onTogglePin && <PinButton pinned={pinned} onToggle={onTogglePin} />}
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {ABILITIES.map(ab => (
          <AbilityCard
            key={ab}
            ab={ab}
            base={abilities[ab] ?? 10}
            buff={buffTotals[ab] ?? 0}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  )
}
