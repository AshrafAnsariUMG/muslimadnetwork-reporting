/**
 * IslamicIcons — shared filled SVG icons for consistent use across the portal.
 * All icons use fill="currentColor" by default (or explicit color prop).
 * ViewBox 0 0 24 24.
 */

interface IconProps {
  size?: number
  color?: string
}

/**
 * MosqueIcon — proper mosque silhouette:
 * two tall minarets with pointed caps + balcony rings, large central dome,
 * main building base, and crescent moon above the dome apex.
 * Fully filled silhouette style.
 */
export function MosqueIcon({ size = 24, color }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color ?? 'currentColor'}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Left minaret ── */}
      {/* Body */}
      <rect x="1" y="4.5" width="4" height="17.5" />
      {/* Pointed cap */}
      <polygon points="1,4.5 3,2 5,4.5" />
      {/* Balcony ring (slightly wider than body) */}
      <rect x="0.5" y="9.5" width="5" height="1" rx="0.25" />

      {/* ── Right minaret ── */}
      {/* Body */}
      <rect x="19" y="4.5" width="4" height="17.5" />
      {/* Pointed cap */}
      <polygon points="19,4.5 21,2 23,4.5" />
      {/* Balcony ring */}
      <rect x="18.5" y="9.5" width="5" height="1" rx="0.25" />

      {/* ── Central dome ── */}
      {/* Cubic bezier gives a gently pointed onion-dome profile */}
      <path d="M5 14 C6 10 9 5.8 12 5.8 C15 5.8 18 10 19 14 Z" />

      {/* ── Main building base ── */}
      <rect x="5" y="14" width="14" height="8" />

      {/* ── Crescent moon (hilal) above dome apex ──
            Drawn as two full-circle paths with fillRule="evenodd":
            outer circle (center 12,4.3 r=1.5) minus
            inner circle (center 12.5,4.3 r=1.0, internally tangent on the right).
            Creates a left-facing crescent ☽ sitting on the dome tip. */}
      <path
        fillRule="evenodd"
        d="
          M12 2.8 A1.5 1.5 0 1 0 12 5.8 A1.5 1.5 0 1 0 12 2.8 Z
          M12.5 3.3 A1 1 0 1 0 12.5 5.3 A1 1 0 1 0 12.5 3.3 Z
        "
      />
    </svg>
  )
}
