// Core OP card domain model.

export type CardColor = 'Red' | 'Green' | 'Blue' | 'Purple' | 'Black' | 'Yellow'

export type CardType =
  | 'Leader'
  | 'Character'
  | 'Event'
  | 'Stage'
  | 'DON!!'

export type Rarity =
  | 'L' // Leader
  | 'C' // Common
  | 'UC' // Uncommon
  | 'R' // Rare
  | 'SR' // Super Rare
  | 'SEC' // Secret Rare
  | 'P' // Promo
  | 'AA' // Alternate Art
  | 'MR' // Manga Rare

export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG' | 'Sealed'

export type CardLanguage = 'EN' | 'JP' | 'CN' | 'KR' | 'Other'

/**
 * Sealed rating bucket per the Praying Mantis handbook scale:
 *  10  -> bomb / removal
 *  9   -> blocker / playable 2K counter
 *  8   -> efficient threat / value
 *  6-7 -> conditional card
 *  1-5 -> cut / filler
 * Stored as the raw numeric score (supports half points, e.g. 9.5).
 */
export type SealedRating = number

/** Static card definition (the printed card — not the user's owned copy). */
export interface Card {
  /** Set code, e.g. "OP16-001". Unique id. */
  id: string
  setCode: string // "OP16"
  number: string // "001"
  name: string
  type: CardType
  color: CardColor[]
  rarity: Rarity
  cost: number | null // null for Leaders / DON!!
  power: number | null
  counter: number | null // counter value (e.g. 1000 / 2000), null if none
  life: number | null // Leaders only
  attribute?: string // Slash / Strike / etc.
  traits: string[] // e.g. ["Whitebeard Pirates"]
  effect: string
  triggerText?: string

  // Sealed / training metadata
  sealedRating?: SealedRating
  sealedRole?: string // "Auto-include bomb", "Unblockable finisher", etc.
  whatIf?: string // handbook "What if" guidance

  // Derived gameplay flags (used by filters)
  isBlocker?: boolean
  isRemoval?: boolean
  is2kCounter?: boolean

  // Imagery
  imageUrl?: string // remote OR data URL; optional — placeholder used if absent

  /** Marks handbook/seed cards so demo data is never mistaken for the user's real collection. */
  isDemo?: boolean
}
