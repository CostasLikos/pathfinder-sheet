import { useRef, useState } from 'react'
import { SKILLS, DEFAULT_SKILL_ORDER, abilityMod, formatMod } from '../../data/pf1eData'
import PinButton from '../PinButton'

const ABILITY_OPTIONS = ['str', 'dex', 'con', 'int', 'wis', 'cha']

// Build a lookup map from key → skill definition
const SKILL_MAP = Object.fromEntries(SKILLS.map(s => [s.key, s]))

export default function Skills({ character, onChange, pinnedSkills = [], onToggleSkillPin }) {
  const { abilities, skills = {} } = character

  // Skill order stored in character, falls back to default
  const skillOrder = character.skillOrder ?? DEFAULT_SKILL_ORDER

  const dragKey = useRef(null)
  const dragOverKey = useRef(null)
  const [dragging, setDragging] = useState(null)

  // ── helpers ──────────────────────────────────────────────────────────────

  const getSkillData = (key) => skills[key] || {}

  const getDisplayName = (skill) => {
    const s = getSkillData(skill.key)
    if ((skill.customizable || skill.custom) && s.customName) return s.customName
    return skill.name
  }

  const getTotal = (skill) => {
    const s     = getSkillData(skill.key)
    const ab    = s.ability ?? skill.ability  // custom skills can override ability
    const ranks = s.ranks ?? 0
    const mod   = abilityMod(abilities[ab] ?? 10)
    const isCS  = s.classSkill ?? false
    const misc  = s.misc ?? 0
    const csBonus = isCS && ranks > 0 ? 3 : 0
    return ranks + mod + csBonus + misc
  }

  const updateSkill = (key, field, value) => {
    onChange('skills', { ...skills, [key]: { ...(skills[key] || {}), [field]: value } })
  }

  // ── drag and drop ─────────────────────────────────────────────────────────

  const onDragStart = (key) => {
    dragKey.current = key
    setDragging(key)
  }

  const onDragOver = (e, key) => {
    e.preventDefault()
    dragOverKey.current = key
  }

  const onDrop = () => {
    if (!dragKey.current || dragKey.current === dragOverKey.current) return
    const order = [...skillOrder]
    const fromIdx = order.indexOf(dragKey.current)
    const toIdx   = order.indexOf(dragOverKey.current)
    if (fromIdx === -1 || toIdx === -1) return
    order.splice(fromIdx, 1)
    order.splice(toIdx, 0, dragKey.current)
    onChange('skillOrder', order)
    dragKey.current = null
    dragOverKey.current = null
    setDragging(null)
  }

  const onDragEnd = () => setDragging(null)

  // ── totals for header ─────────────────────────────────────────────────────

  const totalRanks = Object.values(skills).reduce((s, v) => s + (v.ranks ?? 0), 0)

  // ── render ────────────────────────────────────────────────────────────────

  const orderedSkills = skillOrder
    .map(key => SKILL_MAP[key])
    .filter(Boolean)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <h2 className="section-title mb-0">Skills</h2>
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
          {totalRanks} ranks spent · drag ☰ to reorder
        </span>
      </div>
      <div className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>
        SC = Class Skill (+3 when trained) · * = Trained Only
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: '0 2px' }}>
          <thead>
            <tr className="text-xs" style={{ color: 'var(--text-dim)' }}>
              <th className="w-5 pb-2" />
              <th className="w-5 pb-2" />
              <th className="text-left pb-2 w-5" title="Class Skill (+3 bonus when trained)">SC</th>
              <th className="text-left pb-2">Skill</th>
              <th className="text-center pb-2 w-10">Ab</th>
              <th className="text-center pb-2 w-10">Mod</th>
              <th className="text-center pb-2 w-16">Ranks</th>
              <th className="text-center pb-2 w-12">Misc</th>
              <th className="text-center pb-2 w-14">Total</th>
            </tr>
          </thead>
          <tbody>
            {orderedSkills.map((skill, rowIndex) => {
              const s      = getSkillData(skill.key)
              const isCS   = s.classSkill ?? false
              const ab     = s.ability ?? skill.ability
              const mod    = abilityMod(abilities[ab] ?? 10)
              const total  = getTotal(skill)
              const isDrag = dragging === skill.key
              const isDragOver = dragOverKey.current === skill.key && dragging && dragging !== skill.key
              const isEven = rowIndex % 2 === 0

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
                    cursor: 'grab',
                    backgroundColor: isDragOver
                      ? 'var(--accent-dim)'
                      : isEven
                      ? 'var(--bg-darker)'
                      : 'var(--bg-surface)',
                    borderBottom: '1px solid var(--bg-border)',
                  }}
                >
                  {/* Drag handle */}
                  <td className="pr-1 text-center select-none px-1" style={{ color: 'var(--text-faint)', fontSize: '10px' }}>
                    ☰
                  </td>

                  {/* Pin button */}
                  <td className="text-center px-1">
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

                  {/* Name — editable for customizable/custom skills */}
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
                            backgroundColor: 'var(--bg-darker)',
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

                  {/* Ability selector — editable for custom skills */}
                  <td className="py-1.5 text-center">
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

                  {/* Ability mod */}
                  <td className="py-1.5 text-center text-xs" style={{ color: mod >= 0 ? 'var(--positive)' : '#ef4444' }}>
                    {formatMod(mod)}
                  </td>

                  {/* Ranks */}
                  <td className="py-1.5 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        onClick={() => updateSkill(skill.key, 'ranks', Math.max(0, (s.ranks ?? 0) - 1))}
                        className="w-4 h-4 flex items-center justify-center rounded text-xs"
                        style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}
                      >−</button>
                      <input
                        type="number"
                        value={s.ranks ?? 0}
                        min={0}
                        onChange={e => updateSkill(skill.key, 'ranks', Math.max(0, Number(e.target.value)))}
                        className="w-10 text-center text-sm font-bold focus:outline-none rounded"
                        style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--bg-border)' }}
                      />
                      <button
                        onClick={() => updateSkill(skill.key, 'ranks', (s.ranks ?? 0) + 1)}
                        className="w-4 h-4 flex items-center justify-center rounded text-xs"
                        style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}
                      >+</button>
                    </div>
                  </td>

                  {/* Misc */}
                  <td className="py-1.5 text-center">
                    <input
                      type="number"
                      value={s.misc ?? 0}
                      onChange={e => updateSkill(skill.key, 'misc', Number(e.target.value))}
                      className="w-10 text-center text-sm focus:outline-none rounded"
                      style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}
                    />
                  </td>

                  {/* Total */}
                  <td className="py-1.5 text-center">
                    <span
                      className="font-bold text-sm px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: 'var(--bg-darker)',
                        color: total >= 10 ? 'var(--positive)' : total >= 5 ? 'var(--accent)' : 'var(--text)',
                        border: '1px solid var(--bg-border)',
                      }}
                    >
                      {formatMod(total)}
                    </span>
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
