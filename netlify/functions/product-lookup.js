// Netlify Function: look up a grocery product by barcode using Open Food Facts.
//
// Called by the website as:  /.netlify/functions/product-lookup?barcode=3017620422003
//
// Only the few fields FridgeWise needs are sent back to the browser. The rest of the
// Open Food Facts response (nutrition, ingredients, etc.) stays on the server.

const OFF_URL = 'https://world.openfoodfacts.org/api/v3/product/'
// Open Food Facts asks apps to identify themselves. Replace the contact with your own URL or email.
const USER_AGENT = 'FridgeWise/1.0 (student hackathon project; contact: github.com/itudidyay)'
const TIMEOUT_MS = 8000

const JSON_HEADERS = { 'Content-Type': 'application/json' }

function respond(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...JSON_HEADERS, ...extraHeaders },
    body: JSON.stringify(body),
  }
}

/**
 * Barcodes are 8 (EAN-8), 12 (UPC-A), 13 (EAN-13) or 14 (GTIN-14) digits,
 * and the last digit is a check digit. Checking it catches most typos before we call the API.
 */
export function isValidBarcode(code) {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false
  const digits = code.split('').map(Number)
  const check = digits.pop()
  // Starting next to the check digit and moving left, weight 3 and 1 alternately.
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10 === check
}

// Keep only short, plain text values; anything else becomes an empty string.
function cleanText(value, maxLength = 200) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

// Open Food Facts lists several brands separated by commas. We use the first one.
function firstBrand(brands) {
  return cleanText(brands).split(',')[0].trim()
}

function toSafeImageUrl(url) {
  return typeof url === 'string' && /^https:\/\//.test(url) ? url : ''
}

export async function handler(event) {
  if (event.httpMethod && event.httpMethod !== 'GET') {
    return respond(405, { error: 'method_not_allowed', message: 'Use GET.' })
  }

  const barcode = (event.queryStringParameters?.barcode ?? '').replace(/[\s-]/g, '')

  if (!barcode) {
    return respond(400, { error: 'missing_barcode', message: 'Please enter a barcode.' })
  }
  if (!isValidBarcode(barcode)) {
    return respond(400, { error: 'invalid_barcode', message: 'That does not look like a valid barcode.' })
  }

  let response
  try {
    response = await fetch(`${OFF_URL}${barcode}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    // Network failure or timeout: the Open Food Facts site could not be reached.
    console.error('Open Food Facts unreachable:', error)
    return respond(503, { error: 'unavailable', message: 'The product database is not responding. Try again later.' })
  }

  let data
  try {
    data = await response.json()
  } catch {
    return respond(502, { error: 'bad_response', message: 'The product database sent an unexpected reply.' })
  }

  const product = data?.product
  const notFound = response.status === 404 || data?.result?.id === 'product_not_found' || !product

  if (notFound) {
    if (response.status >= 500) {
      return respond(502, { error: 'upstream_error', message: 'The product database had a problem. Try again later.' })
    }
    return respond(404, { error: 'not_found', message: 'This product is not in the Open Food Facts database.' })
  }

  const name = cleanText(product.product_name_en) || cleanText(product.product_name) || cleanText(product.generic_name)
  if (!name) {
    // The product exists but has no name, so the form can't use it.
    return respond(404, { error: 'not_found', message: 'This product is in the database but has no name.' })
  }

  return respond(
    200,
    {
      barcode,
      name,
      brand: firstBrand(product.brands),
      imageUrl: toSafeImageUrl(product.image_front_url || product.image_url),
      quantity: cleanText(product.quantity, 60),
    },
    // Product details rarely change, so browsers and Netlify can keep them for a day.
    { 'Cache-Control': 'public, max-age=86400' },
  )
}
