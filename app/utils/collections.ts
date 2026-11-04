import type { CollectionIntent } from './schemas/collection'

/** How each artisan collection intent is named and explained to users. */
export const collectionIntentItems: {
  label: string
  description: string
  value: CollectionIntent
}[] = [
  {
    label: 'My Collection',
    description: 'Caps you own. Just for tracking and showing off.',
    value: 'keep',
  },
  {
    label: 'Wishlist',
    description:
      'Caps you are hunting for. Share it publicly to list it in the Trading Hub as a buying list.',
    value: 'want',
  },
  {
    label: 'For Sale or Trade',
    description:
      'Caps you are letting go. Share it publicly to list it in the Trading Hub with your prices.',
    value: 'sell',
  },
]

/** How a Trading Hub listing reads, by its collection's intent. */
export const TRADE_INTENTS = {
  want: { label: 'Buying', icon: 'solar:money-bag-bold-duotone', color: 'info' },
  sell: { label: 'Selling', icon: 'solar:tag-price-bold-duotone', color: 'warning' },
} as const

/** The orders an artisan collection offers, the first being the default. */
export const artisanCollectionSortItems = [
  {
    label: 'Maker & Sculpt',
    description: 'Grouped by maker, then sculpt, then colorway name.',
    value: 'artisan.maker_sculpt_id|artisan.name',
  },
  {
    label: 'Colorway Name',
    description: 'Grouped by maker, then colorway name, then sculpt.',
    value: 'artisan.name|artisan.maker_sculpt_id',
  },
]

/**
 * An artisan collection's `sort_by`, or the default when it holds one the
 * collection no longer offers (`order|asc`, from the removed Manual Sort).
 */
export const artisanCollectionSort = (sortBy?: string | null) =>
  artisanCollectionSortItems.find(({ value }) => value === sortBy)?.value ??
  artisanCollectionSortItems[0]!.value
