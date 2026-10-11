// Card width and gap of the wishlist grid; the exported image is built from
// these, so it has the same width on every device.
export const WISHLIST_CARD_WIDTH = '18rem'
export const WISHLIST_GRID_GAP = '1rem'

/** Configured columns, reduced to the item count for short sections. */
export const wishlistColumns = (itemCount: number, configured?: number) => {
  const columns = Math.max(1, configured || 1)

  return itemCount > 0 && itemCount < columns ? itemCount : columns
}

/** CSS width of a grid with the given number of columns. */
export const wishlistGridWidth = (columns: number) =>
  `calc(${columns} * ${WISHLIST_CARD_WIDTH} + ${Math.max(columns - 1, 0)} * ${WISHLIST_GRID_GAP})`
