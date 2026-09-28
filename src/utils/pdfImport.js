import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

/**
 * Extract all AcroForm field values from a fillable PDF.
 */
export async function extractPdfFields(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const fields = {}
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const annotations = await page.getAnnotations()
    for (const ann of annotations) {
      if (ann.fieldName && !(ann.fieldName in fields)) {
        const v = ann.fieldValue ?? ''
        fields[ann.fieldName] = v
      }
    }
  }
  return fields
}

// ── helpers ──────────────────────────────────────────────────────────────────

const str = (v, fallback = '') => (v && String(v).trim() !== '-' ? String(v).trim() : fallback)

const num = (v, fallback = 0) => {
  if (v === undefined || v === null || String(v).trim() === '-') return fallback
  const n = parseInt(String(v).replace(/[^\d\-]/g, '').trim(), 10)
  return isNaN(n) ? fallback : n
}

// Parse "1d4 + 7" → { dice: '1d4', bonus: 7 }
const parseDmg = (s = '') => {
  const m = String(s).match(/(\d+d\d+)\s*([+\-]\s*\d+)?/)
  if (!m) return { dice: String(s).trim() || '1d6', bonus: 0 }
  const bonus = m[2] ? parseInt(m[2].replace(/\s/g, ''), 10) : 0
  return { dice: m[1], bonus: isNaN(bonus) ? 0 : bonus }
}

// Parse crit range "19-20" or "x2" mult
const parseCritRange = (s = '') => {
  if (!s) return '20'
  const m = String(s).match(/(\d+)-20/)
  return m ? `${m[1]}-20` : '20'
}
const parseCritMult = (s = '') => {
  if (!s) return '×2'
  const m = String(s).match(/x(\d)/)
  return m ? `×${m[1]}` : '×2'
}

// "ClassName 5" → { className, level }
const parseClassLevel = (s = '') => {
  const m = String(s).trim().match(/^(.+?)\s+(\d+)$/)
  return m ? { className: m[1].trim(), level: parseInt(m[2]) } : { className: s.trim(), level: 1 }
}

// Known spellcasting classes — used to avoid triggering SpellAttacksPanel scan
const CASTER_CLASSES = new Set([
  'wizard','sorcerer','witch','magus','bard','skald','cleric','oracle',
  'druid','paladin','ranger','inquisitor','alchemist','summoner','shaman',
  'warpriest','bloodrager','hunter','arcanist','occultist','spiritualist',
  'medium','mesmerist','psychic',
])

// Map skill PDF keys to app skill IDs
const SKILL_MAP = {
  'SK - Acro': 'acrobatics',
  'SK - Apra': 'appraise',
  'SK - Bluf': 'bluff',
  'SK - Clim': 'climb',
  'SK - Cra1': 'craftAlchemy',
  'SK - Dipl': 'diplomacy',
  'SK - Disa': 'disableDevice',
  'SK - Disg': 'disguise',
  'SK - Esca': 'escapeArtist',
  'SK - Fly':  'fly',
  'SK - Hand': 'handleAnimal',
  'SK - Heal': 'heal',
  'SK - Inti': 'intimidate',
  'SK - Kno1': 'knowledgePlanes',
  'SK - Kno2': 'knowledgeLocal',
  'SK - Kno3': 'knowledgeNobility',
  'SK - Kno4': 'knowledgeReligion',
  'SK - Ling': 'linguistics',
  'SK - Perc': 'perception',
  'SK - Perf': 'perform',
  'SK - Prof': 'profession',
  'SK - Ride': 'ride',
  'SK - Sens': 'senseMotive',
  'SK - Slei': 'sleightOfHand',
  'SK - Spel': 'spellcraft',
  'SK - Stea': 'stealth',
  'SK - Surv': 'survival',
  'SK - Swim': 'swim',
  'SK - Usem': 'useMagicDevice',
}

/**
 * Map extracted PDF fields to our character schema.
 * Targets the JamesTheBard / Dyslexic Studeos PF1e fillable PDF.
 */
