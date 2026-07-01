import { useState, useRef } from 'react'
import { abilityMod, formatMod, SKILLS, computeClassTotals } from '../../data/pf1eData'
import SpinnerInput from '../SpinnerInput'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SECTION_LABELS = {
  basicInfo:    { icon: '🧙',  label: 'Character Info' },
  hp:           { icon: '❤️',  label: 'Hit Points' },
  abilities:    { icon: '💪',  label: 'Ability Scores' },
  ac:           { icon: '🛡️',  label: 'Armor Class' },
  saves:        { icon: '🎲',  label: 'Saving Throws' },
  combat:       { icon: '⚔️',  label: 'Combat' },
  attacks:      { icon: '🗡️',  label: 'Attacks' },
  spellcasting: { icon: '✨',  label: 'Spellcasting' },
  spells:       { icon: '📖',  label: 'Spell List' },
  statBuffs:    { icon: '⚡',  label: 'Stat Buffs' },
  buffs:        { icon: '⏱️',  label: 'Buffs & Tracking' },
  bardic:       { icon: '🎶',  label: 'Bardic Performance' },
  feats:        { icon: '🏅',  label: 'Feats' },
  traits:       { icon: '🌟',  label: 'Traits' },
  equipment:    { icon: '🎒',  label: 'Equipment' },
  currency:     { icon: '💰',  label: 'Currency' },
  notes:        { icon: '📝',  label: 'Notes' },
}

