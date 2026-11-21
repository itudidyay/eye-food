// Browser-side helpers for barcode lookup. The real Open Food Facts call happens in
// netlify/functions/product-lookup.js, so the API key-free details stay on the server.

const LOOKUP_URL = '/.netlify/functions/product-lookup'
const TIMEOUT_MS = 12000

/**
 * Quick check before we bother the server: 8, 12, 13 or 14 digits with a valid check digit.
 * (The function checks the same rule, so the two must stay in sync.)
 */
export function isPlausibleBarcode(code) {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false
  const digits = code.split('').map(Number)
  const check = digits.pop()
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10 === check
}

/**
 * Ask our Netlify Function about a barcode.
 * Always resolves to one of:
 *   { status: 'found', product: { barcode, name, brand, imageUrl, quantity } }
 *   { status: 'not_found' | 'invalid' | 'unavailable', message }
 */
export async function lookupProduct(barcode) {
  let response
  try {
    response = await fetch(`${LOOKUP_URL}?barcode=${encodeURIComponent(barcode)}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    return {
      status: 'unavailable',
      message: 'Could not reach the product database. Check your connection, or enter the details yourself.',
    }
  }

  // If the function isn't running (for example, plain `npm run dev`), the response is not JSON.
  const data = await response.json().catch(() => null)

  if (response.ok && data?.name) return { status: 'found', product: data }
  if (response.status === 404) {
    return { status: 'not_found', message: 'This product is not in the Open Food Facts database. Enter its details below.' }
  }
  if (response.status === 400) {
    return { status: 'invalid', message: data?.message ?? 'That barcode is not valid.' }
  }
  return { status: 'unavailable', message: 'The product database is unavailable right now. Enter the details below.' }
}
