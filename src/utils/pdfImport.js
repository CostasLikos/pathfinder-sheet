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
      if (ann.fieldName && ann.fieldValue !== undefined && ann.fieldValue !== '') {
        // Don't overwrite a value we already have (some fields repeat across pages)
        if (!(ann.fieldName in fields)) {
          fields[ann.fieldName] = ann.fieldValue
        }
      }
    }
  }
  return fields
}

// ── helpers ──────────────────────────────────────────────────────────────────

const num = (v, fallback = 0) => {
  if (v === undefined || v === null) return fallback
  const n = parseInt(String(v).replace(/[^0-9\-]/g, '').trim(), 10)
  return isNaN(n) ? fallback : n
}

// Parse "1d6+3" or "1d4 + 7" → { dice: '1d6', bonus: 3 }
const parseDmg = (str = '') => {
  const m = String(str).match(/(\d+d\d+)\s*([+-]\s*\d+)?/)
  if (!m) return { dice: str.trim() || '1d6', bonus: 0 }
  const dice = m[1]
  const bonus = m[2] ? parseInt(m[2].replace(/\s/g, ''), 10) : 0
  return { dice, bonus: isNaN(bonus) ? 0 : bonus }
}

// Parse first number from an attack modifier string like "+14, +9"
const parseFirstMod = (str = '') => {
  const m = String(str).match(/([+-]?\d+)/)
  return m ? parseInt(m[1], 10) : 0
}

// Parse "ClassName 3" → { className, level }
const parseClassLevel = (str = '') => {
  const m = String(str).trim().match(/^(.+?)\s+(\d+)$/)
  if (!m) return { className: str.trim(), level: 1 }
  return { className: m[1].trim(), level: parseInt(m[2], 10) }
}

/**
 * Map extracted PDF fields to our character schema.
 * This mapping targets the "Dyslexic Studeos" / standard PF1e fillable PDF layout.
 */
