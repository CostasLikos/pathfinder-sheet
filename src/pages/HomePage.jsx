import { useNavigate } from 'react-router-dom'
import { useCharacterStore } from '../store/characterStore'
import { useRef, useState } from 'react'
import SettingsPanel from '../components/SettingsPanel'

export default function HomePage() {
  const navigate = useNavigate()
  const { characters, addCharacter, deleteCharacter, exportCharacter, importCharacter } = useCharacterStore()
  const importRef = useRef()
  const [settingsOpen, setSettingsOpen] = useState(false)

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

  const getClassColor = (cls) => {
    const colors = {
      Fighter: 'text-red-400', Wizard: 'text-blue-400', Rogue: 'text-yellow-400',
      Cleric: 'text-yellow-200', Paladin: 'text-amber-400', Ranger: 'text-green-400',
      Barbarian: 'text-orange-400', Druid: 'text-emerald-400', Bard: 'text-purple-400',
      Monk: 'text-cyan-400', Sorcerer: 'text-pink-400',
    }
    return colors[cls] || 'text-pf-gold'
  }

  return (
    <div className="min-h-screen page-bg">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {/* Header */}
      <div className="top-bar px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/pf-logo.png" alt="" className="h-10 w-10 object-contain" onError={e => e.target.style.display='none'} />
          <div>
            <h1 className="text-pf-gold font-medieval text-2xl font-bold tracking-wide">
              Pathfinder Sheet
            </h1>
            <p className="text-gray-400 text-xs">First Edition Character Manager</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button onClick={() => importRef.current.click()} className="btn-secondary text-sm">
            Import Character
          </button>
          <button onClick={handleCreate} className="btn-primary text-sm">
            + New Character
          </button>
          <button onClick={() => setSettingsOpen(true)} className="btn-secondary text-sm px-3" title="Settings">⚙️</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Hero banner when no characters */}
        {characters.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">⚔️</div>
            <h2 className="text-pf-gold font-medieval text-4xl font-bold mb-4">
              Begin Your Adventure
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
              Create your first Pathfinder 1e character and track your journey through the Inner Sea.
            </p>
            <button onClick={handleCreate} className="btn-primary text-lg px-10 py-3">
              Create Your First Character
            </button>
          </div>
        )}

        {/* Character Grid */}
        {characters.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-pf-gold font-medieval text-xl font-bold">
                My Characters ({characters.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.map(char => (
                <div
                  key={char.id}
                  className="card hover:border-pf-gold transition-colors duration-200 cursor-pointer group"
                  onClick={() => navigate(`/character/${char.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* Portrait */}
                    <div className="w-16 h-16 rounded border border-pf-border bg-pf-darker flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {char.portrait
                        ? <img src={char.portrait} alt="" className="w-full h-full object-cover" />
                        : <span className="text-3xl">🧙</span>
                      }
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-lg truncate group-hover:text-pf-gold transition-colors">
                        {char.name || 'Unnamed Hero'}
                      </h3>
                      <p className={`text-sm font-semibold ${getClassColor(char.class)}`}>
                        {char.class || 'No Class'} {char.level > 0 ? `• Level ${char.level}` : ''}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {char.race || 'Unknown Race'} {char.alignment ? `• ${char.alignment}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* HP Bar */}
                  {char.hp.max > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>HP</span>
                        <span>{char.hp.current}/{char.hp.max}</span>
                      </div>
                      <div className="h-1.5 bg-pf-darker rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pf-red rounded-full transition-all"
                          style={{ width: `${Math.max(0, Math.min(100, (char.hp.current / char.hp.max) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-pf-border">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/character/${char.id}`) }}
                      className="flex-1 text-xs py-1 bg-pf-darker hover:bg-pf-border rounded border border-pf-border text-gray-300 hover:text-white transition-colors"
                    >
                      Open
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); exportCharacter(char.id) }}
                      className="flex-1 text-xs py-1 bg-pf-darker hover:bg-pf-border rounded border border-pf-border text-gray-300 hover:text-white transition-colors"
                    >
                      Export
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (confirm(`Delete ${char.name || 'this character'}?`)) deleteCharacter(char.id)
                      }}
                      className="text-xs py-1 px-3 bg-pf-darker hover:bg-red-900 rounded border border-pf-border text-red-400 hover:text-red-300 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {/* Add new card */}
              <div
                onClick={handleCreate}
                className="card border-dashed hover:border-pf-gold hover:bg-pf-surface cursor-pointer transition-all duration-200 flex items-center justify-center min-h-[140px] group"
              >
                <div className="text-center">
                  <div className="text-4xl text-pf-border group-hover:text-pf-gold transition-colors mb-2">+</div>
                  <p className="text-gray-500 group-hover:text-pf-gold text-sm transition-colors">New Character</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
