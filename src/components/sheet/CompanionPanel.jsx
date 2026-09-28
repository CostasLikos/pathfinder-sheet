import { useState, useRef } from 'react'
import { abilityMod, formatMod } from '../../data/pf1eData'

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const ABILITY_LABELS = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' }

const emptyCompanion = () => ({
  id: crypto.randomUUID(),
  name: '',
  raceTemplate: '',
  classType: '',
  levelHD: '',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  hp: { max: 0, current: 0 },
  ac: 10,
  fort: 0,
  ref: 0,
  will: 0,
  speed: 30,
  cmb: 0,
  cmd: 10,
  bab: 0,
  attacks: [
    { label: '1st', bonus: 0, dmgDice: '1d6', dmgBonus: 0, crit: '20/×2' },
  ],
  notes: '',
})

function NumInput({ value, onChange, width = 'w-12', className = '', style = {} }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className={`text-center text-sm font-bold focus:outline-none rounded ${width} ${className}`}
      style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)', color: 'var(--text)', ...style }}
    />
  )
}

function CompanionCard({ companion, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(true)
  const portraitRef = useRef()

  const set = (key, val) => onChange({ ...companion, [key]: val })

  const handlePortrait = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => set('portrait', ev.target.result)
    reader.readAsDataURL(file)
  }
  const setAbility = (ab, val) => onChange({ ...companion, abilities: { ...companion.abilities, [ab]: val } })
  const setHp = (key, val) => onChange({ ...companion, hp: { ...companion.hp, [key]: val } })
  const setAttack = (i, key, val) => {
    const next = companion.attacks.map((a, idx) => idx === i ? { ...a, [key]: val } : a)
    onChange({ ...companion, attacks: next })
  }
  const addAttack = () => onChange({ ...companion, attacks: [...companion.attacks, { label: `${companion.attacks.length + 1}${['st','nd','rd'][companion.attacks.length] || 'th'}`, bonus: 0, dmgDice: '1d6', dmgBonus: 0, crit: '20/×2' }] })
  const removeAttack = (i) => onChange({ ...companion, attacks: companion.attacks.filter((_, idx) => idx !== i) })

  const conMod = abilityMod(companion.abilities.con)
  const strMod = abilityMod(companion.abilities.str)
  const dexMod = abilityMod(companion.abilities.dex)
  const hpPct  = companion.hp.max > 0 ? Math.max(0, Math.min(100, (companion.hp.current / companion.hp.max) * 100)) : 0
  const hpColor = hpPct <= 25 ? '#ef4444' : hpPct <= 50 ? '#f59e0b' : 'var(--positive)'

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--accent)44', backgroundColor: 'var(--bg-card)' }}>

      {/* ── Header bar ── */}
      <div className="flex items-center gap-2 px-2 py-2 select-none"
        style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, var(--bg-darker))' }}>

        {/* Portrait */}
        <div className="relative group flex-shrink-0 cursor-pointer rounded-lg overflow-hidden"
          style={{ width: '44px', height: '44px', border: '2px solid var(--accent)44', backgroundColor: 'var(--bg-darker)' }}
          onClick={e => { e.stopPropagation(); portraitRef.current?.click() }}
          title="Click to upload portrait">
          {companion.portrait
            ? <img src={companion.portrait} alt="" className="w-full h-full object-cover group-hover:brightness-75 transition-all" />
            : <div className="w-full h-full flex items-center justify-center text-xl">🐾</div>
          }
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
            style={{ color: 'var(--accent)' }}>
            {companion.portrait ? '✎' : '+'}
          </div>
        </div>
        <input ref={portraitRef} type="file" accept="image/*" className="hidden" onChange={handlePortrait} />

        {/* Name + info — clicking this area toggles expand */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(x => !x)}>
          <div className="font-bold text-sm" style={{ color: 'var(--accent)' }}>
            {companion.name || 'Unnamed Companion'}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {companion.raceTemplate && (
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{companion.raceTemplate}</span>
            )}
            {companion.levelHD && (
              <span className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-dim)' }}>
                HD {companion.levelHD}
              </span>
            )}
          </div>
        </div>

        {/* HP quick view */}
        <div className="flex items-center gap-1 text-xs font-bold cursor-pointer" style={{ color: hpColor }}
          onClick={() => setExpanded(x => !x)}>
          <span>{companion.hp.current}</span>
          <span style={{ color: 'var(--text-faint)' }}>/</span>
          <span>{companion.hp.max}</span>
          <span className="ml-1" style={{ color: 'var(--text-faint)' }}>HP</span>
        </div>
        <span className="text-xs cursor-pointer" style={{ color: 'var(--text-faint)' }}
          onClick={() => setExpanded(x => !x)}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="p-3 space-y-3">

          {/* ── Identity row ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Name', key: 'name' },
              { label: 'Race / Template', key: 'raceTemplate' },
              { label: 'Class / Type', key: 'classType' },
              { label: 'Level / HD', key: 'levelHD' },
            ].map(({ label, key }) => (
              <div key={key} className="flex flex-col gap-0.5">
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{label}</span>
                <input
                  type="text"
                  value={companion[key] ?? ''}
                  onChange={e => set(key, e.target.value)}
                  className="text-sm font-bold px-2 py-1 rounded focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)', color: 'var(--text)' }}
                />
              </div>
            ))}
          </div>

          {/* ── Stats row: Abilities + HP + Defenses ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* Ability Scores */}
            <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--accent)' }}>Abilities</div>
              <div className="grid grid-cols-3 gap-1.5">
                {ABILITIES.map(ab => {
                  const mod = abilityMod(companion.abilities[ab])
                  return (
                    <div key={ab} className="flex flex-col items-center gap-0.5 rounded py-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
                      <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{ABILITY_LABELS[ab]}</span>
                      <NumInput value={companion.abilities[ab]} onChange={v => setAbility(ab, v)} width="w-10" />
                      <span className="text-xs font-bold" style={{ color: mod >= 0 ? 'var(--positive)' : '#ef4444' }}>
                        {formatMod(mod)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* HP */}
            <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--accent)' }}>Hit Points</div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Current</span>
                    <input type="number" value={companion.hp.current}
                      onChange={e => setHp('current', Number(e.target.value))}
                      className="w-14 text-center text-2xl font-bold focus:outline-none rounded"
                      style={{ backgroundColor: 'var(--bg-surface)', border: `2px solid ${hpColor}`, color: hpColor }} />
                  </div>
                  <span className="text-xl" style={{ color: 'var(--text-faint)' }}>/</span>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Max</span>
                    <NumInput value={companion.hp.max} onChange={v => setHp('max', v)} width="w-14" />
                  </div>
                </div>
                {/* HP bar */}
                <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--bg-border)' }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${hpPct}%`, backgroundColor: hpColor }} />
                </div>
                <div className="flex gap-3 w-full justify-center">
                  <button onClick={() => setHp('current', Math.min(companion.hp.max, companion.hp.current + 1))}
                    className="flex-1 text-xs py-1 rounded font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: 'var(--positive)', border: '1px solid var(--positive)' }}>+1</button>
                  <button onClick={() => setHp('current', Math.max(0, companion.hp.current - 1))}
                    className="flex-1 text-xs py-1 rounded font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef444466' }}>−1</button>
                </div>
              </div>
            </div>

            {/* Defenses */}
            <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--accent)' }}>Defenses</div>
              {/* AC full-width */}
              {[{ label: 'AC', key: 'ac', color: 'var(--accent)' }].map(({ label, key, color }) => (
                <div key={key} className="flex items-center justify-between gap-1 rounded px-1.5 py-1 mb-1.5"
                  style={{ backgroundColor: 'var(--bg-surface)', border: `2px solid ${color}55` }}>
                  <span className="text-xs font-bold" style={{ color }}>{label}</span>
                  <NumInput value={companion[key] ?? 0} onChange={v => set(key, v)} width="w-10" />
                </div>
              ))}
              {/* Fort/Ref/Will | Speed/CMB/CMD */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: 'Fort', key: 'fort', color: '#4ade80' },
                    { label: 'Ref',  key: 'ref',  color: '#f59e0b' },
                    { label: 'Will', key: 'will', color: '#c084fc' },
                  ].map(({ label, key, color }) => (
                    <div key={key} className="flex items-center justify-between gap-1 rounded px-1.5 py-1"
                      style={{ backgroundColor: 'var(--bg-surface)', border: `1px solid ${color}33` }}>
                      <span className="text-xs font-bold" style={{ color }}>{label}</span>
                      <NumInput value={companion[key] ?? 0} onChange={v => set(key, v)} width="w-10" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: 'Speed', key: 'speed', color: '#60a5fa' },
                    { label: 'CMB',   key: 'cmb',   color: '#94a3b8' },
                    { label: 'CMD',   key: 'cmd',   color: '#94a3b8' },
                  ].map(({ label, key, color }) => (
                    <div key={key} className="flex items-center justify-between gap-1 rounded px-1.5 py-1"
                      style={{ backgroundColor: 'var(--bg-surface)', border: `1px solid ${color}33` }}>
                      <span className="text-xs font-bold" style={{ color }}>{label}</span>
                      <NumInput value={companion[key] ?? 0} onChange={v => set(key, v)} width="w-10" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Attacks ── */}
          <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#ef4444' }}>⚔ Attacks</div>
              <div className="text-xs" style={{ color: 'var(--text-faint)' }}>BAB: <span className="font-bold" style={{ color: 'var(--text)' }}>{formatMod(companion.bab)}</span></div>
            </div>

            {/* BAB input */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Base Attack Bonus</span>
              <NumInput value={companion.bab} onChange={v => set('bab', v)} width="w-12" />
            </div>

            <div className="space-y-1.5">
              {/* Header */}
              <div className="grid gap-2 text-xs font-bold" style={{ color: 'var(--text-faint)', gridTemplateColumns: '2fr 1fr 2fr 1fr 2fr auto' }}>
                <span>Attack</span><span className="text-center">Bonus</span><span className="text-center">Damage</span><span className="text-center">+Dmg</span><span>Crit</span><span></span>
              </div>
              {companion.attacks.map((atk, i) => (
                <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '2fr 1fr 2fr 1fr 2fr auto' }}>
                  <input type="text" value={atk.label} onChange={e => setAttack(i, 'label', e.target.value)}
                    className="text-xs px-1.5 py-1 rounded focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', color: 'var(--text-dim)' }} />
                  <NumInput value={atk.bonus} onChange={v => setAttack(i, 'bonus', v)} width="w-full" />
                  <input type="text" value={atk.dmgDice} onChange={e => setAttack(i, 'dmgDice', e.target.value)}
                    className="text-xs px-1.5 py-1 rounded focus:outline-none text-center font-bold"
                    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', color: '#fbbf24' }} />
                  <NumInput value={atk.dmgBonus} onChange={v => setAttack(i, 'dmgBonus', v)} width="w-full" />
                  <input type="text" value={atk.crit} onChange={e => setAttack(i, 'crit', e.target.value)}
                    className="text-xs px-1.5 py-1 rounded focus:outline-none text-center"
                    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', color: '#f87171' }} />
                  <button onClick={() => removeAttack(i)} className="text-xs w-6 h-6 flex items-center justify-center rounded"
                    style={{ color: '#ef4444', border: '1px solid var(--bg-border)' }}>✕</button>
                </div>
              ))}
              <button onClick={addAttack} className="text-xs px-2 py-1 rounded mt-1"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', color: 'var(--text-dim)' }}>
                + Add Attack
              </button>
            </div>
          </div>

          {/* ── Notes ── */}
          <textarea
            value={companion.notes ?? ''}
            onChange={e => set('notes', e.target.value)}
            placeholder="Special abilities, traits, notes…"
            rows={2}
            className="w-full text-xs px-2 py-1.5 rounded focus:outline-none resize-none"
            style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)', color: 'var(--text-dim)' }}
          />

          {/* ── Remove button ── */}
          <div className="flex justify-end">
            <button onClick={onRemove} className="text-xs px-3 py-1 rounded"
              style={{ color: '#ef4444', border: '1px solid #ef444444', backgroundColor: 'rgba(239,68,68,0.08)' }}>
              Remove Companion
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CompanionPanel({ companions = [], onChange }) {
  const [collapsed, setCollapsed] = useState(false)

  const addCompanion = () => onChange([...companions, emptyCompanion()])
  const updateCompanion = (i, data) => onChange(companions.map((c, idx) => idx === i ? data : c))
  const removeCompanion = (i) => onChange(companions.filter((_, idx) => idx !== i))

  const hasAny = companions.length > 0

  return (
    <div className="card">
      {/* Section header */}
      <div className="flex items-center justify-between mb-0 cursor-pointer select-none"
        onClick={() => setCollapsed(x => !x)}>
        <h2 className="section-title mb-0 flex items-center gap-2">
          🐾 Companions & Familiars
          {hasAny && <span className="text-xs px-1.5 py-0.5 rounded font-normal" style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-dim)' }}>{companions.length}</span>}
        </h2>
        <div className="flex items-center gap-2">
          {!collapsed && (
            <button onClick={e => { e.stopPropagation(); addCompanion() }}
              className="btn-primary text-xs py-1 px-3">
              + Add
            </button>
          )}
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{collapsed ? '▼' : '▲'}</span>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-3 space-y-3">
          {companions.length === 0 ? (
            <div className="text-center py-6" style={{ color: 'var(--text-faint)' }}>
              <div className="text-3xl mb-2">🐾</div>
              <p className="text-sm">No companions yet.</p>
              <button onClick={addCompanion} className="mt-2 btn-secondary text-xs">Add Companion</button>
            </div>
          ) : (
            companions.map((c, i) => (
              <CompanionCard
                key={c.id}
                companion={c}
                onChange={data => updateCompanion(i, data)}
                onRemove={() => removeCompanion(i)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
