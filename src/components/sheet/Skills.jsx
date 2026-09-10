import { useRef, useState } from 'react'
import { SKILLS, DEFAULT_SKILL_ORDER, abilityMod, formatMod, computeClassTotals } from '../../data/pf1eData'
import PinButton from '../PinButton'

// Renders 1-4 badge letters in triangle/square spatial layout
function BadgeCluster({ badges }) {
  if (!badges.length) return null
  const S = { fontSize: '0.5rem', fontWeight: 700, lineHeight: 1, width: '8px', textAlign: 'center' }
  const rows = badges.length === 1 ? [[badges[0]]]
    : badges.length === 2 ? [[badges[0], badges[1]]]
    : badges.length === 3 ? [[badges[0], badges[1]], [badges[2]]]
    : [[badges[0], badges[1]], [badges[2], badges[3]]]
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'super', marginLeft: '2px', gap: '1px' }}>
      {rows.map((row, ri) => (
        <span key={ri} style={{ display: 'flex', gap: '1px', justifyContent: 'center' }}>
          {row.map(({ label, color }) => (
            <span key={label} style={{ ...S, color }}>{label}</span>
          ))}
        </span>
      ))}
    </span>
  )
}

const ABILITY_OPTIONS = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const SKILL_MAP = Object.fromEntries(SKILLS.map(s => [s.key, s]))
const ACP_SKILLS = new Set(['acrobatics','climb','escapeArtist','fly','ride','sleightOfHand','stealth','swim'])
const ACP_DOUBLE = new Set(['swim'])

const ABILITY_COLORS = {
  str: '#ef4444',
  dex: '#22c55e',
  con: '#f59e0b',
  int: '#3b82f6',
  wis: '#a855f7',
  cha: '#ec4899',
}

// Skills that belong to collapsible groups
const SKILL_GROUPS = {
  knowledge: {
    label: 'Knowledge',
    icon: '📚',
    keys: ['kArcana','kDungeoneering','kEngineering','kGeography','kHistory','kLocal','kNature','kNobility','kPlanes','kReligion'],
  },
  custom: {
    label: 'Custom Skills',
    icon: '✏️',
    keys: ['custom1','custom2','custom3'],
  },
}

