import type { CalendarDate } from '@internationalized/date'
import { DateFormatter } from '@internationalized/date'
import { domToPng, domToBlob } from 'modern-screenshot'

const df = new DateFormatter('en-US', {
  dateStyle: 'medium',
})

export const toISODate = (date: CalendarDate) => {
  return date.toString()
}

export const formatDate = (date: string) => {
  return date ? df.format(new Date(date)) : ''
}

export const formatDateRange = (fromDate: string, toDate: string) => {
  return fromDate && toDate
    ? df.formatRange(new Date(fromDate), new Date(toDate))
    : ''
}

export const keycapProfiles = {
  Cherry: {
    epbt: 'ePBT',
    gmk: 'GMK CYL',
    jtk: 'JTK',
    keykobo: 'Key Kobo',
    mw: 'MW',
    pbtfans: 'PBTfans',
  },
  SA: {
    sa: 'Signature Plastics',
  },
  Others: {
    dcs: 'DCS',
    dsa: 'DSA',
    'gmk-mtnu': 'GMK MTNU',
    kat: 'KAT',
    kam: 'KAM',
    mt3: 'MT3',
    xda: 'XDA',
  },
}

export const keycapStatusColors = {
  'Interest Check': 'secondary',
  Cancelled: 'error',
  Scheduled: 'info',
  Live: 'info',
  'In Production': 'info',
  Shipping: 'info',
  Complete: 'success',
}

export const keycapStatusMap = {
  ic: {
    title: 'Interest Check',
    description:
      'Sets currently in the interest check stage where designers gather community feedback.',
  },
  live: {
    title: 'Group Buy Live',
    description:
      'Sets that are either live in group buy or scheduled to start soon.',
  },
  ended: {
    title: 'Group Buy Ended',
    description:
      'Sets with group buys already ended and awaiting production or delivery.',
  },
  pending: {
    title: 'Pending Review',
    description:
      'Awaiting admin or moderator review before being visible to users.',
  },
}

export const manufacturers = Object.values(keycapProfiles).reduce(
  (curr, prev) => {
    Object.assign(curr, prev)
    return curr
  },
  {},
)

export const colorwayTitle = (colorway: any) =>
  `${colorway.name} ${colorway?.sculpt.name}`

export const copyScreenshot = async (
  element: HTMLElement,
  toast: any,
  openInNewTab: boolean,
) => {
  // capture with full scroll size
  const blob = await domToBlob(element, {
    width: element.scrollWidth,
    height: element.scrollHeight,
  })

  try {
    if (blob) {
      if (openInNewTab) {
        open(URL.createObjectURL(blob))
      } else {
        const clipItem = new ClipboardItem({
          [blob.type]: blob,
        })
        await navigator.clipboard.write([clipItem])

        toast.add({
          color: 'success',
          title: 'Image copied to clipboard!',
        })
      }
    } else {
      toast.add({
        color: 'error',
        title: 'Image Save Failed',
        detail: 'Could not create image, blob is null',
      })
    }
  } catch (error) {
    console.error('Error while saving image to clipboard', error)

    if (blob) {
      if (navigator.userAgent.toLowerCase().includes('firefox')) {
        toast.add({
          color: 'info',
          title: 'Firefox Configuration',
          detail:
            'On Firefox you can enable the asyncClipboard.clipboardItem permission in about:config to enable copying straight to the clipboard',
        })
      }

      toast.add({
        color: 'info',
        title: 'Clipboard Access Denied',
        detail:
          'Could not save image to clipboard. Opening in new tab instead (make sure popups are allowed)',
      })

      open(URL.createObjectURL(blob))
    } else {
      toast.add({
        color: 'error',
        title: 'Image Save Failed',
        detail: 'Error while saving image to clipboard',
      })
    }
  }
}

export const downloadScreenshot = async (element: HTMLElement) => {
  // capture with full scroll size
  const img = await domToPng(element, {
    width: element.scrollWidth,
    height: element.scrollHeight,
  })

  const link = document.createElement('a')
  link.download = 'trading.png'
  link.href = img
  link.click()
}
