import { useEffect, useState } from 'react'
import { useThemeStore, THEMES, applyTheme } from '../store/themeStore'
import { useFontStore, FONTS, applyFont } from '../store/fontStore'

function Section({ icon, title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--bg-border)' }}>
      <button
        onClick={() => setOpen(x => !x)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
        style={{ backgroundColor: open ? 'var(--bg-darker)' : 'var(--bg-surface)' }}
      >
        <span className="text-lg flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--accent)' }}>{title}</div>
          <div className="text-xs" style={{ color: 'var(--text-faint)' }}>{subtitle}</div>
        </div>
        <span className="text-xs flex-shrink-0 transition-transform" style={{ color: 'var(--text-dim)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>
      {open && (
        <div className="p-3 space-y-1.5" style={{ borderTop: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-darker)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function SettingsPanel({ open, onClose }) {
  const { activeTheme, setTheme } = useThemeStore()
  const { activeFont, setFont }   = useFontStore()

  useEffect(() => { applyTheme(activeTheme) }, [activeTheme])
  useEffect(() => { applyFont(activeFont) },   [activeFont])

  if (!open) return null

  const handleTheme = (id) => { setTheme(id); applyTheme(id) }
  const handleFont  = (id) => { setFont(id);  applyFont(id)  }

  const activeThemeObj = THEMES[activeTheme]
  const activeFontObj  = FONTS[activeFont]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-96 h-full overflow-y-auto shadow-2xl flex flex-col" style={{ backgroundColor: 'var(--bg-surface)', borderLeft: '1px solid var(--bg-border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--accent)', fontFamily: 'Georgia, serif' }}>⚙️ Settings</h2>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Customize your experience</p>
          </div>
          <button onClick={onClose} className="text-xl hover:opacity-70 transition-opacity" style={{ color: 'var(--text-dim)' }}>✕</button>
        </div>

        <div className="p-4 space-y-3 flex-1">

          {/* Active summary chips */}
          <div className="flex gap-2 flex-wrap pb-1">
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)', color: 'var(--text-dim)' }}>
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-l-full" style={{ backgroundColor: activeThemeObj?.preview[0] }} />
                <div className="w-3 h-3 rounded-r-full" style={{ backgroundColor: activeThemeObj?.preview[1] }} />
              </div>
              <span style={{ color: 'var(--accent)' }}>{activeThemeObj?.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)', color: 'var(--text-dim)' }}>
              <span>✍️</span>
              <span style={{ color: 'var(--accent)', fontFamily: activeFontObj?.family }}>{activeFontObj?.name}</span>
            </div>
          </div>

          {/* ── Color Theme ── */}
          <Section icon="🎨" title="Color Theme" subtitle="The look and feel of your tome" defaultOpen>
            {Object.values(THEMES).map(theme => {
              const isActive = activeTheme === theme.id
              return (
                <button
                  key={theme.id}
                  onClick={() => handleTheme(theme.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left"
                  style={{
                    backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                    border: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                  }}
                >
                  <div className="flex gap-0.5 flex-shrink-0">
                    <div className="w-5 h-5 rounded-l-full border border-white/10" style={{ backgroundColor: theme.preview[0] }} />
                    <div className="w-5 h-5 rounded-r-full border border-white/10" style={{ backgroundColor: theme.preview[1] }} />
                  </div>
                  <span className="flex-1 text-sm" style={{ color: isActive ? 'var(--accent)' : 'var(--text)', fontFamily: 'Georgia, serif', fontWeight: isActive ? 'bold' : 'normal' }}>
                    {theme.name}
                  </span>
                  {isActive && <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>✓</span>}
                </button>
              )
            })}
          </Section>

          {/* ── Lettering Style ── */}
          <Section icon="✍️" title="Lettering Style" subtitle="The hand that wrote your legend">
            {Object.values(FONTS).map(font => {
              const isActive = activeFont === font.id
              return (
                <button
                  key={font.id}
                  onClick={() => handleFont(font.id)}
                  className="w-full flex flex-col gap-0.5 px-3 py-2.5 rounded-lg transition-all text-left"
                  style={{
                    backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                    border: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: isActive ? 'var(--accent)' : 'var(--text)', fontFamily: font.family }}>
                      {font.name}
                    </span>
                    {isActive && <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>✓</span>}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{font.desc}</span>
                  <span className="text-xs mt-0.5" style={{ color: 'var(--text-dim)', fontFamily: font.family, fontStyle: 'italic' }}>
                    {font.preview}
                  </span>
                </button>
              )
            })}
          </Section>

          {/* ── About ── */}
          <Section icon="ℹ️" title="About" subtitle="Pathfinder 1e Character Sheet">
            <div className="text-xs space-y-1 px-1 py-1" style={{ color: 'var(--text-dim)' }}>
              <p>All data saved locally in your browser.</p>
              <p>Export characters as JSON to back them up.</p>
            </div>
          </Section>

        </div>
      </div>
    </div>
  )
}