const KEY_TO_GROUP = {}
Object.entries(SKILL_GROUPS).forEach(([gid, g]) => g.keys.forEach(k => { KEY_TO_GROUP[k] = gid }))

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
  const [collapsedGroups, setCollapsedGroups] = useState({ knowledge: true, custom: false })
  const toggleGroup = (gid) => setCollapsedGroups(prev => ({ ...prev, [gid]: !prev[gid] }))
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

      {/* Column headers */}
      <div className="flex items-center gap-2 px-2 mb-1 text-xs select-none" style={{ color: 'var(--text-faint)' }}>
        <div className="hidden md:flex gap-1 flex-shrink-0">
          <span style={{ width: '16px' }} />
          <span style={{ width: '16px' }} />
        </div>
        <span style={{ width: '16px', flexShrink: 0 }}>CS</span>
        <span className="flex-1">Skill</span>
        <span className="hidden md:block" style={{ width: '48px', textAlign: 'center' }}>Ability</span>
        <span className="hidden md:block" style={{ width: '36px', textAlign: 'center' }}>Mod</span>
        <span className="md:hidden" style={{ width: '36px', textAlign: 'center' }}>Mod</span>
        <span className={`text-center ${pendingRanks > 0 ? 'level-up-pulse' : ''}`}
          style={{ width: '80px', borderRadius: '4px', ...(pendingRanks > 0 ? { color: '#22c55e' } : {}) }}>
          Ranks
        </span>
        <span style={{ width: '60px', textAlign: 'center' }}>Total</span>
      </div>

      {/* Skill rows as cards */}
      <div className="space-y-1">
        {orderedSkills.map((skill, rowIndex) => {
          const gid = KEY_TO_GROUP[skill.key]
          const group = gid ? SKILL_GROUPS[gid] : null
          const isFirstInGroup = group && group.keys[0] === skill.key
          const isCollapsed = gid ? (collapsedGroups[gid] ?? false) : false

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
          const abColor = ABILITY_COLORS[ab] ?? 'var(--accent)'

          // Group summary for header
          const groupHeaderData = isFirstInGroup ? (() => {
            const groupTotals = group.keys.map(k => {
              const gSkill = SKILL_MAP[k]; if (!gSkill) return null
              return { key: k, total: getTotal(gSkill), name: getDisplayName(gSkill) }
            }).filter(Boolean)
            const best = groupTotals.reduce((a, b) => a.total > b.total ? a : b, groupTotals[0])
            const trained = groupTotals.filter(g => (skills[g.key]?.ranks ?? 0) > 0).length
            return { best, trained }
          })() : null

          return (
            <div key={skill.key}>
              {/* Group header — only on first skill of group */}
              {isFirstInGroup && (
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 transition-all"
                  style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                  onClick={() => toggleGroup(gid)}
                >
                  <span>{group.icon}</span>
                  <span className="font-bold text-sm" style={{ fontFamily: 'Georgia, serif' }}>{group.label}</span>
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    ({group.keys.length}{groupHeaderData.trained > 0 ? ` · ${groupHeaderData.trained} trained` : ''})
                  </span>
                  {isCollapsed && groupHeaderData.best && (
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                      best: <strong style={{ color: 'var(--positive)' }}>{formatMod(groupHeaderData.best.total)}</strong>
                      <span style={{ color: 'var(--text-faint)' }}> {groupHeaderData.best.name.replace(/Knowledge \(|\)/g, '').replace('Custom Skill','custom')}</span>
                    </span>
                  )}
                  <span className="ml-auto text-xs" style={{ color: 'var(--text-faint)' }}>{isCollapsed ? '▶' : '▼'}</span>
                </button>
              )}

              {/* Skill row — hidden when group is collapsed */}
              {!isCollapsed && (
            <div
              draggable
              onDragStart={() => onDragStart(skill.key)}
              onDragOver={e => onDragOver(e, skill.key)}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              className="flex items-center gap-2 px-2 rounded-lg transition-all"
              style={{
                opacity: isDrag ? 0.4 : 1,
                minHeight: '38px',
                backgroundColor: dragOverKey.current === skill.key && dragging && dragging !== skill.key
                  ? 'var(--accent-dim)'
                  : isEven
                  ? `color-mix(in srgb, ${abColor} 5%, var(--bg-darker))`
                  : 'var(--bg-surface)',
                border: `1px solid var(--bg-border)`,
                borderLeft: `3px solid ${abColor}88`,
              }}
              onMouseEnter={e => { if (!isDrag) e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${abColor} 12%, var(--bg-darker))` }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = isEven ? `color-mix(in srgb, ${abColor} 5%, var(--bg-darker))` : 'var(--bg-surface)' }}
            >
              {/* Drag handle — desktop only */}
              <span className="hidden md:block select-none flex-shrink-0"
                style={{ color: 'var(--text-faint)', fontSize: '10px', cursor: 'grab', width: '16px', textAlign: 'center' }}>☰</span>

              {/* Pin — desktop only */}
              <span className="hidden md:flex flex-shrink-0" style={{ width: '16px', justifyContent: 'center' }}>
                {onToggleSkillPin && (
                  <PinButton pinned={pinnedSkills.includes(skill.key)} onToggle={() => onToggleSkillPin(skill.key)} className="text-xs" />
                )}
              </span>

              {/* Class skill checkbox */}
              <span className="flex-shrink-0" style={{ width: '16px', textAlign: 'center' }}>
                <input type="checkbox" checked={isCS}
                  onChange={e => updateSkill(skill.key, 'classSkill', e.target.checked)}
                  className="accent-yellow-500" />
              </span>

              {/* Name */}
              <span className="flex-1 min-w-0 text-sm">
                {(skill.customizable || skill.custom) ? (
                  <span className="flex items-center gap-1">
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-dim)' }}>{skill.baseName ?? ''}</span>
                    <input type="text" value={s.customName ?? ''}
                      onChange={e => updateSkill(skill.key, 'customName', e.target.value)}
                      placeholder={skill.custom ? 'Skill name...' : '(specialty)'}
                      className="text-xs px-1 py-0 rounded focus:outline-none flex-1 min-w-0"
                      style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)', color: 'var(--text)' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
                    />
                  </span>
                ) : (
                  <span style={{ color: 'var(--text)' }}>
                    {skill.name}
                    {skill.trainedOnly && <span className="ml-1 text-xs" style={{ color: '#ca8a04' }}>*</span>}
                  </span>
                )}
              </span>

              {/* Ability label — desktop */}
              <span className="hidden md:block text-xs text-center flex-shrink-0" style={{ width: '48px', color: 'var(--text-faint)' }}>
                {skill.custom ? (
                  <select value={ab} onChange={e => updateSkill(skill.key, 'ability', e.target.value)}
                    className="text-xs rounded focus:outline-none px-0.5"
                    style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}>
                    {ABILITY_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                ) : ab}
              </span>

              {/* Ability mod — desktop */}
              <span className="hidden md:block text-xs font-bold text-center flex-shrink-0"
                style={{ width: '36px', color: abColor }}>
                {formatMod(mod)}
              </span>

              {/* Ability mod — mobile stacked */}
              <span className="md:hidden flex flex-col items-center leading-none flex-shrink-0" style={{ width: '36px' }}>
                {skill.custom ? (
                  <select value={ab} onChange={e => updateSkill(skill.key, 'ability', e.target.value)}
                    className="rounded focus:outline-none"
                    style={{ fontSize: '0.6rem', backgroundColor: 'var(--bg-darker)', color: abColor, border: `1px solid ${abColor}55`, padding: '1px 2px', width: '36px' }}>
                    {ABILITY_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                ) : (
                  <span style={{ fontSize: '0.55rem', color: abColor, opacity: 0.8 }}>{ab}</span>
                )}
                <span className="text-xs font-bold" style={{ color: abColor }}>{formatMod(mod)}</span>
              </span>

              {/* Ranks */}
              <span className="flex-shrink-0" style={{ width: '80px' }}>
                <span className="flex items-center justify-center gap-0.5">
                  <button onClick={() => updateSkill(skill.key, 'ranks', Math.max(0, (s.ranks ?? 0) - 1))}
                    className="flex items-center justify-center rounded text-xs flex-shrink-0"
                    style={{ width: '20px', height: '20px', backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}>−</button>
                  <input type="number" value={s.ranks ?? 0} min={0}
                    onChange={e => updateSkill(skill.key, 'ranks', Math.max(0, Math.min(maxRanks, Number(e.target.value))))}
                    className="text-center text-sm font-bold focus:outline-none rounded"
                    style={{ width: '36px', backgroundColor: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--bg-border)' }}
                  />
                  <button onClick={() => updateSkill(skill.key, 'ranks', Math.min(maxRanks, (s.ranks ?? 0) + 1))}
                    className="flex items-center justify-center rounded text-xs flex-shrink-0"
                    style={{ width: '20px', height: '20px', backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}>+</button>
                </span>
              </span>

              {/* Total with breakdown tooltip */}
              <span className="flex-shrink-0" style={{ width: '60px', textAlign: 'center' }}>
                <span className="relative inline-block"
                  onMouseEnter={() => showTooltip(skill.key)}
                  onMouseLeave={hideTooltip}
                  onTouchStart={() => startLongPress(skill.key)}
                  onTouchEnd={() => { cancelLongPress(); setTimeout(() => setTooltip(null), 2500) }}
                  onTouchCancel={cancelLongPress}
                >
                  <span className="font-bold cursor-help select-none inline-flex items-center justify-center rounded-lg"
                    style={{
                      minWidth: '52px', height: '32px', padding: '0 6px',
                      fontSize: '1rem', whiteSpace: 'nowrap', fontFamily: 'Georgia, serif',
                      backgroundColor: `${abColor}18`,
                      color: total >= 10 ? 'var(--positive)' : total >= 5 ? 'var(--accent)' : 'var(--text)',
                      border: `1px solid ${abColor}55`,
                    }}>
                    {formatMod(total)}
                    <BadgeCluster badges={[
                      ...(acp > 0 ? [{ label: 'A', color: 'var(--warning)' }] : []),
                      ...(misc !== 0 ? [{ label: 'M', color: 'var(--text-faint)' }] : []),
                      ...(skillBuff > 0 ? [{ label: 'B', color: 'var(--positive)' }] : []),
                      ...(skillBuff < 0 ? [{ label: 'D', color: '#ef4444' }] : []),
                      ...((buffTotals[ab] ?? 0) !== 0 ? [{ label: (buffTotals[ab] ?? 0) > 0 ? 'B' : 'D', color: (buffTotals[ab] ?? 0) > 0 ? 'var(--positive)' : '#ef4444' }] : []),
                    ]} />
                  </span>

                  {/* Breakdown tooltip */}
                  {showTip && (() => {
                    const buffAbStr = buffTotals[ab] ?? 0
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
                      <div className={`absolute z-50 right-0 rounded-lg shadow-2xl pointer-events-auto ${rowIndex < 4 ? 'top-full mt-2' : 'bottom-full mb-2'}`}
                        style={{ backgroundColor: 'var(--bg-darker)', border: `1px solid ${abColor}`, color: 'var(--text-dim)', fontSize: '0.72rem', minWidth: '180px', padding: '10px' }}
                        onMouseEnter={() => showTooltip(skill.key)}
                        onMouseLeave={hideTooltip}
                      >
                        <div className="font-bold mb-2 text-xs uppercase tracking-widest" style={{ color: abColor }}>
                          {getDisplayName(skill)} Breakdown
                        </div>
                        {lines.map(({ label, value, editable }) => (
                          <div key={label} className="flex justify-between items-center py-1" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                            <span style={{ color: 'var(--text-faint)' }}>{label}</span>
                            {editable ? (
                              <input type="number" value={misc}
                                onChange={e => updateSkill(skill.key, 'misc', Number(e.target.value))}
                                onClick={e => e.stopPropagation()}
                                className="text-center font-bold rounded focus:outline-none"
                                style={{ width: '44px', backgroundColor: 'var(--bg-surface)', border: `1px solid ${abColor}`, color: value > 0 ? 'var(--positive)' : value < 0 ? '#ef4444' : 'var(--text-dim)', fontSize: '0.72rem' }}
                              />
                            ) : (
                              <span className="font-bold" style={{ color: value > 0 ? 'var(--positive)' : value < 0 ? '#ef4444' : 'var(--text-dim)' }}>
                                {value > 0 ? `+${value}` : value}
                              </span>
                            )}
                          </div>
                        ))}
                        {misc === 0 && (
                          <div className="flex justify-between items-center py-1" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                            <span style={{ color: 'var(--text-faint)' }}>Misc</span>
                            <input type="number" value={misc}
                              onChange={e => updateSkill(skill.key, 'misc', Number(e.target.value))}
                              onClick={e => e.stopPropagation()}
                              className="text-center font-bold rounded focus:outline-none"
                              style={{ width: '44px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', color: 'var(--text-dim)', fontSize: '0.72rem' }}
                            />
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1.5 mt-0.5 font-bold text-xs">
                          <span style={{ color: 'var(--text-dim)' }}>Total</span>
                          <span style={{ color: total >= 10 ? 'var(--positive)' : total >= 5 ? 'var(--accent)' : 'var(--text)' }}>{formatMod(total)}</span>
                        </div>
                        {onToggleSkillPin && (
                          <button onClick={e => { e.stopPropagation(); onToggleSkillPin(skill.key) }}
                            className="mt-2 w-full text-xs py-1 rounded transition-all"
                            style={{
                              backgroundColor: pinnedSkills.includes(skill.key) ? 'var(--accent-dim)' : 'var(--bg-surface)',
                              color: pinnedSkills.includes(skill.key) ? 'var(--accent)' : 'var(--text-faint)',
                              border: `1px solid ${pinnedSkills.includes(skill.key) ? 'var(--accent)' : 'var(--bg-border)'}`,
                            }}>
                            {pinnedSkills.includes(skill.key) ? '📌 Pinned to Dashboard' : '📌 Pin to Dashboard'}
                          </button>
                        )}
                      </div>
                    )
                  })()}
                </span>
              </span>
            </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
