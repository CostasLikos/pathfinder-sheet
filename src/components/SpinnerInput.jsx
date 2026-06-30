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

  const btnStyle = {
    backgroundColor: 'transparent',
    color: 'var(--accent)',
    border: '1px solid var(--bg-border)',
    lineHeight: 1,
    cursor: 'pointer',
    transition: 'all 0.15s',
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={dec}
        className="h-5 w-5 flex items-center justify-center rounded-full text-xs font-bold select-none"
        style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--bg-darker)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--bg-border)' }}
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
        className={`${width} h-5 text-center text-xs font-bold focus:outline-none rounded`}
        style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--text)', border: '1px solid var(--bg-border)' }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
      />
      <button
        onClick={inc}
        className="h-5 w-5 flex items-center justify-center rounded-full text-xs font-bold select-none"
        style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--bg-darker)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--bg-border)' }}
      >+</button>
    </div>
  )
}
