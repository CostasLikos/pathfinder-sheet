import { useState, useMemo } from 'react'
import { abilityMod, formatMod } from '../../data/pf1eData'
import PinButton from '../PinButton'
import ALL_SPELLS from '../../data/spells.json'

const DAMAGE_TYPES = ['B', 'P', 'S', 'B&P', 'B&S', 'P&S', 'Fire', 'Cold', 'Electric', 'Acid', 'Force', 'Other']
const CRIT_RANGES = ['20', '19-20', '18-20', '17-20']
const CRIT_MULTS = ['×2', '×3', '×4']
const ATTACK_TYPES = ['Melee', 'Ranged', 'CMB']

const emptyWeapon = () => ({
  id: crypto.randomUUID(),
  name: '',
  attackType: 'Melee',
  ability: 'str',       // ability used for attack roll
  dmgAbility: 'str',    // ability used for damage
  attackMisc: 0,        // misc attack bonus (enchantment, feats, etc.)
  dmgDice: '1d6',
  dmgMisc: 0,           // misc damage bonus
  critRange: '20',
  critMult: '×2',
  damageType: 'S',
  notes: '',
  // Temp buffs (reset-able)
  tempAttack: 0,
  tempDamage: 0,
})

function DiceRoller({ result, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-pf-surface border-2 border-pf-gold rounded-xl p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-gray-400 text-sm mb-2">{result.label}</div>
        <div className="text-6xl font-bold text-white mb-2">{result.total}</div>
        {result.breakdown && <div className="text-gray-400 text-sm">{result.breakdown}</div>}
        {result.nat20 && <div className="text-yellow-400 font-bold mt-2">⚡ Natural 20!</div>}
        {result.nat1  && <div className="text-red-400 font-bold mt-2">💀 Natural 1!</div>}
        <button onClick={onClose} className="mt-4 btn-secondary text-sm px-6">Close</button>
      </div>
    </div>
  )
}

function rollDice(expr) {
  // e.g. "2d6", "1d8", "1d4"
  const match = expr.match(/^(\d+)d(\d+)$/)
  if (!match) return { rolls: [], total: 0 }
  const count = parseInt(match[1])
  const sides = parseInt(match[2])
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) }
}

