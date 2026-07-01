import { useNavigate } from 'react-router-dom'
import { useCharacterStore } from '../store/characterStore'
import { useRef, useState, useEffect } from 'react'
import SettingsPanel from '../components/SettingsPanel'
import { THEMES, useThemeStore } from '../store/themeStore'
import SigilBackground from '../components/SigilBackground'

export default function HomePage() {
  const navigate = useNavigate()
  const { characters, addCharacter, deleteCharacter, exportCharacter, importCharacter } = useCharacterStore()
  const importRef = useRef()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { activeTheme } = useThemeStore()

  // derive accent + bg colors from active theme for the hero
  const theme = THEMES[activeTheme] || THEMES.darkGold
  const accentHex   = theme.vars['--accent']
  const accentDim   = theme.vars['--accent-dim']
  const bgDarker    = theme.vars['--bg-darker']
  const bgBorder    = theme.vars['--bg-border']
  const textColor   = theme.vars['--text']

  const handleCreate = () => {
    const id = addCharacter()
    navigate(`/character/${id}`)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = importCharacter(ev.target.result)
      if (!result.success) alert(result.error)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const formatLastSeen = (ts) => {
    if (!ts) return { text: 'never opened', funny: false }
    const diff = Date.now() - ts
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    const months = Math.floor(days / 30.44)
    const years  = Math.floor(days / 365.25)

    const parts = []
    if (years  > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`)
    const remMonths = months - years * 12
    if (remMonths > 0) parts.push(`${remMonths} month${remMonths > 1 ? 's' : ''}`)
    const remDays = days - Math.floor(months * 30.44)
    if (remDays > 0 && years === 0) parts.push(`${remDays} day${remDays > 1 ? 's' : ''}`)
    const remMins = mins - hours * 60
    if (hours === 0 && days === 0) parts.push(`${mins < 1 ? 'less than a' : mins} minute${mins !== 1 ? 's' : ''}`)
    else if (days === 0) { parts.push(`${hours} hour${hours > 1 ? 's' : ''}`); if (remMins > 0) parts.push(`${remMins} minute${remMins > 1 ? 's' : ''}`) }

    const text = (parts.length ? parts.join(', ') : 'just now') + ' since last view'
    const funny = months >= 1

    const funnyLines = [
      'Dead campaign?',
      'Your DM has moved on.',
      'The tavern closed down.',
      'Your character died of old age.',
      'The dragon won.',
      'Roll for abandonment.',
    ]
    const funnyMsg = funnyLines[(Math.floor(ts / 1000)) % funnyLines.length]

    return { text, funny, funnyMsg }
  }

  const getClassColor = (cls) => {
    const colors = {
      Fighter: 'text-red-400', Wizard: 'text-blue-400', Rogue: 'text-yellow-400',
      Cleric: 'text-yellow-200', Paladin: 'text-amber-400', Ranger: 'text-green-400',
      Barbarian: 'text-orange-400', Druid: 'text-emerald-400', Bard: 'text-purple-400',
      Monk: 'text-cyan-400', Sorcerer: 'text-pink-400',
    }
    return colors[cls] || 'text-pf-gold'
  }

  // hex → rgba helper
  const hex2rgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1,3),16)
    const g = parseInt(hex.slice(3,5),16)
    const b = parseInt(hex.slice(5,7),16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  const glowColor  = hex2rgba(accentHex, 0.35)
  const glowFaint  = hex2rgba(accentHex, 0.12)
  const glowStrong = hex2rgba(accentHex, 0.55)
  const dimColor   = hex2rgba(accentDim,  0.6)

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: bgDarker }}>
      {/* Big sigil background */}
      <SigilBackground
        size={null}
        opacity={0.07}
        color={accentHex}
        pulse
        className="absolute"
        style={{ width: '100vmin', height: '100vmin', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }}
      />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* ── HERO ── */}
      <div style={{
        position: 'relative',
        minHeight: characters.length === 0 ? '100vh' : '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: `radial-gradient(ellipse 70% 55% at 50% 38%, ${hex2rgba(accentDim, 0.55)} 0%, ${hex2rgba(accentDim, 0.15)} 40%, ${bgDarker} 75%)`,
      }}>

        {/* deep bg vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 120% 80% at 50% 100%, ${hex2rgba(accentHex, 0.08)} 0%, transparent 60%)`,
        }} />

        {/* ── GATE ── */}
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '280px', pointerEvents: 'none' }}>

          {/* outer frame sides */}
          {[-1, 1].map(side => (
            <div key={side} style={{
              position: 'absolute',
              bottom: 0,
              [side === -1 ? 'right' : 'left']: '100%',
              width: '28px',
              height: '320px',
              background: `linear-gradient(to top, ${bgDarker} 60%, transparent 100%)`,
              borderTop: `1px solid ${hex2rgba(accentHex, 0.2)}`,
              [side === -1 ? 'borderRight' : 'borderLeft']: `2px solid ${hex2rgba(accentHex, 0.15)}`,
            }} />
          ))}

          {/* outer arch */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '-20px',
            right: '-20px',
            height: '360px',
            background: `linear-gradient(to top, ${bgDarker} 55%, ${hex2rgba(accentDim, 0.07)} 100%)`,
            borderTop: `2px solid ${hex2rgba(accentHex, 0.3)}`,
            borderLeft: `2px solid ${hex2rgba(accentHex, 0.2)}`,
            borderRight: `2px solid ${hex2rgba(accentHex, 0.2)}`,
            borderRadius: '48% 48% 0 0 / 22% 22% 0 0',
            boxShadow: `inset 0 0 80px ${hex2rgba(accentDim, 0.25)}, 0 0 60px ${glowFaint}`,
          }} />

          {/* inner arch */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '10px',
            right: '10px',
            height: '320px',
            background: `linear-gradient(to top, #000000 60%, ${hex2rgba(accentDim, 0.05)} 100%)`,
            borderTop: `1px solid ${hex2rgba(accentHex, 0.2)}`,
            borderLeft: `1px solid ${hex2rgba(accentHex, 0.12)}`,
            borderRight: `1px solid ${hex2rgba(accentHex, 0.12)}`,
            borderRadius: '48% 48% 0 0 / 20% 20% 0 0',
          }} />

          {/* door panel left */}
          <div style={{
            position: 'absolute', bottom: 0, left: '14px',
            width: '114px', height: '290px',
            background: `linear-gradient(160deg, ${hex2rgba(accentDim, 0.12)} 0%, #050000 50%)`,
            borderTop: `1px solid ${hex2rgba(accentHex, 0.18)}`,
            borderRight: `1px solid ${hex2rgba(accentHex, 0.08)}`,
          }}>
            {/* panel carvings */}
            {[40, 110, 185].map((top, i) => (
              <div key={i} style={{
                position: 'absolute', top, left: '10px', right: '10px', height: '55px',
                border: `1px solid ${hex2rgba(accentHex, 0.1)}`,
                borderRadius: '2px',
                background: hex2rgba(accentDim, 0.05),
              }} />
            ))}
          </div>

          {/* door panel right */}
          <div style={{
            position: 'absolute', bottom: 0, right: '14px',
            width: '114px', height: '290px',
            background: `linear-gradient(200deg, ${hex2rgba(accentDim, 0.10)} 0%, #030000 50%)`,
            borderTop: `1px solid ${hex2rgba(accentHex, 0.18)}`,
            borderLeft: `1px solid ${hex2rgba(accentHex, 0.08)}`,
          }}>
            {[40, 110, 185].map((top, i) => (
              <div key={i} style={{
                position: 'absolute', top, left: '10px', right: '10px', height: '55px',
                border: `1px solid ${hex2rgba(accentHex, 0.1)}`,
                borderRadius: '2px',
                background: hex2rgba(accentDim, 0.05),
              }} />
            ))}
          </div>

          {/* center split */}
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '2px', height: '290px',
            background: `linear-gradient(to top, ${hex2rgba(accentHex, 0.4)}, transparent)`,
          }} />

          {/* keystone at arch top */}
          <div style={{
            position: 'absolute', top: '0px', left: '50%', transform: 'translateX(-50%)',
            width: '22px', height: '30px',
            background: hex2rgba(accentDim, 0.4),
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            filter: `drop-shadow(0 0 6px ${glowColor})`,
          }} />

          {/* skull ornament */}
          <div style={{
            position: 'absolute', top: '28px', left: '50%', transform: 'translateX(-50%)',
            fontSize: '1.4rem',
            filter: `drop-shadow(0 0 8px ${glowStrong})`,
            opacity: 0.7,
          }}>💀</div>

          {/* ground glow */}
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '420px', height: '70px',
            background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 70%)`,
            filter: 'blur(14px)',
          }} />

          {/* cracked ground lines */}
          {[[-30, 40, 70], [20, 50, 55], [-10, 30, 80]].map(([rotate, left, width], i) => (
            <div key={i} style={{
              position: 'absolute', bottom: '2px',
              left: `${left}px`, width: `${width}px`, height: '1px',
              background: `linear-gradient(90deg, transparent, ${hex2rgba(accentHex, 0.4)}, transparent)`,
              transform: `rotate(${rotate}deg)`,
              transformOrigin: 'left center',
            }} />
          ))}
        </div>

        {/* floating embers */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[...Array(22)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${4 + (i * 4.3) % 92}%`,
              bottom: `${5 + (i * 6.1) % 35}%`,
              width: i % 4 === 0 ? '3px' : '2px',
              height: i % 4 === 0 ? '3px' : '2px',
              borderRadius: '50%',
              backgroundColor: i % 3 === 0 ? accentHex : i % 3 === 1 ? accentDim : hex2rgba(accentHex, 0.8),
              animation: `ember ${3.5 + (i % 5) * 0.7}s ease-in infinite`,
              animationDelay: `${(i * 0.35) % 4.5}s`,
            }} />
          ))}
        </div>

        {/* top vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(to bottom, ${bgDarker} 0%, transparent 25%, transparent 65%, ${bgDarker} 100%)`,
        }} />

        {/* ── TITLE CONTENT ── */}
        <div style={{
          position: 'relative', zIndex: 10, textAlign: 'center',
          padding: '0 1.5rem',
          paddingBottom: characters.length === 0 ? '160px' : '80px',
        }}>
          <div style={{
            fontSize: '0.65rem', letterSpacing: '0.45em', textTransform: 'uppercase',
            color: hex2rgba(accentHex, 0.5), marginBottom: '0.8rem', fontFamily: 'Georgia, serif',
          }}>
            Pathfinder · First Edition
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 9vw, 4.5rem)',
            fontWeight: 900, fontFamily: 'Georgia, serif', lineHeight: 1.05,
            marginBottom: '1.5rem',
            background: `linear-gradient(180deg, ${textColor} 0%, ${accentHex} 45%, ${accentDim} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: `drop-shadow(0 2px 16px ${glowColor})`,
          }}>
            Chronicle<br />of Heroes
          </h1>

          {/* quote */}
          <div style={{
            maxWidth: '380px', margin: '0 auto 2rem',
            padding: '1rem 1.2rem',
            borderLeft: `2px solid ${hex2rgba(accentHex, 0.3)}`,
            borderRight: `2px solid ${hex2rgba(accentHex, 0.1)}`,
            background: hex2rgba(accentDim, 0.08),
          }}>
            <p style={{
              color: hex2rgba(textColor, 0.55),
              fontSize: '0.78rem', fontStyle: 'italic',
              lineHeight: 1.75, fontFamily: 'Georgia, serif',
              letterSpacing: '0.01em',
            }}>
              "Hell hath no limits, nor is circumscribed<br />
              In one self place, for where we are is hell,<br />
              And where hell is there must we ever be."
            </p>
            <p style={{
              color: accentHex, fontSize: '0.65rem', letterSpacing: '0.2em',
              textTransform: 'uppercase', marginTop: '0.6rem',
              opacity: 0.7,
            }}>Mephistopheles</p>
          </div>

          {characters.length === 0 ? (
            <div className="flex flex-col items-center gap-3">
              <button onClick={handleCreate} style={{
                background: `linear-gradient(135deg, ${accentDim}, ${hex2rgba(accentHex, 0.7)})`,
                border: `1px solid ${hex2rgba(accentHex, 0.6)}`,
                color: textColor,
                padding: '0.75rem 2.5rem', borderRadius: '3px',
                fontWeight: 700, fontSize: '1rem', fontFamily: 'Georgia, serif',
                letterSpacing: '0.06em', cursor: 'pointer',
                boxShadow: `0 0 24px ${glowColor}`,
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 40px ${glowStrong}`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 24px ${glowColor}`}
              >Begin Your Journey</button>
              <button onClick={() => importRef.current.click()} style={{
                background: 'transparent',
                border: `1px solid ${hex2rgba(accentHex, 0.2)}`,
                color: hex2rgba(accentHex, 0.45),
                padding: '0.45rem 1.5rem', borderRadius: '3px',
                fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = hex2rgba(accentHex, 0.5); e.currentTarget.style.color = hex2rgba(accentHex, 0.8) }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = hex2rgba(accentHex, 0.2); e.currentTarget.style.color = hex2rgba(accentHex, 0.45) }}
              >Import Character</button>
            </div>
          ) : (
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={handleCreate} style={{
                background: `linear-gradient(135deg, ${accentDim}, ${hex2rgba(accentHex, 0.5)})`,
                border: `1px solid ${hex2rgba(accentHex, 0.5)}`,
                color: textColor, padding: '0.5rem 1.5rem', borderRadius: '3px',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                boxShadow: `0 0 12px ${glowFaint}`,
              }}>+ New Character</button>
              <button onClick={() => importRef.current.click()} className="btn-secondary text-sm">Import</button>
              <button onClick={() => setSettingsOpen(true)} className="btn-secondary text-sm px-3" title="Settings">⚙️</button>
            </div>
          )}
        </div>

        {characters.length === 0 && (
          <button onClick={() => setSettingsOpen(true)} style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'transparent', border: `1px solid ${hex2rgba(accentHex, 0.2)}`,
            color: hex2rgba(accentHex, 0.4), padding: '0.4rem 0.6rem',
            borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', zIndex: 20,
          }}>⚙️</button>
        )}
      </div>

      {/* ── CHARACTER GRID ── */}
      {characters.length > 0 && (
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ color: 'var(--accent)', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '1.1rem' }}>
              My Characters ({characters.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map(char => (
              <div key={char.id}
                className="card cursor-pointer transition-all duration-200"
                onClick={() => navigate(`/character/${char.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bg-border)'}
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded border flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-darker)' }}>
                    {char.portrait
                      ? <img src={char.portrait} alt="" className="w-full h-full object-cover" />
                      : <span className="text-4xl">🧙</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate" style={{ color: 'var(--text)' }}>
                      {char.name || 'Unnamed Hero'}
                    </h3>
                    <p className={`text-sm font-semibold ${getClassColor(char.class)}`}>
                      {char.class || 'No Class'} {char.level > 0 ? `• Level ${char.level}` : ''}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                      {char.race || 'Unknown Race'} {char.alignment ? `• ${char.alignment}` : ''}
                    </p>
                  </div>
                </div>

                {char.hp.max > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-dim)' }}>
                      <span>HP</span><span>{char.hp.current}/{char.hp.max}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-darker)' }}>
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${Math.max(0, Math.min(100, (char.hp.current / char.hp.max) * 100))}%`,
                        backgroundColor: 'var(--danger)',
                      }} />
                    </div>
                  </div>
                )}

                {(() => { const ls = formatLastSeen(char.lastAccessedAt); return (
                  <div className="mt-2 text-xs" style={{ color: ls.funny ? hex2rgba(accentHex, 0.5) : 'var(--text-faint)' }}>
                    {ls.funny
                      ? <><span style={{ color: '#f59e0b', fontStyle: 'italic' }}>{ls.funnyMsg}</span> · {ls.text}</>
                      : ls.text}
                  </div>
                )})()}

                <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--bg-border)' }}>
                  <button onClick={e => { e.stopPropagation(); navigate(`/character/${char.id}`) }}
                    className="flex-1 text-xs py-1 rounded transition-colors"
                    style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)', color: 'var(--text-dim)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                  >Open</button>
                  <button onClick={e => { e.stopPropagation(); exportCharacter(char.id) }}
                    className="flex-1 text-xs py-1 rounded transition-colors"
                    style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)', color: 'var(--text-dim)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                  >Export</button>
                  <button onClick={e => {
                    e.stopPropagation()
                    if (confirm(`Delete ${char.name || 'this character'}?`)) deleteCharacter(char.id)
                  }}
                    className="text-xs py-1 px-3 rounded transition-colors"
                    style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)', color: '#f87171' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#450a0a'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-darker)'}
                  >✕</button>
                </div>
              </div>
            ))}

            <div onClick={handleCreate}
              className="card border-dashed cursor-pointer transition-all duration-200 flex items-center justify-center min-h-[140px]"
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bg-border)'}
            >
              <div className="text-center">
                <div className="text-4xl mb-2" style={{ color: 'var(--bg-border)' }}>+</div>
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>New Character</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center py-8 mt-4" style={{ borderTop: '1px solid var(--bg-border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          Created by <span style={{ color: 'var(--accent)' }}>Costas Likos</span>
        </p>
      </div>

      <style>{`
        @keyframes ember {
          0%   { transform: translateY(0) scale(1); opacity: 0.7; }
          60%  { opacity: 1; }
          100% { transform: translateY(-140px) scale(0.2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
