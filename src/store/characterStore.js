import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const defaultCharacter = () => ({
  id: crypto.randomUUID(),
  createdAt: Date.now(),
  // Basic Info
  name: '',
  playerName: '',
  race: '',
  class: '',
  level: 1,
  classes: [],   // [{ id, className, level, isFavored, favoredHP, favoredSkill }]
  alignment: '',
  deity: '',
  homeland: '',
  portrait: null,
  // Ability Scores
  abilities: {
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  },
  // Combat
  hp: { max: 0, current: 0, nonlethal: 0 },
  ac: { armor: 0, shield: 0, natural: 0, deflect: 0, misc: 0 },
  bab: 0,
  initiative: { misc: 0 },
  speed: 30,
  // Saving Throws
  saves: {
    fort: { base: 0, misc: 0 },
    ref:  { base: 0, misc: 0 },
    will: { base: 0, misc: 0 },
  },
  // Skills
  skills: {},
  skillOrder: null, // null = use default order from pf1eData
  // Feats & Traits
  feats: [],
  traits: [],
  // Equipment
  weapons: [],
  armor: [],
  gear: [],
  currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
  // Spells
  spellcasting: {
    class: '',
    ability: 'int',
    concentration: 0,
    slots: {},
    spells: [],
  },
  // Buffs & Tracking
  buffs: [],
  combatRound: 1,
  bardicPerformance: {
    used: 0,
    active: false,
    currentPerf: '',
    lingeringFeat: false,
    lingeringRounds: 0,
  },
  // Notes
  notes: '',
  experience: 0,
  // Dashboard pins
  pins: { sections: [], skills: [] },
  // Session spell list (spell names saved for quick access)
  sessionSpells: [],
  // Stat-modifying buffs/debuffs
  statBuffs: [],
  // Armor properties
  armorProps: { checkPenalty: 0, maxDex: null, spellFailure: 0 },
})

export const useCharacterStore = create(
  persist(
    (set, get) => ({
      characters: [],

      addCharacter: () => {
        const newChar = defaultCharacter()
        set(state => ({ characters: [...state.characters, newChar] }))
        return newChar.id
      },

      updateCharacter: (id, updates) => {
        set(state => ({
          characters: state.characters.map(c =>
            c.id === id ? { ...c, ...updates } : c
          )
        }))
      },

      deleteCharacter: (id) => {
        set(state => ({
          characters: state.characters.filter(c => c.id !== id)
        }))
      },

      getCharacter: (id) => {
        return get().characters.find(c => c.id === id)
      },

      importCharacter: (json) => {
        try {
          const char = JSON.parse(json)
          char.id = crypto.randomUUID()
          char.createdAt = Date.now()
          set(state => ({ characters: [...state.characters, char] }))
          return { success: true }
        } catch {
          return { success: false, error: 'Invalid character file' }
        }
      },

      exportCharacter: (id) => {
        const char = get().characters.find(c => c.id === id)
        if (!char) return
        const json = JSON.stringify(char, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${char.name || 'character'}.json`
        a.click()
        URL.revokeObjectURL(url)
      },
    }),
    {
      name: 'pathfinder-characters',
    }
  )
)
