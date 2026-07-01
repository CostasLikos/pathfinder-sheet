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
