import { domToBlob, domToPng } from 'modern-screenshot'

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
