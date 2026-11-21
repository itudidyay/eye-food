import { useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import Modal from './components/Modal.jsx'
import IngredientForm from './components/IngredientForm.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import RecipeDetails from './components/RecipeDetails.jsx'
import Fridge from './pages/Fridge.jsx'
import Stores from './pages/Stores.jsx'
import builtInRecipes from './data/recipes.js'
import useInventory from './hooks/useInventory.js'
import useCustomRecipes from './hooks/useCustomRecipes.js'
import { scoreRecipe } from './utils/recommendation.js'
import { getPantryNames, getUnitOptions } from './utils/options.js'

const PAGES = ['search', 'recipes', 'pantry', 'stores']

// Read the page from the URL (#pantry) so refreshing keeps you on the same page.
function getPageFromHash() {
  const page = window.location.hash.replace('#', '')
  return PAGES.includes(page) ? page : 'search'
}

export default function App() {
  const {
    inventory,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    deductIngredients,
    loadSampleData,
    clearInventory,
  } = useInventory()

  const { customRecipes, addRecipe, deleteRecipe } = useCustomRecipes()

  const [page, setPage] = useState(getPageFromHash)
  // Which pop-up is open: null, { type: 'add' }, { type: 'edit', ingredient },
  // { type: 'add-recipe' }, or { type: 'recipe', recipeId }
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  // Set while the fridge scene plays its exit animation toward another page.
  const [leavingTo, setLeavingTo] = useState(null)
  // True when the fridge scene is being entered from the map with the Back button.
  const [cameFromMap, setCameFromMap] = useState(false)

  // Keep the page in sync with the browser's back and forward buttons.
  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Hide the toast message after 3 seconds.
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  // Built-in recipes plus the ones the user wrote.
  const allRecipes = useMemo(() => [...builtInRecipes, ...customRecipes], [customRecipes])

  const pantryNames = useMemo(() => getPantryNames(inventory), [inventory])
  const unitOptions = useMemo(() => getUnitOptions(inventory, allRecipes), [inventory, allRecipes])

  function goTo(nextPage, { fromMap = false } = {}) {
    setCameFromMap(fromMap)
    window.location.hash = nextPage
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // The Back button on the map: return to the closed fridge, zooming out of the door map.
  function backFromMap() {
    goTo('search', { fromMap: true })
  }

  function navigate(nextPage) {
    // Leaving the fridge for the map: the fridge scene zooms into the door map and dims
    // to black first, then calls finishLeaving. Any other click cancels a pending leave.
    if (nextPage === 'stores' && page !== 'stores') {
      setLeavingTo('stores')
      return
    }
    setLeavingTo(null)
    goTo(nextPage)
  }

  function finishLeaving() {
    if (leavingTo) goTo(leavingTo)
    setLeavingTo(null)
  }

  const closeModal = () => setModal(null)
  const openAddForm = () => setModal({ type: 'add' })
  const openEditForm = (ingredient) => setModal({ type: 'edit', ingredient })
  const openAddRecipe = () => setModal({ type: 'add-recipe' })
  const openRecipe = (recipeId) => setModal({ type: 'recipe', recipeId })

  function handleDelete(ingredient) {
    if (window.confirm(`Delete "${ingredient.name}" from your kitchen?`)) {
      deleteIngredient(ingredient.id)
      closeModal()
      setToast(`Deleted ${ingredient.name}`)
    }
  }

  function handleDeleteRecipe(recipe) {
    if (window.confirm(`Delete your recipe "${recipe.name}"?`)) {
      deleteRecipe(recipe.id)
      closeModal()
      setToast(`Deleted ${recipe.name}`)
    }
  }

  function handleClearAll() {
    if (window.confirm('Remove ALL ingredients? This cannot be undone.')) {
      clearInventory()
      setToast('Pantry cleared')
    }
  }

  function handleLoadSample() {
    if (inventory.length === 0 || window.confirm('Replace your current ingredients with sample data?')) {
      loadSampleData()
      setToast('Sample data loaded')
    }
  }

  // The selected recipe is re-scored from the *current* inventory every render.
  const selectedRecipe = modal?.type === 'recipe' ? allRecipes.find((r) => r.id === modal.recipeId) : null
  const selectedResult = selectedRecipe ? scoreRecipe(selectedRecipe, inventory) : null

  return (
    <div className="app">
      <Sidebar currentPage={page} onNavigate={navigate} />
      <Navbar currentPage={page} onNavigate={navigate} />

      <main className="main">
        {/* Search, Recipes and Pantry share one fridge scene, so moving between them animates. */}
        {page !== 'stores' && (
          <Fridge
            page={page}
            onNavigate={navigate}
            leavingTo={leavingTo}
            onLeaveDone={finishLeaving}
            arriveFromMap={cameFromMap}
            recipes={allRecipes}
            inventory={inventory}
            onOpenRecipe={openRecipe}
            onAddRecipe={openAddRecipe}
            onAddIngredient={openAddForm}
            onEditIngredient={openEditForm}
            onLoadSample={handleLoadSample}
            onClearAll={handleClearAll}
          />
        )}
        {page === 'stores' && <Stores onBack={backFromMap} />}
      </main>

      {modal?.type === 'add' && (
        <Modal title="Add ingredient" onClose={closeModal}>
          <IngredientForm
            pantryNames={pantryNames}
            unitOptions={unitOptions}
            onCancel={closeModal}
            onSubmit={(data) => {
              addIngredient(data)
              closeModal()
              setToast(`Added ${data.name}`)
            }}
          />
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Edit ingredient" onClose={closeModal}>
          <IngredientForm
            initialValues={modal.ingredient}
            pantryNames={pantryNames}
            unitOptions={unitOptions}
            onCancel={closeModal}
            onDelete={() => handleDelete(modal.ingredient)}
            onSubmit={(data) => {
              updateIngredient(modal.ingredient.id, data)
              closeModal()
              setToast(`Updated ${data.name}`)
            }}
          />
        </Modal>
      )}

      {modal?.type === 'add-recipe' && (
        <Modal title="Add a recipe" onClose={closeModal} size="large">
          <RecipeForm
            pantryNames={pantryNames}
            unitOptions={unitOptions}
            onCancel={closeModal}
            onSubmit={(data) => {
              addRecipe(data)
              closeModal()
              setToast(`Saved recipe “${data.name}”`)
            }}
          />
        </Modal>
      )}

      {selectedResult && (
        <Modal title={selectedResult.recipe.name} onClose={closeModal} size="large">
          <RecipeDetails
            result={selectedResult}
            onDelete={handleDeleteRecipe}
            onCook={(deductions) => {
              deductIngredients(deductions)
              closeModal()
              setToast('Pantry updated')
            }}
          />
        </Modal>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
