import { ABILITY_NAMES, abilityMod, formatMod } from '../../data/pf1eData'
import PinButton from '../PinButton'
import SpinnerInput from '../SpinnerInput'

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export default function AbilityScores({ abilities, onChange, pinned, onTogglePin }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-0">
        <h2 className="section-title mb-0">Ability Scores</h2>
        {onTogglePin && <PinButton pinned={pinned} onToggle={onTogglePin} />}
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-3">
        {ABILITIES.map(ab => {
          const score = abilities[ab] ?? 10
          const mod = abilityMod(score)
          return (
            <div key={ab} className="stat-box flex flex-col items-center gap-2">
              <span className="text-xs font-bold uppercase" style={{ color: 'var(--accent)' }}>{ab}</span>
              <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{score}</div>
              <SpinnerInput
                value={score}
                onChange={v => onChange(ab, Math.max(1, Math.min(30, v)))}
                min={1} max={30}
                width="w-10"
              />
              <div className="text-lg font-bold" style={{ color: mod >= 0 ? 'var(--positive)' : '#ef4444' }}>
                {formatMod(mod)}
              </div>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{ABILITY_NAMES[ab].slice(0, 3)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
