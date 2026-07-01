export default function SigilBackground({
  size = 400,
  opacity = 0.07,
  color = 'var(--accent)',
  className = '',
  style = {},
  pulse = false,
  pulseFast = false,
  rotate = false,     // enable rotation animation
  spinning = false,   // true = fast spin burst (tab change)
}) {
  const pulseClass = pulseFast
    ? 'sigil-pulse-fast'
    : pulse && rotate
      ? 'sigil-pulse'
      : pulse
        ? 'sigil-pulse-static'
        : ''
  const opacityLow    = opacity
  const opacityHigh   = Math.min(1, opacity * 2.2)
  // Strip transform out of style so it doesn't override the rotation animation.
  // We pass it as --sigil-base-transform so the keyframe can include it.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size ?? undefined}
      height={size ?? undefined}
      aria-hidden="true"
      className={`pointer-events-none select-none ${pulseClass} ${className}`}
      style={{
        opacity,
        '--sigil-opacity-low':  opacityLow,
        '--sigil-opacity-high': opacityHigh,
        '--sigil-spin-dur':     spinning ? '0.6s' : '40s',
        transformOrigin:        'center center',
        ...style,
      }}
    >
      <circle cx="256" cy="256" r="226" fill="none" stroke={color} strokeWidth="6"/>
      <circle cx="256" cy="256" r="198" fill="none" stroke={color} strokeWidth="3"/>

      <text x="256" y="44"  textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia,serif" fontSize="34" fill={color}>מ</text>
      <text x="470" y="260" textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia,serif" fontSize="34" fill={color}>פ</text>
      <text x="256" y="472" textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia,serif" fontSize="34" fill={color}>י</text>
      <text x="42"  y="260" textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia,serif" fontSize="34" fill={color}>ז</text>

      <g transform="translate(256,256)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="-128,0 30,-106 30,106" stroke={color} strokeWidth="5.5"/>
        <line x1="52" y1="-148" x2="52" y2="152" stroke={color} strokeWidth="7.5"/>
        <line x1="6"  y1="-86"  x2="116" y2="-86" stroke={color} strokeWidth="6.5"/>
        <line x1="116" y1="-112" x2="116" y2="-60" stroke={color} strokeWidth="6"/>
        <line x1="98"  y1="-112" x2="134" y2="-112" stroke={color} strokeWidth="5"/>
        <line x1="98"  y1="-60"  x2="134" y2="-60"  stroke={color} strokeWidth="5"/>
        <line x1="116" y1="-30"  x2="116" y2="106"  stroke={color} strokeWidth="6"/>
        <line x1="52"  y1="-30"  x2="116" y2="-30"  stroke={color} strokeWidth="5.5"/>
        <line x1="52"  y1="10"   x2="116" y2="10"   stroke={color} strokeWidth="5.5"/>
        <line x1="52"  y1="50"   x2="116" y2="50"   stroke={color} strokeWidth="5.5"/>
        <line x1="52"  y1="90"   x2="116" y2="90"   stroke={color} strokeWidth="5.5"/>
        <line x1="36"  y1="30"   x2="134" y2="30"   stroke={color} strokeWidth="6"/>
        <line x1="84"  y1="0"    x2="84"  y2="60"   stroke={color} strokeWidth="6"/>
        <path d="M30,126 L64,106 L70,148 Z" stroke={color} strokeWidth="4"/>
        <line x1="-90" y1="40"  x2="-48" y2="40"  stroke={color} strokeWidth="4.5"/>
        <line x1="-90" y1="40"  x2="-48" y2="76"  stroke={color} strokeWidth="4.5"/>
        <line x1="-90" y1="76"  x2="-48" y2="76"  stroke={color} strokeWidth="4.5"/>
        <path d="M52,152 Q32,170 10,160 Q-12,148 -4,130" stroke={color} strokeWidth="3.5"/>
      </g>
    </svg>
  )
}
