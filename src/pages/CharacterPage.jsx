import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useCharacterStore } from '../store/characterStore'
import { computeClassTotals, computeConditionTotals, CONDITIONS } from '../data/pf1eData'
import SigilBackground from '../components/SigilBackground'
import PinButton from '../components/PinButton'
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

const TABS = ['Overview', 'Attacks', 'Spells', 'Skills', 'Feats & Traits', 'Equipment', 'Helper', 'Notes', '📌 Dashboard']

export default function CharacterPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { characters, updateCharacter, exportCharacter, touchCharacter } = useCharacterStore()
  const character = characters.find(c => c.id === id)
  const [activeTab, setActiveTab] = useState('Overview')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sigilSpinning, setSigilSpinning] = useState(false)

  useEffect(() => { touchCharacter(id) }, [id])
  const spinTimer = useRef(null)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSigilSpinning(true)
    clearTimeout(spinTimer.current)
    spinTimer.current = setTimeout(() => setSigilSpinning(false), 700)
  }

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

  // Compute net buff/debuff totals from all active stat buffs + active conditions
  const buffTotals = (() => {
    const t = { attackRoll:0, damage:0, ac:0, initiative:0, fort:0, ref:0, will:0, hp:0, cmb:0, str:0, dex:0, con:0, int:0, wis:0, cha:0, stealth:0 }
    ;(character.statBuffs ?? []).filter(b => b.active).forEach(b => {
      Object.keys(t).forEach(k => { t[k] += (b.mods?.[k] ?? 0) * (b.type === 'debuff' ? -1 : 1) })
    })
    const condTotals = computeConditionTotals(character.conditions ?? [])
    Object.keys(t).forEach(k => { t[k] += condTotals[k] ?? 0 })
    return t
  })()

  // Active conditions for header display
  const activeConditions = CONDITIONS.filter(c => (character.conditions ?? []).includes(c.id))

  // ── Multiclass computed totals ─────────────────────────────────────────────
  const classTotals = computeClassTotals(character.classes ?? [])
  const hasClasses  = (character.classes ?? []).length > 0
  // If classes are set, use computed BAB and base saves; otherwise fall back to manual
  const computedBAB       = hasClasses ? classTotals.totalBAB : null
  const computedSaveBases = hasClasses ? { fort: classTotals.totalFort, ref: classTotals.totalRef, will: classTotals.totalWill } : null
  const favoredHP         = classTotals.totalFavoredHP

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
        <div className="top-bar px-4 py-3 flex items-center justify-between relative overflow-hidden">
          <div className="absolute" style={{ width: '33%', height: 'auto', top: '50%', left: '0', transform: 'translateY(-50%)', zIndex: 0 }}>
            <SigilBackground size={null} opacity={0.18} pulse rotate spinning={sigilSpinning} />
          </div>
          <div className="flex items-center gap-3 min-w-0 relative z-10">
            <button onClick={() => navigate('/')} className="text-sm flex-shrink-0" style={{ color: 'var(--text-dim)' }}>← Back</button>
            <div className="w-px h-5 flex-shrink-0" style={{ backgroundColor: 'var(--bg-border)' }} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold truncate" style={{ color: 'var(--accent)', fontFamily: 'Georgia, serif' }}>
                  {character.name || 'Unnamed Hero'}
                </span>
                {activeConditions.map(c => (
                  <span key={c.id} className="condition-blink text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ color: c.color, border: `1px solid ${c.color}`, backgroundColor: `${c.color}18`, '--blink-color': c.color }}>
                    {c.icon} {c.label}
                  </span>
                ))}
              </div>
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {hasClasses
                  ? (character.classes ?? []).map(c => `${c.className} ${c.level}`).join(' / ')
                  : (character.class || '—')
                }
                {' '}• Lvl {hasClasses ? classTotals.totalLevel : (character.level || '?')}
                {character.race ? ` • ${character.race}` : ''}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 relative z-10">
            <button onClick={() => exportCharacter(id)} className="btn-secondary text-xs py-1 px-3">Export</button>
            <button onClick={() => setSettingsOpen(true)} className="btn-secondary text-xs py-1 px-3" title="Settings">⚙️</button>
          </div>
        </div>

        <div className="tab-bar px-4 flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => handleTabChange(tab)} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}>
              {tab}
              {tab === 'Buff & Debuff' && character.class?.toLowerCase() === 'bard' && (
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
      <div key={activeTab} className="tab-content max-w-6xl mx-auto p-4 space-y-4">

        {activeTab === '📌 Dashboard' && (
          <Dashboard character={character} onChange={update} />
        )}

        {activeTab === 'Overview' && (
          <>
            <BasicInfo character={character} onChange={update} pinned={pinnedMap.basicInfo} onTogglePin={() => toggleSectionPin('basicInfo')} />
            <AbilityScores
              abilities={character.abilities}
              onChange={updateAbility}
              pinned={pinnedMap.abilities}
              onTogglePin={() => toggleSectionPin('abilities')}
              buffTotals={buffTotals}
            />
            <CombatStats
              character={character}
              onChange={update}
              pins={pinnedMap}
              onTogglePin={toggleSectionPin}
              buffTotals={buffTotals}
              armorProps={character.armorProps ?? {}}
              computedBAB={computedBAB}
              computedSaveBases={computedSaveBases}
              favoredHP={favoredHP}
            />
          </>
        )}

        {activeTab === 'Attacks' && (
          <Attacks
            character={character}
            onChange={update}
            pinned={pinnedMap.attacks}
            onTogglePin={() => toggleSectionPin('attacks')}
            buffTotals={buffTotals}
            computedBAB={computedBAB}
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
            armorCheckPenalty={character.armorProps?.checkPenalty ?? 0}
            buffTotals={buffTotals}
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

        {activeTab === 'Helper' && (
          <BuffTracker
            character={character}
            onChange={update}
            pins={pinnedMap}
            onTogglePin={toggleSectionPin}
          />
        )}

        {activeTab === 'Notes' && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title mb-0">Notes</h2>
              <PinButton pinned={pinnedMap.notes} onToggle={() => toggleSectionPin('notes')} />
            </div>
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