function WeaponCard({ weapon, bab, abilities, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const [rollResult, setRollResult] = useState(null)

  const strMod = abilityMod(abilities.str ?? 10)
  const dexMod = abilityMod(abilities.dex ?? 10)

  const abilityModForAttack = abilityMod(abilities[weapon.ability] ?? 10)
  const abilityModForDmg   = abilityMod(abilities[weapon.dmgAbility] ?? 10)

  // Build attack bonus string (BAB + ability + misc + temp)
  const baseAttackBonus = (bab ?? 0) + abilityModForAttack + (weapon.attackMisc ?? 0) + (weapon.tempAttack ?? 0)

  // Generate all attacks from BAB (every 5 points = extra attack at -5)
  const attackBonuses = []
  let current = baseAttackBonus
  const babVal = bab ?? 0
  attackBonuses.push(current)
  if (babVal >= 6)  attackBonuses.push(current - 5)
  if (babVal >= 11) attackBonuses.push(current - 10)
  if (babVal >= 16) attackBonuses.push(current - 15)

  const totalDmgBonus = abilityModForDmg + (weapon.dmgMisc ?? 0) + (weapon.tempDamage ?? 0)

  const rollAttack = (bonus) => {
    const d20 = Math.floor(Math.random() * 20) + 1
    const total = d20 + bonus
    setRollResult({
      label: `${weapon.name || 'Attack'} — Attack Roll`,
      total,
      breakdown: `d20(${d20}) ${formatMod(bonus)}`,
      nat20: d20 === 20,
      nat1: d20 === 1,
    })
  }

  const rollDamage = () => {
    const { rolls, total: diceTotal } = rollDice(weapon.dmgDice || '1d6')
    const total = diceTotal + totalDmgBonus
    setRollResult({
      label: `${weapon.name || 'Attack'} — Damage Roll`,
      total,
      breakdown: `${weapon.dmgDice}(${rolls.join('+')}) ${formatMod(totalDmgBonus)}`,
    })
  }

  const field = (label, key, type = 'text', opts = null) => (
    <div className="flex flex-col gap-0.5">
      <label className="text-gray-500 text-xs">{label}</label>
      {opts ? (
        <select value={weapon[key] ?? ''} onChange={e => onUpdate(key, e.target.value)} className="input-field text-xs py-1">
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={weapon[key] ?? ''}
          onChange={e => onUpdate(key, type === 'number' ? Number(e.target.value) : e.target.value)}
          className="input-field text-xs py-1"
        />
      )}
    </div>
  )

  return (
    <div className="bg-pf-darker border border-pf-border rounded-lg overflow-hidden">
      {rollResult && <DiceRoller result={rollResult} onClose={() => setRollResult(null)} />}

      {/* Main Row */}
      <div className="flex items-center gap-3 p-3">
        {/* Weapon Name */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={weapon.name}
            onChange={e => onUpdate('name', e.target.value)}
            placeholder="Weapon name..."
            className="bg-transparent text-white font-semibold text-sm focus:outline-none w-full border-b border-transparent focus:border-pf-gold"
          />
          <div className="text-gray-500 text-xs mt-0.5">
            {weapon.attackType} • {weapon.dmgDice} • {weapon.damageType} • Crit {weapon.critRange}/{weapon.critMult}
          </div>
        </div>

        {/* Attack Buttons */}
        <div className="flex flex-col gap-1">
          <div className="text-gray-400 text-xs text-center">Attack</div>
          <div className="flex gap-1">
            {attackBonuses.map((bonus, i) => (
              <button
                key={i}
                onClick={() => rollAttack(bonus)}
                className="bg-pf-red hover:bg-red-700 text-white text-xs font-bold rounded px-2 py-1 border border-red-800 transition-colors min-w-[40px]"
                title={`Click to roll attack ${i + 1}`}
              >
                {formatMod(bonus)}
              </button>
            ))}
          </div>
        </div>

        {/* Damage Button */}
        <div className="flex flex-col gap-1">
          <div className="text-gray-400 text-xs text-center">Damage</div>
          <button
            onClick={rollDamage}
            className="bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold rounded px-3 py-1 border border-amber-700 transition-colors"
            title="Click to roll damage"
          >
            {weapon.dmgDice}{totalDmgBonus !== 0 ? formatMod(totalDmgBonus) : ''}
          </button>
        </div>

        {/* Temp Buffs */}
        <div className="flex flex-col gap-1 items-center">
          <div className="text-yellow-500 text-xs">Buff</div>
          <div className="flex gap-1">
            <div className="flex flex-col items-center">
              <input
                type="number"
                value={weapon.tempAttack ?? 0}
                onChange={e => onUpdate('tempAttack', Number(e.target.value))}
                className="w-10 text-center bg-pf-surface border border-yellow-700 rounded text-yellow-400 text-xs focus:outline-none py-1"
                title="Temporary attack bonus (buff, spell, etc.)"
              />
              <span className="text-gray-600 text-xs">atk</span>
            </div>
            <div className="flex flex-col items-center">
              <input
                type="number"
                value={weapon.tempDamage ?? 0}
                onChange={e => onUpdate('tempDamage', Number(e.target.value))}
                className="w-10 text-center bg-pf-surface border border-yellow-700 rounded text-yellow-400 text-xs focus:outline-none py-1"
                title="Temporary damage bonus (buff, spell, etc.)"
              />
              <span className="text-gray-600 text-xs">dmg</span>
            </div>
          </div>
        </div>

        {/* Expand / Delete */}
        <div className="flex flex-col gap-1">
          <button onClick={() => setExpanded(x => !x)} className="text-gray-400 hover:text-white text-xs px-2 py-1 border border-pf-border rounded transition-colors">
            {expanded ? '▲' : '▼'}
          </button>
          <button onClick={onRemove} className="text-red-500 hover:text-red-400 text-xs px-2 py-1 border border-pf-border rounded transition-colors">✕</button>
        </div>
      </div>

      {/* Breakdown Bar */}
      <div className="px-3 pb-2 flex gap-4 text-xs text-gray-500 border-t border-pf-border/30 pt-2">
        <span>BAB {formatMod(bab ?? 0)}</span>
        <span>+ {weapon.ability.toUpperCase()} {formatMod(abilityModForAttack)}</span>
        {weapon.attackMisc !== 0 && <span>+ Misc {formatMod(weapon.attackMisc)}</span>}
        {weapon.tempAttack !== 0 && <span className="text-yellow-500">+ Buff {formatMod(weapon.tempAttack)}</span>}
        <span className="text-pf-border">|</span>
        <span>Dmg {weapon.dmgAbility.toUpperCase()} {formatMod(abilityModForDmg)}</span>
        {weapon.dmgMisc !== 0 && <span>+ Misc {formatMod(weapon.dmgMisc)}</span>}
        {weapon.tempDamage !== 0 && <span className="text-yellow-500">+ Buff {formatMod(weapon.tempDamage)}</span>}
      </div>

      {/* Expanded Edit Panel */}
      {expanded && (
        <div className="border-t border-pf-border bg-pf-surface p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          {field('Weapon Name', 'name')}
          {field('Attack Type', 'attackType', 'text', ATTACK_TYPES)}
          {field('Attack Ability', 'ability', 'text', ['str', 'dex', 'int', 'wis', 'cha'])}
          {field('Damage Ability', 'dmgAbility', 'text', ['str', 'dex', 'int', 'wis', 'cha', 'none'])}
          {field('Damage Dice', 'dmgDice')}
          {field('Damage Type', 'damageType', 'text', DAMAGE_TYPES)}
          {field('Crit Range', 'critRange', 'text', CRIT_RANGES)}
          {field('Crit Mult', 'critMult', 'text', CRIT_MULTS)}
          {field('Attack Misc Bonus', 'attackMisc', 'number')}
          {field('Damage Misc Bonus', 'dmgMisc', 'number')}
          <div className="col-span-2">
            {field('Notes', 'notes')}
          </div>
        </div>
      )}
    </div>
  )
}

// ── helpers to extract damage & attack type from description ──
function extractDamage(desc = '') {
  const m = desc.match(/(\d+d\d+(?:\+\d+)?(?:\s*(?:points?|damage))?(?:\s+(?:of\s+)?[\w\s]+damage)?)/i)
  return m ? m[1].replace(/points? of /i, '').replace(/points? /i, '').trim() : null
}

function scaledDamage(desc = '', casterLevel = 1) {
  // "Xd6 per caster level (max Yd6)" — e.g. Fireball
  let m = desc.match(/(\d+)d(\d+)[^.(]*per\s+caster\s+level[^(]*\(max\.?\s+(\d+)d\d+\)/i)
  if (m) {
    const count = Math.min(casterLevel * parseInt(m[1]), parseInt(m[3]))
    return { dmg: `${count}d${m[2]}`, scaled: true }
  }
  // "Xd6 per caster level" no max
  m = desc.match(/(\d+)d(\d+)[^.]*per\s+caster\s+level/i)
  if (m) return { dmg: `${casterLevel * parseInt(m[1])}d${m[2]}`, scaled: true }

  // "Xd6 per two caster levels"
  m = desc.match(/(\d+)d(\d+)[^.]*per\s+two\s+caster\s+levels?/i)
  if (m) return { dmg: `${Math.max(1, Math.floor(casterLevel / 2)) * parseInt(m[1])}d${m[2]}`, scaled: true }

  // "Xd6 per N caster levels"
  m = desc.match(/(\d+)d(\d+)[^.]*per\s+(\d+)\s+caster\s+levels?/i)
  if (m) return { dmg: `${Math.max(1, Math.floor(casterLevel / parseInt(m[3]))) * parseInt(m[1])}d${m[2]}`, scaled: true }

  // fixed
  const fixed = extractDamage(desc)
  return fixed ? { dmg: fixed, scaled: false } : null
}
function hasAttackRoll(desc = '') {
  return /attack roll|ranged touch|melee touch|touch attack/i.test(desc)
}
function attackKind(desc = '') {
  if (/ranged touch/i.test(desc)) return 'Ranged Touch'
  if (/melee touch/i.test(desc)) return 'Melee Touch'
  if (/touch attack/i.test(desc)) return 'Touch'
  if (/attack roll/i.test(desc)) return 'Attack Roll'
  return null
}

// normalize class name for matching spell_level field
function normalizeClass(cls = '') {
  const c = cls.toLowerCase().trim()
  const map = {
    'wizard': 'sorcerer/wizard', 'sorcerer': 'sorcerer/wizard',
    'witch': 'witch', 'magus': 'magus', 'bard': 'bard', 'skald': 'skald',
    'cleric': 'cleric/oracle', 'oracle': 'cleric/oracle', 'druid': 'druid',
    'paladin': 'paladin', 'ranger': 'ranger', 'inquisitor': 'inquisitor',
    'alchemist': 'alchemist', 'summoner': 'summoner', 'shaman': 'shaman',
    'warpriest': 'warpriest', 'bloodrager': 'bloodrager', 'hunter': 'hunter',
  }
  return map[c] || c
}

function getSpellLevel(spell, classKey) {
  if (!spell.spell_level) return null
  // spell_level format: "sorcerer/wizard 2, magus 3"
  for (const part of spell.spell_level.split(',')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(classKey)) {
      const lvl = parseInt(trimmed.replace(classKey, '').trim())
      return isNaN(lvl) ? null : lvl
    }
  }
  return null
}

function SpellAttacksPanel({ character, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [rollResult, setRollResult] = useState(null)
  const [expandedSpell, setExpandedSpell] = useState(null)
  const [tab, setTab] = useState('session') // 'session' | 'all'

  const sessionSpells = character.sessionSpells ?? []
  const addToSession   = (name) => { if (!sessionSpells.includes(name)) onChange('sessionSpells', [...sessionSpells, name]) }
  const removeFromSession = (name) => onChange('sessionSpells', sessionSpells.filter(n => n !== name))
  const inSession      = (name) => sessionSpells.includes(name)

  const castingClass = character.spellcasting?.class || ''
  const classKey = normalizeClass(castingClass)
  const casterLevel = character.level || 1

  // casting stat modifier
  const CAST_STAT = {
    'sorcerer/wizard': 'int', 'witch': 'int', 'magus': 'int', 'alchemist': 'int',
    'cleric/oracle': 'wis', 'druid': 'wis', 'ranger': 'wis', 'paladin': 'wis',
    'inquisitor': 'wis', 'warpriest': 'wis', 'shaman': 'wis', 'hunter': 'wis',
    'bard': 'cha', 'skald': 'cha', 'summoner': 'cha', 'bloodrager': 'cha',
  }
  const castStat = CAST_STAT[classKey] || 'int'
  const castMod  = abilityMod(character.abilities?.[castStat] ?? 10)
  const spellAtk = (character.bab ?? 0) + castMod   // touch attack bonus
  const spellDC  = 10 + castMod                      // base DC (no level yet, shown per spell)

  const spells = useMemo(() => {
    if (!classKey) return []
    return ALL_SPELLS
      .filter(s => {
        const lvl = getSpellLevel(s, classKey)
        if (lvl === null) return false
        if (!hasAttackRoll(s.description) && !scaledDamage(s.description, casterLevel)) return false
        return true
      })
      .map(s => ({ ...s, _level: getSpellLevel(s, classKey) }))
      .sort((a, b) => a._level - b._level || a.name.localeCompare(b.name))
  }, [classKey, casterLevel])

  const filtered = useMemo(() => {
    if (!search.trim()) return spells
    const q = search.toLowerCase()
    return spells.filter(s => s.name.toLowerCase().includes(q) || s.school?.toLowerCase().includes(q))
  }, [spells, search])

  if (!castingClass) return null

  const rollSpellAttack = (spell) => {
    const d20 = Math.floor(Math.random() * 20) + 1
    const kind = attackKind(spell.description)
    const total = d20 + spellAtk
    setRollResult({
      label: `${spell.name} — ${kind}`,
      total,
      breakdown: `d20(${d20}) ${formatMod(spellAtk)} (BAB+${castStat.toUpperCase()})`,
      nat20: d20 === 20, nat1: d20 === 1,
    })
  }

  return (
    <div className="card mt-3">
      {rollResult && <DiceRoller result={rollResult} onClose={() => setRollResult(null)} />}
      <button
        className="flex items-center justify-between w-full"
        onClick={() => setOpen(o => !o)}
      >
        <h2 className="section-title mb-0">✨ Spell Attacks <span className="text-xs font-normal ml-2" style={{ color: 'var(--text-dim)' }}>({castingClass} — {spells.length} spells)</span></h2>
        <span style={{ color: 'var(--accent)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {/* stat line */}
          <div className="flex gap-4 text-xs px-1 mb-2 flex-wrap" style={{ color: 'var(--text-dim)' }}>
            <span>Touch Atk <strong style={{ color: 'var(--accent)' }}>{formatMod(spellAtk)}</strong></span>
            <span>Base DC <strong style={{ color: 'var(--accent)' }}>{spellDC} + spell lvl</strong></span>
            <span>{castStat.toUpperCase()} mod <strong style={{ color: 'var(--accent)' }}>{formatMod(castMod)}</strong></span>
            <span>CL <strong style={{ color: 'var(--accent)' }}>{casterLevel}</strong></span>
          </div>

          {/* tabs */}
          <div className="flex gap-1 mb-2">
            {[['session', `📋 Session (${sessionSpells.length})`], ['all', '📖 All Spells']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className="text-xs px-3 py-1 rounded transition-colors"
                style={{
                  backgroundColor: tab === id ? 'var(--accent-dim)' : 'var(--bg-darker)',
                  color: tab === id ? 'var(--accent)' : 'var(--text-dim)',
                  border: `1px solid ${tab === id ? 'var(--accent)' : 'var(--bg-border)'}`,
                }}
              >{label}</button>
            ))}
          </div>

          {/* search (all tab only) */}
          {tab === 'all' && (
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search spells..." className="input-field text-xs py-1 w-full mb-2" />
          )}

          {/* SESSION TAB */}
          {tab === 'session' && (
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {sessionSpells.length === 0 && (
                <p className="text-center text-xs py-6" style={{ color: 'var(--text-faint)' }}>
                  No spells saved yet. Go to "All Spells" and click ＋ to add them.
                </p>
              )}
              {sessionSpells.map(name => {
                const spell = spells.find(s => s.name === name)
                if (!spell) return null
                const dmgInfo = scaledDamage(spell.description, casterLevel)
                const kind    = attackKind(spell.description)
                const dc      = spellDC + spell._level
                const isOpen  = expandedSpell === spell.name
                return <SpellRow key={name} spell={spell} dmgInfo={dmgInfo} kind={kind} dc={dc}
                  isOpen={isOpen} spellAtk={spellAtk} casterLevel={casterLevel}
                  onRoll={() => rollSpellAttack(spell)}
                  onToggleExpand={() => setExpandedSpell(isOpen ? null : spell.name)}
                  onRemove={() => removeFromSession(name)}
                  inSession={true} spellDC={spellDC} />
              })}
            </div>
          )}

          {/* ALL SPELLS TAB */}
          {tab === 'all' && (
          <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
            {filtered.slice(0, 80).map(spell => {
              const dmgInfo = scaledDamage(spell.description, casterLevel)
              const kind    = attackKind(spell.description)
              const isOpen  = expandedSpell === spell.name
              const dc      = spellDC + spell._level
              return <SpellRow key={spell.name} spell={spell} dmgInfo={dmgInfo} kind={kind} dc={dc}
                isOpen={isOpen} spellAtk={spellAtk} casterLevel={casterLevel}
                onRoll={() => rollSpellAttack(spell)}
                onToggleExpand={() => setExpandedSpell(isOpen ? null : spell.name)}
                onAdd={() => addToSession(spell.name)}
                inSession={inSession(spell.name)} spellDC={spellDC} />
            })}
            {filtered.length === 0 && (
              <p className="text-center text-xs py-4" style={{ color: 'var(--text-faint)' }}>No offensive spells found for {castingClass}.</p>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  )
}

function SpellRow({ spell, dmgInfo, kind, dc, isOpen, spellAtk, casterLevel, onRoll, onToggleExpand, onAdd, onRemove, inSession }) {
  return (
    <div className="rounded overflow-hidden" style={{ backgroundColor: 'var(--bg-darker)', border: `1px solid ${inSession ? 'var(--accent-dim)' : 'var(--bg-border)'}` }}>
      <div className="flex items-center gap-2 px-3 py-2">
        {/* level badge */}
        <span className="text-xs font-bold rounded px-1.5 py-0.5 flex-shrink-0"
          style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', minWidth: '1.4rem', textAlign: 'center' }}>
          {spell._level}
        </span>

        {/* name + school */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{spell.name}</div>
          <div className="text-xs capitalize" style={{ color: 'var(--text-faint)' }}>{spell.school}</div>
        </div>

        {/* attack roll button */}
        {kind && (
          <button onClick={onRoll}
            className="text-xs font-bold rounded px-2 py-1 flex-shrink-0 transition-colors"
            style={{ backgroundColor: 'var(--danger)', color: 'var(--text)', border: '1px solid var(--bg-border)' }}
            title={`Roll ${kind}: ${formatMod(spellAtk)}`}>
            {kind.split(' ')[0]} {formatMod(spellAtk)}
          </button>
        )}

        {/* damage */}
        {dmgInfo && (
          <span className="text-xs font-bold flex-shrink-0 text-center"
            style={{ color: dmgInfo.scaled ? '#f59e0b' : 'var(--text-dim)', minWidth: '3.5rem' }}
            title={dmgInfo.scaled ? `Scales with CL ${casterLevel}` : 'Fixed damage'}>
            {dmgInfo.dmg.split(' ').slice(0,2).join(' ')}
            {dmgInfo.scaled && <span className="ml-0.5" style={{ color: 'var(--positive)', fontSize: '0.6rem' }}>↑</span>}
          </span>
        )}

        {/* DC */}
        {spell.saving_throw && spell.saving_throw !== 'none' && (
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-dim)' }}>
            DC <strong style={{ color: 'var(--accent)' }}>{dc}</strong>
          </span>
        )}

        {/* add / remove session */}
        {onAdd && !inSession && (
          <button onClick={onAdd} title="Add to session"
            className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 transition-colors"
            style={{ color: 'var(--positive)', border: '1px solid var(--bg-border)' }}>＋</button>
        )}
        {onRemove && (
          <button onClick={onRemove} title="Remove from session"
            className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 transition-colors"
            style={{ color: 'var(--danger)', border: '1px solid var(--bg-border)' }}>✕</button>
        )}

        {/* expand */}
        <button onClick={onToggleExpand}
          className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ color: 'var(--text-faint)', border: '1px solid var(--bg-border)' }}>
          {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {/* expanded detail */}
      {isOpen && (
        <div className="px-3 pb-3 pt-1 space-y-1 text-xs border-t" style={{ borderColor: 'var(--bg-border)', color: 'var(--text-dim)' }}>
          <div className="flex gap-4 flex-wrap mb-1">
            <span><strong style={{ color: 'var(--text)' }}>Cast:</strong> {spell.casting_time}</span>
            <span><strong style={{ color: 'var(--text)' }}>Range:</strong> {spell.range}</span>
            <span><strong style={{ color: 'var(--text)' }}>Duration:</strong> {spell.duration}</span>
            {spell.saving_throw && <span><strong style={{ color: 'var(--text)' }}>Save:</strong> {spell.saving_throw} DC {dc}</span>}
            {spell.components && <span><strong style={{ color: 'var(--text)' }}>Comp:</strong> {spell.components}</span>}
          </div>
          <p style={{ lineHeight: 1.6 }}>{spell.description?.slice(0, 400)}{spell.description?.length > 400 ? '…' : ''}</p>
        </div>
      )}
    </div>
  )
}

export default function Attacks({ character, onChange, pinned, onTogglePin }) {
  const { weapons = [], bab, abilities } = character

  const addWeapon = () => onChange('weapons', [...weapons, emptyWeapon()])

  const updateWeapon = (index, key, value) => {
    const updated = weapons.map((w, i) => i === index ? { ...w, [key]: value } : w)
    onChange('weapons', updated)
  }

  const removeWeapon = (index) => onChange('weapons', weapons.filter((_, i) => i !== index))

  const clearAllBuffs = () => {
    onChange('weapons', weapons.map(w => ({ ...w, tempAttack: 0, tempDamage: 0 })))
  }

  return (
  <>
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="section-title mb-0">Attacks & Weapons</h2>
          {onTogglePin && <PinButton pinned={pinned} onToggle={onTogglePin} />}
        </div>
        <div className="flex gap-2">
          {weapons.some(w => w.tempAttack !== 0 || w.tempDamage !== 0) && (
            <button onClick={clearAllBuffs} className="text-xs text-yellow-500 hover:text-yellow-400 border border-yellow-700 px-2 py-1 rounded transition-colors">
              Clear Buffs
            </button>
          )}
          <button onClick={addWeapon} className="btn-primary text-xs py-1 px-3">+ Add Weapon</button>
        </div>
      </div>

      {weapons.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">⚔️</div>
          <p className="text-sm">No weapons added yet.</p>
          <button onClick={addWeapon} className="mt-3 btn-secondary text-xs">Add First Weapon</button>
        </div>
      )}

      <div className="space-y-2">
        {weapons.map((weapon, i) => (
          <WeaponCard
            key={weapon.id}
            weapon={weapon}
            bab={bab}
            abilities={abilities}
            onUpdate={(key, value) => updateWeapon(i, key, value)}
            onRemove={() => removeWeapon(i)}
          />
        ))}
      </div>

      {weapons.length > 0 && (
        <div className="mt-3 text-xs text-gray-500 border-t border-pf-border pt-3">
          💡 Click attack/damage buttons to roll. Use Buff fields for temporary bonuses (spells, Power Attack, etc). Click ▼ to edit weapon details.
        </div>
      )}
    </div>

    <SpellAttacksPanel character={character} onChange={onChange} />
  </>
  )
}
