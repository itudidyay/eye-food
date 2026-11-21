import chainStores from '../data/chainStores.js'

// Store lookup using OpenStreetMap data.
//   - Overpass API  → grocery shops near a point (https://overpass-api.de), tried first
//   - Photon        → fallback shop search when Overpass is unreachable (https://photon.komoot.io)
//   - Nominatim     → turn a typed place name into coordinates (https://nominatim.openstreetmap.org)
// All are free, public services with fair-use limits. Keep requests to one per user action.
// Location is only sent as coordinates or the typed search text. Nothing is stored on a server.

// Overpass servers are tried in order. If one is slow, busy or refuses the request, the next one is used.
const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const PHOTON_URL = 'https://photon.komoot.io/api/'
const REQUEST_TIMEOUT_MS = 15000
export const SEARCH_RADIUS_M = 3000

/** fetch() that gives up after REQUEST_TIMEOUT_MS instead of hanging forever. */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** Distance in kilometres between two lat/lon points (haversine formula). */
export function distanceKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/** Ask the browser for the user's position. Rejects if denied or unavailable. */
export function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Your browser cannot share its location.'))
      return
    }
    // The browser's permission prompt can sit unanswered, so guard with our own timer too.
    const timer = setTimeout(
      () => reject(new Error('No answer about your location. Type a city or postcode instead.')),
      REQUEST_TIMEOUT_MS,
    )
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer)
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: 'Your location' })
      },
      () => {
        clearTimeout(timer)
        reject(new Error('Location is blocked. Type a city or postcode instead.'))
      },
      { enableHighAccuracy: false, timeout: REQUEST_TIMEOUT_MS, maximumAge: 5 * 60 * 1000 },
    )
  })
}

