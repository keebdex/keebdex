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
