// A custom hook that owns the inventory list.
// Components call these functions instead of touching localStorage directly.

import { useEffect, useState } from 'react'
import {
  createId,
  getSampleInventory,
  loadInventory,
  sanitizeIngredient,
  saveInventory,
} from '../utils/storage.js'

export default function useInventory() {
  // The function form runs only once, on the first render.
  // First visit (nothing saved yet) → start with sample data for the demo.
  const [inventory, setInventory] = useState(() => loadInventory() ?? getSampleInventory())

  // Every time the inventory changes, save it.
  useEffect(() => {
    saveInventory(inventory)
  }, [inventory])

  function addIngredient(data) {
    const ingredient = sanitizeIngredient({ ...data, id: createId() })
    if (ingredient) setInventory((current) => [...current, ingredient])
  }

  function updateIngredient(id, data) {
    setInventory((current) =>
      current.map((item) => (item.id === id ? sanitizeIngredient({ ...item, ...data, id }) ?? item : item)),
    )
  }

  function deleteIngredient(id) {
    setInventory((current) => current.filter((item) => item.id !== id))
  }

  /**
   * Subtract amounts after cooking.
   * deductions = [{ id, amount }, ...]
   * Items that still have some left are kept. Items that hit 0 are removed.
   */
  function deductIngredients(deductions) {
    setInventory((current) =>
      current
        .map((item) => {
          const deduction = deductions.find((d) => d.id === item.id)
          if (!deduction || !(deduction.amount > 0)) return item
          // Round to 2 decimals to avoid things like 0.30000000000000004
          const remaining = Math.round((item.quantity - deduction.amount) * 100) / 100
          return { ...item, quantity: Math.max(0, remaining) }
        })
        .filter((item) => item.quantity > 0),
    )
  }

  function loadSampleData() {
    setInventory(getSampleInventory())
  }

  function clearInventory() {
    setInventory([])
  }

  return {
    inventory,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    deductIngredients,
    loadSampleData,
    clearInventory,
  }
}
