export default function PinButton({ pinned, onToggle, className = '' }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle() }}
      title={pinned ? 'Unpin from Dashboard' : 'Pin to Dashboard'}
      className={`flex-shrink-0 text-base leading-none transition-all ${className}`}
      style={{
        color: pinned ? 'var(--accent)' : 'var(--text-faint)',
        opacity: pinned ? 1 : 0.4,
        filter: pinned ? 'none' : 'grayscale(1)',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.filter = 'none' }}
      onMouseLeave={e => {
        if (!pinned) { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.filter = 'grayscale(1)' }
      }}
    >
      📌
    </button>
  )
}
