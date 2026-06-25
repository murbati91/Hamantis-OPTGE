import type { Card, CardColor, CardType, Rarity } from '../types'

/**
 * apitcg.com One Piece importer.
 *
 * The browser calls apitcg directly (it returns `Access-Control-Allow-Origin: *`
 * and accepts the `x-api-key` header), so NO backend/proxy is needed. The key is
 * supplied by the user and stored only on their device.
 *
 * apitcg has no "all cards in a set" filter, so we iterate card numbers
 * (`code=OPxx-001`, `-002`, …) until we hit a run of empty responses. Each call
 * returns the base printing plus alt-art variants; we keep the base card.
 *
 * Note: apitcg's dataset lags the newest releases — OP14/OP15/OP16 are not in it
 * yet (OP16 ships baked-in from Limitless). Use this for OP01–OP13, EB, ST sets
 * and for future sets once apitcg adds them.
 */

const API_BASE = 'https://www.apitcg.com/api/one-piece/cards'

interface ApitcgImage {
  small?: string
  large?: string
}
interface ApitcgCard {
  id: string
  code: string
  rarity: string
  type: string
  name: string
  images?: ApitcgImage
  cost?: number | string | null
  attribute?: { name?: string } | string | null
  power?: number | string | null
  counter?: number | string | null
  color?: string | null
  family?: string | null
  ability?: string | null
  trigger?: string | null
}
interface ApitcgResponse {
  page?: number
  limit?: number
  total: number
  totalPages?: number
  data: ApitcgCard[]
}

const VALID_COLORS: CardColor[] = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow']
const VALID_RARITIES: Rarity[] = ['L', 'C', 'UC', 'R', 'SR', 'SEC', 'P', 'AA', 'MR']

function toNum(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : null
}

