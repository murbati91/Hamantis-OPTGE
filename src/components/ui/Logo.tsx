/**
 * One Piece TCG GCC brand mark — an original stylized straw hat (Luffy's hat is
 * the universal One Piece symbol) on the red/gold roundel. Drawn from scratch as
 * inline SVG (no copyrighted artwork) so it scales crisply and loads no assets.
 */
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label="One Piece TCG GCC"
    >
      <defs>
        <linearGradient id="opg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
      </defs>
      <rect x="16" y="16" width="480" height="480" rx="120" fill="url(#opg)" />
      <rect
        x="16"
        y="16"
        width="480"
        height="480"
        rx="120"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="20"
        opacity="0.9"
      />
      {/* straw hat */}
      <ellipse cx="256" cy="312" rx="180" ry="48" fill="#e7b24b" stroke="#9c6315" strokeWidth="8" />
      <path d="M178 312 C178 188 334 188 334 312 Z" fill="#f0c258" stroke="#9c6315" strokeWidth="8" />
      <path d="M184 292 C222 308 290 308 328 292 L328 270 C290 286 222 286 184 270 Z" fill="#c81e1e" />
    </svg>
  )
}
