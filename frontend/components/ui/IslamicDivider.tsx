'use client'

// Compute 8-pointed star path (two overlapping squares rotated 45°)
// centered at (cx, cy) with outer tip radius r
function octagram(cx: number, cy: number, r: number): string {
  const ri = r * 0.414 // inner valley radius
  const pts: string[] = []
  for (let i = 0; i < 16; i++) {
    const a = (i * 22.5 - 90) * (Math.PI / 180)
    const rad = i % 2 === 0 ? r : ri
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`)
  }
  return `M${pts[0]}L${pts.slice(1).join('L')}Z`
}

interface Props {
  variant?: 'full' | 'simple'
}

const GOLD = '#C9A84C'
const H = 32
const CY = H / 2   // 16
const TILE = 60     // pattern tile width in px

// Band pattern defs — inline per SVG to avoid global ID collisions
function BandPattern({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={id} x="0" y="0" width={TILE} height={H} patternUnits="userSpaceOnUse">
        <line x1="0" y1={CY - 2} x2={TILE} y2={CY - 2} stroke={GOLD} strokeWidth="0.5" />
        <line x1="0" y1={CY + 2} x2={TILE} y2={CY + 2} stroke={GOLD} strokeWidth="0.5" />
        <path d={octagram(TILE / 2, CY, 5)} fill={GOLD} fillOpacity="0.85" />
      </pattern>
    </defs>
  )
}

export default function IslamicDivider({ variant = 'simple' }: Props) {
  if (variant === 'full') {
    return (
      <div className="px-5" style={{ opacity: 0.35 }}>
        <div style={{ display: 'flex', alignItems: 'center', height: H }}>
          {/* Left band */}
          <div style={{ flex: 1, height: H, overflow: 'hidden' }}>
            <svg width="100%" height={H}>
              <BandPattern id="ip-band-l" />
              <rect width="100%" height={H} fill="url(#ip-band-l)" />
            </svg>
          </div>

          {/* Center medallion */}
          <svg width="56" height={H} viewBox="0 0 56 32" style={{ flexShrink: 0 }}>
            <circle cx="28" cy={CY} r="14" fill="none" stroke={GOLD} strokeWidth="0.5" />
            <path d={octagram(28, CY, 12)} fill="none" stroke={GOLD} strokeWidth="0.5" />
            <path d={octagram(28, CY, 7)} fill={GOLD} fillOpacity="0.28" stroke={GOLD} strokeWidth="0.5" />
            <circle cx="28" cy={CY} r="2.5" fill={GOLD} />
          </svg>

          {/* Right band */}
          <div style={{ flex: 1, height: H, overflow: 'hidden' }}>
            <svg width="100%" height={H}>
              <BandPattern id="ip-band-r" />
              <rect width="100%" height={H} fill="url(#ip-band-r)" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  // Simple: full-width band
  return (
    <div className="px-5" style={{ opacity: 0.35 }}>
      <svg width="100%" height={H}>
        <BandPattern id="ip-band-s" />
        <rect width="100%" height={H} fill="url(#ip-band-s)" />
      </svg>
    </div>
  )
}
