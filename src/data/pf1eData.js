export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export const ABILITY_NAMES = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
}

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
]

export const RACES = [
  'Dwarf', 'Elf', 'Gnome', 'Half-Elf', 'Half-Orc', 'Halfling', 'Human',
  'Aasimar', 'Tiefling', 'Goblin', 'Catfolk', 'Dhampir', 'Fetchling',
  'Ifrit', 'Oread', 'Sylph', 'Undine', 'Tengu', 'Ratfolk', 'Other',
]

export const CLASSES = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Gunslinger',
  'Inquisitor', 'Magus', 'Monk', 'Oracle', 'Paladin', 'Ranger',
  'Rogue', 'Shaman', 'Skald', 'Slayer', 'Sorcerer', 'Summoner',
  'Swashbuckler', 'Warpriest', 'Witch', 'Wizard', 'Other',
]

// bab: 'full'=1/lvl, 'mid'=3/4, 'half'=1/2
// fort/ref/will: 'good'=floor(lvl/2)+2, 'poor'=floor(lvl/3)
export const CLASS_DATA = {
  Barbarian:   { bab:'full', fort:'good', ref:'poor', will:'poor', hd:12, skillsPerLevel:4 },
  Bard:        { bab:'mid',  fort:'poor', ref:'good', will:'good', hd:8,  skillsPerLevel:6 },
  Cleric:      { bab:'mid',  fort:'good', ref:'poor', will:'good', hd:8,  skillsPerLevel:2 },
  Druid:       { bab:'mid',  fort:'good', ref:'poor', will:'good', hd:8,  skillsPerLevel:4 },
  Fighter:     { bab:'full', fort:'good', ref:'poor', will:'poor', hd:10, skillsPerLevel:2 },
  Gunslinger:  { bab:'full', fort:'good', ref:'good', will:'poor', hd:10, skillsPerLevel:4 },
  Inquisitor:  { bab:'mid',  fort:'good', ref:'poor', will:'good', hd:8,  skillsPerLevel:6 },
  Magus:       { bab:'mid',  fort:'good', ref:'poor', will:'good', hd:8,  skillsPerLevel:2 },
  Monk:        { bab:'mid',  fort:'good', ref:'good', will:'good', hd:8,  skillsPerLevel:4 },
  Oracle:      { bab:'mid',  fort:'poor', ref:'poor', will:'good', hd:8,  skillsPerLevel:4 },
  Paladin:     { bab:'full', fort:'good', ref:'poor', will:'good', hd:10, skillsPerLevel:2 },
  Ranger:      { bab:'full', fort:'good', ref:'good', will:'poor', hd:10, skillsPerLevel:6 },
  Rogue:       { bab:'mid',  fort:'poor', ref:'good', will:'poor', hd:8,  skillsPerLevel:8 },
  Shaman:      { bab:'mid',  fort:'poor', ref:'poor', will:'good', hd:8,  skillsPerLevel:4 },
  Skald:       { bab:'mid',  fort:'good', ref:'poor', will:'good', hd:8,  skillsPerLevel:4 },
  Slayer:      { bab:'mid',  fort:'good', ref:'good', will:'poor', hd:10, skillsPerLevel:6 },
  Sorcerer:    { bab:'half', fort:'poor', ref:'poor', will:'good', hd:6,  skillsPerLevel:2 },
  Summoner:    { bab:'mid',  fort:'poor', ref:'poor', will:'good', hd:8,  skillsPerLevel:2 },
  Swashbuckler:{ bab:'full', fort:'good', ref:'good', will:'poor', hd:10, skillsPerLevel:4 },
  Warpriest:   { bab:'mid',  fort:'good', ref:'poor', will:'good', hd:8,  skillsPerLevel:2 },
  Witch:       { bab:'half', fort:'poor', ref:'poor', will:'good', hd:6,  skillsPerLevel:2 },
  Wizard:      { bab:'half', fort:'poor', ref:'poor', will:'good', hd:6,  skillsPerLevel:2 },
  Other:       { bab:'full', fort:'good', ref:'good', will:'good', hd:8,  skillsPerLevel:4 },
}

