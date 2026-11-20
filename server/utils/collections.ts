// Columns of `user_collections` and `user_collection_items` that any reader may
// get. `uid` and `contact` are left out on purpose: the handlers add them only
// for the signed-in callers that may see them, so a guest's query never asks
// for them (a column grant can then hide them from the anon role).
export const COLLECTION_COLUMNS =
  'id, name, category, intent, message, published, sort_by, created_at'

export const COLLECTION_ITEM_COLUMNS =
  'id, collection_id, artisan_item_id, keyset_item_id, keyboard_item_id, asking_price, exchange, order, priority'
