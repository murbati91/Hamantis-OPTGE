/**
 * One Piece TCG GCC brand mark — a red roundel with an "OP" monogram.
 * Pure inline SVG so it scales crisply and needs no asset loading.
 */
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
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
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#opg)" />
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2.5"
        opacity="0.9"
      />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="30"
        fontWeight="800"
        fill="#ffffff"
      >
        OP
      </text>
    </svg>
  )
}
