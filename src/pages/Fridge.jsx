import { useEffect, useMemo, useState } from 'react'
import FridgeShelves from '../components/FridgeShelves.jsx'
import { IngredientsList, RecipeSummary } from '../components/RecipeAnswer.jsx'
import RecipeImage from '../components/RecipeImage.jsx'
import { getRecommendations, scaleResult } from '../utils/recommendation.js'
import { searchRecipes } from '../utils/search.js'
import { getIngredientIcon } from '../utils/ingredientIcons.js'
import '../FridgeScene.css'

// One full-screen kitchen scene serves two tabs:
//   Search → the closed fridge. Type on the whiteboard; the fridge opens and shows the recipe.
//   Pantry → the open fridge. The shelves hold your ingredients; click one to edit it.
// The doors lead to the Pantry and the map on the freezer leads to Stores.
//
// Phases:
//   entry    first visit only: the camera moves in and lands in front of the fridge
//   front    closed fridge
//   opening  the door swings open and the camera pushes in
//   dark     the screen dims to black
//   interior the fridge light comes on over the shelves
//   open     inside the fridge (recipe cards on Search, editable shelves on Pantry)
//   closing  the screen dims, the door shuts, and we return to the front
const INTRO_KEY = 'fridgewise.introSeen'
const STEP_MS = { entry: 2400, opening: 1300, dark: 1000, interior: 900, closing: 1000 }
const NEXT_PHASE = { entry: 'front', opening: 'dark', dark: 'interior', interior: 'open', closing: 'front' }
const DOOR_OPEN_PHASES = ['opening', 'dark', 'interior', 'open']

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
  page, // 'search' or 'pantry'
  onNavigate,
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
    if (page === 'pantry') return 'open' // arriving straight on the Pantry tab: already inside
    return readIntroSeen() ? 'front' : 'entry'
  })
  const [draft, setDraft] = useState('')
  const [asked, setAsked] = useState('') // the query whose results are shown
  const [pickedId, setPickedId] = useState(null) // the recipe opened from the grid, or null for the grid
  const [servingsById, setServingsById] = useState({})

  const ranked = useMemo(() => getRecommendations(recipes, inventory), [recipes, inventory])
  const matches = useMemo(() => searchRecipes(ranked, asked), [ranked, asked])
  const current = matches.find((result) => result.recipe.id === pickedId) ?? null
  const servings = current ? servingsById[current.recipe.id] ?? current.recipe.servings : 0
  const scaled = current ? scaleResult(current, servings / current.recipe.servings) : null

  // Move through the animation phases on a timer. Waiting phases (front, open) have no timer.
  useEffect(() => {
    const ms = STEP_MS[phase]
    if (!ms) return undefined
    const timer = setTimeout(
      () => {
        if (phase === 'entry') writeIntroSeen()
        setPhase(NEXT_PHASE[phase])
      },
      prefersReducedMotion() ? 0 : ms,
    )
    return () => clearTimeout(timer)
  }, [phase])

  // Keep the fridge in step with the tab: Pantry means open, Search with no query means closed.
  useEffect(() => {
    if (page === 'pantry') {
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
    if (page === 'pantry') {
      onNavigate('search') // the effect above shuts the door
    } else {
      setDraft('')
      setAsked('') // the effect above shuts the door
    }
  }

  // The doors lead to the Pantry. Only the closed fridge can be opened this way.
  function openPantry() {
    if (phase === 'front') onNavigate('pantry')
  }

  function setServings(value) {
    if (!current) return
    setServingsById((all) => ({ ...all, [current.recipe.id]: value }))
  }

  const isFront = phase === 'front'
  const doorOpen = DOOR_OPEN_PHASES.includes(phase)
  const showResults = phase === 'open' && page === 'search' && asked.length > 0
  const showPantry = phase === 'open' && page === 'pantry'
  // A few items for the glimpse through the opening door, three to a shelf.
  const glimpse = [0, 1, 2].map((row) => inventory.slice(row * 3, row * 3 + 3))

  const sceneClasses = [
    'scene',
    `phase-${phase}`,
    doorOpen ? 'door-open' : '',
    showResults ? 'show-results' : '',
    showPantry ? 'show-pantry' : '',
  ].join(' ')

  return (
    <div className={sceneClasses}>
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
              <b>Eye</b>Fridge
            </span>
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

          {/* Freezer door: opens the Pantry. The map pinned to it opens Stores. */}
          <div className="f-door-top metal" onClick={openPantry}>
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
      <FridgeShelves items={inventory} interactive={showPantry} onSelect={onEditIngredient} />

      {/* Pantry: controls over the open fridge. */}
      <div className="pantry-bar">
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

      {/* Search: cards over the open fridge. */}
      <div className="results">
        <div className="results-inner">
          <div className="results-top">
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
            <button type="button" className="pill-button" onClick={closeFridge} tabIndex={showResults ? 0 : -1}>
              Close fridge
            </button>
          </div>

          {asked && matches.length === 0 && (
            <div className="results-note">
              <p>Nothing matches “{asked}”.</p>
              <button type="button" className="text-button" onClick={onAddRecipe} tabIndex={showResults ? 0 : -1}>
                Add it as a recipe
              </button>
            </div>
          )}

          {/* Step 1: every matching recipe as a tile. */}
          {!current && matches.length > 0 && (
            <>
              <div className="recipe-grid">
                {matches.map((result) => {
                  const have = result.available.length
                  const total = result.recipe.ingredients.length
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
                ← All {matches.length} {matches.length === 1 ? 'result' : 'results'}
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
