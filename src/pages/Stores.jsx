import { useState } from 'react'
import { Search } from 'lucide-react'
import StoreMap, { formatDistance } from '../components/StoreMap.jsx'
import {
  getBrowserLocation,
  findNearbyStores,
  geocodePlace,
  likelyStockOf,
  shopLabel,
  SEARCH_RADIUS_M,
} from '../utils/stores.js'
import { scoreRecipe } from '../utils/recommendation.js'
import { estimateIngredientCost, estimateRecipeCost, formatMoney } from '../utils/pricing.js'

// Full-screen map of nearby grocery shops, with one floating panel for the place search,
// the shop list and a shopping list for one recipe.
// OpenStreetMap doesn't publish stock levels or prices, so every cost here is an estimate
// and is the same at every shop.
export default function Stores({ recipes, inventory }) {
  const [center, setCenter] = useState(null)
  const [stores, setStores] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [error, setError] = useState('')
  const [placeText, setPlaceText] = useState('')
  const [recipeId, setRecipeId] = useState(recipes[0]?.id)

  const sortedRecipes = [...recipes].sort((a, b) => a.name.localeCompare(b.name))
  // Ids are numbers for built-in recipes and strings for custom ones, so compare as text.
  const selectedRecipe = recipes.find((recipe) => String(recipe.id) === String(recipeId)) ?? recipes[0]
  const shopping = selectedRecipe ? scoreRecipe(selectedRecipe, inventory) : null
  const buyCost = shopping ? estimateRecipeCost(shopping) : null

  // Each store gets a label and a guess at which missing ingredients it sells.
  const missingNames = shopping ? shopping.missing.map((ingredient) => ingredient.name) : []
  const storesWithInfo = stores.map((store) => {
    const likely = likelyStockOf(store.shopType, missingNames)
    const note = missingNames.length === 0 ? '' : likely.length === 0 ? 'Probably none of your missing items' : `Likely sells: ${likely.join(', ')}`
    return { ...store, label: shopLabel(store.shopType), note }
  })

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

  return (
    <div className="map-page">
      <StoreMap center={status === 'error' ? null : center} stores={storesWithInfo} />

      <aside className="map-panel">
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
                      {store.note && (
                        <span className="muted small">
                          <br />
                          {store.note}
                        </span>
                      )}
                    </span>
                    <small>{formatDistance(store.distanceKm)}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {shopping && (
          <section>
            <h2 className="section-title">Shopping list</h2>
            <label className="select-box">
              <span className="sr-only">Recipe</span>
              <select value={selectedRecipe.id} onChange={(e) => setRecipeId(e.target.value)}>
                {sortedRecipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </option>
                ))}
              </select>
            </label>

            {shopping.missing.length === 0 ? (
              <p className="muted small">You already have everything for this recipe.</p>
            ) : (
              <>
                <ul className="shopping-list">
                  {shopping.missing.map((ingredient) => {
                    const { cost } = estimateIngredientCost(ingredient.name, ingredient.amount, ingredient.unit, null)
                    return (
                      <li key={ingredient.name}>
                        <span>
                          {ingredient.amount} {ingredient.unit} {ingredient.name}
                        </span>
                        <span className="muted">{cost === null ? 'price unknown' : formatMoney(cost)}</span>
                      </li>
                    )
                  })}
                </ul>
                <p className="recipe-cost">
                  Estimated total: {formatMoney(buyCost.buyCost)}
                  {buyCost.buyHasUnknown && <span className="muted"> (some prices unknown)</span>}
                </p>
              </>
            )}
            <p className="muted small">Estimates use typical prices, not live store data.</p>
          </section>
        )}
      </aside>
    </div>
  )
}