/** Turn a typed place name into coordinates. Returns null if nothing matches. */
export async function geocodePlace(query) {
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`
  const response = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Place search is unavailable right now. Try again later.')

  const [first] = await response.json()
  if (!first) return null
  return { lat: Number(first.lat), lon: Number(first.lon), label: first.display_name.split(',').slice(0, 2).join(',') }
}

/** Run an Overpass query on the first server that answers with valid data. */
async function queryOverpass(query) {
  const failures = []
  for (const server of OVERPASS_SERVERS) {
    try {
      const response = await fetchWithTimeout(server, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return data.elements ?? []
    } catch (error) {
      failures.push(error.name === 'AbortError' ? 'timed out' : error.message)
    }
  }
  throw new Error(`The store map service did not respond (${failures.join(', ')}). Try again in a minute.`)
}

// Shop types we treat as grocery shops, and the ingredients each one is ASSUMED to sell.
// OpenStreetMap doesn't record stock, so these lists are guesses by shop type, not real inventory.
const SHOP_TYPES = {
  supermarket: { label: 'Supermarket', sells: 'all' },
  grocery: { label: 'Grocery shop', sells: 'all' },
  greengrocer: {
    label: 'Greengrocer',
    sells: ['apple', 'avocado', 'banana', 'basil', 'bell pepper', 'broccoli', 'carrot', 'celery', 'cucumber',
      'garlic', 'green onion', 'lemon', 'lettuce', 'mushroom', 'onion', 'potato', 'spinach', 'strawberries',
      'tomato', 'zucchini'],
  },
  convenience: {
    label: 'Convenience store',
    sells: ['bread', 'butter', 'egg', 'honey', 'lemon', 'milk', 'tortilla', 'yogurt', 'banana', 'garlic', 'onion'],
  },
}

/** Which of `ingredientNames` a shop of this type is likely to sell. */
export function likelyStockOf(shopType, ingredientNames) {
  const sells = SHOP_TYPES[shopType]?.sells
  if (!sells) return []
  if (sells === 'all') return ingredientNames
  return ingredientNames.filter((name) => sells.includes(name.trim().toLowerCase()))
}

export function shopLabel(shopType) {
  return SHOP_TYPES[shopType]?.label ?? 'Shop'
}

/** Overpass: exact OSM category search. Preferred when it answers. */
async function findStoresOverpass(center) {
  const query = `
    [out:json][timeout:25];
    nwr(around:${SEARCH_RADIUS_M},${center.lat},${center.lon})["shop"~"^(supermarket|convenience|greengrocer|grocery)$"];
    out center 40;
  `
  const elements = await queryOverpass(query)
  return elements
    .map((element) => {
      const lat = element.lat ?? element.center?.lat
      const lon = element.lon ?? element.center?.lon
      if (lat === undefined || lon === undefined) return null
      const point = { lat, lon }
      return {
        id: `${element.type}-${element.id}`,
        name: element.tags?.name ?? `Unnamed ${element.tags?.shop ?? 'shop'}`,
        shopType: element.tags?.shop,
        ...point,
        distanceKm: distanceKm(center, point),
      }
    })
    .filter(Boolean)
}

/**
 * Photon (komoot): free OSM-based geocoder, no key needed. Used when Overpass is unreachable.
 * Photon is a text search, not a category search, so a single query misses most shops.
 * We run a few generic words inside a bounding box around the point, then merge and de-duplicate.
 */
// Chains are found by name, because Photon can't list every shop of a type.
// Generic words catch independent shops; chain names catch the big brands.
const CHAIN_NAMES = [
  // US
  'Ralphs', 'Vons', 'Albertsons', 'Food 4 Less', 'Smart & Final', 'Stater Bros', "Trader Joe's",
  'Whole Foods', 'Sprouts', 'Aldi', 'Lidl', 'Walmart', 'Target', 'Costco', 'Safeway', 'Kroger',
  // UK
  'Tesco', "Sainsbury's", 'Asda', 'Morrisons', 'Waitrose', 'Co-op', 'Iceland',
]
const PHOTON_QUERIES = ['supermarket', 'store', 'grocery', 'shop', ...CHAIN_NAMES]

function boundingBox(center, radiusM) {
  const dLat = radiusM / 111320
  const dLon = radiusM / (111320 * Math.cos((center.lat * Math.PI) / 180))
  return [center.lon - dLon, center.lat - dLat, center.lon + dLon, center.lat + dLat].join(',')
}

async function findStoresPhoton(center) {
  const bbox = boundingBox(center, SEARCH_RADIUS_M)
  const results = await Promise.allSettled(
    PHOTON_QUERIES.map(async (q) => {
      const params = new URLSearchParams({ q, lat: String(center.lat), lon: String(center.lon), bbox, limit: '40' })
      for (const type of Object.keys(SHOP_TYPES)) params.append('osm_tag', `shop:${type}`)
      const response = await fetchWithTimeout(`${PHOTON_URL}?${params}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return (await response.json()).features ?? []
    }),
  )
  if (results.every((result) => result.status === 'rejected')) throw new Error('Photon unavailable')

  const unique = new Map()
  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    for (const feature of result.value) {
      const props = feature.properties
      const key = `${props.osm_type}${props.osm_id}`
      if (!unique.has(key)) unique.set(key, feature)
    }
  }

  return [...unique.entries()]
    .map(([key, feature]) => {
      const [lon, lat] = feature.geometry.coordinates
      const props = feature.properties
      const point = { lat, lon }
      return {
        id: `photon-${key}`,
        name: props.name ?? `Unnamed ${props.osm_value}`,
        shopType: props.osm_value,
        ...point,
        distanceKm: distanceKm(center, point),
      }
    })
    .filter((store) => store.distanceKm <= SEARCH_RADIUS_M / 1000)
}

/** Hardcoded chain stores (src/data/chainStores.js) within the radius. No network needed. */
function hardcodedStores(center) {
  return chainStores
    .map((store, index) => {
      const point = { lat: store.lat, lon: store.lon }
      return {
        id: `chain-${index}`,
        name: store.brand,
        shopType: 'supermarket',
        ...point,
        distanceKm: distanceKm(center, point),
      }
    })
    .filter((store) => store.distanceKm <= SEARCH_RADIUS_M / 1000)
}

/**
 * Grocery shops within SEARCH_RADIUS_M of a point, nearest first.
 * Hardcoded chain stores are always included. Live results are added, skipping any within ~50 m of a hardcoded one.
 * Returns [{ id, name, shopType, lat, lon, distanceKm }].
 */
export async function findNearbyStores(center) {
  const fixed = hardcodedStores(center)
  let live = []
  let liveFailed = false
  try {
    live = await findStoresOverpass(center)
  } catch {
    try {
      live = await findStoresPhoton(center)
    } catch {
      liveFailed = true
    }
  }
  if (liveFailed && fixed.length === 0) {
    throw new Error('The store map service did not respond. Try again in a minute.')
  }
  const near = (a, b) => Math.abs(a.lat - b.lat) < 0.0005 && Math.abs(a.lon - b.lon) < 0.0005
  const extra = live.filter((store) => !fixed.some((known) => near(store, known)))
  return [...fixed, ...extra].sort((a, b) => a.distanceKm - b.distanceKm)
}
