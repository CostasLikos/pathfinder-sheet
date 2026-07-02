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

export default function CombatStats({ character, onChange, pins = {}, onTogglePin, buffTotals = {}, armorProps = {}, computedBAB = null, computedSaveBases = null, favoredHP = 0 }) {
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
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Hit Points</h2>
          {onTogglePin && <PinButton pinned={pins.hp} onToggle={() => onTogglePin('hp')} />}
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="text-center">
              <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Current</div>
              <SpinnerInput value={hp.current ?? 0} onChange={v => onChange('hp', { ...hp, current: v })} width="w-14" />
            </div>
            <span className="text-xl mt-4" style={{ color: 'var(--text-faint)' }}>/</span>
            <div className="text-center">
              <div className="text-xs mb-1 flex items-center justify-center gap-1" style={{ color: 'var(--text-dim)' }}>
                Max <BuffBadge val={bt.hp ?? 0} />
              </div>
              <SpinnerInput value={hp.max ?? 0} onChange={v => onChange('hp', { ...hp, max: Math.max(0, v) })} min={0} width="w-14" />
              {(bt.hp ?? 0) !== 0 && (
                <div className="text-sm font-bold mt-1" style={{ color: 'var(--positive)' }}>{effectiveMaxHP}</div>
              )}
            </div>
            <div className="text-center">
              <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Nonlethal</div>
              <SpinnerInput value={hp.nonlethal ?? 0} onChange={v => onChange('hp', { ...hp, nonlethal: Math.max(0, v) })} min={0} width="w-14" />
            </div>
          </div>
          <div className="flex-1 min-w-32" ref={hpFlashRef} style={{ borderRadius: '4px' }}>
            {effectiveMaxHP > 0 && (
              <>
                <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-border)' }}>
                  <div
                    className={`h-full rounded-full transition-all${hpDanger ? ' hp-bar-danger' : ''}`}
                    style={{ width: `${Math.max(0, hpPct)}%`, backgroundColor: hpColor }}
                  />
                </div>
                <div className="text-xs mt-1 text-center font-bold" style={{ color: hpColor }}>
                  {hp.current}/{effectiveMaxHP} HP{hpDanger && !hpStatus ? ' ⚠' : ''}
                </div>
              </>
            )}
            {hpStatus && (
              <div
                className="mt-2 text-center font-bold tracking-widest"
                style={{
                  color: hpStatusColor,
                  fontSize: hpStatus === 'DEAD' ? '1.4rem' : '1rem',
                  textShadow: `0 0 12px ${hpStatusColor}`,
                  animation: hpStatus === 'DEAD' ? 'hp-danger 1.4s ease-in-out infinite' : hpStatus === 'Unconscious' ? 'hp-danger 2.5s ease-in-out infinite' : 'none',
                  letterSpacing: hpStatus === 'DEAD' ? '0.25em' : '0.1em',
                }}
              >
                {hpStatus}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── AC ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Armor Class</h2>
          {onTogglePin && <PinButton pinned={pins.ac} onToggle={() => onTogglePin('ac')} />}
        </div>
        {maxDex !== Infinity && rawDexMod > maxDex && (
          <div className="mb-2 px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid var(--warning)', color: 'var(--warning)' }}>
            ⚠ Max Dex {maxDex} — your DEX mod ({rawDexMod >= 0 ? `+${rawDexMod}` : rawDexMod}) is capped for AC
          </div>
        )}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[['Total AC', totalAC, acFlashRef], ['Touch', touchAC, null], ['Flat-Footed', flatFooted, null]].map(([lbl, val, ref]) => (
            <div key={lbl} ref={ref} className="stat-box text-center" style={{ borderRadius: '6px' }}>
              <div className="text-xs mb-1 flex items-center justify-center gap-1" style={{ color: 'var(--text-dim)' }}>
                {lbl} <BuffBadge val={bt.ac ?? 0} />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{val}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {[
            ['Armor', 'armor'], ['Shield', 'shield'], ['Natural', 'natural'],
            ['Deflection', 'deflect'], ['Misc', 'misc'],
          ].map(([label, key]) => (
            <div key={key} className="stat-box flex flex-col items-center gap-1">
              <span className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>{label}</span>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="stat-box flex flex-col items-center justify-center gap-1">
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>BAB</div>
            {computedBAB !== null
              ? <div className="text-xl font-bold" style={{ color: 'var(--accent)' }}>+{computedBAB}</div>
              : <SpinnerInput value={bab ?? 0} onChange={v => onChange('bab', v)} width="w-12" />
            }
            {computedBAB !== null && <div className="text-xs" style={{ color: 'var(--text-faint)' }}>auto</div>}
          </div>
          <div className="stat-box flex flex-col items-center justify-center gap-1">
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Initiative</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{formatMod(totalInit)}</div>
            <div className="flex items-center justify-between gap-2 px-1 w-full text-xs" style={{ color: 'var(--text-faint)' }}>
              <span>Misc</span>
              <SpinnerInput value={initiative?.misc ?? 0} onChange={v => onChange('initiative', { ...initiative, misc: v })} width="w-10" />
            </div>
          </div>
          <div className="stat-box text-center">
            <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>CMB</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{formatMod(cmb)}</div>
          </div>
          <div className="stat-box text-center">
            <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>CMD</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{cmd}</div>
          </div>
        </div>

        {/* Saving Throws */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'fort', label: 'Fortitude', mod: conMod, total: totalFort, buffVal: bt.fort ?? 0, flashRef: fortFlashRef },
            { key: 'ref',  label: 'Reflex',    mod: dexMod, total: totalRef,  buffVal: bt.ref  ?? 0, flashRef: refFlashRef  },
            { key: 'will', label: 'Will',       mod: wisMod, total: totalWill, buffVal: bt.will ?? 0, flashRef: willFlashRef },
          ].map(({ key, label, mod, total, buffVal, flashRef }) => (
            <div key={key} ref={flashRef} className="stat-box text-center" style={{ borderRadius: '6px' }}>
              <div className="text-xs font-bold mb-1 flex items-center justify-center gap-1" style={{ color: 'var(--accent)' }}>
                {label} <BuffBadge val={buffVal} />
              </div>
              <div className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>{formatMod(total)}</div>

              {/* aligned rows: label left, value right — all same width */}
              <div className="text-xs space-y-1" style={{ color: 'var(--text-faint)' }}>
                {[
                  { label: 'Ability', el: <span style={{ color: 'var(--text-dim)' }}>{formatMod(mod)}</span> },
                  { label: 'Base',    el: computedSaveBases
                      ? <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>+{computedSaveBases[key]} <span style={{ color: 'var(--text-faint)', fontWeight: 'normal' }}>(auto)</span></span>
                      : <SpinnerInput value={saves[key]?.base ?? 0} onChange={v => onChange('saves', { ...saves, [key]: { ...saves[key], base: v } })} width="w-10" />
                  },
                  { label: 'Enhance', el: <SpinnerInput value={saves[key]?.enhance ?? 0} onChange={v => onChange('saves', { ...saves, [key]: { ...saves[key], enhance: v } })} width="w-10" /> },
                  { label: 'Misc',    el: <SpinnerInput value={saves[key]?.misc    ?? 0} onChange={v => onChange('saves', { ...saves, [key]: { ...saves[key], misc:    v } })} width="w-10" /> },
                ].map(({ label: lbl, el }) => (
                  <div key={lbl} className="flex items-center justify-between gap-2 px-1">
                    <span style={{ color: 'var(--text-faint)', minWidth: '3rem', textAlign: 'left' }}>{lbl}</span>
                    <div className="flex justify-end">{el}</div>
                  </div>
                ))}
                <div className="px-1 pt-0.5">
                  <input
                    type="text"
                    value={saves[key]?.notes ?? ''}
                    onChange={e => onChange('saves', { ...saves, [key]: { ...saves[key], notes: e.target.value } })}
                    placeholder="notes..."
                    className="w-full rounded px-1 py-0.5 text-xs focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)', color: 'var(--text-dim)' }}
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
