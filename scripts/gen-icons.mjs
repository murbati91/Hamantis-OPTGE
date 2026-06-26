// Regenerates the PWA icons + favicon in the One Piece TCG GCC palette.
// Run: node scripts/gen-icons.mjs   (requires the `sharp` devDependency)
import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'node:fs'

// Brand mark: an original stylized straw hat (the universal One Piece symbol) on
// the red/gold roundel — matches the in-app Logo. Rounded-square variant for the
// favicon / app icons.
const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ef4444"/>
      <stop offset="1" stop-color="#991b1b"/>
    </linearGradient>
  </defs>
  <rect x="16" y="16" width="480" height="480" rx="120" fill="url(#g)"/>
  <rect x="16" y="16" width="480" height="480" rx="120" fill="none" stroke="#fbbf24" stroke-width="20" opacity="0.9"/>
  <ellipse cx="256" cy="312" rx="180" ry="48" fill="#e7b24b" stroke="#9c6315" stroke-width="8"/>
  <path d="M178 312 C178 188 334 188 334 312 Z" fill="#f0c258" stroke="#9c6315" stroke-width="8"/>
  <path d="M184 292 C222 308 290 308 328 292 L328 270 C290 286 222 286 184 270 Z" fill="#c81e1e"/>
</svg>`

// Maskable variant: full-bleed gradient (no rounded corners cut by the OS mask),
// straw hat kept inside the safe area.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ef4444"/>
      <stop offset="1" stop-color="#991b1b"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <ellipse cx="256" cy="300" rx="150" ry="40" fill="#e7b24b" stroke="#9c6315" stroke-width="8"/>
  <path d="M191 300 C191 196 321 196 321 300 Z" fill="#f0c258" stroke="#9c6315" stroke-width="8"/>
  <path d="M196 284 C228 298 284 298 316 284 L316 266 C284 280 228 280 196 266 Z" fill="#c81e1e"/>
</svg>`

const buf = Buffer.from(mark)
mkdirSync('public/icons', { recursive: true })

const targets = [
  ['public/icons/icon-192.png', 192, buf],
  ['public/icons/icon-512.png', 512, buf],
  ['public/icons/icon-512-maskable.png', 512, Buffer.from(maskable)],
  ['public/icons/apple-touch-icon-180.png', 180, buf],
]

for (const [file, size, src] of targets) {
  await sharp(src).resize(size, size).png().toFile(file)
  console.log('wrote', file)
}

writeFileSync('public/favicon.svg', mark)
console.log('wrote public/favicon.svg')

// 1200x630 social/Open Graph image.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7f1d1d"/>
      <stop offset="0.55" stop-color="#0b1220"/>
      <stop offset="1" stop-color="#0b1220"/>
    </linearGradient>
    <linearGradient id="op" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ef4444"/>
      <stop offset="1" stop-color="#991b1b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(96,210)">
    <rect x="0" y="0" width="200" height="200" rx="44" fill="url(#op)"/>
    <rect x="0" y="0" width="200" height="200" rx="44" fill="none" stroke="#fbbf24" stroke-width="7" opacity="0.9"/>
    <g transform="translate(100,100) scale(0.34) translate(-256,-256)">
      <ellipse cx="256" cy="312" rx="180" ry="48" fill="#e7b24b" stroke="#9c6315" stroke-width="8"/>
      <path d="M178 312 C178 188 334 188 334 312 Z" fill="#f0c258" stroke="#9c6315" stroke-width="8"/>
      <path d="M184 292 C222 308 290 308 328 292 L328 270 C290 286 222 286 184 270 Z" fill="#c81e1e"/>
    </g>
  </g>
  <text x="340" y="300" font-family="Inter, Arial, sans-serif" font-size="78" font-weight="800" fill="#ffffff">One Piece TCG GCC</text>
  <text x="344" y="360" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="600" fill="#fca5a5">Collection wallet · Sealed simulator · Training</text>
  <text x="344" y="410" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="500" fill="#94a3b8">GCC community · Fan-made, unofficial</text>
</svg>`
await sharp(Buffer.from(og)).resize(1200, 630).png().toFile('public/og-image.png')
console.log('wrote public/og-image.png')
