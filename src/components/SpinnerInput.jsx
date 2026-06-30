export default function SpinnerInput({ value, onChange, min, max, step = 1, className = '', width = 'w-12' }) {
  const dec = () => {
    const next = value - step
    if (min !== undefined && next < min) return
    onChange(next)
  }
  const inc = () => {
    const next = value + step
    if (max !== undefined && next > max) return
    onChange(next)
  }

  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={dec}
        className="h-7 w-7 flex items-center justify-center rounded-l text-base font-bold select-none transition-colors"
        style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--accent)', border: '1px solid var(--bg-border)', borderRight: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent-dim)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--bg-border)' }}
      >−</button>
      <input
        type="number"
        value={value}
        onChange={e => {
          const v = Number(e.target.value)
          if (min !== undefined && v < min) return
          if (max !== undefined && v > max) return
          onChange(v)
        }}
        className={`${width} h-7 text-center text-sm font-bold focus:outline-none`}
        style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text)', border: '1px solid var(--bg-border)' }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
      />
      <button
        onClick={inc}
        className="h-7 w-7 flex items-center justify-center rounded-r text-base font-bold select-none transition-colors"
        style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--accent)', border: '1px solid var(--bg-border)', borderLeft: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent-dim)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--bg-border)' }}
      >+</button>
    </div>
  )
}
