import { useEffect } from 'react'
import { useThemeStore, THEMES, applyTheme } from '../store/themeStore'
import { useFontStore, FONTS, applyFont } from '../store/fontStore'

export default function SettingsPanel({ open, onClose }) {
  const { activeTheme, setTheme } = useThemeStore()
  const { activeFont, setFont }   = useFontStore()

  useEffect(() => { applyTheme(activeTheme) }, [activeTheme])
  useEffect(() => { applyFont(activeFont) },   [activeFont])

  if (!open) return null

  const handleTheme = (id) => { setTheme(id); applyTheme(id) }
  const handleFont  = (id) => { setFont(id);  applyFont(id)  }

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

        <div className="p-5 space-y-8 flex-1">

          {/* ── Section 1: Color Themes ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🎨</span>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Color Theme</h3>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>The look and feel of your tome</p>
              </div>
            </div>

            <div className="space-y-1.5">
              {Object.values(THEMES).map(theme => {
                const isActive = activeTheme === theme.id
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleTheme(theme.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left"
                    style={{
                      backgroundColor: isActive ? 'var(--bg-darker)' : 'transparent',
                      border: `2px solid ${isActive ? 'var(--accent)' : 'var(--bg-border)'}`,
                    }}
                  >
                    <div className="flex gap-0.5 flex-shrink-0">
                      <div className="w-6 h-6 rounded-l-full border border-white/10" style={{ backgroundColor: theme.preview[0] }} />
                      <div className="w-6 h-6 rounded-r-full border border-white/10" style={{ backgroundColor: theme.preview[1] }} />
                    </div>
                    <span className="flex-1 text-sm font-medium" style={{ color: isActive ? 'var(--accent)' : 'var(--text)', fontFamily: 'Georgia, serif' }}>
                      {theme.name}
                    </span>
                    {isActive && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: 'var(--bg-darker)', backgroundColor: 'var(--accent)' }}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--bg-border)' }} />

          {/* ── Section 2: Lettering / Font ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">✍️</span>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Lettering Style</h3>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>The hand that wrote your legend</p>
              </div>
            </div>

            <div className="space-y-2">
              {Object.values(FONTS).map(font => {
                const isActive = activeFont === font.id
                return (
                  <button
                    key={font.id}
                    onClick={() => handleFont(font.id)}
                    className="w-full flex flex-col gap-1 px-3 py-3 rounded-lg transition-all text-left"
                    style={{
                      backgroundColor: isActive ? 'var(--bg-darker)' : 'transparent',
                      border: `2px solid ${isActive ? 'var(--accent)' : 'var(--bg-border)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: isActive ? 'var(--accent)' : 'var(--text)', fontFamily: font.family }}>
                        {font.name}
                      </span>
                      {isActive && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: 'var(--bg-darker)', backgroundColor: 'var(--accent)' }}>✓</span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{font.desc}</span>
                    <span className="text-sm mt-0.5" style={{ color: 'var(--text-dim)', fontFamily: font.family, fontStyle: 'italic' }}>
                      {font.preview}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--bg-border)' }} />

          {/* About */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>ℹ️ About</h3>
            <div className="text-xs space-y-1" style={{ color: 'var(--text-dim)' }}>
              <p>Pathfinder 1e Character Sheet</p>
              <p>All data saved locally in your browser.</p>
              <p>Export characters as JSON to back them up.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