const babValue = (prog, lvl) => prog === 'full' ? lvl : prog === 'mid' ? Math.floor(lvl*3/4) : Math.floor(lvl/2)
const saveGood = (lvl) => Math.floor(lvl/2) + 2
const savePoor = (lvl) => Math.floor(lvl/3)
const saveVal  = (type, lvl) => type === 'good' ? saveGood(lvl) : savePoor(lvl)

export function computeClassTotals(classes = []) {
  let totalLevel = 0, totalBAB = 0, totalFort = 0, totalRef = 0, totalWill = 0
  let totalFavoredHP = 0, totalFavoredSkill = 0, totalHD = 0, totalSkillsPerLevel = 0
  for (const c of classes) {
    const lvl  = c.level ?? 0
    const data = CLASS_DATA[c.className] ?? CLASS_DATA.Other
    totalLevel       += lvl
    totalBAB         += babValue(data.bab, lvl)
    totalFort        += saveVal(data.fort, lvl)
    totalRef         += saveVal(data.ref,  lvl)
    totalWill        += saveVal(data.will, lvl)
    totalFavoredHP   += c.favoredHP   ?? 0
    totalFavoredSkill+= c.favoredSkill ?? 0
    totalHD          += data.hd * lvl
    totalSkillsPerLevel += data.skillsPerLevel * lvl
  }
  return { totalLevel, totalBAB, totalFort, totalRef, totalWill, totalFavoredHP, totalFavoredSkill, totalHD, totalSkillsPerLevel }
}

export const SPELL_SCHOOLS = [
  'Abjuration','Conjuration','Divination','Enchantment',
  'Evocation','Illusion','Necromancy','Transmutation','Universal',
]

// Base skill list — craft/perform/profession have variants below
export const SKILLS = [
  { key: 'acrobatics',    name: 'Acrobatics',        ability: 'dex', trainedOnly: false },
  { key: 'appraise',      name: 'Appraise',           ability: 'int', trainedOnly: false },
  { key: 'bluff',         name: 'Bluff',              ability: 'cha', trainedOnly: false },
  { key: 'climb',         name: 'Climb',              ability: 'str', trainedOnly: false },
  { key: 'craft1',        name: 'Craft',              ability: 'int', trainedOnly: false, customizable: true, baseName: 'Craft' },
  { key: 'craft2',        name: 'Craft',              ability: 'int', trainedOnly: false, customizable: true, baseName: 'Craft' },
  { key: 'diplomacy',     name: 'Diplomacy',          ability: 'cha', trainedOnly: false },
  { key: 'disableDevice', name: 'Disable Device',     ability: 'dex', trainedOnly: true  },
  { key: 'disguise',      name: 'Disguise',           ability: 'cha', trainedOnly: false },
  { key: 'escapeArtist',  name: 'Escape Artist',      ability: 'dex', trainedOnly: false },
  { key: 'fly',           name: 'Fly',                ability: 'dex', trainedOnly: false },
  { key: 'handleAnimal',  name: 'Handle Animal',      ability: 'cha', trainedOnly: true  },
  { key: 'heal',          name: 'Heal',               ability: 'wis', trainedOnly: false },
  { key: 'intimidate',    name: 'Intimidate',         ability: 'cha', trainedOnly: false },
  { key: 'kArcana',       name: 'Knowledge (Arcana)', ability: 'int', trainedOnly: true  },
  { key: 'kDungeoneering',name: 'Knowledge (Dungeoneering)', ability: 'int', trainedOnly: true },
  { key: 'kEngineering',  name: 'Knowledge (Engineering)',   ability: 'int', trainedOnly: true },
  { key: 'kGeography',    name: 'Knowledge (Geography)',     ability: 'int', trainedOnly: true },
  { key: 'kHistory',      name: 'Knowledge (History)',       ability: 'int', trainedOnly: true },
  { key: 'kLocal',        name: 'Knowledge (Local)',         ability: 'int', trainedOnly: true },
  { key: 'kNature',       name: 'Knowledge (Nature)',        ability: 'int', trainedOnly: true },
  { key: 'kNobility',     name: 'Knowledge (Nobility)',      ability: 'int', trainedOnly: true },
  { key: 'kPlanes',       name: 'Knowledge (Planes)',        ability: 'int', trainedOnly: true },
  { key: 'kReligion',     name: 'Knowledge (Religion)',      ability: 'int', trainedOnly: true },
  { key: 'linguistics',   name: 'Linguistics',        ability: 'int', trainedOnly: true  },
  { key: 'perception',    name: 'Perception',         ability: 'wis', trainedOnly: false },
  { key: 'perform1',      name: 'Perform',            ability: 'cha', trainedOnly: false, customizable: true, baseName: 'Perform' },
  { key: 'profession1',   name: 'Profession',         ability: 'wis', trainedOnly: true,  customizable: true, baseName: 'Profession' },
  { key: 'ride',          name: 'Ride',               ability: 'dex', trainedOnly: false },
  { key: 'senseMotive',   name: 'Sense Motive',       ability: 'wis', trainedOnly: false },
  { key: 'sleightOfHand', name: 'Sleight of Hand',    ability: 'dex', trainedOnly: true  },
  { key: 'spellcraft',    name: 'Spellcraft',         ability: 'int', trainedOnly: true  },
  { key: 'stealth',       name: 'Stealth',            ability: 'dex', trainedOnly: false },
  { key: 'survival',      name: 'Survival',           ability: 'wis', trainedOnly: false },
  { key: 'swim',          name: 'Swim',               ability: 'str', trainedOnly: false },
  { key: 'useMagicDevice',name: 'Use Magic Device',   ability: 'cha', trainedOnly: true  },
  // Blank custom skills
  { key: 'custom1', name: 'Custom Skill', ability: 'str', trainedOnly: false, custom: true },
  { key: 'custom2', name: 'Custom Skill', ability: 'str', trainedOnly: false, custom: true },
  { key: 'custom3', name: 'Custom Skill', ability: 'str', trainedOnly: false, custom: true },
]

