import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Shown before a place is picked: the whole world.
const WORLD_VIEW = { lat: 25, lon: 0, zoom: 2 }

// Interactive OpenStreetMap showing where you are and the shops around you.
// `center` is null until the user picks a place; the map then shows the world.
// Uses CircleMarkers instead of pin images, so no marker assets need to be bundled.
export default function StoreMap({ center, stores }) {
  return (
    <MapContainer
      center={center ? [center.lat, center.lon] : [WORLD_VIEW.lat, WORLD_VIEW.lon]}
      zoom={center ? 14 : WORLD_VIEW.zoom}
      minZoom={2}
      scrollWheelZoom
      zoomControl={false}
      className="store-map"
    >
      {/* Bottom left, clear of the floating navigation. */}
      <ZoomControl position="bottomleft" />
      {center && <Recenter center={center} stores={stores} />}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {center && (
        <CircleMarker center={[center.lat, center.lon]} radius={8} pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 0.9 }}>
          <Tooltip>You are here</Tooltip>
        </CircleMarker>
      )}

      {stores.map((store) => (
        <CircleMarker
          key={store.id}
          center={[store.lat, store.lon]}
          radius={7}
          pathOptions={{ color: '#166534', fillColor: '#22c55e', fillOpacity: 0.9 }}
        >
          <Popup>
            <strong>{store.name}</strong>
            <br />
            {store.label}, {formatDistance(store.distanceKm)} away
            {store.note && (
              <>
                <br />
                <span className="muted">{store.note}</span>
              </>
            )}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

// MapContainer only reads its centre on mount, so move the view when a new place is picked.
// Zoom out until every shop is visible, otherwise shops 1–3 km away sit off-screen.
function Recenter({ center, stores }) {
  const map = useMap()
  useEffect(() => {
    if (stores.length === 0) {
      map.setView([center.lat, center.lon], 14)
      return
    }
    const points = [[center.lat, center.lon], ...stores.map((store) => [store.lat, store.lon])]
    map.fitBounds(points, { padding: [24, 24], maxZoom: 15 })
    // stores is a new array each render, so depend on the centre and the store ids only.
  }, [map, center.lat, center.lon, stores.map((store) => store.id).join(',')]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
