import { useRef, useState } from 'react'
import { SKILLS, DEFAULT_SKILL_ORDER, abilityMod, formatMod, computeClassTotals } from '../../data/pf1eData'
import PinButton from '../PinButton'

const ABILITY_OPTIONS = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const SKILL_MAP = Object.fromEntries(SKILLS.map(s => [s.key, s]))
const ACP_SKILLS = new Set(['acrobatics','climb','escapeArtist','fly','ride','sleightOfHand','stealth','swim'])
const ACP_DOUBLE = new Set(['swim'])

export default function Skills({ character, onChange, pinnedSkills = [], onToggleSkillPin, armorCheckPenalty = 0, buffTotals = {}, pendingRanks = 0 }) {
  const { abilities, skills = {} } = character
  const hasClasses = (character.classes ?? []).length > 0
  const maxRanks = hasClasses
    ? computeClassTotals(character.classes).totalLevel
    : (character.level || 1)

  const effAbilities = Object.fromEntries(
    Object.keys(abilities).map(k => [k, (abilities[k] ?? 10) + (buffTotals[k] ?? 0)])
  )

  const skillOrder = character.skillOrder ?? DEFAULT_SKILL_ORDER

  const dragKey = useRef(null)
  const dragOverKey = useRef(null)
  const [dragging, setDragging] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const longPressTimer = useRef(null)
  const hideTimer = useRef(null)

  const showTooltip = (key) => {
    clearTimeout(hideTimer.current)
    setTooltip(key)
  }
  const hideTooltip = () => {
    hideTimer.current = setTimeout(() => setTooltip(null), 120)
  }

  const getSkillData = (key) => skills[key] || {}

  const getDisplayName = (skill) => {
    const s = getSkillData(skill.key)
    if ((skill.customizable || skill.custom) && s.customName) return s.customName
    return skill.name
  }

  const getTotal = (skill) => {
    const s      = getSkillData(skill.key)
    const ab     = s.ability ?? skill.ability
    const ranks  = s.ranks ?? 0
    const mod    = abilityMod(effAbilities[ab] ?? 10)
    const isCS   = s.classSkill ?? false
    const misc   = s.misc ?? 0
    const csBonus = isCS && ranks > 0 ? 3 : 0
    const acp    = ACP_SKILLS.has(skill.key) ? (ACP_DOUBLE.has(skill.key) ? armorCheckPenalty * 2 : armorCheckPenalty) : 0
    const skillBuff = skill.key === 'stealth' ? (buffTotals.stealth ?? 0)
                    : skill.key === 'fly'     ? (buffTotals.fly ?? 0)
                    : 0
    return ranks + mod + csBonus + misc - acp + skillBuff
  }

  const getACP = (skill) => ACP_SKILLS.has(skill.key)
    ? (ACP_DOUBLE.has(skill.key) ? armorCheckPenalty * 2 : armorCheckPenalty)
    : 0

  const updateSkill = (key, field, value) => {
    onChange('skills', { ...skills, [key]: { ...(skills[key] || {}), [field]: value } })
  }

  // ── drag ──────────────────────────────────────────────────────────────────
  const onDragStart = (key) => { dragKey.current = key; setDragging(key) }
  const onDragOver  = (e, key) => { e.preventDefault(); dragOverKey.current = key }
  const onDrop      = () => {
    if (!dragKey.current || dragKey.current === dragOverKey.current) return
    const order = [...skillOrder]
    const fromIdx = order.indexOf(dragKey.current)
    const toIdx   = order.indexOf(dragOverKey.current)
    if (fromIdx === -1 || toIdx === -1) return
    order.splice(fromIdx, 1)
    order.splice(toIdx, 0, dragKey.current)
    onChange('skillOrder', order)
    dragKey.current = null; dragOverKey.current = null; setDragging(null)
  }
  const onDragEnd = () => setDragging(null)

  // ── long press (mobile) ───────────────────────────────────────────────────
  const startLongPress = (key) => {
    longPressTimer.current = setTimeout(() => setTooltip(key), 500)
  }
  const cancelLongPress = () => {
    clearTimeout(longPressTimer.current)
  }

  const totalRanks = Object.values(skills).reduce((s, v) => s + (v.ranks ?? 0), 0)
  const orderedSkills = skillOrder.map(key => SKILL_MAP[key]).filter(Boolean)

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="section-title mb-0">Skills</h2>
        <div className="flex items-center gap-2">
          {pendingRanks > 0 && (
            <span className="level-up-pulse text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e66' }}>
              +{pendingRanks} rank{pendingRanks > 1 ? 's' : ''} to spend
            </span>
          )}
          <span className="text-xs hidden md:inline" style={{ color: 'var(--text-faint)' }}>
            {totalRanks} spent · drag ☰ to reorder
          </span>
          <span className="text-xs md:hidden" style={{ color: 'var(--text-faint)' }}>
            {totalRanks} ranks used
          </span>
        </div>
      </div>
      <div className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>
        <span className="hidden md:inline">CS = Class Skill (+3 when trained) · * = Trained Only · Tap total for breakdown</span>
        <span className="md:hidden">CS = Class Skill · * = Trained Only · Hold total for breakdown</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: '0 2px' }}>
          <thead>
            <tr className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {/* Drag + Pin hidden on mobile */}
              <th className="w-5 pb-2 hidden md:table-cell" />
              <th className="w-5 pb-2 hidden md:table-cell" />
              <th className="text-left pb-2 w-5" title="Class Skill (+3 bonus when trained)">CS</th>
              <th className="text-left pb-2">Skill</th>
              {/* Ab + Mod combined on mobile */}
              <th className="text-center pb-2 w-16 hidden md:table-cell">Ability</th>
              <th className="text-center pb-2 w-10 hidden md:table-cell">Mod</th>
              <th className="text-center pb-2 w-8 md:hidden" title="Ability Modifier">Mod</th>
              <th className={`text-center pb-2 w-16 ${pendingRanks > 0 ? 'level-up-pulse' : ''}`}
                style={pendingRanks > 0 ? { color: '#22c55e', borderRadius: '4px' } : {}}>
                Ranks
              </th>
              <th className="text-center pb-2 w-14">Total</th>
            </tr>
          </thead>
          <tbody>
            {orderedSkills.map((skill, rowIndex) => {
              const s       = getSkillData(skill.key)
              const isCS    = s.classSkill ?? false
              const ab      = s.ability ?? skill.ability
              const mod     = abilityMod(effAbilities[ab] ?? 10)
              const total   = getTotal(skill)
              const acp     = getACP(skill)
              const misc    = s.misc ?? 0
              const ranks   = s.ranks ?? 0
              const csBonus = isCS && ranks > 0 ? 3 : 0
              const skillBuff = skill.key === 'stealth' ? (buffTotals.stealth ?? 0)
                              : skill.key === 'fly'     ? (buffTotals.fly ?? 0)
                              : 0
              const isDrag  = dragging === skill.key
              const isEven  = rowIndex % 2 === 0
              const showTip = tooltip === skill.key

              const rowBg = isEven ? 'var(--bg-darker)' : 'var(--bg-surface)'

              return (
                <tr
                  key={skill.key}
                  draggable
                  onDragStart={() => onDragStart(skill.key)}
                  onDragOver={e => onDragOver(e, skill.key)}
                  onDrop={onDrop}
                  onDragEnd={onDragEnd}
                  style={{
                    opacity: isDrag ? 0.4 : 1,
                    backgroundColor: dragOverKey.current === skill.key && dragging && dragging !== skill.key
                      ? 'var(--accent-dim)' : rowBg,
                    borderBottom: '1px solid var(--bg-border)',
                  }}
                >
                  {/* Drag handle — desktop only */}
                  <td className="pr-1 text-center select-none px-1 hidden md:table-cell"
                    style={{ color: 'var(--text-faint)', fontSize: '10px', cursor: 'grab' }}>☰</td>

                  {/* Pin — desktop only */}
                  <td className="text-center px-1 hidden md:table-cell">
                    {onToggleSkillPin && (
                      <PinButton
                        pinned={pinnedSkills.includes(skill.key)}
                        onToggle={() => onToggleSkillPin(skill.key)}
                        className="text-xs"
                      />
                    )}
                  </td>

                  {/* Class skill checkbox */}
                  <td className="py-1.5">
                    <input
                      type="checkbox"
                      checked={isCS}
                      onChange={e => updateSkill(skill.key, 'classSkill', e.target.checked)}
                      className="accent-yellow-500"
                    />
                  </td>

                  {/* Name */}
                  <td className="py-1.5 pr-2">
                    {(skill.customizable || skill.custom) ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-dim)' }}>
                          {skill.baseName ?? ''}
                        </span>
                        <input
                          type="text"
                          value={s.customName ?? ''}
                          onChange={e => updateSkill(skill.key, 'customName', e.target.value)}
                          placeholder={skill.custom ? 'Skill name...' : '(specialty)'}
                          className="text-xs px-1 py-0 rounded focus:outline-none flex-1 min-w-0"
                          style={{
                            backgroundColor: rowBg,
                            border: '1px solid var(--bg-border)',
                            color: 'var(--text)',
                          }}
                          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                          onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
                        />
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text)' }}>
                        {skill.name}
                        {skill.trainedOnly && <span className="ml-1 text-xs" style={{ color: '#ca8a04' }}>*</span>}
                      </span>
                    )}
                  </td>

                  {/* Ability — desktop shows selector + label, mobile shows just mod */}
                  <td className="py-1.5 text-center hidden md:table-cell">
                    {skill.custom ? (
                      <select
                        value={ab}
                        onChange={e => updateSkill(skill.key, 'ability', e.target.value)}
                        className="text-xs rounded focus:outline-none px-0.5"
                        style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
                      >
                        {ABILITY_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{ab}</span>
                    )}
                  </td>

                  {/* Ability mod — desktop */}
                  <td className="py-1.5 text-center text-xs hidden md:table-cell"
                    style={{ color: mod >= 0 ? 'var(--positive)' : '#ef4444' }}>
                    {formatMod(mod)}
                  </td>

                  {/* Ability mod — mobile (compact: "DEX +2") */}
                  <td className="py-1.5 text-center md:hidden">
                    <div className="flex flex-col items-center leading-none">
                      <span className="text-xs" style={{ color: 'var(--text-faint)', fontSize: '0.6rem' }}>{ab}</span>
                      <span className="text-xs font-bold" style={{ color: mod >= 0 ? 'var(--positive)' : '#ef4444' }}>
                        {formatMod(mod)}
                      </span>
                    </div>
                  </td>

                  {/* Ranks */}
                  <td className="py-1.5 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        onClick={() => updateSkill(skill.key, 'ranks', Math.max(0, (s.ranks ?? 0) - 1))}
                        className="flex items-center justify-center rounded text-xs"
                        style={{ width: '20px', height: '20px', backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}
                      >−</button>
                      <input
                        type="number"
                        value={s.ranks ?? 0}
                        min={0}
                        onChange={e => updateSkill(skill.key, 'ranks', Math.max(0, Math.min(maxRanks, Number(e.target.value))))}
                        className="text-center text-sm font-bold focus:outline-none rounded"
                        style={{ width: '36px', backgroundColor: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--bg-border)' }}
                      />
                      <button
                        onClick={() => updateSkill(skill.key, 'ranks', Math.min(maxRanks, (s.ranks ?? 0) + 1))}
                        className="flex items-center justify-center rounded text-xs"
                        style={{ width: '20px', height: '20px', backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}
                      >+</button>
                    </div>
                  </td>

                  {/* Total with breakdown tooltip */}
                  <td className="py-1.5 text-center">
                    <div className="relative inline-block"
                      onMouseEnter={() => showTooltip(skill.key)}
                      onMouseLeave={hideTooltip}
                      onTouchStart={() => startLongPress(skill.key)}
                      onTouchEnd={() => { cancelLongPress(); setTimeout(() => setTooltip(null), 2500) }}
                      onTouchCancel={cancelLongPress}
                    >
                      <span
                        className="font-bold text-sm px-2 py-0.5 rounded cursor-help select-none"
                        style={{
                          backgroundColor: 'var(--bg-darker)',
                          color: total >= 10 ? 'var(--positive)' : total >= 5 ? 'var(--accent)' : 'var(--text)',
                          border: `1px solid ${acp > 0 ? 'var(--warning)' : 'var(--bg-border)'}`,
                        }}
                      >
                        {formatMod(total)}
                        {acp > 0 && <span className="ml-0.5 text-xs" style={{ color: 'var(--warning)' }}>⚔</span>}
                        {misc !== 0 && <span className="ml-0.5" style={{ fontSize: '0.55rem', color: 'var(--text-faint)', verticalAlign: 'super' }}>M</span>}
                        {skillBuff > 0 && <span className="ml-0.5" style={{ fontSize: '0.55rem', color: 'var(--positive)', verticalAlign: 'super' }}>B</span>}
                        {skillBuff < 0 && <span className="ml-0.5" style={{ fontSize: '0.55rem', color: '#ef4444', verticalAlign: 'super' }}>D</span>}
                        {(buffTotals[ab] ?? 0) !== 0 && <span className="ml-0.5" style={{ fontSize: '0.55rem', color: (buffTotals[ab] ?? 0) > 0 ? 'var(--positive)' : '#ef4444', verticalAlign: 'super' }}>{(buffTotals[ab] ?? 0) > 0 ? 'B' : 'D'}</span>}
                      </span>

                      {/* Breakdown tooltip */}
                      {showTip && (() => {
                        const buffAbStr  = buffTotals[ab] ?? 0
                        const skillBuffLabel = skill.key === 'fly' ? 'Size (Fly)' : 'Size (Stealth)'
                        const lines = [
                          { label: `${ab.toUpperCase()} mod`, value: mod, always: true },
                          { label: 'Ranks', value: ranks, always: true },
                          { label: 'Class Skill', value: csBonus, always: false },
                          { label: 'Misc', value: misc, always: false, editable: true },
                          acp !== 0 && { label: 'Armor Penalty', value: -acp, always: false },
                          buffAbStr !== 0 && { label: `${ab.toUpperCase()} buff`, value: Math.floor(buffAbStr / 2), always: false },
                          skillBuff !== 0 && { label: skillBuffLabel, value: skillBuff, always: false },
                        ].filter(Boolean).filter(l => l.always || l.value !== 0)

                        return (
                          <div
                            className={`absolute z-50 right-0 rounded-lg shadow-2xl pointer-events-auto ${rowIndex < 4 ? 'top-full mt-2' : 'bottom-full mb-2'}`}
                            style={{
                              backgroundColor: 'var(--bg-darker)',
                              border: '1px solid var(--accent)',
                              color: 'var(--text-dim)',
                              fontSize: '0.72rem',
                              minWidth: '180px',
                              padding: '10px',
                            }}
                            onMouseEnter={() => showTooltip(skill.key)}
                            onMouseLeave={hideTooltip}
                          >
                            <div className="font-bold mb-2 text-xs uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                              {getDisplayName(skill)} Breakdown
                            </div>
                            {lines.map(({ label, value, editable }) => (
                              <div key={label} className="flex justify-between items-center py-1" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                                <span style={{ color: 'var(--text-faint)' }}>{label}</span>
                                {editable ? (
                                  <input
                                    type="number"
                                    value={misc}
                                    onChange={e => updateSkill(skill.key, 'misc', Number(e.target.value))}
                                    onClick={e => e.stopPropagation()}
                                    className="text-center font-bold rounded focus:outline-none"
                                    style={{
                                      width: '44px',
                                      backgroundColor: 'var(--bg-surface)',
                                      border: '1px solid var(--accent)',
                                      color: value > 0 ? 'var(--positive)' : value < 0 ? '#ef4444' : 'var(--text-dim)',
                                      fontSize: '0.72rem',
                                    }}
                                  />
                                ) : (
                                  <span className="font-bold" style={{ color: value > 0 ? 'var(--positive)' : value < 0 ? '#ef4444' : 'var(--text-dim)' }}>
                                    {value > 0 ? `+${value}` : value}
                                  </span>
                                )}
                              </div>
                            ))}
                            {/* Misc row if not already shown (when misc = 0, it's filtered out; still allow editing) */}
                            {misc === 0 && (
                              <div className="flex justify-between items-center py-1" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                                <span style={{ color: 'var(--text-faint)' }}>Misc</span>
                                <input
                                  type="number"
                                  value={misc}
                                  onChange={e => updateSkill(skill.key, 'misc', Number(e.target.value))}
                                  onClick={e => e.stopPropagation()}
                                  className="text-center font-bold rounded focus:outline-none"
                                  style={{
                                    width: '44px',
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--bg-border)',
                                    color: 'var(--text-dim)',
                                    fontSize: '0.72rem',
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-1.5 mt-0.5 font-bold text-xs">
                              <span style={{ color: 'var(--text-dim)' }}>Total</span>
                              <span style={{ color: total >= 10 ? 'var(--positive)' : total >= 5 ? 'var(--accent)' : 'var(--text)' }}>
                                {formatMod(total)}
                              </span>
                            </div>
                            {onToggleSkillPin && (
                              <button
                                onClick={e => { e.stopPropagation(); onToggleSkillPin(skill.key) }}
                                className="mt-2 w-full text-xs py-1 rounded transition-all"
                                style={{
                                  backgroundColor: pinnedSkills.includes(skill.key) ? 'var(--accent-dim)' : 'var(--bg-surface)',
                                  color: pinnedSkills.includes(skill.key) ? 'var(--accent)' : 'var(--text-faint)',
                                  border: `1px solid ${pinnedSkills.includes(skill.key) ? 'var(--accent)' : 'var(--bg-border)'}`,
                                }}
                              >
                                {pinnedSkills.includes(skill.key) ? '📌 Pinned to Dashboard' : '📌 Pin to Dashboard'}
                              </button>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
