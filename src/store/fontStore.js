import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const FONTS = {
  scribesHand: {
    id: 'scribesHand',
    name: "Scribe's Hand",
    desc: 'Classic serif — the default dungeon journal',
    family: 'Georgia, "Times New Roman", serif',
    preview: 'The dragon stirs in its lair...',
  },
  elvenScript: {
    id: 'elvenScript',
    name: 'Elven Script',
    desc: 'Elegant Palatino — flowing and refined',
    family: '"Palatino Linotype", Palatino, "Book Antiqua", serif',
    preview: 'The dragon stirs in its lair...',
  },
  runicInscriptions: {
    id: 'runicInscriptions',
    name: 'Runic Inscriptions',
    desc: 'Cinzel — carved in stone, etched in legend',
    family: '"Cinzel", Georgia, serif',
    preview: 'The dragon stirs in its lair...',
  },
  imFell: {
    id: 'imFell',
    name: 'Fell Manuscript',
    desc: 'IM Fell English — aged ink on parchment',
    family: '"IM Fell English", Georgia, serif',
    preview: 'The dragon stirs in its lair...',
  },
  arcaneCodex: {
    id: 'arcaneCodex',
    name: 'Arcane Codex',
    desc: 'Monospace — precise notation of a mage',
    family: '"Courier New", Courier, monospace',
    preview: 'The dragon stirs in its lair...',
  },
  adventurersNotes: {
    id: 'adventurersNotes',
    name: "Adventurer's Notes",
    desc: 'Clean system font — fast and readable on the road',
    family: 'system-ui, -apple-system, sans-serif',
    preview: 'The dragon stirs in its lair...',
  },
}

export const useFontStore = create(
  persist(
    (set) => ({
      activeFont: 'scribesHand',
      setFont: (id) => set({ activeFont: id }),
    }),
    { name: 'pf-font' }
  )
)

export function applyFont(fontId) {
  const font = FONTS[fontId]
  if (!font) return
  document.documentElement.style.setProperty('--font-body', font.family)
  document.body.style.fontFamily = font.family
}
