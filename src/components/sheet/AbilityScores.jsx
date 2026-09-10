import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ABILITY_NAMES, abilityMod, formatMod } from '../../data/pf1eData'
import PinButton from '../PinButton'
import SpinnerInput from '../SpinnerInput'

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha']

const ABILITY_COLOR = {
  str: '#ef4444', dex: '#22c55e', con: '#f59e0b',
  int: '#3b82f6', wis: '#a855f7', cha: '#ec4899',
}

const ABILITY_ICON = {
  str: '💪', dex: '🏃', con: '❤️', int: '🧠', wis: '👁️', cha: '✨',
}

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
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const cardRef = useRef(null)
  const longPressTimer = useRef(null)
  const score     = base + buff
  const mod       = abilityMod(score)
  const hasBuff   = buff !== 0
  const color     = ABILITY_COLOR[ab]
  const buffColor = buff > 0 ? 'var(--positive)' : '#ef4444'

  const computePos = useCallback(() => {
    if (!cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    setTooltipPos({
      top: r.bottom + window.scrollY + 10,
      left: r.left + window.scrollX + r.width / 2,
    })
  }, [])

  const showTooltip = () => { computePos(); setHovered(true) }
  const hideTooltip = () => setHovered(false)

  const onTouchStart = (e) => {
    longPressTimer.current = setTimeout(() => {
      e.preventDefault()
      showTooltip()
    }, 500)
  }
  const cancelLongPress = () => clearTimeout(longPressTimer.current)

  // Close on any outside tap while open
  useEffect(() => {
    if (!hovered) return
    const handler = (e) => {
      if (!cardRef.current?.contains(e.target)) hideTooltip()
    }
    document.addEventListener('touchstart', handler, { passive: true })
    return () => document.removeEventListener('touchstart', handler)
  }, [hovered])

  return (
    <div
      ref={cardRef}
      className="relative flex flex-col items-center rounded-xl"
      style={{
        backgroundColor: 'var(--bg-darker)',
        border: `1px solid ${hovered ? color : color + '44'}`,
        borderTop: `3px solid ${color}`,
        boxShadow: hovered ? `0 0 16px ${color}33` : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: 'default',
        overflow: 'visible',
      }}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onTouchStart={onTouchStart}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
    >
      {/* Tinted background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(180deg, ${color}0d 0%, transparent 60%)` }} />

      {/* Content */}
      <div className="relative flex flex-col items-center w-full px-2 pt-2 pb-2 gap-1">

        {/* Icon + label */}
        <div className="flex items-center gap-1">
          <span style={{ fontSize: '0.75rem' }}>{ABILITY_ICON[ab]}</span>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{ab}</span>
        </div>

        {/* Score — hero, with modifier badge top-right */}
        <div className="relative flex items-center justify-center" style={{ marginLeft: '14px' }}>
          <div className="font-bold leading-none" style={{ fontSize: '2.6rem', color: hasBuff ? buffColor : 'var(--text)', fontFamily: 'Georgia, serif' }}>
            {score}
          </div>
          <div className="absolute font-bold text-xs px-1.5 py-0.5 rounded-full leading-none"
            style={{
              top: '-6px', right: '-22px',
              backgroundColor: mod >= 0 ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
              color: mod >= 0 ? 'var(--positive)' : '#ef4444',
              border: `1px solid ${mod >= 0 ? 'var(--positive)' : '#ef4444'}`,
              minWidth: '1.5rem', textAlign: 'center',
            }}>
            {formatMod(mod)}
          </div>
        </div>

        {/* Spinner + buff badge */}
        <div className="flex items-center gap-1 mt-1">
          <SpinnerInput value={base} onChange={v => onChange(ab, Math.max(1, Math.min(30, v)))} min={1} max={30} width="w-10" />
          {hasBuff && (
            <span className="text-xs px-1 rounded font-bold leading-none"
              style={{ color: buffColor, backgroundColor: buff > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${buffColor}44` }}>
              {buff > 0 ? `+${buff}` : buff}
            </span>
          )}
        </div>
      </div>

      {/* Tooltip via portal — renders above all content */}
      {hovered && createPortal(
        <div className="rounded-xl p-3 text-xs pointer-events-none"
          style={{
            position: 'absolute',
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: 'translateX(-50%)',
            width: '210px',
            zIndex: 9999,
            backgroundColor: 'var(--bg-surface)',
            border: `2px solid ${color}`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 16px ${color}22`,
            color: 'var(--text-dim)',
          }}
        >
          {/* Arrow pointing up */}
          <div style={{ position: 'absolute', top: '-7px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: `7px solid ${color}` }} />

          {/* Header */}
          <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: `1px solid ${color}44` }}>
            <span style={{ fontSize: '1.1rem' }}>{ABILITY_ICON[ab]}</span>
            <div>
              <div className="font-bold text-sm" style={{ color, fontFamily: 'Georgia, serif' }}>{ABILITY_NAMES[ab]}</div>
              <div style={{ color: 'var(--text-faint)', fontSize: '0.6rem' }}>{ab.toUpperCase()}</div>
            </div>
            <div className="ml-auto text-center">
              <div className="font-bold" style={{ fontSize: '1.6rem', color, fontFamily: 'Georgia, serif', lineHeight: 1 }}>{formatMod(mod)}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-faint)' }}>modifier</div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-faint)' }}>Base score</span>
              <span className="font-bold" style={{ color: 'var(--text)' }}>{base}</span>
            </div>
            {hasBuff && (
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--text-faint)' }}>Buff / item</span>
                <span className="font-bold" style={{ color: buffColor }}>{buff > 0 ? `+${buff}` : buff}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1.5 font-bold" style={{ borderTop: `1px solid ${color}33` }}>
              <span style={{ color: 'var(--text)' }}>Total score</span>
              <span style={{ color }}>{score}</span>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-lg px-2 py-1.5" style={{ backgroundColor: `${color}0d`, border: `1px solid ${color}22` }}>
            <div style={{ color: 'var(--text-faint)', fontSize: '0.65rem', lineHeight: 1.5 }}>
              {ABILITY_DESC[ab]}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default function AbilityScores({ abilities, onChange, pinned, onTogglePin, buffTotals = {}, pendingBump = false }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="section-title mb-0">Ability Scores</h2>
          {pendingBump && (
            <span className="level-up-pulse text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e66' }}>
              +1 to spend!
            </span>
          )}
        </div>
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
