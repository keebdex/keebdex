import type { Database, TablesInsert, TablesUpdate } from '~/types/database.types'

type PublicTable = keyof Database['public']['Tables']

type TableField<T extends PublicTable> = Extract<
  keyof TablesInsert<T> | keyof TablesUpdate<T>,
  string
>

export const TABLE_FIELDS = {
  "artisan_colorways": [
    "colorway_id",
    "created_at",
    "currency",
    "deleted",
    "description",
    "fts",
    "id",
    "img",
    "maker_id",
    "maker_sculpt_id",
    "name",
    "order",
    "photo_credit",
    "price",
    "qty",
    "release",
    "sale_type",
    "sculpt_id",
    "stem"
  ],
  "artisan_makers": [
    "artisancollector",
    "bio",
    "contributors",
    "country_origin",
    "deleted",
    "disable_google_sync",
    "discord",
    "document_ids",
    "founded",
    "fts",
    "id",
    "instagram",
    "invertible_logo",
    "name",
    "updated_at",
    "verified",
    "website"
  ],
  "artisan_sculpts": [
    "cast",
    "collection",
    "created_at",
    "deleted",
    "design",
    "fts",
    "id",
    "img",
    "is_revision_of",
    "maker_id",
    "maker_sculpt_id",
    "name",
    "profile",
    "release",
    "sculpt_id",
    "story"
  ],
  "colors": [
    "code",
    "created_at",
    "fts",
    "hex",
    "id",
    "name",
    "system"
  ],
  "feedbacks": [
    "created_at",
    "email",
    "id",
    "message",
    "name",
    "resolved"
  ],
  "keyboard_brands": [
    "bio",
    "country_origin",
    "created_at",
    "discord",
    "fts",
    "id",
    "instagram",
    "invertible_logo",
    "name",
    "slug",
    "website"
  ],
  "keyboard_releases": [
    "brand_keyboard_slug",
    "brand_slug",
    "case_materials",
    "created_at",
    "currency",
    "description",
    "fts",
    "id",
    "mount_style",
    "msrp_price",
    "name",
    "order",
    "pcb_types",
    "plate_materials",
    "release_year",
    "typing_angle",
    "weight_materials"
  ],
  "keyboard_variants": [
    "brand_keyboard_slug",
    "brand_slug",
    "created_at",
    "finish_type",
    "fts",
    "id",
    "img_back",
    "img_front",
    "photo_credit",
    "release_id",
    "release_year",
    "sale_type",
    "units_produced",
    "variant_name"
  ],
  "keyboards": [
    "brand_keyboard_slug",
    "brand_slug",
    "created_at",
    "derived_from",
    "description",
    "fts",
    "id",
    "layout",
    "name",
    "slug",
    "typing_angle"
  ],
  "keyset_colors": [
    "color_id",
    "created_at",
    "id",
    "profile_keyset_id"
  ],
  "keyset_kits": [
    "cancelled",
    "created_at",
    "description",
    "id",
    "img",
    "kit_id",
    "name",
    "price",
    "profile_keyset_id",
    "qty"
  ],
  "keyset_profiles": [
    "description",
    "id",
    "manufacturer",
    "manufacturer_id",
    "name",
    "profile"
  ],
  "keysets": [
    "created_at",
    "description",
    "designer",
    "end_date",
    "fts",
    "ic_date",
    "id",
    "img",
    "name",
    "order_graph",
    "order_history",
    "profile_id",
    "profile_keyset_id",
    "review_status",
    "sculpt",
    "start_date",
    "status",
    "url"
  ],
  "kit_categories": [
    "description",
    "id",
    "name",
    "slug",
    "sort_order"
  ],
  "testimonials": [
    "avatar_url",
    "content",
    "created_at",
    "featured",
    "id",
    "name",
    "role",
    "status"
  ],
  "user_collection_items": [
    "artisan_item_id",
    "asking_price",
    "collection_id",
    "exchange",
    "id",
    "keyboard_item_id",
    "keyset_item_id",
    "order",
    "priority",
    "uid"
  ],
  "user_collections": [
    "category",
    "contact",
    "created_at",
    "id",
    "intent",
    "message",
    "name",
    "published",
    "sort_by",
    "uid"
  ],
  "users": [
    "assignments",
    "discord",
    "email",
    "favorite_makers",
    "full_name",
    "id",
    "qq",
    "reddit",
    "role"
  ]
} satisfies {
  [K in PublicTable]: readonly TableField<K>[]
}
