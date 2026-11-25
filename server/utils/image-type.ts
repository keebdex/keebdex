// Detects an image's real type from its leading bytes, so uploads never trust
// the client's MIME type or file name. Only formats Cloudflare Images accepts
// and browsers can show are listed (no SVG: it can carry scripts)

export interface DetectedImageType {
  mime: string
  ext: string
}

// Number of leading bytes detectImageType needs
export const IMAGE_SNIFF_BYTES = 32

const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'])

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((value, index) => bytes[offset + index] === value)
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.subarray(start, end))
}

export function detectImageType(bytes: Uint8Array): DetectedImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { mime: 'image/jpeg', ext: 'jpg' }
  }

  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: 'image/png', ext: 'png' }
  }

  // GIF87a / GIF89a
  if (
    startsWith(bytes, [0x47, 0x49, 0x46, 0x38]) &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return { mime: 'image/gif', ext: 'gif' }
  }

  // RIFF....WEBP
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { mime: 'image/webp', ext: 'webp' }
  }

  // ISO BMFF: ....ftyp<major brand>
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === 'ftyp') {
    if (HEIC_BRANDS.has(ascii(bytes, 8, 12))) {
      return { mime: 'image/heic', ext: 'heic' }
    }
  }

  return null
}
