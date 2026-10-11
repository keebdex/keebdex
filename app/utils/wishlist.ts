// Card width and gap of the wishlist grid; the exported image is built from
// these, so it has the same width on every device.
const WISHLIST_CARD_WIDTH = '18rem'
const WISHLIST_GRID_GAP = '1rem'

/** Configured columns, reduced to the item count for short sections. */
export const wishlistColumns = (itemCount: number, configured?: number) => {
  const columns = Math.max(1, configured || 1)

  return itemCount > 0 && itemCount < columns ? itemCount : columns
}

/** CSS width of a grid with the given number of columns. */
export const wishlistGridWidth = (columns: number) =>
  `calc(${columns} * ${WISHLIST_CARD_WIDTH} + ${Math.max(columns - 1, 0)} * ${WISHLIST_GRID_GAP})`

/**
 * Section headings: the custom titles, else the placeholder for the list type
 * (a selling list shows its WTS/WTT placeholder in the first section).
 */
export const wishlistSectionTitles = ({ type, buying, selling }: any) => ({
  buying:
    buying.title ||
    (type === 'selling' ? selling.placeholder : buying.placeholder),
  selling: selling.title || selling.placeholder,
})

export type WishlistTextFormat = 'markdown' | 'plain'

interface WishlistTextSection {
  title: string
  items: any[]
  // Buying sections mark items already found; selling sections mark them sold.
  buying?: boolean
}

const wishlistItemText = (
  { artisan, exchange, asking_price }: any,
  format: WishlistTextFormat,
  buying = false,
) => {
  const name = colorwayTitle(artisan)

  if (!exchange) {
    if (format === 'markdown') return `- ~~${name}~~`
    return `- ${name} (${buying ? 'found' : 'sold'})`
  }

  return asking_price ? `- ${name} - $${asking_price}` : `- ${name}`
}

/**
 * Trading list as text: Markdown for Discord and Reddit (bold titles, struck
 * through unavailable items), or plain text for apps that show Markdown as is.
 */
export const wishlistText = (
  sections: WishlistTextSection[],
  format: WishlistTextFormat = 'markdown',
) =>
  sections
    .filter((section) => section.items.length)
    .map(({ title, items, buying }) => {
      const heading = format === 'markdown' ? `**${title}**` : title
      const lines = items.map((item) => wishlistItemText(item, format, buying))

      return [heading, ...lines].join('\n')
    })
    .join('\n\n')
