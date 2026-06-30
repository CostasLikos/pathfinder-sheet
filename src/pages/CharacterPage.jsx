import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCharacterStore } from '../store/characterStore'
import BasicInfo from '../components/sheet/BasicInfo'
import AbilityScores from '../components/sheet/AbilityScores'
import CombatStats from '../components/sheet/CombatStats'
import Skills from '../components/sheet/Skills'
import FeatsTraits from '../components/sheet/FeatsTraits'
import Attacks from '../components/sheet/Attacks'
import Spells from '../components/sheet/Spells'
import BuffTracker from '../components/sheet/BuffTracker'
import Equipment from '../components/sheet/Equipment'
import Dashboard from '../components/sheet/Dashboard'
import SettingsPanel from '../components/SettingsPanel'

const TABS = ['📌 Dashboard', 'Overview', 'Attacks', 'Spells', 'Skills', 'Feats & Traits', 'Equipment', 'Buffs & Tracking', 'Notes']

export default function CharacterPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getCharacter, updateCharacter, exportCharacter } = useCharacterStore()
  const character = getCharacter(id)
  const [activeTab, setActiveTab] = useState('Overview')
  const [settingsOpen, setSettingsOpen] = useState(false)

  if (!character) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>Character not found.</p>
          <button onClick={() => navigate('/')} className="btn-primary">Back to Home</button>
        </div>
      </div>
    )
  }

  const update = (field, value) => updateCharacter(id, { [field]: value })
  const updateAbility = (ab, value) => updateCharacter(id, { abilities: { ...character.abilities, [ab]: value } })

  // ── Pin helpers ────────────────────────────────────────────────────────────
  const pins = character.pins ?? { sections: [], skills: [] }

  const toggleSectionPin = (sectionId) => {
    const sections = pins.sections ?? []
    const next = sections.includes(sectionId)
      ? sections.filter(s => s !== sectionId)
      : [...sections, sectionId]
    update('pins', { ...pins, sections: next })
  }

  const toggleSkillPin = (skillKey) => {
    const skills = pins.skills ?? []
    const next = skills.includes(skillKey)
      ? skills.filter(k => k !== skillKey)
      : [...skills, skillKey]
    update('pins', { ...pins, skills: next })
  }

  // Build a pins lookup for easy prop passing { hp: true, ac: true, ... }
  const pinnedMap = Object.fromEntries((pins.sections ?? []).map(s => [s, true]))

  return (
    <div className="min-h-screen page-bg">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Sticky header: topbar + tabs */}
      <div className="sticky top-0 z-20">
        <div className="top-bar px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/')} className="text-sm flex-shrink-0" style={{ color: 'var(--text-dim)' }}>← Back</button>
            <div className="w-px h-5 flex-shrink-0" style={{ backgroundColor: 'var(--bg-border)' }} />
            <div className="min-w-0">
              <span className="font-bold truncate block" style={{ color: 'var(--accent)', fontFamily: 'Georgia, serif' }}>
                {character.name || 'Unnamed Hero'}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {character.class || '—'} {character.level ? `• Lvl ${character.level}` : ''} {character.race ? `• ${character.race}` : ''}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => exportCharacter(id)} className="btn-secondary text-xs py-1 px-3">Export</button>
            <button onClick={() => setSettingsOpen(true)} className="btn-secondary text-xs py-1 px-3" title="Settings">⚙️</button>
          </div>
        </div>

        <div className="tab-bar px-4 flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}>
              {tab}
              {tab === 'Buffs & Tracking' && character.class?.toLowerCase() === 'bard' && (
                <span className="ml-1 text-xs px-1 rounded" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}>🎶</span>
              )}
              {tab === '📌 Dashboard' && (pins.sections?.length > 0 || pins.skills?.length > 0) && (
                <span className="ml-1 text-xs px-1 rounded" style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  {(pins.sections?.length ?? 0) + (pins.skills?.length > 0 ? 1 : 0)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-6xl mx-auto p-4 space-y-4">

        {activeTab === '📌 Dashboard' && (
          <Dashboard character={character} onChange={update} />
        )}

        {activeTab === 'Overview' && (
          <>
            <BasicInfo character={character} onChange={update} />
            <AbilityScores
              abilities={character.abilities}
              onChange={updateAbility}
              pinned={pinnedMap.abilities}
              onTogglePin={() => toggleSectionPin('abilities')}
            />
            <CombatStats
              character={character}
              onChange={update}
              pins={pinnedMap}
              onTogglePin={toggleSectionPin}
            />
          </>
        )}

        {activeTab === 'Attacks' && (
          <Attacks
            character={character}
            onChange={update}
            pinned={pinnedMap.attacks}
            onTogglePin={() => toggleSectionPin('attacks')}
          />
        )}

        {activeTab === 'Spells' && (
          <Spells
            character={character}
            onChange={update}
            pins={pinnedMap}
            onTogglePin={toggleSectionPin}
          />
        )}

        {activeTab === 'Skills' && (
          <Skills
            character={character}
            onChange={update}
            pinnedSkills={pins.skills ?? []}
            onToggleSkillPin={toggleSkillPin}
          />
        )}

        {activeTab === 'Feats & Traits' && (
          <FeatsTraits
            character={character}
            onChange={update}
            pins={pinnedMap}
            onTogglePin={toggleSectionPin}
          />
        )}

        {activeTab === 'Equipment' && (
          <Equipment
            character={character}
            onChange={update}
            pins={pinnedMap}
            onTogglePin={toggleSectionPin}
          />
        )}

        {activeTab === 'Buffs & Tracking' && (
          <BuffTracker
            character={character}
            onChange={update}
            pins={pinnedMap}
            onTogglePin={toggleSectionPin}
          />
        )}

        {activeTab === 'Notes' && (
          <div className="card">
            <h2 className="section-title">Notes</h2>
            <textarea
              value={character.notes || ''}
              onChange={e => update('notes', e.target.value)}
              placeholder="Write anything here — backstory, party notes, quest info..."
              rows={20}
              className="input-field resize-none text-sm leading-relaxed"
            />
          </div>
        )}
      </div>
    </div>
  )
}