/** Strip HTML, decode the few entities apitcg emits, collapse whitespace. */
function cleanText(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function mapType(t: string): CardType {
  switch (t.toUpperCase()) {
    case 'LEADER':
      return 'Leader'
    case 'CHARACTER':
      return 'Character'
    case 'EVENT':
      return 'Event'
    case 'STAGE':
      return 'Stage'
    case 'DON':
    case 'DON!!':
      return 'DON!!'
    default:
      return 'Character'
  }
}

function mapRarity(r: string, type: CardType): Rarity {
  if (type === 'Leader') return 'L'
  const up = r.toUpperCase()
  if (up === 'LEADER') return 'L'
  if (up === 'COMMON') return 'C'
  if (up === 'UNCOMMON') return 'UC'
  if (up === 'RARE') return 'R'
  return (VALID_RARITIES as string[]).includes(up) ? (up as Rarity) : 'C'
}

function mapColors(c: string | null | undefined): CardColor[] {
  if (!c) return ['Red']
  const parts = c
    .split(/[\/,]/)
    .map((x) => x.trim())
    .filter((x): x is CardColor => (VALID_COLORS as string[]).includes(x))
  return parts.length ? parts : ['Red']
}

function mapTraits(family: string | null | undefined): string[] {
  if (!family) return []
  return family
    .split(/[\/,]/)
    .map((t) => t.trim())
    .filter(Boolean)
}

/** Map one apitcg card to our internal Card. Returns null for unusable rows. */
export function mapApitcgCard(raw: ApitcgCard): Card | null {
  const code = raw.code || raw.id
  if (!code || !/^[A-Z0-9]+-\d+/i.test(code)) return null
  const [setCode, number = ''] = code.split('-')
  const type = mapType(raw.type)
  const attribute =
    typeof raw.attribute === 'object' && raw.attribute ? raw.attribute.name : undefined
  const effect = cleanText(raw.ability)
  const trigger = cleanText(raw.trigger)
  const counter = toNum(raw.counter)

  return {
    id: code,
    setCode,
    number,
    name: cleanText(raw.name) || code,
    type,
    color: mapColors(raw.color),
    rarity: mapRarity(raw.rarity, type),
    cost: type === 'Leader' ? null : toNum(raw.cost),
    power: toNum(raw.power),
    counter: type === 'Leader' ? null : counter,
    life: null, // apitcg does not expose Leader life
    attribute: attribute || undefined,
    traits: mapTraits(raw.family),
    effect,
    triggerText: trigger || undefined,
    imageUrl: raw.images?.large || raw.images?.small,
    isDemo: true, // imported reference card — not an owned copy
  }
}

/** apitcg may return its quota/error as an HTTP 200 with an `error` field. */
interface ApitcgErrorBody {
  error?: string
}

const PAGE_LIMIT = 100 // ask for big pages to minimise request count (free tier = 1000/month)

async function fetchPage(key: string, page: number): Promise<ApitcgResponse> {
  const res = await fetch(`${API_BASE}?limit=${PAGE_LIMIT}&page=${page}`, {
    headers: { 'x-api-key': key },
  })
  if (res.status === 401 || res.status === 403) {
    throw new Error('apitcg rejected the API key (401/403). Check the key in Settings.')
  }
  if (res.status === 429) {
    throw new Error('apitcg monthly request limit reached (HTTP 429). Resets next month, or upgrade your plan.')
  }
  if (!res.ok) throw new Error(`apitcg request failed (HTTP ${res.status}).`)
  const json = (await res.json()) as ApitcgResponse & ApitcgErrorBody
  // The free tier signals quota exhaustion as a 200 with an `error` body.
  if (json.error) {
    if (/limit/i.test(json.error)) {
      throw new Error(
        `apitcg quota: "${json.error}" The free tier allows 1,000 requests/month. It resets next month, or upgrade to Basic ($9 / 10,000) to finish now.`,
      )
    }
    throw new Error(`apitcg error: ${json.error}`)
  }
  return json
}

export interface ImportProgress {
  /** Pages fetched so far. */
  page: number
  /** Total pages to fetch (from the API). */
  totalPages: number
  /** Cards collected so far. */
  found: number
}

/**
 * Fetch the ENTIRE apitcg One Piece catalogue via pagination (≈25–30 requests
 * for ~2,500 cards), keeping only the base printing of each card (alt-art
 * variants share the same code). Quota-friendly — fits the free 1,000/month
 * budget many times over. Returns one mapped Card per unique code.
 */
export async function fetchAllApitcgCards(
  key: string,
  onProgress?: (p: ImportProgress) => void,
): Promise<Card[]> {
  if (!key.trim()) throw new Error('No apitcg API key set. Add it in Settings.')

  const byCode = new Map<string, Card>()
  let page = 1
  let totalPages = 1
  do {
    const json = await fetchPage(key, page)
    totalPages = json.totalPages || 1
    for (const raw of json.data ?? []) {
      // Keep the base printing (id === code); skip alt-art variants (id like _p1).
      if (raw.id !== raw.code && byCode.has(raw.code)) continue
      const card = mapApitcgCard(raw)
      if (card) byCode.set(card.id, card)
    }
    onProgress?.({ page, totalPages, found: byCode.size })
    page++
    await new Promise((r) => setTimeout(r, 150)) // polite pacing
  } while (page <= totalPages)

  return [...byCode.values()]
}

export interface ImportAllResult {
  cards: Card[]
  /** Per-set tally of what was found. */
  perSet: { set: string; count: number }[]
}

function tallyBySet(cards: Card[]): { set: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const c of cards) counts.set(c.setCode, (counts.get(c.setCode) ?? 0) + 1)
  return [...counts.entries()]
    .map(([set, count]) => ({ set, count }))
    .sort((a, b) => a.set.localeCompare(b.set))
}

/** Import every card apitcg has (all sets) in one paginated pass. */
export async function importAllApitcg(
  key: string,
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportAllResult> {
  const cards = await fetchAllApitcgCards(key, onProgress)
  return { cards, perSet: tallyBySet(cards) }
}

/** Import a single set: fetch the catalogue once, then keep only that set. */
export async function importApitcgSet(
  setCode: string,
  key: string,
  onProgress?: (p: ImportProgress) => void,
): Promise<Card[]> {
  const set = setCode.trim().toUpperCase()
  if (!/^[A-Z]{1,3}\d{1,2}$/.test(set)) {
    throw new Error(`"${setCode}" is not a valid set code (e.g. OP12, EB02, ST15).`)
  }
  const all = await fetchAllApitcgCards(key, onProgress)
  return all.filter((c) => c.setCode === set)
}
