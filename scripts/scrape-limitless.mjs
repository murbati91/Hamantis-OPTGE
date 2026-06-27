// Deterministic Limitless One Piece scraper.
//   node scripts/scrape-limitless.mjs --sets      -> print every set code (from the index)
//   node scripts/scrape-limitless.mjs OP01 [OP02] -> scrape those sets -> src/data/sets/<SET>.json
//
// Card pages expose stats as labelled tokens ("3 Cost", "5000 Power", "+1000
// Counter", "5 Life") which we anchor on, so parsing is robust to layout drift.
// Images point at the CLEAN Limitless English scan (no Bandai "SAMPLE" stamp);
// the UI falls back to a generated placeholder when an EN scan doesn't exist yet.

import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'https://onepiece.limitlesstcg.com'
const CDN = 'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece'
const COLORS = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow']
const ATTRS = ['Slash', 'Strike', 'Ranged', 'Special', 'Wisdom']
const TYPES = ['Leader', 'Character', 'Event', 'Stage']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (card-data-bake)' },
      })
      if (res.status === 404) return null
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return await res.text()
    } catch (e) {
      if (i === tries - 1) throw e
      await sleep(400 * (i + 1))
    }
  }
}

/** Strip tags -> trimmed non-empty lines. */
function lines(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#0*(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

const num = (s, re) => {
  const m = s.match(re)
  return m ? Number(m[1]) : null
}

const RARITY = [
  ['Secret Rare', 'SEC'],
  ['Super Rare', 'SR'],
  ['Special Card', 'P'],
  ['Promo', 'P'],
  ['Uncommon', 'UC'],
  ['Common', 'C'],
  ['Rare', 'R'],
]

function parseCard(code, html) {
  const ls = lines(html)
  const text = ls.join('\n')
  const [setCode, number = ''] = code.split('-')

  // Title: "Nami (OP01-016) • Romance Dawn – Limitless One Piece"
  const titleLine = ls.find((l) => l.includes(`(${code})`)) || ''
  const name = (titleLine.split('(')[0] || code).trim() || code

  // Anchor on the FIRST stat line (Power / Cost / Life) — Events & Stages have no
  // Power, so anchoring on Power alone mistyped them. Stats are read by label.
  const statIdx = ls.findIndex(
    (l) => /\bPower$/i.test(l) || /^\d+\s+Cost$/i.test(l) || /^\d+\s+Life$/i.test(l),
  )
  const powerRaw = num(text, /(\d[\d,]*)\s*Power/i)
  const lifeRaw = num(text, /(\d+)\s*Life/i)
  const costRaw = num(text, /(\d+)\s*Cost/i)

  // Type: most reliable signal is the word on the line right AFTER the card
  // code — Limitless lists "<name> / <code> / <TYPE> / • / <color> / • N Cost".
  // (Anchoring on the stat block missed Stages — they have Cost-but-no-Power
  // like Events, so inference mislabeled every Stage as Event/Character.)
  let type = null
  const idIdx = ls.findIndex((l) => l === code)
  if (idIdx >= 0) {
    for (let i = idIdx + 1; i < ls.length && i <= idIdx + 5; i++) {
      if (TYPES.includes(ls[i])) { type = ls[i]; break }
    }
  }
  const anchor = statIdx >= 0 ? statIdx : 0
  if (!type) {
    for (let i = anchor; i >= 0 && i > anchor - 10; i--) {
      if (TYPES.includes(ls[i])) { type = ls[i]; break }
    }
  }
  if (!type) {
    if (lifeRaw != null) type = 'Leader'
    else if (costRaw != null && powerRaw == null) type = 'Event'
    else type = 'Character'
  }

  // Color(s): scan the small header window for colour words.
  const head = ls.slice(Math.max(0, anchor - 6), anchor + 2).join(' ')
  const color = COLORS.filter((c) => new RegExp(`\\b${c}\\b`).test(head))
  if (!color.length) {
    const any = COLORS.find((c) => new RegExp(`\\b${c}\\b`).test(text))
    color.push(any || 'Red')
  }

  const power = powerRaw
  const cost = type === 'Leader' ? null : costRaw
  const life = type === 'Leader' ? lifeRaw : null
  const counter = type === 'Leader' ? null : num(text, /\+?(\d+)\s*Counter/i)
  const attribute = ATTRS.find((a) => new RegExp(`\\b${a}\\b`).test(head)) || undefined

  let rarity = type === 'Leader' ? 'L' : 'C'
  if (type !== 'Leader') {
    for (const [label, r] of RARITY) {
      if (ls.some((l) => l === label)) { rarity = r; break }
    }
  }

  // Effect = bracketed/keyword lines after Power, before the trash-nav footer.
  const footer = ls.findIndex((l) => /^(Leaders|Prints|Top Cut|Decks|Tournaments)$/i.test(l))
  const end = footer > anchor ? footer : ls.length
  const body = ls.slice(anchor + 1, end)
  const effect = body
    .filter((l) => /\[|\bgain|\bWhen\b|\brest\b|trash|\+\d|−\d|-\d{3,}|Look at|draw|K\.?O\.?/i.test(l))
    .join(' ')
    .replace(/You can support us[^.!]*[.!]/gi, ' ') // strip affiliate footer
    .replace(/^[•\s]*\+\d+\s*Counter\s*/i, '') // drop the leading counter stat
    .replace(/\b[A-Z]{2,3}\d{2}-\d{3}\b/g, ' ') // drop stray card codes
    .replace(/[•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Traits: a "/"-joined line (e.g. "Supernovas/Straw Hat Crew") in the body.
  const traitLine = body.find((l) => /\//.test(l) && /[A-Za-z]{3}/.test(l) && !/\[/.test(l) && l.length < 80)
  const traits = traitLine ? traitLine.split('/').map((t) => t.trim()).filter(Boolean) : []

  // Keyword [Blocker] is the FIRST bracket token on a real Blocker — distinguish
  // from cards that merely reference "[Blocker]" in their text (e.g. Usopp).
  const firstBracket = effect.match(/\[([^\]]+)\]/)
  const isBlocker = firstBracket && /^blocker$/i.test(firstBracket[1].trim()) ? true : undefined

  return {
    id: code,
    setCode,
    number,
    name,
    type,
    color,
    rarity,
    cost,
    power,
    counter,
    life,
    attribute,
    traits,
    effect,
    ...(isBlocker ? { isBlocker: true } : {}),
    imageUrl: `${CDN}/${setCode}/${code}_EN.webp`,
    isDemo: true,
  }
}

async function listSets() {
  const html = await get(`${BASE}/cards`)
  const set = new Set()
  // Set landing pages are slugged: /cards/op16-the-time-of-battle -> OP16.
  for (const m of html.matchAll(/\/cards\/([a-z]{2,3}\d{2})-[a-z0-9-]+/gi)) {
    set.add(m[1].toUpperCase())
  }
  return [...set].sort()
}

async function cardCodes(setCode) {
  const html = await get(`${BASE}/cards/${setCode}`)
  if (!html) return []
  const set = new Set()
  for (const m of html.matchAll(new RegExp(`/cards/(${setCode}-\\d{3})\\b`, 'g'))) set.add(m[1])
  return [...set].sort()
}

async function scrapeSet(setCode) {
  const codes = await cardCodes(setCode)
  const out = []
  let fail = 0
  for (const code of codes) {
    try {
      const html = await get(`${BASE}/cards/${code}`)
      if (!html) { fail++; continue }
      out.push(parseCard(code, html))
    } catch {
      fail++
    }
    await sleep(120)
  }
  await mkdir(resolve(ROOT, 'src/data/sets'), { recursive: true })
  await writeFile(
    resolve(ROOT, 'src/data/sets', `${setCode}.json`),
    JSON.stringify(out, null, 0),
  )
  console.log(`${setCode}: ${out.length} cards (${fail} failed) of ${codes.length}`)
  return out.length
}

const argv = process.argv.slice(2)
if (argv[0] === '--sets') {
  console.log((await listSets()).join('\n'))
} else if (argv.length) {
  for (const s of argv) await scrapeSet(s.toUpperCase())
} else {
  console.error('usage: scrape-limitless.mjs --sets | <SET>...')
  process.exit(1)
}
