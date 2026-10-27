// Brand, maker, and profile logos are fixed 500×500 files on R2, named after
// the owner's key (`maker_id`, `profile_id`, a brand's `slug`). The server
// passes its own `imgUrl`, since this reads the app's runtime config by default
export const logoUrl = (
  key: string | null | undefined,
  imgUrl: string = useRuntimeConfig().public.imgUrl,
) => `${imgUrl}/logo/${key}.png`