export const DEFAULT_SKILL_ORDER = SKILLS.map(s => s.key)

export const abilityMod = (score) => Math.floor((score - 10) / 2)
export const formatMod  = (mod)   => mod >= 0 ? `+${mod}` : `${mod}`

// ─── PF1e Conditions ──────────────────────────────────────────────────────────
// mods: applied automatically to character stats when the condition is active
// effect: human-readable summary (includes effects we can't auto-apply)
export const CONDITIONS = [
  { id: 'blinded',     label: 'Blinded',     icon: '👁️', color: '#94a3b8',
    effect: '−2 AC, lose Dex to AC, −4 Perception, 50% miss chance',
    mods: { ac: -2 } },
  { id: 'confused',    label: 'Confused',    icon: '💫', color: '#a78bfa',
    effect: 'Random actions each round (d100)',
    mods: {} },
  { id: 'cowering',    label: 'Cowering',    icon: '😨', color: '#f87171',
    effect: '−2 AC, lose Dex to AC, can take no actions',
    mods: { ac: -2 } },
  { id: 'dazed',       label: 'Dazed',       icon: '😵', color: '#94a3b8',
    effect: 'Can take no actions, lose Dex to AC',
    mods: {} },
  { id: 'dazzled',     label: 'Dazzled',     icon: '✨', color: '#fbbf24',
    effect: '−1 attack rolls, −1 Perception checks',
    mods: { attackRoll: -1 } },
  { id: 'deafened',    label: 'Deafened',    icon: '🔇', color: '#94a3b8',
    effect: '−4 initiative, 20% spell failure, −4 Perception',
    mods: { initiative: -4 } },
  { id: 'entangled',   label: 'Entangled',   icon: '🕸️', color: '#86efac',
    effect: '−2 attack, −4 Dex, can\'t run/charge, concentration +10 DC',
    mods: { attackRoll: -2, dex: -4 } },
  { id: 'exhausted',   label: 'Exhausted',   icon: '😴', color: '#f87171',
    effect: '−6 STR, −6 DEX, half speed',
    mods: { str: -6, dex: -6 } },
  { id: 'fascinated',  label: 'Fascinated',  icon: '👀', color: '#a78bfa',
    effect: 'Stands quietly, −4 Perception vs other threats, no actions',
    mods: {} },
  { id: 'fatigued',    label: 'Fatigued',    icon: '😓', color: '#fbbf24',
    effect: '−2 STR, −2 DEX, can\'t run or charge',
    mods: { str: -2, dex: -2 } },
  { id: 'flat-footed', label: 'Flat-Footed', icon: '🦶', color: '#94a3b8',
    effect: 'Loses Dex to AC, can\'t make attacks of opportunity',
    mods: {} },
  { id: 'frightened',  label: 'Frightened',  icon: '😱', color: '#fb923c',
    effect: '−2 attack/saves/skills, must flee source of fear',
    mods: { attackRoll: -2, fort: -2, ref: -2, will: -2 } },
  { id: 'grappled',    label: 'Grappled',    icon: '🤼', color: '#fb923c',
    effect: '−4 Dex, −2 attack/CMB, concentration +10 DC, can\'t move',
    mods: { attackRoll: -2, dex: -4, cmb: -2 } },
  { id: 'invisible',   label: 'Invisible',   icon: '👻', color: '#e2e8f0',
    effect: '+2 attack, opponents lose Dex to AC against you',
    mods: { attackRoll: 2 } },
  { id: 'nauseated',   label: 'Nauseated',   icon: '🤢', color: '#86efac',
    effect: 'Only move action per round, no attacking or casting',
    mods: {} },
  { id: 'panicked',    label: 'Panicked',    icon: '🏃', color: '#f87171',
    effect: '−2 saves, must flee; can\'t cast, attack, or use skills',
    mods: { fort: -2, ref: -2, will: -2 } },
  { id: 'paralyzed',   label: 'Paralyzed',   icon: '🧊', color: '#60a5fa',
    effect: 'STR/DEX treated as 0, considered helpless',
    mods: { str: -10, dex: -10 } },
  { id: 'petrified',   label: 'Petrified',   icon: '🗿', color: '#94a3b8',
    effect: 'Turned to stone, unconscious',
    mods: {} },
  { id: 'pinned',      label: 'Pinned',      icon: '📌', color: '#f87171',
    effect: 'Immobile, −4 AC, lose Dex to AC, only verbal/mental actions',
    mods: { ac: -4 } },
  { id: 'prone',       label: 'Prone',       icon: '⬇️', color: '#fbbf24',
    effect: '+4 AC vs ranged, −4 AC vs melee, −4 melee attack',
    mods: { attackRoll: -4 } },
  { id: 'shaken',      label: 'Shaken',      icon: '😬', color: '#fb923c',
    effect: '−2 attack, saves, skill checks, and ability checks',
    mods: { attackRoll: -2, fort: -2, ref: -2, will: -2 } },
  { id: 'sickened',    label: 'Sickened',    icon: '🤒', color: '#86efac',
    effect: '−2 attack/damage/saves/skill/ability checks',
    mods: { attackRoll: -2, damage: -2, fort: -2, ref: -2, will: -2 } },
  { id: 'staggered',   label: 'Staggered',   icon: '💢', color: '#fbbf24',
    effect: 'One standard OR move action per round (not both)',
    mods: {} },
  { id: 'stunned',     label: 'Stunned',     icon: '⚡', color: '#fb923c',
    effect: '−2 AC, lose Dex to AC, drop items, can\'t act',
    mods: { ac: -2 } },
]

export function computeConditionTotals(activeConditionIds = []) {
  const totals = { attackRoll:0, damage:0, ac:0, initiative:0, fort:0, ref:0, will:0, hp:0, cmb:0, str:0, dex:0, con:0, int:0, wis:0, cha:0 }
  activeConditionIds.forEach(id => {
    const cond = CONDITIONS.find(c => c.id === id)
    if (!cond) return
    Object.entries(cond.mods ?? {}).forEach(([k, v]) => { if (k in totals) totals[k] += v })
  })
  return totals
}
