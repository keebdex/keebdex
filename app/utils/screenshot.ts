import { domToBlob, domToPng } from 'modern-screenshot'

// iOS Safari refuses canvases above ~16.7M pixels; stay below with a margin.
const MAX_CANVAS_PIXELS = 16_000_000
const MAX_SCALE = 2

/**
 * Renders the element (full scroll size) to a PNG blob, as sharp as the device
 * allows while keeping the canvas under the mobile size limit.
 */
export const captureScreenshot = async (element: HTMLElement) => {
  const width = element.scrollWidth
  const height = element.scrollHeight
  const fit = Math.sqrt(MAX_CANVAS_PIXELS / Math.max(width * height, 1))

  const blob = await domToBlob(element, {
    width,
    height,
    scale: Math.min(MAX_SCALE, Math.max(window.devicePixelRatio || 1, 1), fit),
  })

  if (!blob) throw new Error('Could not create the image.')

  return blob
}

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = url
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Whether the browser can hand image files to the native share sheet. */
export const canShareFiles = () => {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false

  const probe = new File([''], 'probe.png', { type: 'image/png' })
  return navigator.canShare({ files: [probe] })
}

/**
 * Opens the native share sheet with the image (save to Photos, send to an
 * app), or downloads it where files cannot be shared. Call it straight from a
 * click with a ready blob: Safari rejects a share after a long await.
 * Returns false when the user dismisses the share sheet.
 */
export const shareBlob = async (blob: Blob, filename: string) => {
  const file = new File([blob], `${filename}.png`, { type: 'image/png' })

  if (!navigator.canShare?.({ files: [file] })) {
    downloadBlob(blob, filename)
    return true
  }

  try {
    await navigator.share({ files: [file] })
    return true
  } catch (error) {
    if ((error as Error).name === 'AbortError') return false
    throw error
  }
}

/**
 * Copies a PNG to the clipboard. `ClipboardItem` takes a promise so the write
 * starts inside the click gesture, which Safari requires.
 */
export const copyBlob = async (blob: Blob | Promise<Blob>, toast: any) => {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': Promise.resolve(blob) }),
    ])

    toast.add(noticeToast('image_copied'))
  } catch (error) {
    console.error('Error while saving image to clipboard', error)

    toast.add(noticeToast('image_copy_failed'))
  }
}

export const copyScreenshot = async (
  element: HTMLElement,
  toast: any,
  openInNewTab = false,
) => {
  // Capture with full scroll size for long preview cards.
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

        toast.add(noticeToast('image_copied'))
      }
    } else {
      toast.add({
        color: 'error',
        title: 'Image Copy Failed',
        description: 'Could not create image, blob is null',
      })
    }
  } catch (error) {
    console.error('Error while saving image to clipboard', error)

    if (blob) {
      if (navigator.userAgent.toLowerCase().includes('firefox')) {
        toast.add({
          color: 'info',
          title: 'Firefox Configuration',
          description:
            'On Firefox you can enable the asyncClipboard.clipboardItem permission in about:config to enable copying straight to the clipboard',
        })
      }

      toast.add({
        color: 'info',
        title: 'Clipboard Access Denied',
        description:
          'Could not save image to clipboard. Opening in new tab instead (make sure popups are allowed)',
      })

      open(URL.createObjectURL(blob))
    } else {
      toast.add({
        color: 'error',
        title: 'Image Copy Failed',
        description: 'Error while saving image to clipboard',
      })
    }
  }
}

export const downloadScreenshot = async (
  element: HTMLElement,
  filename: string,
) => {
  // Capture with full scroll size for long preview cards.
  const img = await domToPng(element, {
    width: element.scrollWidth,
    height: element.scrollHeight,
  })

  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = img
  link.click()
}
