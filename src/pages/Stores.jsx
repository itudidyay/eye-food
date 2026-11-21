import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import StoreMap, { formatDistance } from '../components/StoreMap.jsx'
import { getBrowserLocation, findNearbyStores, geocodePlace, shopLabel, SEARCH_RADIUS_M } from '../utils/stores.js'

// Full-screen map of nearby grocery shops, with one floating panel for the place search
// and the list of shops.
const FADE_OUT_MS = 550

export default function Stores({ onBack }) {
  const [closing, setClosing] = useState(false) // true while the map dims to black on the way back
  const [center, setCenter] = useState(null)
  const [stores, setStores] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [error, setError] = useState('')
  const [placeText, setPlaceText] = useState('')

  // Each store gets a readable label for its shop type.
  const storesWithInfo = stores.map((store) => ({ ...store, label: shopLabel(store.shopType) }))

  async function searchAround(point) {
    setCenter(point)
    setStatus('loading')
    setError('')
    try {
      setStores(await findNearbyStores(point))
      setStatus('ready')
    } catch (err) {
      setStores([])
      setError(err.message)
      setStatus('error')
    }
  }

  async function handleUseLocation() {
    setStatus('loading')
    setError('')
    try {
      await searchAround(await getBrowserLocation())
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  // If the browser already has permission, find shops straight away instead of waiting for a click.
  // Only a 'granted' state is used here, so this never triggers the browser's permission prompt.
  useEffect(() => {
    let cancelled = false
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((result) => {
        if (result.state === 'granted' && !cancelled) handleUseLocation()
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // Runs once on mount; handleUseLocation only uses state setters, so it's safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handlePlaceSearch(event) {
    event.preventDefault()
    if (!placeText.trim()) return
    setStatus('loading')
    setError('')
    try {
      const point = await geocodePlace(placeText.trim())
      if (!point) {
        setError(`Couldn't find "${placeText.trim()}". Try a city or postcode.`)
        setStatus('error')
        return
      }
      await searchAround(point)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  // Back to the fridge: dim the map to black first, then let the fridge scene zoom out.
  function handleBack() {
    if (closing) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      onBack()
      return
    }
    setClosing(true)
    setTimeout(onBack, FADE_OUT_MS)
  }

  return (
    <div className="map-page">
      {/* Arriving from the fridge, the map fades up from black; leaving, it dims back to black. */}
      <div className={`map-veil ${closing ? 'is-closing' : ''}`} aria-hidden="true" />
      <StoreMap center={status === 'error' ? null : center} stores={storesWithInfo} />

      <aside className="map-panel">
        <button type="button" className="text-button map-back" onClick={handleBack}>
          ← Back
        </button>
        <h1>Stores</h1>

        <form className="search" onSubmit={handlePlaceSearch}>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="City or postcode"
            aria-label="Search for a city or postcode"
            value={placeText}
            onChange={(e) => setPlaceText(e.target.value)}
          />
        </form>
        <button type="button" className="button" onClick={handleUseLocation} disabled={status === 'loading'}>
          Use my location
        </button>

        {status === 'error' && <p className="form-error">{error}</p>}
        {status === 'loading' && <p className="muted small">Finding shops nearby…</p>}

        {center && status === 'ready' && (
          <section>
            <h2 className="section-title">Shops within {SEARCH_RADIUS_M / 1000} km</h2>
            {stores.length === 0 ? (
              <p className="muted small">None found. Try a different place.</p>
            ) : (
              <ul className="store-list">
                {storesWithInfo.map((store) => (
                  <li key={store.id}>
                    <span>
                      {store.name} <span className="muted small">({store.label})</span>
                    </span>
                    <small>{formatDistance(store.distanceKm)}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </aside>
    </div>
  )
}
