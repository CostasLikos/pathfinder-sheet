import { useEffect, useRef } from 'react'
import { abilityMod, formatMod } from '../../data/pf1eData'
import PinButton from '../PinButton'
import SpinnerInput from '../SpinnerInput'

function useFlash(value) {
  const prevRef = useRef(value)
  const elRef   = useRef(null)
  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = value
    if (!elRef.current || value === prev) return
    const cls = value > prev ? 'flash-positive' : 'flash-negative'
    elRef.current.classList.remove('flash-positive', 'flash-negative')
    void elRef.current.offsetWidth // reflow
    elRef.current.classList.add(cls)
  }, [value])
  return elRef
}

export default function CombatStats({ character, onChange, pins = {}, onTogglePin, buffTotals = {}, armorProps = {}, computedBAB = null, computedSaveBases = null, favoredHP = 0, pendingHP = false }) {
  const { abilities, hp, ac, saves, bab, initiative, speed } = character
  const bt = buffTotals
  // Use computed class-derived values when available, fall back to manual
  const effectiveBAB       = computedBAB ?? (bab ?? 0)
  const effectiveFortBase  = computedSaveBases?.fort ?? (saves.fort?.base ?? 0)
  const effectiveRefBase   = computedSaveBases?.ref  ?? (saves.ref?.base  ?? 0)
  const effectiveWillBase  = computedSaveBases?.will ?? (saves.will?.base ?? 0)

  // effective ability scores (base + buff)
  const effStr = (abilities.str ?? 10) + (bt.str ?? 0)
  const effDex = (abilities.dex ?? 10) + (bt.dex ?? 0)
  const effCon = (abilities.con ?? 10) + (bt.con ?? 0)
  const effWis = (abilities.wis ?? 10) + (bt.wis ?? 0)

  // Max Dex caps DEX mod applied to AC only
  const rawDexMod = abilityMod(effDex)
  const maxDex    = armorProps.maxDex !== null && armorProps.maxDex !== undefined ? armorProps.maxDex : Infinity
  const dexMod    = Math.min(rawDexMod, maxDex)
  const conMod = abilityMod(effCon)
  const wisMod = abilityMod(effWis)
  const strMod = abilityMod(effStr)

  const totalAC     = 10 + (ac.armor ?? 0) + (ac.shield ?? 0) + dexMod + (ac.natural ?? 0) + (ac.deflect ?? 0) + (ac.misc ?? 0) + (bt.ac ?? 0)
  const touchAC     = 10 + dexMod + (ac.deflect ?? 0) + (ac.misc ?? 0) + (bt.ac ?? 0)
  const flatFooted  = 10 + (ac.armor ?? 0) + (ac.shield ?? 0) + (ac.natural ?? 0) + (ac.deflect ?? 0) + (ac.misc ?? 0) + (bt.ac ?? 0)
  const totalFort   = effectiveFortBase + conMod + (saves.fort?.enhance ?? 0) + (saves.fort?.misc ?? 0) + (bt.fort ?? 0)
  const totalRef    = effectiveRefBase  + rawDexMod + (saves.ref?.enhance  ?? 0) + (saves.ref?.misc  ?? 0) + (bt.ref  ?? 0)
  const totalWill   = effectiveWillBase + wisMod + (saves.will?.enhance ?? 0) + (saves.will?.misc ?? 0) + (bt.will ?? 0)
  const totalInit   = rawDexMod + (initiative?.misc ?? 0) + (bt.initiative ?? 0)
  const cmb         = effectiveBAB + strMod + (bt.cmb ?? 0)
  const cmd         = 10 + effectiveBAB + strMod + rawDexMod + (bt.cmb ?? 0)

  // buff indicator helper
  const buffed = (key) => (bt[key] ?? 0) !== 0

  const effectiveMaxHP = (hp.max ?? 0) + (bt.hp ?? 0) + favoredHP
  const hpPct      = effectiveMaxHP > 0 ? Math.max(0, Math.min(100, (hp.current / effectiveMaxHP) * 100)) : 0
  const hpDanger   = hpPct <= 25 && effectiveMaxHP > 0

  // PF1e HP status: death at negative CON score
  const deathThreshold = -(effCon)   // e.g. CON 14 → dies at -14
  const hpStatus = (() => {
    const cur = hp.current ?? 0
    if (cur <= deathThreshold)  return 'DEAD'
    if (cur < 0)                return 'Unconscious'
    if (cur === 0)              return 'Staggered'
    return null
  })()
  const hpStatusColor = hpStatus === 'DEAD' ? '#ef4444' : hpStatus === 'Unconscious' ? '#f97316' : '#f59e0b'
  const hpColor    = hpStatus === 'DEAD' ? '#ef4444' : hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444'

  // Flash refs for key derived stats
  const acFlashRef   = useFlash(totalAC)
  const fortFlashRef = useFlash(totalFort)
  const refFlashRef  = useFlash(totalRef)
  const willFlashRef = useFlash(totalWill)
  const hpFlashRef   = useFlash(effectiveMaxHP)

  const BuffBadge = ({ val }) => val !== 0 ? (
    <span className="text-xs ml-1 px-1 rounded" style={{ backgroundColor: val > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: val > 0 ? 'var(--positive)' : '#ef4444', border: `1px solid ${val > 0 ? 'var(--positive)' : '#ef4444'}` }}>
      {val > 0 ? `+${val}` : val}
    </span>
  ) : null

  return (
    <div className="space-y-3">

      {/* ── HP ── */}
      <div className="card" style={{
        borderTop: `3px solid ${hpColor}`,
        borderLeft: `1px solid ${hpColor}55`,
        borderRight: `1px solid ${hpColor}22`,
        borderBottom: `1px solid ${hpColor}22`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 20px ${hpColor}66, inset 0 1px 0 ${hpColor}33, inset 0 -1px 0 rgba(0,0,0,0.3)`,
      }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg" style={{ filter: hpStatus === 'DEAD' ? 'grayscale(1)' : 'none' }}>❤️</span>
            <h2 className="section-title mb-0" style={{ color: hpColor }}>Hit Points</h2>
            {hpStatus && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  color: hpStatusColor,
                  backgroundColor: `${hpStatusColor}18`,
                  border: `1px solid ${hpStatusColor}55`,
                  animation: hpStatus !== 'Staggered' ? 'hp-danger 1.8s ease-in-out infinite' : 'none',
                }}>
                {hpStatus}
              </span>
            )}
          </div>
          {onTogglePin && <PinButton pinned={pins.hp} onToggle={() => onTogglePin('hp')} />}
        </div>

        {/* Progress bar — prominent */}
        {effectiveMaxHP > 0 && (
          <div ref={hpFlashRef} className="mb-4">
            <div className="rounded-full overflow-hidden" style={{ height: '22px', backgroundColor: 'var(--bg-border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)' }}>
              <div
                className={`h-full rounded-full transition-all duration-500${hpDanger ? ' hp-bar-danger' : ''}`}
                style={{
                  width: `${Math.max(0, hpPct)}%`,
                  background: hpPct > 50
                    ? `linear-gradient(90deg, #16a34a, ${hpColor})`
                    : hpPct > 25
                    ? `linear-gradient(90deg, #b45309, ${hpColor})`
                    : `linear-gradient(90deg, #7f1d1d, ${hpColor})`,
                  boxShadow: `0 0 8px ${hpColor}66`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1.5">
              <span className="font-bold" style={{ color: hpColor }}>
                {hp.current} / {effectiveMaxHP} HP
                {hpDanger && !hpStatus && <span className="ml-1">⚠</span>}
              </span>
              <span style={{ color: 'var(--text-faint)' }}>{Math.round(hpPct)}%</span>
            </div>
          </div>
        )}

        {/* Current / Max inputs */}
        <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">

          {/* Current HP */}
          <div className="flex flex-col items-center gap-1 rounded-xl px-4 py-3"
            style={{ background: `${hpColor}12`, border: `2px solid ${hpColor}44` }}>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: `${hpColor}99` }}>Current</div>
            <input
              type="number"
              value={hp.current ?? 0}
              onChange={e => onChange('hp', { ...hp, current: Number(e.target.value) })}
              className="hp-input text-center font-bold focus:outline-none bg-transparent"
              style={{ width: '150px', fontSize: '4rem', fontFamily: 'Georgia, serif', color: hpColor, border: 'none', outline: 'none' }}
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => onChange('hp', { ...hp, current: (hp.current ?? 0) - 1 })}
                className="flex items-center justify-center font-bold transition-all"
                style={{ width: '32px', height: '24px', borderRadius: '6px', border: `1px solid ${hpColor}55`, color: hpColor, backgroundColor: 'transparent', fontSize: '1.1rem' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = hpColor; e.currentTarget.style.color = '#000' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = hpColor }}
              >−</button>
              <button
                onClick={() => onChange('hp', { ...hp, current: (hp.current ?? 0) + 1 })}
                className="flex items-center justify-center font-bold transition-all"
                style={{ width: '32px', height: '24px', borderRadius: '6px', border: `1px solid ${hpColor}55`, color: hpColor, backgroundColor: 'transparent', fontSize: '1.1rem' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = hpColor; e.currentTarget.style.color = '#000' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = hpColor }}
              >+</button>
            </div>
          </div>

          {/* Max HP */}
          <div className={`flex flex-col items-center gap-1 rounded-xl px-4 py-3 ${pendingHP ? 'level-up-pulse' : ''}`}
            style={{ background: 'var(--bg-darker)', border: pendingHP ? '2px solid #22c55e88' : '2px solid var(--bg-border)' }}>
            <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-1"
              style={{ color: pendingHP ? '#22c55e' : 'var(--text-faint)' }}>
              Max {pendingHP && '⬆'} <BuffBadge val={bt.hp ?? 0} />
            </div>
            <input
              type="number"
              value={hp.max ?? 0}
              onChange={e => onChange('hp', { ...hp, max: Math.max(0, Number(e.target.value)) })}
              className="hp-input text-center font-bold focus:outline-none bg-transparent"
              style={{ width: '150px', fontSize: '4rem', fontFamily: 'Georgia, serif', color: 'var(--text-dim)', border: 'none', outline: 'none' }}
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => onChange('hp', { ...hp, max: Math.max(0, (hp.max ?? 0) - 1) })}
                className="flex items-center justify-center font-bold transition-all"
                style={{ width: '32px', height: '24px', borderRadius: '6px', border: '1px solid var(--bg-border)', color: 'var(--text-dim)', backgroundColor: 'transparent', fontSize: '1.1rem' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent)'; e.currentTarget.style.color = '#000' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)' }}
              >−</button>
              <button
                onClick={() => onChange('hp', { ...hp, max: (hp.max ?? 0) + 1 })}
                className="flex items-center justify-center font-bold transition-all"
                style={{ width: '32px', height: '24px', borderRadius: '6px', border: '1px solid var(--bg-border)', color: 'var(--text-dim)', backgroundColor: 'transparent', fontSize: '1.1rem' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent)'; e.currentTarget.style.color = '#000' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)' }}
              >+</button>
            </div>
            {(bt.hp ?? 0) !== 0 && (
              <div className="text-xs font-bold" style={{ color: 'var(--positive)' }}>= {effectiveMaxHP} effective</div>
            )}
          </div>
        </div>

        {/* Quick adjust buttons */}
        <div className="flex gap-1.5 justify-center mb-4">
          {[-10, -5].map(n => (
            <button key={n}
              onClick={() => onChange('hp', { ...hp, current: (hp.current ?? 0) + n })}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{ backgroundColor: '#ef444418', color: '#ef4444', border: '1px solid #ef444433' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ef444430' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ef444418' }}>
              {n}
            </button>
          ))}
          <div className="w-px mx-0.5" style={{ backgroundColor: 'var(--bg-border)' }} />
          {[5, 10].map(n => (
            <button key={n}
              onClick={() => onChange('hp', { ...hp, current: (hp.current ?? 0) + n })}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{ backgroundColor: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e33' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#22c55e30' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#22c55e18' }}>
              +{n}
            </button>
          ))}
        </div>

        {/* Nonlethal */}
        <div className="flex items-center justify-center gap-3 pt-3" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <span className="text-xs uppercase tracking-widest font-bold"
            style={{ color: (hp.nonlethal ?? 0) > 0 ? '#f59e0b' : 'var(--text-faint)' }}>
            🤕 Nonlethal
          </span>
          <SpinnerInput value={hp.nonlethal ?? 0} onChange={v => onChange('hp', { ...hp, nonlethal: Math.max(0, v) })} min={0} width="w-14" />
          {(hp.nonlethal ?? 0) > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color: '#f59e0b', backgroundColor: '#f59e0b18', border: '1px solid #f59e0b44' }}>
              −{hp.nonlethal} effective
            </span>
          )}
        </div>

      </div>

      {/* ── AC ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Armor Class</h2>
          {onTogglePin && <PinButton pinned={pins.ac} onToggle={() => onTogglePin('ac')} />}
        </div>
        {maxDex !== Infinity && rawDexMod > maxDex && (
          <div className="mb-3 px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid var(--warning)', color: 'var(--warning)' }}>
            ⚠ Max Dex {maxDex} — your DEX mod ({rawDexMod >= 0 ? `+${rawDexMod}` : rawDexMod}) is capped for AC
          </div>
        )}

        {/* AC display — hero Total + secondary Touch/FF */}
        <div className="flex items-stretch gap-3 mb-4">
          {/* Total AC — hero */}
          <div ref={acFlashRef} className="flex-1 flex flex-col items-center justify-center py-3 rounded-xl"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 8%, var(--bg-darker))', border: '2px solid var(--accent)55' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              🛡 Total AC <BuffBadge val={bt.ac ?? 0} />
            </div>
            <div className="font-bold leading-none" style={{ fontSize: '3rem', color: 'var(--accent)', fontFamily: 'Georgia, serif' }}>{totalAC}</div>
          </div>
          {/* Touch + Flat-Footed — secondary */}
          <div className="flex flex-col gap-2 justify-center" style={{ minWidth: '90px' }}>
            {[['Touch', touchAC, '#3b82f6'], ['Flat-Footed', flatFooted, 'var(--text-dim)']].map(([lbl, val, col]) => (
              <div key={lbl} className="stat-box text-center py-2" style={{ borderLeft: `3px solid ${col}55` }}>
                <div className="text-xs mb-0.5" style={{ color: 'var(--text-faint)' }}>{lbl}</div>
                <div className="text-xl font-bold" style={{ color: col }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AC components */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {[
            ['Armor', 'armor', '#94a3b8'], ['Shield', 'shield', '#c084fc'], ['Natural', 'natural', '#4ade80'],
            ['Deflect', 'deflect', '#60a5fa'], ['Misc', 'misc', 'var(--text-dim)'],
          ].map(([label, key, col]) => (
            <div key={key} className="flex flex-col items-center gap-1 rounded-lg py-2"
              style={{ backgroundColor: 'var(--bg-darker)', border: `1px solid var(--bg-border)`, borderTop: `2px solid ${col}66` }}>
              <span className="text-xs font-bold" style={{ color: col }}>{label}</span>
              <SpinnerInput value={ac[key] ?? 0} onChange={v => onChange('ac', { ...ac, [key]: v })} width="w-10" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Combat Numbers + Saves ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <h2 className="section-title mb-0">Combat Numbers</h2>
          <div className="flex gap-3 items-center">
            {onTogglePin && <>
              <PinButton pinned={pins.saves} onToggle={() => onTogglePin('saves')} />
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>saves</span>
              <PinButton pinned={pins.combat} onToggle={() => onTogglePin('combat')} />
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>combat</span>
            </>}
          </div>
        </div>

        {/* BAB / Init / CMB / CMD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'BAB', icon: '⚔️', color: '#ef4444', content: (
              computedBAB !== null
                ? <><div className="text-2xl font-bold" style={{ color: '#ef4444', fontFamily: 'Georgia, serif' }}>+{computedBAB}</div>
                    <div className="text-xs" style={{ color: 'var(--text-faint)' }}>auto</div></>
                : <><div className="text-2xl font-bold" style={{ color: '#ef4444', fontFamily: 'Georgia, serif' }}>{bab >= 0 ? `+${bab}` : bab}</div>
                    <SpinnerInput value={bab ?? 0} onChange={v => onChange('bab', v)} width="w-12" /></>
            )},
            { label: 'Initiative', icon: '⚡', color: '#f59e0b', content: (
              <><div className="text-2xl font-bold" style={{ color: '#f59e0b', fontFamily: 'Georgia, serif' }}>{formatMod(totalInit)}</div>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-faint)' }}>
                  <span>misc</span>
                  <SpinnerInput value={initiative?.misc ?? 0} onChange={v => onChange('initiative', { ...initiative, misc: v })} width="w-10" />
                </div></>
            )},
            { label: 'CMB', icon: '🤜', color: '#a78bfa', content: (
              <div className="text-2xl font-bold" style={{ color: '#a78bfa', fontFamily: 'Georgia, serif' }}>{formatMod(cmb)}</div>
            )},
            { label: 'CMD', icon: '🛡', color: '#60a5fa', content: (
              <div className="text-2xl font-bold" style={{ color: '#60a5fa', fontFamily: 'Georgia, serif' }}>{cmd}</div>
            )},
          ].map(({ label, icon, color, content }) => (
            <div key={label} className="flex flex-col items-center justify-center gap-1 rounded-xl py-3"
              style={{ backgroundColor: 'var(--bg-darker)', border: `1px solid var(--bg-border)`, borderTop: `3px solid ${color}` }}>
              <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-1" style={{ color }}>
                <span>{icon}</span>{label}
              </div>
              {content}
            </div>
          ))}
        </div>

        {/* Saving Throws */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'fort', label: 'Fort',  icon: '💪', mod: conMod, total: totalFort, buffVal: bt.fort ?? 0, flashRef: fortFlashRef, color: '#f59e0b' },
            { key: 'ref',  label: 'Reflex', icon: '🏃', mod: dexMod, total: totalRef,  buffVal: bt.ref  ?? 0, flashRef: refFlashRef,  color: '#22c55e' },
            { key: 'will', label: 'Will',   icon: '🔮', mod: wisMod, total: totalWill, buffVal: bt.will ?? 0, flashRef: willFlashRef, color: '#a855f7' },
          ].map(({ key, label, icon, mod, total, buffVal, flashRef, color }) => (
            <div key={key} ref={flashRef} className="flex flex-col rounded-xl overflow-hidden"
              style={{ backgroundColor: 'var(--bg-darker)', border: `1px solid var(--bg-border)`, borderTop: `3px solid ${color}` }}>
              {/* Header */}
              <div className="flex flex-col items-center justify-center py-3"
                style={{ backgroundColor: `color-mix(in srgb, ${color} 8%, var(--bg-darker))` }}>
                <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-1 mb-1" style={{ color }}>
                  {icon} {label} <BuffBadge val={buffVal} />
                </div>
                <div className="font-bold leading-none" style={{ fontSize: '2rem', color, fontFamily: 'Georgia, serif' }}>{formatMod(total)}</div>
              </div>
              {/* Breakdown */}
              <div className="px-1.5 py-2 text-xs space-y-1" style={{ color: 'var(--text-faint)' }}>
                {[
                  { label: 'Ability', el: <span style={{ color: 'var(--text-dim)', fontWeight: 'bold' }}>{formatMod(mod)}</span> },
                  { label: 'Base', el: computedSaveBases
                      ? <span style={{ color, fontWeight: 'bold' }}>+{computedSaveBases[key]} <span style={{ color: 'var(--text-faint)', fontWeight: 'normal' }}>(auto)</span></span>
                      : <SpinnerInput value={saves[key]?.base ?? 0} onChange={v => onChange('saves', { ...saves, [key]: { ...saves[key], base: v } })} width="w-8" small />
                  },
                  { label: 'E', el: <SpinnerInput value={saves[key]?.enhance ?? 0} onChange={v => onChange('saves', { ...saves, [key]: { ...saves[key], enhance: v } })} width="w-8" small /> },
                  { label: 'M', el: <SpinnerInput value={saves[key]?.misc    ?? 0} onChange={v => onChange('saves', { ...saves, [key]: { ...saves[key], misc:    v } })} width="w-8" small /> },
                ].map(({ label: lbl, el }) => (
                  <div key={lbl} className="flex items-center justify-between gap-1">
                    <span style={{ color: 'var(--text-faint)', flexShrink: 0 }}>{lbl}</span>
                    <div className="flex justify-end">{el}</div>
                  </div>
                ))}
                <div className="pt-0.5">
                  <input type="text" value={saves[key]?.notes ?? ''}
                    onChange={e => onChange('saves', { ...saves, [key]: { ...saves[key], notes: e.target.value } })}
                    placeholder="notes..."
                    className="w-full rounded px-1 py-0.5 text-xs focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', color: 'var(--text-dim)' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Speed ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>⚡ Movement Speed</span>
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{Math.round((speed ?? 30) / 5)} squares</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Big speed value */}
          <div className="text-center">
            <div className="text-4xl font-bold leading-none" style={{ color: 'var(--accent)', fontFamily: 'Georgia, serif' }}>
              {speed ?? 30}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>ft. / round</div>
          </div>

          {/* Pip track — each pip = 5 ft, up to 12 pips (60 ft) */}
          <div className="flex-1">
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 12 }).map((_, i) => {
                const filled = (speed ?? 30) / 5 > i
                return (
                  <div key={i} className="h-2 rounded-sm flex-1 min-w-[10px] transition-colors"
                    style={{ backgroundColor: filled ? 'var(--accent)' : 'var(--bg-border)', opacity: filled ? (i < 6 ? 1 : 0.65) : 0.4 }} />
                )
              })}
            </div>
            <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--text-faint)' }}>
              <span>0</span><span>30 ft</span><span>60 ft</span>
            </div>
          </div>

          {/* Spinner */}
          <SpinnerInput value={speed ?? 30} onChange={v => onChange('speed', Math.max(0, v))} min={0} step={5} width="w-14" />
        </div>
      </div>

    </div>
  )
}
