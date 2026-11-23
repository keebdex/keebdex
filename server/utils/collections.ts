// Columns of `user_collections` and `user_collection_items` that any reader may
// get. `uid` and `contact` are left out on purpose: the handlers add them only
// for the signed-in callers that may see them, so a guest's query never asks
// for them (a column grant can then hide them from the anon role).
export const COLLECTION_COLUMNS =
  'id, name, category, intent, message, published, sort_by, created_at'

export const COLLECTION_ITEM_COLUMNS =
  'id, collection_id, artisan_item_id, keyset_item_id, keyboard_item_id, asking_price, exchange, order, priority'

// The catalog record behind each item, with only what the collection pages
// show and sort by: whole rows would also send `fts` and `submitted_by`
export const COLLECTION_ITEM_EMBEDS = [
  'artisan:artisan_colorways(id, name, img, deleted, maker_id, maker_sculpt_id, colorway_id, sculpt:artisan_sculpts(name))',
  'keyset:keysets(id, name, designer, img, profile_keyset_id, profile:keyset_profiles(name))',
  'keyboard:keyboard_variants(id, variant_name, img_front, img_back, release:keyboard_releases(id, name, brand_keyboard_slug, keyboard:keyboards(name, slug)), brand:keyboard_brands(name, slug))',
].join(', ')
