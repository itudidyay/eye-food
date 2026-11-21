import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import FridgeShelves, { PANTRY_SORTS } from '../components/FridgeShelves.jsx'
import { IngredientsList, RecipeSummary } from '../components/RecipeAnswer.jsx'
import RecipeImage from '../components/RecipeImage.jsx'
import { getRecommendations, scaleResult } from '../utils/recommendation.js'
import { searchRecipes } from '../utils/search.js'
import { getIngredientIcon } from '../utils/ingredientIcons.js'
import '../FridgeScene.css'

// One full-screen kitchen scene serves three tabs:
//   Search  → the closed fridge. Type on the whiteboard; the fridge opens and shows matching recipes.
//   Recipes → the open fridge, showing every recipe that uses something you have.
//   Pantry  → the open fridge. The shelves hold your ingredients; click one to edit it.
// The fridge door leads to the Pantry and the map on the freezer leads to Stores.
//
// Phases:
//   entry    first visit only: the camera moves in and lands in front of the fridge
//   front    closed fridge
//   opening  the door swings open and the camera pushes in
//   dark     the screen dims to black
//   interior the black lifts to show the shelves
//   open     inside the fridge (recipe cards on Search and Recipes, editable shelves on Pantry)
//   closing  the screen dims to black
//   reveal   the black lifts on the fridge from outside, door still open, as the camera pulls back
//   shutting the door swings shut, and we are back at the front
//   map-zoom leaving for Stores from the closed fridge: the camera zooms into the map on the freezer door
//   map-dark the screen dims to black, then the Stores page takes over
//   map-arrive, map-zoomed, map-out
//            returning from Stores with its Back button: the scene starts black and zoomed into
//            the door map, then the black lifts and the camera pulls back out to the front
const INTRO_KEY = 'fridgewise.introSeen'
const STEP_MS = {
  entry: 2400,
  opening: 1300,
  dark: 1000,
  interior: 600,
  closing: 600,
  reveal: 900,
  shutting: 1300,
  'map-zoom': 900,
  'map-dark': 650,
  'map-zoomed': 120,
  'map-out': 1500,
}
const MAP_PHASES = ['map-zoom', 'map-dark']
const NEXT_PHASE = {
  entry: 'front',
  opening: 'dark',
  dark: 'interior',
  interior: 'open',
  closing: 'reveal',
  reveal: 'shutting',
  shutting: 'front',
  'map-zoom': 'map-dark',
  'map-zoomed': 'map-out',
  'map-out': 'front',
}
const DOOR_OPEN_PHASES = ['opening', 'dark', 'interior', 'open', 'closing', 'reveal']
// While these phases run on the way to recipe cards, the shelves are already dimmed behind them,
// so the screen darkens once (the fade to black) and not again when the cards arrive.
const INSIDE_PHASES = ['dark', 'interior', 'open']

function readIntroSeen() {
  try {
    return sessionStorage.getItem(INTRO_KEY) === '1'
  } catch {
    return false
  }
}

function writeIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_KEY, '1')
  } catch {
    // storage blocked: the intro just plays again next time
  }
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export default function Fridge({
  page, // 'search', 'recipes' or 'pantry'
  onNavigate,
  leavingTo, // 'stores' while the exit animation toward the map should play, otherwise null
  onLeaveDone,
  arriveFromMap, // true when entering from the map with its Back button
  recipes,
  inventory,
  onOpenRecipe,
  onAddRecipe,
  onAddIngredient,
  onEditIngredient,
  onLoadSample,
  onClearAll,
}) {
  const [phase, setPhase] = useState(() => {
    if (page !== 'search') return 'open' // arriving straight on Recipes or Pantry: already inside
    if (arriveFromMap) return 'map-arrive' // back from the map: start black, then zoom out
    return readIntroSeen() ? 'front' : 'entry'
  })
  const [draft, setDraft] = useState('')
  const [asked, setAsked] = useState('') // the query whose results are shown
  const [pickedId, setPickedId] = useState(null) // the recipe opened from the grid, or null for the grid
  const [servingsById, setServingsById] = useState({})
  // Where the camera zooms when leaving for the map: the centre of the door map, in pixels.
  const [zoomTarget, setZoomTarget] = useState(null)
  const [pantrySort, setPantrySort] = useState('expiration') // how the shelves are ordered

  const ranked = useMemo(() => getRecommendations(recipes, inventory), [recipes, inventory])
  const matches = useMemo(() => searchRecipes(ranked, asked), [ranked, asked])
  // The Recipes tab lists every recipe that uses something you have.
  // Ones you can cook right now come first, then ones that need shopping.
  const suggested = useMemo(() => {
    const ready = ranked.filter((result) => result.missing.length === 0)
    const needShopping = ranked.filter((result) => result.missing.length > 0)
    return [...ready, ...needShopping]
  }, [ranked])
  const readyCount = suggested.filter((result) => result.missing.length === 0).length
  const isRecipes = page === 'recipes'
  const listed = isRecipes ? suggested : matches
  const current = listed.find((result) => result.recipe.id === pickedId) ?? null
  const servings = current ? servingsById[current.recipe.id] ?? current.recipe.servings : 0
  const scaled = current ? scaleResult(current, servings / current.recipe.servings) : null

  // Move through the animation phases on a timer. Waiting phases (front, open) have no timer.
  useEffect(() => {
    const ms = STEP_MS[phase]
    if (!ms) return undefined
    const timer = setTimeout(
      () => {
        if (phase === 'entry') writeIntroSeen()
        if (phase === 'map-dark') {
          onLeaveDone() // the screen is black: hand over to the Stores page
          return
        }
        if (phase === 'map-out') setZoomTarget(null) // the camera is back at rest
        setPhase(NEXT_PHASE[phase])
      },
      prefersReducedMotion() ? 0 : ms,
    )
    return () => clearTimeout(timer)
  }, [phase])

  // Back from the map: before the first paint, find the door map so the scene can start
  // zoomed into it (under the black), ready to pull back out.
  useLayoutEffect(() => {
    if (phase !== 'map-arrive') return
    writeIntroSeen() // this arrival shows the fridge, so the first-visit intro should not replay later
    const map = document.querySelector('.door-map')?.getBoundingClientRect()
    if (!map) {
      setPhase('front')
      return
    }
    const x = map.left + map.width / 2
    const y = map.top + map.height / 2
    setZoomTarget({ x, y, dx: window.innerWidth / 2 - x, dy: window.innerHeight / 2 - y })
    setPhase('map-zoomed')
  }, [phase])

  // Leaving for the map. From the closed fridge the camera zooms into the door map first;
  // from anywhere else (inside the fridge, mid-animation) the screen just dims.
  useEffect(() => {
    const inMapPhase = MAP_PHASES.includes(phase)
    if (leavingTo === 'stores' && !inMapPhase) {
      const map = phase === 'front' ? document.querySelector('.door-map')?.getBoundingClientRect() : null
      if (map) {
        const x = map.left + map.width / 2
        const y = map.top + map.height / 2
        setZoomTarget({ x, y, dx: window.innerWidth / 2 - x, dy: window.innerHeight / 2 - y })
        setPhase('map-zoom')
      } else {
        setPhase('map-dark')
      }
    } else if (!leavingTo && inMapPhase) {
      // The leave was cancelled by another tab click. A zoom started at the closed fridge, so go
      // back there (the tab effect below then opens the door if needed); otherwise we were inside.
      setPhase(zoomTarget ? 'front' : 'open')
      setZoomTarget(null)
    }
  }, [leavingTo, phase, zoomTarget])

  // Changing tab always returns to the grid, never to a recipe opened on another tab.
  useEffect(() => {
    setPickedId(null)
  }, [page])

  // Keep the fridge in step with the tab: Recipes and Pantry mean open, Search with no query means closed.
  useEffect(() => {
    if (page !== 'search') {
      if (asked) {
        setAsked('')
        setDraft('')
      }
      if (phase === 'front') setPhase('opening')
    } else if (phase === 'open' && !asked) {
      setPhase('closing')
    }
  }, [page, phase, asked])

  function handleSubmit(event) {
    event.preventDefault()
    const query = draft.trim()
    if (!query) return
    if (phase === 'front') {
      // Drop focus first, or the browser scrolls the scene to follow the input as the door swings.
      document.activeElement?.blur()
      setAsked(query)
      setPickedId(null)
      setPhase('opening')
    } else if (phase === 'open') {
      setAsked(query) // a new search while the fridge is open just swaps the cards
      setPickedId(null)
    }
  }

  function closeFridge() {
    if (page !== 'search') {
      onNavigate('search') // the effect above shuts the door
    } else {
      setDraft('')
      setAsked('') // the effect above shuts the door
    }
  }

  // The fridge door leads to the Pantry. Only the closed fridge can be opened this way.
  function openPantry() {
    if (phase === 'front') onNavigate('pantry')
  }

  function setServings(value) {
    if (!current) return
    setServingsById((all) => ({ ...all, [current.recipe.id]: value }))
  }

  const isFront = phase === 'front'
  // While dimming out to the map from inside the fridge there is no zoom target, and the door stays open.
  const doorOpen = DOOR_OPEN_PHASES.includes(phase) || (phase === 'map-dark' && !zoomTarget)
  const showResults = phase === 'open' && (isRecipes || (page === 'search' && asked.length > 0))
  const showPantry = phase === 'open' && page === 'pantry'
  // A few items for the glimpse through the opening door, three to a shelf.
  const glimpse = [0, 1, 2].map((row) => inventory.slice(row * 3, row * 3 + 3))

  const sceneClasses = [
    'scene',
    `phase-${phase}`,
    doorOpen ? 'door-open' : '',
    showResults ? 'show-results' : '',
    showPantry ? 'show-pantry' : '',
    INSIDE_PHASES.includes(phase) && (isRecipes || (page === 'search' && asked.length > 0)) ? 'dim-shelves' : '',
  ].join(' ')

  return (
    <div
      className={sceneClasses}
      style={
        zoomTarget
          ? { '--zoom-x': `${zoomTarget.x}px`, '--zoom-y': `${zoomTarget.y}px`, '--zoom-dx': `${zoomTarget.dx}px`, '--zoom-dy': `${zoomTarget.dy}px` }
          : undefined
      }
    >
      {/* The kitchen: wall, floor and the fridge. */}
      <div className="floor" aria-hidden="true" />
      <div className="camera">
        {/* The app name, on a sign hanging on the wall to the right of the fridge. */}
        <div className="wall-sign" aria-hidden="true">
          <div className="wall-sign-board">
            <span className="wall-sign-eye">
              <span />
            </span>
            <span className="wall-sign-name">
              <b>Eye</b>Food
            </span>
          </div>
        </div>
        {/* A note taped under the name sign: what each part of the fridge does. */}
        <div className="wall-sign wall-note">
          <div className="wall-note-paper">
            <p className="wall-note-title">How it works</p>
            <ul>
              <li>
                <span aria-hidden="true">🗺️</span>
                <span>
                  Click the <b>map</b> to see grocery stores near you
                </span>
              </li>
              <li>
                <span aria-hidden="true">🚪</span>
                <span>
                  Click the <b>fridge</b> to see what’s in your pantry
                </span>
              </li>
              <li>
                <span aria-hidden="true">✏️</span>
                <span>
                  Click the <b>whiteboard</b> to search up a recipe
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="fridge-shadow" aria-hidden="true" />
        <div className="fridge3d">
          <div className="f-side" aria-hidden="true" />
          <div className="f-body" aria-hidden="true">
            <div className="f-cavity">
              {glimpse.map((row, index) => (
                <div className="f-shelf" key={index}>
                  {row.map((item) => (
                    <span key={item.id}>{getIngredientIcon(item.name)}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Freezer door: not clickable itself. The map pinned to it opens Stores. */}
          <div className="f-door-top metal">
            <span className="f-handle" aria-hidden="true" />
            <button
              type="button"
              className="door-map"
              onClick={(event) => {
                event.stopPropagation()
                onNavigate('stores')
              }}
              tabIndex={isFront ? 0 : -1}
              aria-label="Open the store map"
            >
              <span className="door-map-pin" aria-hidden="true" />
            </button>
          </div>

          {/* Fridge door: opens the Pantry. The whiteboard on it is the search box. */}
          <div className="f-door">
            <div className="f-door-front metal" onClick={openPantry}>
              <span className="f-handle" aria-hidden="true" />
              <form className="whiteboard" onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()}>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="What’s cooking?"
                  aria-label="Search a recipe or ingredient"
                  autoComplete="off"
                  spellCheck={false}
                  tabIndex={isFront ? 0 : -1}
                />
              </form>
            </div>
            <div className="f-door-back" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>

      <div className="scene-dark" aria-hidden="true" />
      <FridgeShelves items={inventory} interactive={showPantry} onSelect={onEditIngredient} sortBy={pantrySort} />

      {/* Pantry: controls over the open fridge. */}
      <div className="pantry-bar">
        <label className="pill-select">
          <span>Sort</span>
          <select value={pantrySort} onChange={(e) => setPantrySort(e.target.value)} tabIndex={showPantry ? 0 : -1}>
            {Object.entries(PANTRY_SORTS).map(([id, sort]) => (
              <option key={id} value={id}>
                {sort.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="pill-button primary" onClick={onAddIngredient} tabIndex={showPantry ? 0 : -1}>
          Add ingredient
        </button>
        <button type="button" className="pill-button" onClick={closeFridge} tabIndex={showPantry ? 0 : -1}>
          Close fridge
        </button>
      </div>
      <div className="pantry-foot">
        {inventory.length === 0 && <span>Your fridge is empty.</span>}
        <button type="button" className="text-button" onClick={onLoadSample} tabIndex={showPantry ? 0 : -1}>
          {inventory.length === 0 ? 'Load sample items' : 'Reset to sample'}
        </button>
        {inventory.length > 0 && (
          <button type="button" className="text-button danger" onClick={onClearAll} tabIndex={showPantry ? 0 : -1}>
            Clear all
          </button>
        )}
      </div>

      {/* Search and Recipes: cards over the open fridge. */}
      <div className="results">
        <div className="results-inner">
          <div className="results-top">
            {isRecipes ? (
              <h1 className="results-heading">
                {suggested.length === 0
                  ? 'Recipes'
                  : `${suggested.length} ${suggested.length === 1 ? 'recipe' : 'recipes'} · ${readyCount} ready to cook now`}
              </h1>
            ) : (
              <form className="results-search" onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Search again"
                  aria-label="Search again"
                  tabIndex={showResults ? 0 : -1}
                />
              </form>
            )}
            <button type="button" className="pill-button" onClick={closeFridge} tabIndex={showResults ? 0 : -1}>
              Close fridge
            </button>
          </div>

          {isRecipes && suggested.length === 0 && (
            <div className="results-note">
              <p>No recipe uses anything in the fridge yet.</p>
              <button type="button" className="text-button" onClick={() => onNavigate('pantry')} tabIndex={showResults ? 0 : -1}>
                Add ingredients in the Pantry
              </button>
            </div>
          )}

          {!isRecipes && asked && matches.length === 0 && (
            <div className="results-note">
              <p>Nothing matches “{asked}”.</p>
              <button type="button" className="text-button" onClick={onAddRecipe} tabIndex={showResults ? 0 : -1}>
                Add it as a recipe
              </button>
            </div>
          )}

          {/* Step 1: every listed recipe as a tile. */}
          {!current && listed.length > 0 && (
            <>
              <div className="recipe-grid">
                {listed.map((result) => {
                  const have = result.available.length
                  const total = result.recipe.ingredients.length
                  // Pantry items this recipe would use up that expire within 3 days.
                  const useSoon = [...new Set(result.expiringSoon.map((match) => match.item.name))]
                  return (
                    <button
                      type="button"
                      className="recipe-tile"
                      key={result.recipe.id}
                      onClick={() => setPickedId(result.recipe.id)}
                      tabIndex={showResults ? 0 : -1}
                    >
                      <RecipeImage recipe={result.recipe} />
                      <span className="recipe-tile-name">{result.recipe.name}</span>
                      <span className={`recipe-tile-count ${have === total ? 'is-ready' : ''}`}>
                        You have {have} of {total} ingredients
                      </span>
                      {useSoon.length > 0 && <span className="recipe-tile-soon">Use soon: {useSoon.join(', ')}</span>}
                      <span className="recipe-tile-bar" aria-hidden="true">
                        <span style={{ width: `${(have / total) * 100}%` }} />
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="results-note">
                <button type="button" className="text-button" onClick={onAddRecipe} tabIndex={showResults ? 0 : -1}>
                  Add a recipe
                </button>
              </p>
            </>
          )}

          {/* Step 2: the chosen recipe, with its ingredients beside it. */}
          {current && scaled && (
            <>
              <button type="button" className="pill-button back-button" onClick={() => setPickedId(null)}>
                ← All {listed.length} {isRecipes ? (listed.length === 1 ? 'recipe' : 'recipes') : listed.length === 1 ? 'result' : 'results'}
              </button>
              <div className="answer">
                <RecipeSummary
                  recipe={current.recipe}
                  result={scaled}
                  servings={servings}
                  onServings={setServings}
                  onOpen={() => onOpenRecipe(current.recipe.id)}
                />
                <IngredientsList result={scaled} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
