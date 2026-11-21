// Everything that touches localStorage lives here, so the rest of the app
// never has to worry about JSON parsing or broken data.

import { dateFromToday, parseDate } from './expiration.js'

const STORAGE_KEY = 'fridgewise.inventory.v1'
const RECIPES_KEY = 'fridgewise.customRecipes.v1'

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
// Recipes without a servings count (older saves, built-ins that don't set one) serve 4.
export const DEFAULT_SERVINGS = 4

/** Make a unique ID. crypto.randomUUID is not available everywhere, so we have a fallback. */
export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Clean up one ingredient so the UI can trust its shape.
 * Returns null if the ingredient is unusable (for example, it has no name).
 */
export function sanitizeIngredient(raw) {
  if (!raw || typeof raw !== 'object') return null

  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) return null

  const quantity = Number(raw.quantity)
  const price = Number(raw.price)

  return {
    id: raw.id ?? createId(),
    name,
    quantity: Number.isFinite(quantity) && quantity >= 0 ? quantity : 1,
    unit: typeof raw.unit === 'string' && raw.unit.trim() ? raw.unit.trim() : 'item',
    // Older saved items have no purchase date, so they default to today.
    dateAdded: parseDate(raw.dateAdded) ? raw.dateAdded : dateFromToday(0),
    expirationDate: typeof raw.expirationDate === 'string' ? raw.expirationDate : '',
    // Total amount paid for this purchase. Optional: 0 means "not entered".
    price: Number.isFinite(price) && price > 0 ? price : 0,
  }
}

/**
 * Load the inventory from localStorage.
 * Returns null when nothing has been saved yet (first visit),
 * so the app knows it can show sample data.
 */
export function loadInventory() {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (json === null) return null

    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return []

    return parsed.map(sanitizeIngredient).filter(Boolean)
  } catch (error) {
    console.warn('Could not read inventory from localStorage:', error)
    return []
  }
}

export function saveInventory(inventory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
  } catch (error) {
    console.warn('Could not save inventory to localStorage:', error)
  }
}

/** Clean up one user-written recipe. Returns null if it has no name or no usable ingredients. */
export function sanitizeRecipe(raw) {
  if (!raw || typeof raw !== 'object') return null

  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const ingredients = (Array.isArray(raw.ingredients) ? raw.ingredients : [])
    .map((ing) => {
      const amount = Number(ing?.amount)
      const ingName = typeof ing?.name === 'string' ? ing.name.trim() : ''
      if (!ingName || !(amount > 0)) return null
      return { name: ingName, amount, unit: typeof ing.unit === 'string' && ing.unit.trim() ? ing.unit.trim() : 'item' }
    })
    .filter(Boolean)

  if (!name || ingredients.length === 0) return null

  const cookingTime = Number(raw.cookingTime)
  const servings = Number(raw.servings)

  return {
    id: raw.id ?? createId(),
    name,
    description: typeof raw.description === 'string' ? raw.description : '',
    image: typeof raw.image === 'string' && raw.image ? raw.image : '🍽️',
    color: typeof raw.color === 'string' ? raw.color : '#ecfdf5',
    ingredients,
    cookingTime: Number.isFinite(cookingTime) && cookingTime > 0 ? cookingTime : 30,
    servings: Number.isFinite(servings) && servings > 0 ? servings : DEFAULT_SERVINGS,
    difficulty: DIFFICULTIES.includes(raw.difficulty) ? raw.difficulty : 'Easy',
    instructions: Array.isArray(raw.instructions)
      ? raw.instructions.filter((step) => typeof step === 'string' && step.trim())
      : [],
    isCustom: true,
  }
}

export function loadCustomRecipes() {
  try {
    const json = localStorage.getItem(RECIPES_KEY)
    if (json === null) return []
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed.map(sanitizeRecipe).filter(Boolean) : []
  } catch (error) {
    console.warn('Could not read custom recipes from localStorage:', error)
    return []
  }
}

export function saveCustomRecipes(recipes) {
  try {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes))
  } catch (error) {
    console.warn('Could not save custom recipes to localStorage:', error)
  }
}

/**
 * Demo data so the app looks alive on the first visit.
 * Dates are relative to today, so they are never stale.
 */
export function getSampleInventory() {
  const item = (name, quantity, unit, daysFromToday) => ({
    id: createId(),
    name,
    quantity,
    unit,
    dateAdded: dateFromToday(-3),
    expirationDate: dateFromToday(daysFromToday),
  })

  return [
    item('Chicken breast', 1.5, 'lb', 0),
    item('Spinach', 1, 'bag', 1),
    item('Mushrooms', 8, 'oz', 1),
    item('Milk', 6, 'cup', 2),
    item('Greek yogurt', 2, 'cup', 3),
    item('Tomatoes', 4, 'item', 4),
    item('Bell pepper', 2, 'item', 5),
    item('Broccoli', 1, 'head', 6),
    item('Eggs', 12, 'item', 10),
    item('Carrots', 6, 'item', 12),
    item('Cheddar cheese', 3, 'cup', 14),
    item('Butter', 16, 'tbsp', 40),
    item('Strawberries', 1, 'cup', -1),    item('Ground beef', 1, 'lb', 90),
    item('Frozen peas', 2, 'cup', 120),    item('Bananas', 3, 'item', 2),
    item('Bread', 10, 'slice', 3),
    item('Tortillas', 8, 'item', 8),
    item('Onion', 3, 'item', 20),
    item('Garlic', 10, 'clove', 30),
    item('Soy sauce', 10, 'tbsp', 180),
    item('Oats', 4, 'cup', 200),
    item('Pasta', 2, 'box', 300),
    item('Rice', 5, 'cup', 365),
  ]
}
