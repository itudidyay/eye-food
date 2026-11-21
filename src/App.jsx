import { useEffect, useMemo, useState } from 'react'
import { CircleCheck } from 'lucide-react'
import Navbar from './components/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import Modal from './components/Modal.jsx'
import IngredientForm from './components/IngredientForm.jsx'
import RecipeDetails from './components/RecipeDetails.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Pantry from './pages/Pantry.jsx'
import Recipes from './pages/Recipes.jsx'
import recipes from './data/recipes.js'
import useInventory from './hooks/useInventory.js'
import { getRecommendations, scoreRecipe } from './utils/recommendation.js'
import { getDaysUntilExpiration } from './utils/expiration.js'

const PAGES = ['dashboard', 'pantry', 'recipes']

// Read the page from the URL (#pantry) so refreshing keeps you on the same page.
function getPageFromHash() {
  const page = window.location.hash.replace('#', '')
  return PAGES.includes(page) ? page : 'dashboard'
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

  const [page, setPage] = useState(getPageFromHash)
  // Which pop-up is open: null, { type: 'add' }, { type: 'edit', ingredient }, or { type: 'recipe', recipeId }
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)

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

  // Recalculate recommendations only when the inventory changes.
  const recommendations = useMemo(() => getRecommendations(recipes, inventory), [inventory])

  const urgentCount = inventory.filter((item) => {
    const days = getDaysUntilExpiration(item.expirationDate)
    return days !== null && days >= 0 && days <= 3
  }).length

  function navigate(nextPage) {
    window.location.hash = nextPage
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeModal = () => setModal(null)
  const openAddForm = () => setModal({ type: 'add' })
  const openEditForm = (ingredient) => setModal({ type: 'edit', ingredient })
  const openRecipe = (recipeId) => setModal({ type: 'recipe', recipeId })

  function handleDelete(ingredient) {
    if (window.confirm(`Delete "${ingredient.name}" from your kitchen?`)) {
      deleteIngredient(ingredient.id)
      setToast(`Deleted ${ingredient.name}`)
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
  const selectedRecipe = modal?.type === 'recipe' ? recipes.find((r) => r.id === modal.recipeId) : null
  const selectedResult = selectedRecipe ? scoreRecipe(selectedRecipe, inventory) : null

  return (
    <div className="app">
      <Sidebar currentPage={page} onNavigate={navigate} urgentCount={urgentCount} />
      <Navbar currentPage={page} onNavigate={navigate} urgentCount={urgentCount} />

      <main className="main">
        {page === 'dashboard' && (
          <Dashboard
            inventory={inventory}
            recommendations={recommendations}
            onNavigate={navigate}
            onSelectRecipe={openRecipe}
            onAddIngredient={openAddForm}
          />
        )}
        {page === 'pantry' && (
          <Pantry
            inventory={inventory}
            onAdd={openAddForm}
            onEdit={openEditForm}
            onDelete={handleDelete}
            onLoadSample={handleLoadSample}
            onClearAll={handleClearAll}
          />
        )}
        {page === 'recipes' && (
          <Recipes
            recommendations={recommendations}
            totalRecipes={recipes.length}
            onSelectRecipe={openRecipe}
            onNavigate={navigate}
          />
        )}
      </main>

      {modal?.type === 'add' && (
        <Modal title="Add ingredient" onClose={closeModal}>
          <IngredientForm
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
            onCancel={closeModal}
            onSubmit={(data) => {
              updateIngredient(modal.ingredient.id, data)
              closeModal()
              setToast(`Updated ${data.name}`)
            }}
          />
        </Modal>
      )}

      {selectedResult && (
        <Modal title={selectedResult.recipe.name} onClose={closeModal} size="large">
          <RecipeDetails
            result={selectedResult}
            onCook={(deductions) => {
              deductIngredients(deductions)
              closeModal()
              setToast('Enjoy your meal! Your pantry has been updated 🎉')
            }}
          />
        </Modal>
      )}

      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={18} />
          {toast}
        </div>
      )}
    </div>
  )
}
