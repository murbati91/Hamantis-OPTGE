export interface Venue {
  id: string
  name: string
  area: string
  description: string
  mapUrl: string
  tags: string[]
}

/**
 * Community-sourced list of existing tabletop/TCG-friendly venues in Bahrain.
 * No dedicated One Piece TCG store/venue exists locally yet — these are the
 * closest known hobby/card-game spots where local meetups or exhibitions
 * could realistically be organized. Confirm current hours/events directly
 * with each venue before publicizing a specific date.
 */
export const BAHRAIN_VENUES: Venue[] = [
  {
    id: 'howayte',
    name: 'Howayte Hobby Store',
    area: 'Tubli / Sitrah, Bahrain',
    description:
      'Dedicated hobby & tabletop game store — the best-known regular TCG venue in Bahrain, with evenings built around Magic: The Gathering drafts, painting nights and other card/board games.',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Howayte+Hobby+Store+Bahrain',
    tags: ['TCG store', 'Regular events'],
  },
  {
    id: 'ravens-nest',
    name: "The Raven's Nest",
    area: 'Janusan, Bahrain',
    description:
      "Bahrain's fantasy-fiction-themed café — rent board and card games on-site while you eat/drink; a relaxed spot for casual sealed play or a small meetup.",
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=The+Raven%27s+Nest+Bahrain',
    tags: ['Café', 'Game rental'],
  },
  {
    id: 'higher-grounds',
    name: 'Higher Grounds',
    area: 'The Avenues, Phase Two, Manama',
    description:
      'Café with board/card games available for guests and a track record of hosting workshops — worth approaching for a one-off exhibition or demo day.',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Higher+Grounds+The+Avenues+Manama+Bahrain',
    tags: ['Café', 'Workshops'],
  },
]
