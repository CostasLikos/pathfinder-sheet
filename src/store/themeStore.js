import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const THEMES = {
  darkGold: {
    id: 'darkGold',
    name: 'Dark Gold',
    preview: ['#12121e', '#C9A84C'],
    vars: {
      '--bg-darker':  '#12121e',
      '--bg-dark':    '#1a1a2e',
      '--bg-surface': '#16213e',
      '--bg-border':  '#2a2a4a',
      '--accent':     '#C9A84C',
      '--accent-dim': '#8B6914',
      '--accent-hover': '#e8c060',
      '--text':       '#e2e8f0',
      '--text-dim':   '#94a3b8',
      '--text-faint': '#4a5568',
      '--danger':     '#8B0000',
      '--danger-hover': '#a00000',
      '--positive':   '#22c55e',
      '--warning':    '#f59e0b',
    }
  },
  darkRed: {
    id: 'darkRed',
    name: 'Blood Red',
    preview: ['#1a0a0a', '#dc2626'],
    vars: {
      '--bg-darker':  '#0f0808',
      '--bg-dark':    '#1a0a0a',
      '--bg-surface': '#200d0d',
      '--bg-border':  '#3d1515',
      '--accent':     '#dc2626',
      '--accent-dim': '#7f1d1d',
      '--accent-hover': '#ef4444',
      '--text':       '#fde8e8',
      '--text-dim':   '#fca5a5',
      '--text-faint': '#5a2020',
      '--danger':     '#450a0a',
      '--danger-hover': '#7f1d1d',
      '--positive':   '#16a34a',
      '--warning':    '#d97706',
    }
  },
  arcane: {
    id: 'arcane',
    name: 'Arcane Purple',
    preview: ['#0d0a1a', '#a855f7'],
    vars: {
      '--bg-darker':  '#0d0a1a',
      '--bg-dark':    '#130f24',
      '--bg-surface': '#1a1430',
      '--bg-border':  '#2d2050',
      '--accent':     '#a855f7',
      '--accent-dim': '#6b21a8',
      '--accent-hover': '#c084fc',
      '--text':       '#f0e6ff',
      '--text-dim':   '#c4b5fd',
      '--text-faint': '#4c1d95',
      '--danger':     '#7f1d1d',
      '--danger-hover': '#991b1b',
      '--positive':   '#16a34a',
      '--warning':    '#d97706',
    }
  },
  forest: {
    id: 'forest',
    name: 'Forest Green',
    preview: ['#0a120a', '#22c55e'],
    vars: {
      '--bg-darker':  '#060e06',
      '--bg-dark':    '#0a120a',
      '--bg-surface': '#0f1a0f',
      '--bg-border':  '#1a3020',
      '--accent':     '#22c55e',
      '--accent-dim': '#14532d',
      '--accent-hover': '#4ade80',
      '--text':       '#e8f5e8',
      '--text-dim':   '#86efac',
      '--text-faint': '#1a3020',
      '--danger':     '#7f1d1d',
      '--danger-hover': '#991b1b',
      '--positive':   '#16a34a',
      '--warning':    '#d97706',
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    preview: ['#050f1a', '#0ea5e9'],
    vars: {
      '--bg-darker':  '#050f1a',
      '--bg-dark':    '#0a1628',
      '--bg-surface': '#0f1f38',
      '--bg-border':  '#1a3550',
      '--accent':     '#0ea5e9',
      '--accent-dim': '#0c4a6e',
      '--accent-hover': '#38bdf8',
      '--text':       '#e0f2fe',
      '--text-dim':   '#7dd3fc',
      '--text-faint': '#1e4060',
      '--danger':     '#7f1d1d',
      '--danger-hover': '#991b1b',
      '--positive':   '#16a34a',
      '--warning':    '#d97706',
    }
  },
  parchment: {
    id: 'parchment',
    name: 'Parchment (Light)',
    preview: ['#f5f0e8', '#7c3d12'],
    vars: {
      '--bg-darker':  '#e8dfc8',
      '--bg-dark':    '#f0e8d0',
      '--bg-surface': '#f5f0e8',
      '--bg-border':  '#c8b898',
      '--accent':     '#7c3d12',
      '--accent-dim': '#a0522d',
      '--accent-hover': '#92400e',
      '--text':       '#2c1810',
      '--text-dim':   '#6b4226',
      '--text-faint': '#a08060',
      '--danger':     '#7f1d1d',
      '--danger-hover': '#991b1b',
      '--positive':   '#15803d',
      '--warning':    '#b45309',
    }
  },

  // ── New themes ──────────────────────────────────────────────────────────────

  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    preview: ['#0a0014', '#ff2d78'],
    vars: {
      '--bg-darker':  '#030008',
      '--bg-dark':    '#0a0014',
      '--bg-surface': '#110022',
      '--bg-border':  '#2a004a',
      '--accent':     '#ff2d78',
      '--accent-dim': '#6b0030',
      '--accent-hover': '#ff6aaa',
      '--text':       '#f0e0ff',
      '--text-dim':   '#c084fc',
      '--text-faint': '#4a1070',
      '--danger':     '#ff2d78',
      '--danger-hover': '#ff6aaa',
      '--positive':   '#00ff9f',
      '--warning':    '#ffe600',
    }
  },

  neon: {
    id: 'neon',
    name: 'Neon City',
    preview: ['#000d1a', '#00f5ff'],
    vars: {
      '--bg-darker':  '#000508',
      '--bg-dark':    '#000d1a',
      '--bg-surface': '#001428',
      '--bg-border':  '#002244',
      '--accent':     '#00f5ff',
      '--accent-dim': '#003344',
      '--accent-hover': '#66faff',
      '--text':       '#e0faff',
      '--text-dim':   '#67e8f9',
      '--text-faint': '#0e4460',
      '--danger':     '#ff2d78',
      '--danger-hover': '#ff6aaa',
      '--positive':   '#39ff14',
      '--warning':    '#ffe600',
    }
  },

  synthwave: {
    id: 'synthwave',
    name: 'Synthwave',
    preview: ['#0e0020', '#f72585'],
    vars: {
      '--bg-darker':  '#070010',
      '--bg-dark':    '#0e0020',
      '--bg-surface': '#160030',
      '--bg-border':  '#300060',
      '--accent':     '#f72585',
      '--accent-dim': '#700040',
      '--accent-hover': '#ff6eb0',
      '--text':       '#ffe8ff',
      '--text-dim':   '#b5179e',
      '--text-faint': '#4a0060',
      '--danger':     '#f72585',
      '--danger-hover': '#ff6eb0',
      '--positive':   '#7fff00',
      '--warning':    '#ffb703',
    }
  },

  midnight: {
    id: 'midnight',
    name: 'Midnight Steel',
    preview: ['#080c10', '#64748b'],
    vars: {
      '--bg-darker':  '#030507',
      '--bg-dark':    '#080c10',
      '--bg-surface': '#0d1218',
      '--bg-border':  '#1e2a35',
      '--accent':     '#94a3b8',
      '--accent-dim': '#1e3050',
      '--accent-hover': '#cbd5e1',
      '--text':       '#e2e8f0',
      '--text-dim':   '#94a3b8',
      '--text-faint': '#334155',
      '--danger':     '#ef4444',
      '--danger-hover': '#f87171',
      '--positive':   '#22c55e',
      '--warning':    '#f59e0b',
    }
  },

  ember: {
    id: 'ember',
    name: 'Ember',
    preview: ['#0f0800', '#ff6b00'],
    vars: {
      '--bg-darker':  '#080400',
      '--bg-dark':    '#0f0800',
      '--bg-surface': '#1a0e00',
      '--bg-border':  '#3d2000',
      '--accent':     '#ff6b00',
      '--accent-dim': '#7c2d00',
      '--accent-hover': '#ff9a3c',
      '--text':       '#fff0e0',
      '--text-dim':   '#fdba74',
      '--text-faint': '#78350f',
      '--danger':     '#dc2626',
      '--danger-hover': '#ef4444',
      '--positive':   '#16a34a',
      '--warning':    '#eab308',
    }
  },

  ice: {
    id: 'ice',
    name: 'Ice Crystal',
    preview: ['#f0f8ff', '#0369a1'],
    vars: {
      '--bg-darker':  '#dbeafe',
      '--bg-dark':    '#eff6ff',
      '--bg-surface': '#f0f8ff',
      '--bg-border':  '#bfdbfe',
      '--accent':     '#0369a1',
      '--accent-dim': '#bae6fd',
      '--accent-hover': '#0284c7',
      '--text':       '#0c1a2e',
      '--text-dim':   '#1e40af',
      '--text-faint': '#93c5fd',
      '--danger':     '#dc2626',
      '--danger-hover': '#ef4444',
      '--positive':   '#15803d',
      '--warning':    '#b45309',
    }
  },

  void: {
    id: 'void',
    name: 'Void Black',
    preview: ['#000000', '#6366f1'],
    vars: {
      '--bg-darker':  '#000000',
      '--bg-dark':    '#050505',
      '--bg-surface': '#0a0a0a',
      '--bg-border':  '#1a1a1a',
      '--accent':     '#6366f1',
      '--accent-dim': '#1e1b4b',
      '--accent-hover': '#818cf8',
      '--text':       '#f1f5f9',
      '--text-dim':   '#a5b4fc',
      '--text-faint': '#312e81',
      '--danger':     '#ef4444',
      '--danger-hover': '#f87171',
      '--positive':   '#22c55e',
      '--warning':    '#f59e0b',
    }
  },

  nature: {
    id: 'nature',
    name: 'Nature & Earth',
    preview: ['#f5f0e8', '#065f46'],
    vars: {
      '--bg-darker':  '#d4e6d4',
      '--bg-dark':    '#e8f0e0',
      '--bg-surface': '#f0f5ec',
      '--bg-border':  '#b0c8a0',
      '--accent':     '#065f46',
      '--accent-dim': '#a7f3d0',
      '--accent-hover': '#047857',
      '--text':       '#1a2e1a',
      '--text-dim':   '#3d6b3d',
      '--text-faint': '#86a886',
      '--danger':     '#991b1b',
      '--danger-hover': '#b91c1c',
      '--positive':   '#15803d',
      '--warning':    '#92400e',
    }
  },
}

export const useThemeStore = create(
  persist(
    (set) => ({
      activeTheme: 'darkGold',
      setTheme: (id) => set({ activeTheme: id }),
    }),
    { name: 'pf-theme' }
  )
)

export function applyTheme(themeId) {
  const theme = THEMES[themeId]
  if (!theme) return
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}
