import { ALIGNMENTS, RACES, CLASSES, CLASS_DATA, computeClassTotals } from '../../data/pf1eData'
import { useRef, useState } from 'react'
import PinButton from '../PinButton'

const emptyClassEntry = (isFavored = false) => ({
  id: crypto.randomUUID(),
  className: 'Fighter',
  level: 1,
  isFavored,
  favoredHP: 0,
  favoredSkill: 0,
})

function ClassEntry({ entry, index, total, onChange, onRemove, canRemoveFavored }) {
  const data  = CLASS_DATA[entry.className] ?? CLASS_DATA.Other
  const lvl   = entry.level ?? 1
  const favTotal = (entry.favoredHP ?? 0) + (entry.favoredSkill ?? 0)
  const maxFav   = entry.isFavored ? lvl : 0
  const remaining = maxFav - favTotal

  const set = (key, val) => onChange({ ...entry, [key]: val })

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: 'var(--bg-surface)', border: `1px solid ${entry.isFavored ? 'var(--accent)' : 'var(--bg-border)'}` }}>
      <div className="flex items-center gap-2 flex-wrap">

        {/* Favored class star */}
        <button
          onClick={() => {
            const becomingFavored = !entry.isFavored
            onChange({ ...entry, isFavored: becomingFavored, favoredHP: 0, favoredSkill: 0 })
          }}
          title={entry.isFavored ? 'Favored class (click to unset)' : 'Set as favored class'}
          className="text-lg flex-shrink-0"
          style={{ color: entry.isFavored ? 'var(--accent)' : 'var(--text-faint)' }}
        >★</button>

        {/* Class selector */}
        <select
          value={entry.className}
          onChange={e => set('className', e.target.value)}
          className="flex-1 text-sm px-2 py-1 rounded focus:outline-none font-bold"
          style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text)', border: '1px solid var(--bg-border)', minWidth: '120px' }}
        >
          {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Level */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => set('level', Math.max(1, lvl-1))} className="w-6 h-6 flex items-center justify-center rounded text-sm" style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}>−</button>
          <input
            type="number" min={1} max={20} value={lvl}
            onChange={e => set('level', Math.max(1, Math.min(20, Number(e.target.value))))}
            className="w-10 text-center text-sm font-bold focus:outline-none rounded"
            style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--accent)', border: '1px solid var(--bg-border)' }}
          />
          <button onClick={() => set('level', Math.min(20, lvl+1))} className="w-6 h-6 flex items-center justify-center rounded text-sm" style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text)' }}>+</button>
        </div>

        {/* Class stats badges */}
        <div className="flex gap-1 flex-wrap">
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}>
            d{data.hd}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}>
            {data.bab === 'full' ? 'Full BAB' : data.bab === 'mid' ? '¾ BAB' : '½ BAB'}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text-dim)', border: '1px solid var(--bg-border)' }}>
            {data.skillsPerLevel}+Int skills
          </span>
        </div>

        {onRemove && (
          <button onClick={onRemove} className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: '#ef4444', border: '1px solid var(--bg-border)' }}>✕</button>
        )}
      </div>

      {/* Favored class bonus tracker */}
      {entry.isFavored && (
        <div className="flex items-center gap-3 flex-wrap pt-1" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>★ Favored Bonus ({remaining >= 0 ? remaining : 0} unspent / {maxFav} levels)</span>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>+HP:</span>
            <button onClick={() => set('favoredHP', Math.max(0, (entry.favoredHP??0)-1))} className="w-5 h-5 flex items-center justify-center rounded text-xs" style={{ backgroundColor:'var(--bg-border)', color:'var(--text)' }}>−</button>
            <span className="text-sm font-bold w-5 text-center" style={{ color: (entry.favoredHP??0)>0 ? 'var(--positive)' : 'var(--text-faint)' }}>{entry.favoredHP??0}</span>
            <button
              onClick={() => favTotal < maxFav && set('favoredHP', (entry.favoredHP??0)+1)}
              className="w-5 h-5 flex items-center justify-center rounded text-xs"
              style={{ backgroundColor:'var(--bg-border)', color: favTotal < maxFav ? 'var(--text)' : 'var(--text-faint)' }}
            >+</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>+Skill Rank:</span>
            <button onClick={() => set('favoredSkill', Math.max(0, (entry.favoredSkill??0)-1))} className="w-5 h-5 flex items-center justify-center rounded text-xs" style={{ backgroundColor:'var(--bg-border)', color:'var(--text)' }}>−</button>
            <span className="text-sm font-bold w-5 text-center" style={{ color: (entry.favoredSkill??0)>0 ? 'var(--positive)' : 'var(--text-faint)' }}>{entry.favoredSkill??0}</span>
            <button
              onClick={() => favTotal < maxFav && set('favoredSkill', (entry.favoredSkill??0)+1)}
              className="w-5 h-5 flex items-center justify-center rounded text-xs"
              style={{ backgroundColor:'var(--bg-border)', color: favTotal < maxFav ? 'var(--text)' : 'var(--text-faint)' }}
            >+</button>
          </div>
          {remaining < 0 && (
            <span className="text-xs" style={{ color: '#ef4444' }}>Over budget by {Math.abs(remaining)}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default function BasicInfo({ character, onChange, pinned, onTogglePin }) {
  const portraitRef = useRef()
  const [classesOpen, setClassesOpen] = useState(true)

  const handlePortrait = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange('portrait', ev.target.result)
    reader.readAsDataURL(file)
  }

  // Migrate legacy class/level to classes array if needed
  const classes = (() => {
    if ((character.classes ?? []).length > 0) return character.classes
    if (character.class) return [emptyClassEntry(true)].map(e => ({ ...e, className: character.class, level: character.level ?? 1, isFavored: true }))
    return []
  })()

  const totals = computeClassTotals(classes)
  const hasFavored = classes.some(c => c.isFavored)

  const updateClasses = (next) => {
    onChange('classes', next)
    // Keep legacy fields in sync
    if (next.length > 0) {
      onChange('level', totals.totalLevel)
      onChange('class', next.map(c => `${c.className} ${c.level}`).join(' / '))
    }
  }

  const addClass = () => {
    updateClasses([...classes, emptyClassEntry(!hasFavored)])
  }

  const updateEntry = (index, entry) => {
    // Only one class can be favored
    let next = classes.map((c, i) => i === index ? entry : c)
    if (entry.isFavored) next = next.map((c, i) => i === index ? c : { ...c, isFavored: false, favoredHP: 0, favoredSkill: 0 })
    updateClasses(next)
  }

  const removeClass = (index) => updateClasses(classes.filter((_, i) => i !== index))

  const field = (label, key, type = 'text', options = null) => (
    <div className="flex flex-col gap-1">
      <label className="text-gray-400 text-xs uppercase tracking-wide">{label}</label>
      {options ? (
        <select value={character[key] || ''} onChange={e => onChange(key, e.target.value)} className="input-field text-sm">
          <option value="">— Select —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={character[key] || ''} onChange={e => onChange(key, type === 'number' ? Number(e.target.value) : e.target.value)} className="input-field text-sm" />
      )}
    </div>
  )

  const SaveBadge = ({ label, val, type }) => (
    <div className="text-center">
      <div className="text-xs mb-0.5" style={{ color: type === 'good' ? 'var(--positive)' : 'var(--text-faint)' }}>{label}</div>
      <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>{val >= 0 ? `+${val}` : val}</div>
      <div className="text-xs" style={{ color: type === 'good' ? 'var(--positive)' : 'var(--text-faint)' }}>{type}</div>
    </div>
  )

  return (
    <div className="card">
      {onTogglePin && (
        <div className="flex justify-end mb-2">
          <PinButton pinned={pinned} onToggle={onTogglePin} />
        </div>
      )}
      <div className="flex gap-4">
        {/* Portrait */}
        <div className="relative flex-shrink-0 self-stretch" style={{ width: '120px' }}>
          <div
            onClick={() => portraitRef.current.click()}
            className="w-full h-full rounded border-2 border-dashed cursor-pointer overflow-hidden flex items-center justify-center transition-colors group"
            style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-darker)', minHeight: '100%' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bg-border)'}
          >
            {character.portrait
              ? <img src={character.portrait} alt="" className="w-full h-full object-cover" />
              : <span className="text-4xl">🧙</span>
            }
            <div className="absolute bottom-0 left-0 right-0 text-center py-0.5" style={{ backgroundColor:'rgba(0,0,0,0.55)', fontSize:'0.6rem', color:'var(--text-dim)', letterSpacing:'0.05em' }}>
              {character.portrait ? 'change' : 'add photo'}
            </div>
          </div>
          <input ref={portraitRef} type="file" accept="image/*" className="hidden" onChange={handlePortrait} />
        </div>

        {/* Fields */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
          {field('Character Name', 'name')}
          {field('Player Name', 'playerName')}
          {field('Race', 'race', 'text', RACES)}
          {field('Alignment', 'alignment', 'text', ALIGNMENTS)}
          {field('Deity', 'deity')}
          {field('Homeland', 'homeland')}
          {field('Experience', 'experience', 'number')}
          {field('Age', 'age', 'number')}
          {field('Gender', 'gender')}
          {field('Size', 'size', 'text', ['Fine','Diminutive','Tiny','Small','Medium','Large','Huge','Gargantuan','Colossal'])}
          {field('Height', 'height')}
          {field('Weight', 'weight')}
          {field('Background', 'background')}
          {field('Drawbacks', 'drawbacks')}
          <div className="col-span-2 md:col-span-3 flex flex-col gap-1">
            <label className="text-gray-400 text-xs uppercase tracking-wide">Languages</label>
            <input type="text" value={character.languages||''} onChange={e => onChange('languages', e.target.value)} placeholder="e.g. Common, Elvish, Draconic..." className="input-field text-sm" />
          </div>
          <div className="col-span-2 md:col-span-3 flex flex-col gap-1">
            <label className="text-gray-400 text-xs uppercase tracking-wide">Description</label>
            <textarea
              value={character.description || ''}
              onChange={e => {
                onChange('description', e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              onFocus={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
              placeholder="Appearance, personality, mannerisms..."
              rows={2}
              className="input-field text-sm resize-none overflow-hidden"
              style={{ minHeight: '2.5rem', transition: 'height 0.1s ease' }}
            />
          </div>
        </div>
      </div>

      {/* ── Multiclass Manager ── */}
      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--bg-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setClassesOpen(o => !o)}
            className="flex items-center gap-2 text-left"
          >
            <span className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
              {classesOpen ? '▾' : '▸'} Classes
            </span>
            {totals.totalLevel > 0 && (
              <span className="text-xs font-normal" style={{ color: 'var(--text-dim)' }}>
                {(character.classes ?? []).map(c => `${c.className} ${c.level}`).join(' / ')} — Lvl {totals.totalLevel}
              </span>
            )}
          </button>
          <div className="flex gap-2">
            {classesOpen && <button onClick={addClass} className="btn-primary text-xs py-1 px-3">+ Add Class</button>}
          </div>
        </div>

        {classesOpen && classes.length === 0 && (
          <div className="text-center py-4 text-sm" style={{ color: 'var(--text-faint)' }}>
            No classes yet. Click <strong>+ Add Class</strong> to get started.
          </div>
        )}

        {classesOpen && <div className="space-y-2">
          {classes.map((entry, i) => (
            <ClassEntry
              key={entry.id}
              entry={entry}
              index={i}
              total={classes.length}
              onChange={(updated) => updateEntry(i, updated)}
              onRemove={classes.length > 1 ? () => removeClass(i) : null}
            />
          ))}
        </div>}

        {/* Computed totals */}
        {classesOpen && totals.totalLevel > 0 && (
          <div className="mt-3 pt-3 rounded-lg p-3" style={{ backgroundColor: 'var(--bg-darker)', border: '1px solid var(--bg-border)' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Total Level</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{totals.totalLevel}</div>
              </div>
              <div className="text-center">
                <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Base Attack Bonus</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>+{totals.totalBAB}</div>
                {totals.totalBAB >= 6  && <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>+{totals.totalBAB}/+{totals.totalBAB-5}{totals.totalBAB>=11?`/+${totals.totalBAB-10}`:''}{ totals.totalBAB>=16?`/+${totals.totalBAB-15}`:''}</div>}
              </div>
              <div className="text-center">
                <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Skills / Level</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{Math.round(totals.totalSkillsPerLevel / Math.max(1, totals.totalLevel))}+Int</div>
              </div>
              <div className="text-center">
                <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Favored Bonus</div>
                <div className="text-sm font-bold" style={{ color: 'var(--positive)' }}>
                  {totals.totalFavoredHP > 0 && <div>+{totals.totalFavoredHP} HP</div>}
                  {totals.totalFavoredSkill > 0 && <div>+{totals.totalFavoredSkill} Skill Rank{totals.totalFavoredSkill!==1?'s':''}</div>}
                  {totals.totalFavoredHP === 0 && totals.totalFavoredSkill === 0 && <div style={{ color:'var(--text-faint)' }}>None</div>}
                </div>
              </div>
            </div>

            {/* Save progressions */}
            <div className="mt-3 pt-3 flex justify-around" style={{ borderTop: '1px solid var(--bg-border)' }}>
              {classes.map(c => {
                const data = CLASS_DATA[c.className] ?? CLASS_DATA.Other
                return (
                  <div key={c.id} className="text-center">
                    <div className="text-xs font-bold mb-1" style={{ color: 'var(--accent)' }}>{c.className} {c.level}</div>
                    <div className="flex gap-3 text-xs justify-center">
                      <span style={{ color: data.fort==='good' ? 'var(--positive)' : 'var(--text-faint)' }}>Fort {data.fort==='good' ? `+${Math.floor(c.level/2)+2}` : `+${Math.floor(c.level/3)}`}</span>
                      <span style={{ color: data.ref==='good'  ? 'var(--positive)' : 'var(--text-faint)' }}>Ref  {data.ref==='good'  ? `+${Math.floor(c.level/2)+2}` : `+${Math.floor(c.level/3)}`}</span>
                      <span style={{ color: data.will==='good' ? 'var(--positive)' : 'var(--text-faint)' }}>Will {data.will==='good' ? `+${Math.floor(c.level/2)+2}` : `+${Math.floor(c.level/3)}`}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total saves */}
            <div className="mt-2 flex justify-center gap-8">
              <div className="text-center">
                <div className="text-xs" style={{ color:'var(--text-faint)' }}>Total Fort</div>
                <div className="font-bold text-lg" style={{ color:'var(--text)' }}>+{totals.totalFort}</div>
              </div>
              <div className="text-center">
                <div className="text-xs" style={{ color:'var(--text-faint)' }}>Total Ref</div>
                <div className="font-bold text-lg" style={{ color:'var(--text)' }}>+{totals.totalRef}</div>
              </div>
              <div className="text-center">
                <div className="text-xs" style={{ color:'var(--text-faint)' }}>Total Will</div>
                <div className="font-bold text-lg" style={{ color:'var(--text)' }}>+{totals.totalWill}</div>
              </div>
            </div>
            <div className="text-xs text-center mt-1" style={{ color:'var(--text-faint)' }}>
              Base save values only — add CON/DEX/WIS mods and enhancements in Combat Stats
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
