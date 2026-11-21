// Recipes the user writes themselves. Saved to localStorage, separate from the built-in list.

import { useEffect, useState } from 'react'
import { createId, loadCustomRecipes, saveCustomRecipes } from '../utils/storage.js'

export default function useCustomRecipes() {
  const [customRecipes, setCustomRecipes] = useState(() => loadCustomRecipes())

  useEffect(() => {
    saveCustomRecipes(customRecipes)
  }, [customRecipes])

  function addRecipe(data) {
    setCustomRecipes((current) => [
      ...current,
      { ...data, id: createId(), image: '🍽️', color: '#ecfdf5', isCustom: true },
    ])
  }

  function deleteRecipe(id) {
    setCustomRecipes((current) => current.filter((recipe) => recipe.id !== id))
  }

  return { customRecipes, addRecipe, deleteRecipe }
}