function WidgetCard({ id, label, icon, onUnpin, children, isDragging, onDragStart, onDragOver, onDrop, onDragEnd }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="card"
      style={{ position: 'relative', opacity: isDragging ? 0.4 : 1, cursor: 'grab', transition: 'opacity 0.15s' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm flex items-center gap-2 select-none" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>☰</span>
          <span>{icon}</span> {label}
        </h3>
        <button onClick={() => onUnpin(id)} title="Unpin"
          className="text-xs px-2 py-0.5 rounded"
          style={{ color: 'var(--text-faint)', border: '1px solid var(--bg-border)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
        >📌 unpin</button>
      </div>
      {children}
    </div>
  )
}

// ─── Individual Widgets ───────────────────────────────────────────────────────

function HPWidget({ character, onChange }) {
  const { hp } = character
  const current = hp?.current ?? 0
  const max     = hp?.max ?? 0
  const nonlethal = hp?.nonlethal ?? 0
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  const color = pct > 50 ? '#22c55e' : pct > 25 ? '#f59e0b' : '#ef4444'
  const updateHp = (k, v) => onChange('hp', { ...hp, [k]: v })

  return (
    <div className="space-y-3">
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-border)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex items-center gap-4 justify-center">
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Current</div>
          <SpinnerInput value={current} onChange={v => updateHp('current', Math.min(v, max))} width="w-14" />
        </div>
        <div className="text-2xl font-bold" style={{ color: 'var(--text-faint)' }}>/</div>
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Max</div>
          <SpinnerInput value={max} onChange={v => updateHp('max', Math.max(0, v))} min={0} width="w-14" />
        </div>
      </div>
      <div className="flex items-center gap-2 justify-center">
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Nonlethal:</span>
        <SpinnerInput value={nonlethal} onChange={v => updateHp('nonlethal', Math.max(0, v))} min={0} width="w-12" />
      </div>
    </div>
  )
}

function AbilitiesWidget({ character, onChange }) {
  const { abilities } = character
  const ABS = ['str','dex','con','int','wis','cha']
  return (
    <div className="grid grid-cols-3 gap-2">
      {ABS.map(ab => {
        const mod = abilityMod(abilities[ab] ?? 10)
        return (
          <div key={ab} className="stat-box text-center p-2">
            <div className="text-xs font-bold uppercase" style={{ color: 'var(--text-dim)' }}>{ab}</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{abilities[ab] ?? 10}</div>
            <div className="text-sm font-bold" style={{ color: mod >= 0 ? 'var(--positive)' : '#ef4444' }}>{formatMod(mod)}</div>
          </div>
        )
      })}
    </div>
  )
}

function ACWidget({ character }) {
  const { abilities, ac } = character
  const dexMod = abilityMod(abilities.dex ?? 10)
  const total = 10 + (ac.armor??0) + (ac.shield??0) + dexMod + (ac.natural??0) + (ac.deflect??0) + (ac.misc??0)
  const touch = 10 + dexMod + (ac.deflect??0) + (ac.misc??0)
  const flat  = 10 + (ac.armor??0) + (ac.shield??0) + (ac.natural??0) + (ac.deflect??0) + (ac.misc??0)
  return (
    <div className="flex gap-3 justify-center">
      {[['AC', total], ['Touch', touch], ['Flat', flat]].map(([lbl, val]) => (
        <div key={lbl} className="stat-box text-center flex-1">
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{lbl}</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{val}</div>
        </div>
      ))}
    </div>
  )
}

function SavesWidget({ character }) {
  const { abilities, saves } = character
  const mods = {
    fort: abilityMod(abilities.con ?? 10),
    ref:  abilityMod(abilities.dex ?? 10),
    will: abilityMod(abilities.wis ?? 10),
  }
  return (
    <div className="flex gap-3 justify-center">
      {[['Fortitude', 'fort', '🛡️'], ['Reflex', 'ref', '💨'], ['Will', 'will', '🧠']].map(([lbl, key, icon]) => {
        const total = (saves[key]?.base ?? 0) + mods[key] + (saves[key]?.misc ?? 0)
        return (
          <div key={key} className="stat-box text-center flex-1">
            <div className="text-lg mb-0.5">{icon}</div>
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{lbl}</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{formatMod(total)}</div>
          </div>
        )
      })}
    </div>
  )
}

function CombatWidget({ character }) {
  const { abilities, bab, initiative, speed } = character
  const dexMod = abilityMod(abilities.dex ?? 10)
  const strMod = abilityMod(abilities.str ?? 10)
  const initTotal = dexMod + (initiative?.misc ?? 0)
  const cmb = (bab ?? 0) + strMod
  const cmd = 10 + (bab ?? 0) + strMod + dexMod
  return (
    <div className="grid grid-cols-2 gap-2">
      {[['BAB', formatMod(bab ?? 0)], ['Initiative', formatMod(initTotal)], ['CMB', formatMod(cmb)], ['CMD', cmd], ['Speed', `${speed ?? 30} ft`]].map(([lbl, val]) => (
        <div key={lbl} className="stat-box text-center p-2">
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{lbl}</div>
          <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>{val}</div>
        </div>
      ))}
    </div>
  )
}

function AttacksWidget({ character }) {
  const weapons = character.weapons ?? []
  if (!weapons.length) return <p className="text-xs text-center py-2" style={{ color: 'var(--text-faint)' }}>No weapons added.</p>
  return (
    <div className="space-y-2">
      {weapons.map((w, i) => (
        <div key={i} className="p-2 rounded" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
          <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{w.name || 'Unnamed Weapon'}</div>
          <div className="text-xs flex gap-3 mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {w.attackBonus !== undefined && <span>Atk: {formatMod(w.attackBonus ?? 0)}</span>}
            {w.damage && <span>Dmg: {w.damage}</span>}
            {w.critical && <span>Crit: {w.critical}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function SpellcastingWidget({ character }) {
  const sc = character.spellcasting ?? {}
  const abilityModVal = abilityMod(character.abilities[sc.ability ?? 'int'] ?? 10)
  const cl = sc.casterLevel ?? character.level ?? 1
  const conc = cl + abilityModVal + (sc.concentrationMisc ?? 0)
  const baseDC = 10 + abilityModVal + (sc.dcBonuses ?? []).filter(b => b.school === 'All Schools').reduce((s,b) => s + b.bonus, 0)
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="stat-box text-center"><div className="text-xs" style={{ color: 'var(--text-dim)' }}>Class</div><div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{sc.class || '—'}</div></div>
        <div className="stat-box text-center"><div className="text-xs" style={{ color: 'var(--text-dim)' }}>Base DC</div><div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{baseDC}</div></div>
        <div className="stat-box text-center"><div className="text-xs" style={{ color: 'var(--text-dim)' }}>Conc.</div><div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{formatMod(conc)}</div></div>
      </div>
    </div>
  )
}

function SpellsWidget({ character }) {
  const spells = character.spellcasting?.spells ?? []
  const slots  = character.spellcasting?.slots ?? {}
  if (!spells.length && !Object.values(slots).some(s => s?.max > 0))
    return <p className="text-xs text-center py-2" style={{ color: 'var(--text-faint)' }}>No spells added.</p>
  const byLevel = {}
  spells.forEach(s => { if (!byLevel[s.level]) byLevel[s.level] = []; byLevel[s.level].push(s) })
  return (
    <div className="space-y-2">
      {Object.entries(byLevel).sort(([a],[b]) => a-b).map(([lvl, list]) => (
        <div key={lvl}>
          <div className="text-xs font-bold mb-1" style={{ color: 'var(--accent)' }}>{lvl === '0' ? 'Cantrips' : `Level ${lvl}`} {slots[lvl] ? `· ${(slots[lvl].max??0)-(slots[lvl].used??0)}/${slots[lvl].max??0} slots` : ''}</div>
          {list.map((sp,i) => (
            <div key={i} className="text-xs py-0.5 flex gap-2" style={{ color: (sp.used??0) >= (sp.prepared??1) ? 'var(--text-faint)' : 'var(--text)' }}>
              <span style={{ textDecoration: (sp.used??0) >= (sp.prepared??1) ? 'line-through' : 'none' }}>{sp.name}</span>
              {sp.level > 0 && <span style={{ color: 'var(--text-faint)' }}>{(sp.prepared??1)-(sp.used??0)}/{sp.prepared??1}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function BuffsWidget({ character, onChange }) {
  const buffs = character.buffs ?? []
  const round = character.combatRound ?? 1
  const active = buffs.filter(b => b.active)
  if (!active.length) return <p className="text-xs text-center py-2" style={{ color: 'var(--text-faint)' }}>No active buffs.</p>
  return (
    <div className="space-y-1">
      <div className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>Round: <strong style={{ color: 'var(--accent)' }}>{round}</strong></div>
      {active.map((b, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded text-xs" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.color || 'var(--accent)' }} />
          <span className="flex-1 font-semibold" style={{ color: 'var(--text)' }}>{b.name}</span>
          <span style={{ color: 'var(--text-faint)' }}>{b.duration}{b.unit ? ` ${b.unit}` : ''}</span>
        </div>
      ))}
    </div>
  )
}

function BardicWidget({ character, onChange }) {
  const bp = character.bardicPerformance ?? {}
  const cha = abilityMod(character.abilities?.cha ?? 10)
  const lvl = character.level ?? 1
  const maxRounds = 4 + cha + (lvl - 1) * 2
  const remaining = maxRounds - (bp.used ?? 0)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: 'var(--text-dim)' }}>Rounds</span>
        <span className="font-bold" style={{ color: remaining > 0 ? 'var(--accent)' : '#ef4444' }}>{remaining}/{maxRounds}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: Math.min(maxRounds, 20) }).map((_, i) => (
          <div key={i} className="w-3 h-3 rounded-full border" style={{ backgroundColor: i < (bp.used ?? 0) ? 'var(--text-faint)' : 'var(--accent)', borderColor: 'var(--accent)' }} />
        ))}
        {maxRounds > 20 && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>+{maxRounds-20}</span>}
      </div>
      {bp.active && (
        <div className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
          🎶 {bp.currentPerf || 'Performance'} active
        </div>
      )}
    </div>
  )
}

function FeatsWidget({ character }) {
  const feats = character.feats ?? []
  if (!feats.length) return <p className="text-xs text-center py-2" style={{ color: 'var(--text-faint)' }}>No feats added.</p>
  return (
    <div className="space-y-1">
      {feats.map((f, i) => (
        <div key={i} className="text-xs py-1 px-2 rounded" style={{ backgroundColor: i%2===0?'var(--bg-darker)':'var(--bg-surface)', color: 'var(--text)' }}>
          {f.name}
        </div>
      ))}
    </div>
  )
}

function TraitsWidget({ character }) {
  const traits = character.traits ?? []
  if (!traits.length) return <p className="text-xs text-center py-2" style={{ color: 'var(--text-faint)' }}>No traits added.</p>
  return (
    <div className="space-y-1">
      {traits.map((t, i) => (
        <div key={i} className="text-xs py-1 px-2 rounded" style={{ backgroundColor: i%2===0?'var(--bg-darker)':'var(--bg-surface)', color: 'var(--text)' }}>
          {t.name}
        </div>
      ))}
    </div>
  )
}

function EquipmentWidget({ character }) {
  const gear = character.gear ?? []
  if (!gear.length) return <p className="text-xs text-center py-2" style={{ color: 'var(--text-faint)' }}>No gear added.</p>
  return (
    <div className="space-y-1 max-h-40 overflow-y-auto">
      {gear.map((g, i) => (
        <div key={i} className="text-xs py-1 px-2 rounded flex justify-between" style={{ backgroundColor: i%2===0?'var(--bg-darker)':'var(--bg-surface)' }}>
          <span style={{ color: 'var(--text)' }}>{g.name}</span>
          <span style={{ color: 'var(--text-faint)' }}>×{g.qty??1}</span>
        </div>
      ))}
    </div>
  )
}

function CurrencyWidget({ character, onChange }) {
  const cur = character.currency ?? { pp:0, gp:0, sp:0, cp:0 }
  const gpTotal = (cur.pp*10)+(cur.gp)+(cur.sp/10)+(cur.cp/100)
  const update = (k, v) => onChange('currency', { ...cur, [k]: Math.max(0, v) })
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {[['pp','Platinum','#a855f7'],['gp','Gold','#eab308'],['sp','Silver','#9ca3af'],['cp','Copper','#b45309']].map(([k,lbl,col]) => (
          <div key={k} className="text-center">
            <div className="text-xs font-bold mb-0.5" style={{ color: col }}>{lbl}</div>
            <SpinnerInput value={cur[k]??0} onChange={v => update(k, v)} min={0} width="w-10" />
          </div>
        ))}
      </div>
      <div className="text-xs text-center" style={{ color: 'var(--text-faint)' }}>Total: {gpTotal.toFixed(2)} gp</div>
    </div>
  )
}

function NotesWidget({ character, onChange }) {
  return (
    <textarea
      value={character.notes || ''}
      onChange={e => onChange('notes', e.target.value)}
      placeholder="Notes..."
      rows={5}
      className="input-field text-xs resize-none"
    />
  )
}

function BasicInfoWidget({ character }) {
  const classes = character.classes ?? []
  const totals  = computeClassTotals(classes)
  const classStr = classes.length > 0
    ? classes.map(c => `${c.className} ${c.level}`).join(' / ')
    : character.class || '—'
  const level = classes.length > 0 ? totals.totalLevel : (character.level ?? '—')

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {character.portrait
          ? <img src={character.portrait} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" style={{ border: '1px solid var(--bg-border)' }} />
          : <div className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0 text-2xl" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>🧙</div>
        }
        <div className="min-w-0">
          <div className="font-bold truncate" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>{character.name || 'Unnamed Hero'}</div>
          <div className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>{classStr} · Lvl {level}</div>
          {character.race && <div className="text-xs" style={{ color: 'var(--text-faint)' }}>{character.race}{character.alignment ? ` · ${character.alignment}` : ''}</div>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          ['Deity',      character.deity],
          ['Homeland',   character.homeland],
          ['Background', character.background],
          ['Size',       character.size],
          ['Height',     character.height],
          ['Weight',     character.weight],
          ['Age',        character.age],
          ['XP',         character.experience],
        ].filter(([,v]) => v).map(([lbl, val]) => (
          <div key={lbl} className="flex flex-col">
            <span style={{ color: 'var(--text-faint)' }}>{lbl}</span>
            <span style={{ color: 'var(--text-dim)' }}>{val}</span>
          </div>
        ))}
      </div>
      {character.languages && (
        <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
          <span style={{ color: 'var(--text-dim)' }}>Languages: </span>{character.languages}
        </div>
      )}
      {classes.length > 0 && (
        <div className="pt-2 flex gap-3 text-xs justify-center" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <span style={{ color: 'var(--text-faint)' }}>BAB <strong style={{ color: 'var(--text)' }}>+{totals.totalBAB}</strong></span>
          <span style={{ color: 'var(--text-faint)' }}>Fort <strong style={{ color: 'var(--text)' }}>+{totals.totalFort}</strong></span>
          <span style={{ color: 'var(--text-faint)' }}>Ref <strong style={{ color: 'var(--text)' }}>+{totals.totalRef}</strong></span>
          <span style={{ color: 'var(--text-faint)' }}>Will <strong style={{ color: 'var(--text)' }}>+{totals.totalWill}</strong></span>
        </div>
      )}
    </div>
  )
}

function StatBuffsWidget({ character, onChange }) {
  const buffs = character.statBuffs ?? []
  if (!buffs.length) return <p className="text-xs text-center py-2" style={{ color: 'var(--text-faint)' }}>No stat buffs added.</p>
  const toggle = (id) => onChange('statBuffs', buffs.map(b => b.id === id ? { ...b, active: !b.active } : b))
  const STAT_KEYS = ['str','dex','con','int','wis','cha','ac','fort','ref','will','attackRoll','damage','hp']
  return (
    <div className="space-y-1">
      {buffs.map(b => {
        const activeMods = STAT_KEYS.filter(k => (b.mods?.[k] ?? 0) !== 0)
        return (
          <div key={b.id} className="flex items-center gap-2 p-2 rounded text-xs" style={{ backgroundColor: 'var(--bg-darker)', border: `1px solid ${b.active ? 'var(--accent)' : 'var(--bg-border)'}`, opacity: b.active ? 1 : 0.5 }}>
            <button onClick={() => toggle(b.id)} className="w-4 h-4 rounded-full flex-shrink-0 border" style={{ backgroundColor: b.active ? 'var(--accent)' : 'transparent', borderColor: 'var(--accent)' }} />
            <span className="flex-1 font-semibold truncate" style={{ color: 'var(--text)' }}>{b.name}</span>
            <span style={{ color: 'var(--text-faint)' }}>
              {activeMods.map(k => `${(b.mods[k]>0?'+':'')}${b.mods[k]} ${k}`).join(', ')}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Pinned Skills Widget ─────────────────────────────────────────────────────

function PinnedSkillsWidget({ character, onUnpin }) {
  const pinnedSkills = character.pins?.skills ?? []
  const { abilities, skills = {} } = character
  const SKILL_MAP = Object.fromEntries(SKILLS.map(s => [s.key, s]))

  const getTotal = (key) => {
    const def = SKILL_MAP[key]
    if (!def) return 0
    const s    = skills[key] || {}
    const ab   = s.ability ?? def.ability
    const ranks = s.ranks ?? 0
    const mod  = abilityMod(abilities[ab] ?? 10)
    const csBonus = (s.classSkill && ranks > 0) ? 3 : 0
    return ranks + mod + csBonus + (s.misc ?? 0)
  }

  const getDisplayName = (key) => {
    const def = SKILL_MAP[key]
    if (!def) return key
    const s = skills[key] || {}
    if ((def.customizable || def.custom) && s.customName) return s.customName
    return def.name
  }

  if (!pinnedSkills.length)
    return <p className="text-xs text-center py-2" style={{ color: 'var(--text-faint)' }}>Pin individual skills from the Skills tab.</p>

  return (
    <div className="space-y-0.5">
      {pinnedSkills.map((key, i) => {
        const total = getTotal(key)
        const def = SKILL_MAP[key]
        const s = skills[key] || {}
        return (
          <div key={key} className="flex items-center gap-2 px-2 py-1.5 rounded text-xs group"
            style={{ backgroundColor: i%2===0?'var(--bg-darker)':'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
            <span className="flex-1 font-semibold" style={{ color: 'var(--text)' }}>{getDisplayName(key)}</span>
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{def?.ability?.toUpperCase()}</span>
            {s.classSkill && <span className="text-xs" style={{ color: 'var(--accent)' }}>SC</span>}
            <span className="font-bold w-8 text-right" style={{ color: total >= 0 ? 'var(--positive)' : '#ef4444' }}>{formatMod(total)}</span>
            <button onClick={() => onUnpin(key)} className="opacity-0 group-hover:opacity-100 text-xs" style={{ color: 'var(--text-faint)' }} title="Unpin skill">✕</button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Widget Renderer ──────────────────────────────────────────────────────────

function renderWidget(id, character, onChange) {
  switch (id) {
    case 'basicInfo':    return <BasicInfoWidget character={character} />
    case 'hp':           return <HPWidget character={character} onChange={onChange} />
    case 'abilities':    return <AbilitiesWidget character={character} onChange={onChange} />
    case 'ac':           return <ACWidget character={character} />
    case 'saves':        return <SavesWidget character={character} />
    case 'combat':       return <CombatWidget character={character} />
    case 'attacks':      return <AttacksWidget character={character} />
    case 'spellcasting': return <SpellcastingWidget character={character} />
    case 'spells':       return <SpellsWidget character={character} />
    case 'statBuffs':    return <StatBuffsWidget character={character} onChange={onChange} />
    case 'buffs':        return <BuffsWidget character={character} onChange={onChange} />
    case 'bardic':       return <BardicWidget character={character} onChange={onChange} />
    case 'feats':        return <FeatsWidget character={character} />
    case 'traits':       return <TraitsWidget character={character} />
    case 'equipment':    return <EquipmentWidget character={character} />
    case 'currency':     return <CurrencyWidget character={character} onChange={onChange} />
    case 'notes':        return <NotesWidget character={character} onChange={onChange} />
    default:             return null
  }
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ character, onChange }) {
  const pins = character.pins ?? { sections: [], skills: [] }
  const pinnedSections = pins.sections ?? []
  const hasPinnedSkills = (pins.skills ?? []).length > 0

  const dragId    = useRef(null)
  const dragOverId = useRef(null)
  const [dragging, setDragging] = useState(null)

  const unpin = (id) => {
    onChange('pins', { ...pins, sections: pinnedSections.filter(s => s !== id) })
  }

  const unpinSkill = (key) => {
    onChange('pins', { ...pins, skills: (pins.skills ?? []).filter(k => k !== key) })
  }

  const onDragStart = (id) => { dragId.current = id; setDragging(id) }
  const onDragOver  = (e, id) => { e.preventDefault(); dragOverId.current = id }
  const onDrop      = (e) => {
    e.preventDefault()
    const from = dragId.current
    const to   = dragOverId.current
    if (!from || !to || from === to) return
    const next = [...pinnedSections]
    const fi = next.indexOf(from), ti = next.indexOf(to)
    if (fi === -1 || ti === -1) return
    next.splice(fi, 1)
    next.splice(ti, 0, from)
    onChange('pins', { ...pins, sections: next })
    dragId.current = null; dragOverId.current = null; setDragging(null)
  }
  const onDragEnd = () => { dragId.current = null; dragOverId.current = null; setDragging(null) }

  // Skills card gets a virtual id for drag
  const SKILLS_ID = '__skills__'
  const allIds = hasPinnedSkills ? [SKILLS_ID, ...pinnedSections] : pinnedSections

  const isEmpty = pinnedSections.length === 0 && !hasPinnedSkills

  if (isEmpty) {
    return (
      <div className="card text-center py-16">
        <div className="text-5xl mb-4">📌</div>
        <h2 className="font-bold text-xl mb-2" style={{ color: 'var(--accent)', fontFamily: 'Georgia,serif' }}>Dashboard Empty</h2>
        <p className="text-sm mb-1" style={{ color: 'var(--text-dim)' }}>Pin sections using the 📌 icon on any card header across all tabs.</p>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Pin individual skills from the Skills tab.</p>
        <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>Drag cards to reorder them once pinned.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
      {hasPinnedSkills && (
        <WidgetCard
          id={SKILLS_ID} label="Pinned Skills" icon="🎯"
          onUnpin={() => {}}
          isDragging={dragging === SKILLS_ID}
          onDragStart={() => onDragStart(SKILLS_ID)}
          onDragOver={e => onDragOver(e, SKILLS_ID)}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
        >
          <PinnedSkillsWidget character={character} onUnpin={unpinSkill} />
          <div className="mt-2 pt-2 flex justify-end" style={{ borderTop: '1px solid var(--bg-border)' }}>
            <button
              onClick={() => onChange('pins', { ...pins, skills: [] })}
              className="text-xs px-2 py-0.5 rounded"
              style={{ color: 'var(--text-faint)', border: '1px solid var(--bg-border)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
            >unpin all skills</button>
          </div>
        </WidgetCard>
      )}

      {pinnedSections.map(id => {
        const info = SECTION_LABELS[id]
        if (!info) return null
        return (
          <WidgetCard
            key={id} id={id} label={info.label} icon={info.icon}
            onUnpin={unpin}
            isDragging={dragging === id}
            onDragStart={() => onDragStart(id)}
            onDragOver={e => onDragOver(e, id)}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
          >
            {renderWidget(id, character, onChange)}
          </WidgetCard>
        )
      })}
    </div>
  )
}