export function mapFieldsToCharacter(f) {
  // ── Abilities ────────────────────────────────────────────────────────────
  // Only Charisma Total is a named field in this template.
  // The FC- fields are Familiar/Companion stats, not the character's own.
  const abilities = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: num(f['Charisma - Total'], 10),
  }

  // ── HP ───────────────────────────────────────────────────────────────────
  const maxHp = num(f['Total HP'], 0)
  const hp = { max: maxHp, current: maxHp, nonlethal: 0 }

  // ── Saves ────────────────────────────────────────────────────────────────
  // Use class base + misc separately so formula still works once ability scores are set
  const saves = {
    fort: { base: num(f['Class Fortitude Save'] ?? f['Total Fort Save']), misc: num(f['Fortitude Misc Mod']) },
    ref:  { base: num(f['Class Reflex Save']    ?? f['Total Reflex Save']), misc: num(f['Reflex Misc Mod']) },
    will: { base: num(f['Class Willpower Save']  ?? f['Total Will Save']),  misc: num(f['Willpower Misc Mod']) },
  }

  // ── AC ───────────────────────────────────────────────────────────────────
  // Store total AC in misc so the display is correct; user can re-break it down later
  const totalAC = num(f['Total AC'], 10)
  const naturalBonus = num(f['AC - Natural Bonus'], 0)
  const ac = {
    armor:   0,
    shield:  0,
    natural: naturalBonus,
    deflect: 0,
    misc:    Math.max(0, totalAC - 10 - naturalBonus),
  }

  // ── BAB / Initiative / Speed ──────────────────────────────────────────────
  const bab = num(f['Total BAB'] ?? f['ATK - Melee - BAB'])
  const speed = num(f['FC - Speed'], 30) // FC - Speed = 40 in Noah's sheet

  // ── Classes ──────────────────────────────────────────────────────────────
  const classes = []
  for (let i = 2; i <= 4; i++) {
    const raw = f[`CR - Class ${i} Class`]
    if (raw && raw.trim()) {
      const { className, level } = parseClassLevel(raw)
      classes.push({
        id: crypto.randomUUID(),
        className,
        level,
        isFavored: false,
        favoredHP: 0,
        favoredSkill: 0,
      })
    }
  }
  // Also try Class 1 (often not filled in on this template, but try anyway)
  const cls1 = f['CR - Class 1 Class']
  if (cls1 && cls1.trim()) {
    const { className, level } = parseClassLevel(cls1)
    classes.unshift({ id: crypto.randomUUID(), className, level, isFavored: false, favoredHP: 0, favoredSkill: 0 })
  }

  const totalLevel = num(f['Total Levels'], classes.reduce((s, c) => s + c.level, 0) || 1)
  const primaryClass = classes[0]?.className ?? ''

  // ── Weapons ──────────────────────────────────────────────────────────────
  const weapons = []
  for (let i = 1; i <= 3; i++) {
    const name = f[`WA - Weapon ${i} - Name`]
    // Weapons 2+ may not have a name field in this template; skip if no data
    const atkStr = f[`WA - Weapon ${i} - Attack Modifiers`] ?? ''
    const dmgStr = f[`WA - Weapon ${i} - Damage`] ?? ''
    if (!name?.trim() && !atkStr?.trim() && !dmgStr?.trim()) continue

    const { dice: dmgDice, bonus: dmgMisc } = parseDmg(dmgStr)
    // attackMisc: use first modifier minus BAB as misc bonus
    // (PDF stores total attack like +14, we subtract BAB to get rough misc)
    const totalAtk = parseFirstMod(atkStr)
    const attackMisc = atkStr ? Math.max(0, totalAtk - bab) : 0

    weapons.push({
      id: crypto.randomUUID(),
      name: (name ?? `Weapon ${i}`).trim(),
      attackType: 'Melee',
      ability: 'str',
      dmgAbility: 'str',
      attackMisc,
      dmgDice,
      dmgMisc,
      critRange: '20',
      critMult: '×2',
      damageType: 'P',
      notes: '',
      tempAttack: 0,
      tempDamage: 0,
      activePresets: [],
      extraDice: [],
    })
  }

  // ── Skills ───────────────────────────────────────────────────────────────
  const skillKeyMap = {
    'SK - Apra': 'appraise',
    'SK - Bluf': 'bluff',
    'SK - Cra1': 'craftArmor',
    'SK - Disa': 'disableDevice',
    'SK - Dipl': 'diplomacy',
    'SK - Disg': 'disguise',
    'SK - Hand': 'handleAnimal',
    'SK - Inti': 'intimidate',
    'SK - Perc': 'perception',
    'SK - Perf': 'perform',
    'SK - Prof': 'profession',
    'SK - Spel': 'spellcraft',
    'SK - Stea': 'stealth',
    'SK - Usem': 'useMagicDevice',
  }
  const skills = {}
  for (const [pdfKey, skillId] of Object.entries(skillKeyMap)) {
    const ranks = f[`${pdfKey} - Ranks`]
    if (ranks !== undefined) {
      skills[skillId] = { ranks: num(ranks), misc: 0, classSkill: false }
    }
  }

  // ── Gear ─────────────────────────────────────────────────────────────────
  const gear = []
  for (let i = 1; i <= 35; i++) {
    const pad = String(i).padStart(2, '0')
    const itemName = f[`EQ - Line ${pad} - Item Name`]
    if (itemName?.trim()) {
      const wt = num(f[`EQ - Line ${pad} - Total Weight`], 0)
      gear.push({ id: crypto.randomUUID(), name: itemName.trim(), qty: 1, weight: wt, notes: '' })
    }
  }
  // Wondrous items from WE- fields
  for (const [slot, key] of Object.entries({
    Shoulders: 'WE - Shoulders', Throat: 'WE - Throat',
  })) {
    const val = f[key]
    if (val?.trim()) gear.push({ id: crypto.randomUUID(), name: `[${slot}] ${val.trim()}`, qty: 1, weight: 0, notes: '' })
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  const sqLines = Array.from({ length: 15 }, (_, i) => {
    const pad = String(i + 1).padStart(2, '0')
    return f[`FC - Special Qualities ${pad}`]
  }).filter(Boolean)

  const saLines = Array.from({ length: 5 }, (_, i) => {
    const pad = String(i + 1).padStart(2, '0')
    return f[`SA - Name - Line ${pad}`]
  }).filter(Boolean)

  const ffLines = [205, 211, 212, 213, 214, 107].map(n => f[`FF - Line ${n}`]).filter(Boolean)
  const noLines = Array.from({ length: 10 }, (_, i) => {
    const pad = String(i + 1).padStart(2, '0')
    return f[`NO - Line ${pad}`]
  }).filter(Boolean)

  const notesSections = []
  if (sqLines.length)  notesSections.push('Special Qualities:\n' + sqLines.join('\n'))
  if (saLines.length)  notesSections.push('Special Abilities:\n' + saLines.join('\n'))
  if (ffLines.length)  notesSections.push('Class Features:\n' + ffLines.join('\n'))
  if (noLines.length)  notesSections.push('Notes:\n' + noLines.join('\n'))
  const notes = notesSections.join('\n\n')

  // ── Spells ────────────────────────────────────────────────────────────────
  const spellNames = []
  for (let n = 100; n <= 120; n++) {
    const name = f[`SP - Name Desc - ${n}`]
    if (name?.trim()) spellNames.push(name.trim())
  }

  // Only set a casting class if it's a known spellcasting class — otherwise
  // SpellAttacksPanel will scan 2800+ spells on every render and freeze the tab.
  const KNOWN_CASTING_CLASSES = new Set([
    'wizard','sorcerer','witch','magus','bard','skald','cleric','oracle',
    'druid','paladin','ranger','inquisitor','alchemist','summoner','shaman',
    'warpriest','bloodrager','hunter','arcanist','occultist','spiritualist',
    'medium','mesmerist','psychic',
  ])
  const castingClass = KNOWN_CASTING_CLASSES.has(primaryClass.toLowerCase()) ? primaryClass : ''

  return {
    // Basic info — not present as named fields in this PDF template
    name: '',
    playerName: '',
    race: '',
    class: primaryClass,
    level: totalLevel,
    classes,
    alignment: '',
    deity: '',
    homeland: '',
    portrait: null,
    // Stats
    abilities,
    hp,
    ac,
    bab,
    initiative: { misc: 0 },
    speed,
    saves,
    weapons,
    skills,
    gear,
    notes,
    sessionSpells: spellNames,
    spellcasting: { class: castingClass, ability: 'int', concentration: 0, slots: {}, spells: [] },
    // Defaults
    feats: [],
    traits: [],
    armor: [],
    currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
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
    armorProps: { checkPenalty: 0, maxDex: null, spellFailure: 0 },
    skillOrder: null,
  }
}
