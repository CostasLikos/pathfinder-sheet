import { ALIGNMENTS, RACES, CLASSES } from '../../data/pf1eData'
import { useRef } from 'react'

export default function BasicInfo({ character, onChange }) {
  const portraitRef = useRef()

  const handlePortrait = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange('portrait', ev.target.result)
    reader.readAsDataURL(file)
  }

  const field = (label, key, type = 'text', options = null) => (
    <div className="flex flex-col gap-1">
      <label className="text-gray-400 text-xs uppercase tracking-wide">{label}</label>
      {options ? (
        <select
          value={character[key] || ''}
          onChange={e => onChange(key, e.target.value)}
          className="input-field text-sm"
        >
          <option value="">— Select —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={character[key] || ''}
          onChange={e => onChange(key, type === 'number' ? Number(e.target.value) : e.target.value)}
          className="input-field text-sm"
        />
      )}
    </div>
  )

  return (
    <div className="card">
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
            {/* overlay label */}
            <div className="absolute bottom-0 left-0 right-0 text-center py-0.5" style={{
              backgroundColor: 'rgba(0,0,0,0.55)',
              fontSize: '0.6rem',
              color: 'var(--text-dim)',
              letterSpacing: '0.05em',
            }}>
              {character.portrait ? 'change' : 'add photo'}
            </div>
          </div>
          <input ref={portraitRef} type="file" accept="image/*" className="hidden" onChange={handlePortrait} />
        </div>

        {/* Fields */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
          {field('Character Name', 'name')}
          {field('Player Name', 'playerName')}
          {field('Level', 'level', 'number')}
          {field('Race', 'race', 'text', RACES)}
          {field('Class', 'class', 'text', CLASSES)}
          {field('Alignment', 'alignment', 'text', ALIGNMENTS)}
          {field('Deity', 'deity')}
          {field('Homeland', 'homeland')}
          {field('Experience', 'experience', 'number')}
          {field('Age', 'age', 'number')}
          {field('Gender', 'gender')}
          {field('Size', 'size', 'text', ['Fine','Diminutive','Tiny','Small','Medium','Large','Huge','Gargantuan','Colossal'])}
          {field('Height', 'height')}
          {field('Weight', 'weight')}
          {field('Background Occupation', 'background')}
          <div className="col-span-2 md:col-span-3 flex flex-col gap-1">
            <label className="text-gray-400 text-xs uppercase tracking-wide">Languages</label>
            <input
              type="text"
              value={character.languages || ''}
              onChange={e => onChange('languages', e.target.value)}
              placeholder="e.g. Common, Elvish, Draconic..."
              className="input-field text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
