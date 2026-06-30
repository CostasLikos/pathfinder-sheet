import { useEffect } from 'react'
import { useThemeStore, THEMES, applyTheme } from '../store/themeStore'

export default function SettingsPanel({ open, onClose }) {
  const { activeTheme, setTheme } = useThemeStore()

  useEffect(() => {
    applyTheme(activeTheme)
  }, [activeTheme])

  if (!open) return null

  const handleTheme = (id) => {
    setTheme(id)
    applyTheme(id)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-80 h-full overflow-y-auto shadow-2xl flex flex-col" style={{ backgroundColor: 'var(--bg-surface)', borderLeft: '1px solid var(--bg-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--bg-border)' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--accent)', fontFamily: 'Georgia, serif' }}>Settings</h2>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Customize your experience</p>
          </div>
          <button onClick={onClose} className="text-xl hover:opacity-70 transition-opacity" style={{ color: 'var(--text-dim)' }}>✕</button>
        </div>

        <div className="p-5 space-y-6 flex-1">
          {/* Theme Section */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>
              🎨 Color Theme
            </h3>
            <div className="space-y-2">
              {Object.values(THEMES).map(theme => {
                const isActive = activeTheme === theme.id
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleTheme(theme.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left"
                    style={{
                      backgroundColor: isActive ? 'var(--bg-darker)' : 'transparent',
                      border: `2px solid ${isActive ? 'var(--accent)' : 'var(--bg-border)'}`,
                    }}
                  >
                    {/* Color swatches */}
                    <div className="flex gap-1 flex-shrink-0">
                      <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: theme.preview[0] }} />
                      <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: theme.preview[1] }} />
                    </div>
                    <span className="flex-1 text-sm font-medium" style={{ color: isActive ? 'var(--accent)' : 'var(--text)' }}>
                      {theme.name}
                    </span>
                    {isActive && (
                      <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>✓ Active</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--bg-border)' }} />

          {/* About */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
              ℹ️ About
            </h3>
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
