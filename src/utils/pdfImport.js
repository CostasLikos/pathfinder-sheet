import * as pdfjsLib from 'pdfjs-dist'

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

/**
 * Extract all AcroForm field values from a fillable PDF.
 * Returns { fieldName: value } for every field found.
 */
export async function extractPdfFields(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const fields = {}

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const annotations = await page.getAnnotations()
    for (const ann of annotations) {
      if (ann.fieldName && ann.fieldValue !== undefined) {
        fields[ann.fieldName] = ann.fieldValue
      }
    }
  }

  return fields
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const num = (v, fallback = 0) => {
  const n = parseInt(v, 10)
  return isNaN(n) ? fallback : n
}

// ── Field mapping ─────────────────────────────────────────────────────────────

/**
 * Map extracted PDF fields to our character schema.
 */
export function mapFieldsToCharacter(f) {
  // Abilities
  const abilities = {
    str: num(f['FC - Strength']),
    dex: num(f['FC - Dexterity']),
    con: num(f['FC - Constitution']),
    int: num(f['FC - Intelligence']),
    wis: num(f['FC - Wisdom']),
    cha: num(f['FC - Charisma']),
  }

  // HP
  const maxHp = num(f['Total HP'] ?? f['FC - Hit Points'])
  const hp = { max: maxHp, current: maxHp, nonlethal: 0 }

  // Saves
  const saves = {
    fort: { base: num(f['Total Fort Save'] ?? f['FC - Fortitude']), misc: 0 },
    ref:  { base: num(f['Total Reflex Save'] ?? f['FC - Reflex Save']), misc: 0 },
    will: { base: num(f['Total Will Save'] ?? f['FC - Willpower Save']), misc: 0 },
  }

  // AC
  const ac = {
    armor:   num(f['FC - Armor Class']),
    shield:  0,
    natural: num(f['AC - Natural Bonus']),
    deflect: 0,
    misc:    0,
  }

  // BAB
  const bab = num(f['Total BAB'] ?? f['ATK - Melee - BAB'])

  // Speed
  const speed = num(f['FC - Speed'], 30)

  // Weapons (up to 3)
  const weapons = []
  for (let i = 1; i <= 3; i++) {
    const name = f[`WA - Weapon ${i} - Name`]
    if (name && name.trim()) {
      const atkStr = f[`WA - Weapon ${i} - Attack Modifiers`] ?? ''
      const atkNum = num(atkStr.replace(/[^0-9\-+]/g, '').trim(), 0)
      weapons.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        ability: 'str',
        attackMisc: atkNum,
        dmgDice: f[`WA - Weapon ${i} - Damage`] ?? '',
        dmgType: '',
        tempAttack: 0,
        tempDamage: 0,
        critRange: 20,
        critMult: 2,
        notes: '',
      })
    }
  }

  // Skills — map the SK- prefix fields
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
    const total = num(f[`${pdfKey} - Total`], null)
    const ranks = num(f[`${pdfKey} - Ranks`], null)
    if (total !== null || ranks !== null) {
      skills[skillId] = { ranks: ranks ?? 0, misc: 0, classSkill: false }
    }
  }

  // Languages
  const languages = f['PI - Languages'] ?? ''

  // Character info
  const name    = f['PI - Name'] ?? f['Character Name'] ?? ''
  const race    = f['PI - Race'] ?? ''
  const classes = []

  // Try to get class info from the FC- or CR- fields
  const className = f['FC - Class'] ?? f['CR - Class 1'] ?? ''
  const level     = num(f['Total Levels'] ?? f['FC - Level'] ?? f['CR - Class 1 Levels'], 1)

  if (className) {
    classes.push({
      id: crypto.randomUUID(),
      className,
      level,
      isFavored: false,
      favoredHP: 0,
      favoredSkill: 0,
    })
  }

  // Notes / Special Qualities
  const sq = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
    .map(n => f[`FC - Special Qualities ${String(n).padStart(2,'0')}`])
    .filter(Boolean)
    .join('\n')

  const saLines = [1,2,3,4,5]
    .map(n => f[`SA - Name - Line ${String(n).padStart(2,'0')}`])
    .filter(Boolean)
    .join('\n')

  const notes = [sq, saLines].filter(Boolean).join('\n\n').trim()

  // Gear / Equipment
  const gear = []
  for (let i = 1; i <= 35; i++) {
    const pad = String(i).padStart(2, '0')
    const itemName = f[`EQ - Line ${pad} - Item Name`]
    if (itemName && itemName.trim()) {
      const wt = num(f[`EQ - Line ${pad} - Total Weight`], 0)
      gear.push({ id: crypto.randomUUID(), name: itemName.trim(), qty: 1, weight: wt, notes: '' })
    }
  }

  return {
    name,
    race,
    class: className,
    level,
    classes,
    abilities,
    hp,
    ac,
    bab,
    speed,
    saves,
    weapons,
    skills,
    gear,
    notes,
    // defaults for fields not in the PDF
    alignment: '',
    deity: '',
    homeland: '',
    portrait: null,
    initiative: { misc: 0 },
    feats: [],
    traits: [],
    armor: [],
    currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
    spellcasting: { class: '', ability: 'int', concentration: 0, slots: {}, spells: [] },
    buffs: [],
    combatRound: 1,
    bardicPerformance: { used: 0, active: false, currentPerf: '', lingeringFeat: false, lingeringRounds: 0 },
    experience: 0,
    xpTrack: 'medium',
    conditions: [],
    initiativeCombatants: [],
    initiativeCurrent: null,
    pins: { sections: [], skills: [] },
    sessionSpells: [],
    statBuffs: [],
    armorProps: { checkPenalty: 0, maxDex: null, spellFailure: 0 },
    playerName: '',
    skillOrder: null,
  }
}
