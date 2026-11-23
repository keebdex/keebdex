import slugify from 'slugify'

/**
 * URL slug of a name, built the same way as the artisan sync's (bowerbird in
 * keebdex/aviary):
 * punctuation such as apostrophes, dots, and colons is dropped rather than
 * kept in the address ("Jelly's Keys" becomes `jellys-keys`). Page slugs must
 * match the sync's, since it matches synced sculpts by slug.
 */
export const urlSlugify = (text: string) =>
  slugify(text.replace(/[*+~.()'"!:@,/]/g, ''), { lower: true })
