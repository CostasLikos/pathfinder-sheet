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
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div
            onClick={() => portraitRef.current.click()}
            className="w-24 h-24 rounded border-2 border-dashed border-pf-border hover:border-pf-gold cursor-pointer overflow-hidden flex items-center justify-center bg-pf-darker transition-colors"
          >
            {character.portrait
              ? <img src={character.portrait} alt="" className="w-full h-full object-cover" />
              : <span className="text-4xl">🧙</span>
            }
          </div>
          <button onClick={() => portraitRef.current.click()} className="text-xs text-gray-400 hover:text-pf-gold transition-colors">
            {character.portrait ? 'Change' : 'Add Photo'}
          </button>
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
        </div>
      </div>
    </div>
  )
}