export function mapFieldsToCharacter(f) {
  // ── Personal info ─────────────────────────────────────────────────────────
  const name      = str(f['PI - Character'])
  const race      = str(f['PI - Race'])
  const alignment = str(f['PI - Alignment'])
  const deity     = str(f['PI - Deity'])
  const gender    = str(f['PI - Gender'])
  const height    = str(f['PI - Height'])
  const weight    = str(f['PI - Weight'])
  const age       = str(f['PI - Age'])

  // ── Abilities ─────────────────────────────────────────────────────────────
  const abilities = {
    str: num(f['Strength - Total'],     num(f['Strength - Base'],  10)),
    dex: num(f['Dexterity - Total'],    num(f['Dexterity - Base'], 10)),
    con: num(f['Constitution - Total'], num(f['Constitution - Base'], 10)),
    int: num(f['Intelligence - Total'], num(f['Intelligence - Base'], 10)),
    wis: num(f['Wisdom - Total'],       num(f['Wisdom - Base'], 10)),
    cha: num(f['Charisma - Total'],     num(f['Charisma - Base'], 10)),
  }

  // ── HP ───────────────────────────────────────────────────────────────────
  const maxHp = num(f['Total HP'], 0)
  const hp = { max: maxHp, current: maxHp, nonlethal: 0 }

  // ── Saves ─────────────────────────────────────────────────────────────────
  // Use class base + misc. The total = base + ability + misc; ability is derived
  // from abilities above, so just store base + misc and let the formula run.
  const saves = {
    fort: { base: num(f['Class Fortitude Save']), misc: num(f['Fortitude Misc Mod']) },
    ref:  { base: num(f['Class Reflex Save']),    misc: num(f['Reflex Misc Mod']) },
    will: { base: num(f['Class Willpower Save']),  misc: num(f['Willpower Misc Mod']) },
  }

  // ── AC ───────────────────────────────────────────────────────────────────
  const ac = {
    armor:   num(f['AC - Armor Bonus']),
    shield:  num(f['AC - Shield Bonus']),
    natural: num(f['AC - Natural Bonus']),
    deflect: 0,
    misc:    num(f['AC - Dodge Bonus']),
  }

  // ── BAB / initiative / speed ─────────────────────────────────────────────
  const bab   = num(f['Total BAB'])
  const speed = num(f['EX - Run Speed'], 30)
  const initMisc = num(f['EX - Initiative'], 0) - Math.floor((abilities.dex - 10) / 2)

  // ── Classes ──────────────────────────────────────────────────────────────
  const classes = []
  for (let i = 1; i <= 4; i++) {
    const raw = f[`CR - Class ${i} Class`]
    if (!raw || !str(raw)) continue
    const { className, level: clsLevel } = parseClassLevel(str(raw))
    const explicitLevel = num(f[`CR - Class ${i} Levels`], 0)
    classes.push({
      id: crypto.randomUUID(),
      className,
      level: explicitLevel || clsLevel,
      isFavored: str(f['Favored Class']).toLowerCase() === className.toLowerCase(),
      favoredHP: 0,
      favoredSkill: 0,
    })
  }

  const totalLevel  = num(f['Total Levels'], Math.max(1, classes.reduce((s, c) => s + c.level, 0)))
  const primaryClass = classes[0]?.className ?? ''

  // ── Armor ─────────────────────────────────────────────────────────────────
  const armor = []
  for (let i = 1; i <= 3; i++) {
    const armorName = str(f[`AS - Armor ${i} - Name`])
    if (!armorName) continue
    armor.push({
      id: crypto.randomUUID(),
      name: armorName,
      acBonus: num(f[`AS - Armor ${i} - AC Bonus`]),
      maxDex: num(f[`AS - Armor ${i} - Max Dex`], null) || null,
      checkPenalty: num(f[`AS - Armor ${i} - Armor Penalty`]),
      spellFailure: parseInt(str(f[`AS - Armor ${i} - Spell Failure`])) || 0,
      equipped: true,
    })
  }

  const armorProps = {
    checkPenalty: num(f['Armor Penalty']),
    maxDex: num(f['Max Dexterity Bonus'], null) || null,
    spellFailure: 0,
  }

  // ── Weapons ───────────────────────────────────────────────────────────────
  const weapons = []
  for (let i = 1; i <= 5; i++) {
    const wName   = str(f[`WA - Weapon ${i} - Name`])
    const atkStr  = str(f[`WA - Weapon ${i} - Attack Modifiers`])
    const dmgStr  = str(f[`WA - Weapon ${i} - Damage`])
    if (!wName && !atkStr && !dmgStr) continue

    const { dice: dmgDice, bonus: dmgMisc } = parseDmg(dmgStr)
    const wType   = str(f[`WA - Weapon ${i} - Type`]) // "P/S"
    const wRange  = str(f[`WA - Weapon ${i} - Range`])
    const wCrit   = str(f[`WA - Weapon ${i} - Crit`])  // "x2"
    const wCritRng = str(f[`WA - Weapon ${i} - Range`]) // note: Range field holds crit range like 19-20

    // Determine if ranged from range note
    const isRanged = /ft\.|throw|ranged|bow|cross/i.test(str(f[`WA - Weapon ${i} - Ammo`]) + wRange)
    // Best attack ability: ranged → dex, melee → str
    const attackAbility = isRanged ? 'dex' : 'str'
    const abilityMod = Math.floor((abilities[attackAbility] - 10) / 2)
    // First number in attack string is total; subtract BAB+ability to get misc
    const firstAtk = (() => { const m = String(atkStr).match(/([+\-]?\d+)/); return m ? parseInt(m[1]) : 0 })()
    const attackMisc = firstAtk ? Math.max(-5, firstAtk - bab - abilityMod) : 0

    weapons.push({
      id: crypto.randomUUID(),
      name: wName || `Weapon ${i}`,
      attackType: isRanged ? 'Ranged' : 'Melee',
      ability: attackAbility,
      dmgAbility: attackAbility,
      attackMisc,
      dmgDice,
      dmgMisc,
      critRange: parseCritRange(wCritRng || atkStr),
      critMult:  parseCritMult(wCrit),
      damageType: str(wType).split('/')[0] || 'P',
      notes: str(f[`WA - Weapon ${i} - Ammo`]),
      tempAttack: 0,
      tempDamage: 0,
      activePresets: [],
      extraDice: [],
    })
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  const skills = {}
  for (const [pdfKey, skillId] of Object.entries(SKILL_MAP)) {
    const total  = f[`${pdfKey} - Total`]
    const ranks  = f[`${pdfKey} - Ranks`]
    if (total === undefined && ranks === undefined) continue
    const isClass = f[`${pdfKey} - IsClass`]
    skills[skillId] = {
      ranks: num(ranks),
      misc:  0,
      classSkill: isClass === '1' || isClass === 'Yes',
    }
  }
  // Knowledge skills with names
  for (let i = 1; i <= 6; i++) {
    const kName  = str(f[`SK - Kno${i} - Name`])
    const ranks  = f[`SK - Kno${i} - Ranks`]
    const isClass = f[`SK - Kno${i} - IsClass`]
    if (!kName && ranks === undefined) continue
    const skillId = `knowledge${kName ? kName.charAt(0).toUpperCase() + kName.slice(1) : i}`
    skills[skillId] = {
      ranks: num(ranks),
      misc:  0,
      classSkill: isClass === '1' || isClass === 'Yes',
    }
  }

  // ── Currency ─────────────────────────────────────────────────────────────
  const currency = {
    pp: num(f['WT - Currency - Platinum']),
    gp: num(f['WT - Currency - Gold']),
    sp: num(f['WT - Currency - Silver']),
    cp: num(f['WT - Currency - Copper']),
  }

  // ── Gear ─────────────────────────────────────────────────────────────────
  const gear = []
  for (let i = 1; i <= 40; i++) {
    const pad = String(i).padStart(2, '0')
    const itemName = str(f[`EQ - Line ${pad} - Item Name`])
    if (!itemName) continue
    gear.push({
      id: crypto.randomUUID(),
      name: itemName,
      qty:    num(f[`EQ - Line ${pad} - Quantity`], 1),
      weight: num(f[`EQ - Line ${pad} - Total Weight`], 0),
      notes: '',
    })
  }
  // Magic/misc items
  for (let i = 1; i <= 15; i++) {
    const pad = String(i).padStart(2, '0')
    const itemName = str(f[`MI - Item Name - Line ${pad}`])
    if (!itemName) continue
    const charges = str(f[`MI - Uses and Charges - Line ${pad}`])
    gear.push({
      id: crypto.randomUUID(),
      name: itemName + (charges ? ` (×${charges})` : ''),
      qty: 1, weight: 0, notes: 'magic item',
    })
  }
  // Wondrous items from WE- slots
  for (const slot of ['Head','Headband','Eyes','Neck','Shoulders','Chest','Torso','Body','Arms','Wrists','Ring - Left','Ring - Right','Belt','Feet','Throat']) {
    const val = str(f[`WE - ${slot}`])
    if (val) gear.push({ id: crypto.randomUUID(), name: `[${slot}] ${val}`, qty: 1, weight: 0, notes: 'worn item' })
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  const gather = (prefix, count, suffix = '') => {
    const lines = []
    for (let i = 1; i <= count; i++) {
      const pad = String(i).padStart(2, '0')
      const v = str(f[`${prefix}${pad}${suffix}`])
      if (v) lines.push(v)
    }
    return lines
  }

  const ffLines = [...gather('FF - Line ', 9, ''), ...gather('FF - Line 2', 14, '').map(s => s)]
  // Actually rebuild FF lines properly
  const ffAll = []
  for (let n = 101; n <= 115; n++) { const v = str(f[`FF - Line ${n}`]); if (v) ffAll.push(v) }
  for (let n = 201; n <= 215; n++) { const v = str(f[`FF - Line ${n}`]); if (v) ffAll.push(v) }

  const adNotes = []
  for (let i = 1; i <= 15; i++) { const v = str(f[`AD - Notes ${i}`]); if (v) adNotes.push(v) }

  const saLines = []
  for (let i = 1; i <= 10; i++) {
    const pad = String(i).padStart(2, '0')
    const v = str(f[`SA - Name - Line ${pad}`])
    if (v) saLines.push(v)
  }

  const noLines = []
  for (let i = 1; i <= 10; i++) {
    const pad = String(i).padStart(2, '0')
    const v = str(f[`NO - Line ${pad}`])
    if (v) noLines.push(v)
  }

  const fcSQ = []
  for (let i = 1; i <= 20; i++) {
    const pad = String(i).padStart(2, '0')
    const v = str(f[`FC - Special Qualities ${pad}`])
    if (v) fcSQ.push(v)
  }

  const noteParts = []
  if (adNotes.length) noteParts.push('Class Abilities:\n' + adNotes.join('\n'))
  if (ffAll.length)   noteParts.push('Feats & Features:\n' + ffAll.join('\n'))
  if (saLines.length) noteParts.push('Special Abilities:\n' + saLines.join('\n'))
  if (noLines.length) noteParts.push('Notes:\n' + noLines.join('\n'))
  if (fcSQ.length)    noteParts.push('Familiar:\n' + fcSQ.join('\n'))
  const notes = noteParts.join('\n\n')

  // extra fields for the Overview / bio section
  const bio = [
    gender && `Gender: ${gender}`,
    age && `Age: ${age}`,
    height && `Height: ${height}`,
    weight && `Weight: ${weight}`,
  ].filter(Boolean).join(' · ')

  // ── Spells ────────────────────────────────────────────────────────────────
  const sessionSpells = []
  for (let n = 100; n <= 175; n++) {
    const v = str(f[`SP - Name Desc - ${n}`])
    if (v) sessionSpells.push(v)
  }

  // ── Casting class (only if it's actually a spellcasting class) ───────────
  const castingClass = CASTER_CLASSES.has(primaryClass.toLowerCase()) ? primaryClass : ''

  return {
    name,
    playerName: '',
    race,
    class: primaryClass,
    level: totalLevel,
    classes,
    alignment,
    deity,
    homeland: bio, // store bio details in homeland field as a note
    portrait: null,
    abilities,
    hp,
    ac,
    bab,
    initiative: { misc: Math.max(0, initMisc) },
    speed,
    saves,
    weapons,
    skills,
    armor,
    armorProps,
    gear,
    notes,
    currency,
    sessionSpells,
    spellcasting: { class: castingClass, ability: 'int', concentration: 0, slots: {}, spells: [] },
    feats: [],
    traits: [],
    buffs: [],
    combatRound: 1,
    bardicPerformance: { used: 0, active: false, currentPerf: '', lingeringFeat: false, lingeringRounds: 0 },
    experience: 0,
    xpTrack: 'medium',
    conditions: [],
    initiativeCombatants: [],
    initiativeCurrent: null,
    pins: { sections: [], skills: [] },
    statBuffs: [],
    skillOrder: null,
  }
}
