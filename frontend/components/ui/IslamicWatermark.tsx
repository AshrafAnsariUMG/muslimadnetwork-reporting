export default function IslamicWatermark() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.025,
      }}
    >
      <defs>
        <pattern
          id="islamic-geo"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          {/* Square 1: axis-aligned, centered at (20,20) */}
          <rect
            x="12" y="8" width="16" height="24"
            fill="none"
            stroke="#1a4a2e"
            strokeWidth="0.8"
          />
          {/* Square 2: rotated 45° around (20,20) — diamond */}
          <polygon
            points="22.83,5.86 34.14,17.17 17.17,34.14 5.86,22.83"
            fill="none"
            stroke="#1a4a2e"
            strokeWidth="0.8"
          />
          {/* Lattice corner dots for continuity */}
          <circle cx="0"  cy="0"  r="0.6" fill="#1a4a2e" />
          <circle cx="40" cy="0"  r="0.6" fill="#1a4a2e" />
          <circle cx="0"  cy="40" r="0.6" fill="#1a4a2e" />
          <circle cx="40" cy="40" r="0.6" fill="#1a4a2e" />
          <circle cx="20" cy="20" r="0.6" fill="#1a4a2e" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic-geo)" />
    </svg>
  )
}
