import { IMAGE_UPLOAD_FORMATS } from '~/utils/image-formats'
import type { ImageUploadFormat } from '~/utils/image-formats'

// Detects an image's real type from its leading bytes, so uploads never trust
// the client's MIME type or file name. The accepted formats are
// IMAGE_UPLOAD_FORMATS; this file only knows how to recognise each of them

// Leading bytes to read. 12 would cover every signature and an `ftyp` box's
// major brand, but its compatible brands only start at byte 16, and they are
// what tells HEIC from AVIF when the major brand is the generic mif1/msf1.
// Brands listed past byte 64 are not read; real files keep the box at 24-40
// bytes
const SNIFF_BYTES = 64

// HEVC-coded HEIF brands (images and sequences). The generic mif1/msf1 are not
// listed: they say "HEIF container" without naming the codec
const HEIC_BRANDS = new Set([
  'heic',
  'heix',
  'heim',
  'heis',
  'hevc',
  'hevx',
  'hevm',
  'hevs',
])

// Refused even beside a HEIC brand: Cloudflare Images takes AVIF input on
// Enterprise only
const AVIF_BRANDS = new Set(['avif', 'avis'])

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((value, index) => bytes[offset + index] === value)
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.subarray(start, end))
}

// ISO BMFF `ftyp` box: size (0-3), 'ftyp' (4-7), major brand (8-11), minor
// version (12-15), then compatible brands of 4 bytes each up to the box's end
function isHeic(bytes: Uint8Array) {
  if (bytes.length < 16 || ascii(bytes, 4, 8) !== 'ftyp') return false

  const boxSize = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).getUint32(0)

  // Smaller than its own header, or not a whole number of brands (which also
  // refuses the 0 and 1 size escapes, never used by a real ftyp box)
  if (boxSize < 16 || boxSize % 4 !== 0) return false

  const end = Math.min(boxSize, bytes.length)
  const brands = [ascii(bytes, 8, 12)]

  for (let offset = 16; offset + 4 <= end; offset += 4) {
    brands.push(ascii(bytes, offset, offset + 4))
  }

  if (brands.some((brand) => AVIF_BRANDS.has(brand))) return false

  return brands.some((brand) => HEIC_BRANDS.has(brand))
}

export async function detectImageType(
  file: Blob,
): Promise<ImageUploadFormat | null> {
  const bytes = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer())

  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return IMAGE_UPLOAD_FORMATS.jpeg
  }

  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return IMAGE_UPLOAD_FORMATS.png
  }

  // GIF87a / GIF89a
  if (
    startsWith(bytes, [0x47, 0x49, 0x46, 0x38]) &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return IMAGE_UPLOAD_FORMATS.gif
  }

  // RIFF....WEBP
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return IMAGE_UPLOAD_FORMATS.webp
  }

  if (isHeic(bytes)) {
    return IMAGE_UPLOAD_FORMATS.heic
  }

  return null
}
