// Turn a photo chosen from the user's device into a small JPEG that fits comfortably in localStorage.
// Full-size phone photos are several megabytes, so we shrink them first.

const MAX_SIDE_PX = 800 // longest side after resizing
const JPEG_QUALITY = 0.85
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

/**
 * Reads an image File and resolves to a data URL (a "data:image/jpeg;base64,..." string).
 * Rejects with a message the user can read if the file isn't a usable picture.
 */
export async function readPhotoFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please choose a picture file (JPG, PNG or WebP).')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('That picture is larger than 15 MB. Choose a smaller one.')
  }

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('This picture could not be opened. Try a JPG or PNG file.')
  }

  const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

/** Photos we store: https links, or the small JPEGs made above. */
export function isStorablePhoto(value) {
  return typeof value === 'string' && (/^https:\/\//.test(value) || /^data:image\/jpeg;base64,/.test(value))
}
