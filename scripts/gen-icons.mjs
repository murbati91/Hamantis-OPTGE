// Regenerates the PWA icons + favicon in the One Piece TCG GCC palette.
// Run: node scripts/gen-icons.mjs   (requires the `sharp` devDependency)
import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'node:fs'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ef4444"/>
      <stop offset="1" stop-color="#7f1d1d"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <circle cx="256" cy="226" r="150" fill="none" stroke="#fbbf24" stroke-width="10" opacity="0.9"/>
  <text x="256" y="276" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="156" font-weight="800" fill="#ffffff">OP</text>
  <text x="256" y="404" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="50" font-weight="700" letter-spacing="5" fill="#fde68a">TCG GCC</text>
</svg>`

const buf = Buffer.from(svg)
mkdirSync('public/icons', { recursive: true })

const targets = [
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['public/icons/icon-512-maskable.png', 512],
  ['public/icons/apple-touch-icon-180.png', 180],
]

for (const [file, size] of targets) {
  await sharp(buf).resize(size, size).png().toFile(file)
  console.log('wrote', file)
}

writeFileSync('public/favicon.svg', svg)
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
    <text x="100" y="138" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="104" font-weight="800" fill="#ffffff">OP</text>
  </g>
  <text x="340" y="300" font-family="Inter, Arial, sans-serif" font-size="78" font-weight="800" fill="#ffffff">One Piece TCG GCC</text>
  <text x="344" y="360" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="600" fill="#fca5a5">Collection wallet · Sealed simulator · Training</text>
  <text x="344" y="410" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="500" fill="#94a3b8">GCC community · Fan-made, unofficial</text>
</svg>`
await sharp(Buffer.from(og)).resize(1200, 630).png().toFile('public/og-image.png')
console.log('wrote public/og-image.png')
