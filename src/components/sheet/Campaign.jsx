import { useState } from 'react'

const PF_CAMPAIGNS = {
  'PF1e — Official Adventure Paths': [
    'Rise of the Runelords', 'Curse of the Crimson Throne', 'Second Darkness',
    'Legacy of Fire', 'Council of Thieves', 'Kingmaker', "Serpent's Skull",
    'Carrion Crown', 'Jade Regent', 'Skull & Shackles', 'Shattered Star',
    'Reign of Winter', 'Wrath of the Righteous', "Mummy's Mask", 'Iron Gods',
    'Giantslayer', "Hell's Rebels", "Hell's Vengeance", 'Strange Aeons',
    'Ironfang Invasion', 'Ruins of Azlant', 'War for the Crown',
    'Return of the Runelords', "Tyrant's Grasp",
  ],
  'PF2e — Official Adventure Paths': [
    'Age of Ashes', 'Extinction Curse', 'Agents of Edgewatch',
    'Abomination Vaults', 'Fists of the Ruby Phoenix', 'Strength of Thousands',
    'Quest for the Frozen Flame', 'Outlaws of Alkenstar', 'Blood Lords',
    'Gatewalkers', 'Kingmaker (PF2e)', 'Stolen Fate', "Sky King's Tomb",
    'Season of Ghosts', 'Seven Dooms for Sandpoint', 'Curtain Call', 'Spore War',
  ],
  'Standalone Modules': [
    'We Be Goblins!', 'Emerald Spire Superdungeon', 'Thornkeep',
    'Rappan Athuk', 'Slumbering Tsar',
  ],
  'Third-Party / Unofficial': [
    'War of the Burning Sky', 'Zeitgeist', 'Razor Coast',
    'Way of the Wicked', 'Sunken Empires', 'Legendary Planet',
  ],
}

export default function Campaign({ campaign = {}, onChange, pinned, onTogglePin }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')

  const selected   = campaign.name ?? ''
  const customName = campaign.customName ?? ''
  const notes      = campaign.notes ?? ''
  const displayName = selected || customName

  const allCampaigns = Object.entries(PF_CAMPAIGNS).flatMap(([group, list]) =>
    list.map(name => ({ group, name }))
  )
  const filtered = search.trim()
    ? allCampaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : allCampaigns
  const grouped = filtered.reduce((acc, c) => {
    acc[c.group] = acc[c.group] ?? []
    acc[c.group].push(c.name)
    return acc
  }, {})

  const select = (name) => { onChange({ ...campaign, name }); setSearch('') }

  return (
    <div className="card">
      {/* Header — always visible, click to expand */}
      <button
        className="w-full flex items-center justify-between gap-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">🗺</span>
          <div className="text-left min-w-0">
            <div className="font-bold text-sm" style={{ color: 'var(--accent)', fontFamily: 'Georgia, serif' }}>Campaign</div>
            {displayName
              ? <div className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>{displayName}</div>
              : <div className="text-xs italic" style={{ color: 'var(--text-faint)' }}>No campaign set — click to set one</div>
            }
          </div>
        </div>
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-faint)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="mt-4 flex gap-3 flex-col md:flex-row">

          {/* Left — picker */}
          <div className="flex-1 rounded-lg p-3 space-y-2" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
            <div className="text-xs font-bold mb-1" style={{ color: 'var(--text-dim)' }}>Select Campaign</div>
            {selected && (
              <div className="flex items-center justify-between px-2 py-1 rounded text-xs font-bold mb-2"
                style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                <span>{selected}</span>
                <button onClick={e => { e.stopPropagation(); onChange({ ...campaign, name: '' }) }} style={{ color: 'var(--text-faint)' }}>✕</button>
              </div>
            )}
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Search campaigns..."
              className="input-field text-xs"
            />
            <div className="overflow-y-auto space-y-2" style={{ maxHeight: '200px' }}>
              {Object.entries(grouped).map(([group, names]) => (
                <div key={group}>
                  <div className="text-xs font-bold px-1 py-0.5 mb-1"
                    style={{ color: 'var(--text-faint)', borderBottom: '1px solid var(--bg-border)' }}>{group}</div>
                  {names.map(name => (
                    <button key={name} onClick={e => { e.stopPropagation(); select(name) }}
                      className="w-full text-left text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: name === selected ? 'var(--accent-dim)' : 'transparent',
                        color: name === selected ? 'var(--accent)' : 'var(--text-dim)',
                      }}>
                      {name}
                    </button>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-xs italic px-1 py-2" style={{ color: 'var(--text-faint)' }}>No matches — write it in notes</div>
              )}
            </div>
          </div>

          {/* Right — notes */}
          <div className="flex-1 rounded-lg p-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
            <div className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>Campaign Notes</div>
            <input
              type="text"
              value={customName}
              onChange={e => onChange({ ...campaign, customName: e.target.value })}
              onClick={e => e.stopPropagation()}
              placeholder="Custom name (if not in list)..."
              className="input-field text-xs"
            />
            <textarea
              value={notes}
              onChange={e => onChange({ ...campaign, notes: e.target.value })}
              onClick={e => e.stopPropagation()}
              placeholder="Session notes, party goals, current location, DM name, house rules..."
              rows={6}
              className="input-field text-xs resize-none flex-1"
            />
          </div>

        </div>
      )}
    </div>
  )
}
