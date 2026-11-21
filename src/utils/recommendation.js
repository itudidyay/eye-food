// The expiration-weighted recipe recommendation algorithm.
//
// Big idea: a recipe that uses spinach expiring TOMORROW should beat a recipe
// that only uses rice that lasts a year, even if the rice recipe matches more.
//
//   finalScore = urgencyScore + (ingredientMatchRatio * 5)

import { getDaysUntilExpiration } from './expiration.js'

/**
 * Points for one matched ingredient, based on days until it expires.
 *   0–1 days → 10, 2–3 → 7, 4–5 → 4, 6–7 → 2, more than 7 → 1
 * Items with no valid date get 1 point (we can't tell how urgent they are).
 */
export function getUrgencyPoints(days) {
  if (days === null) return 1
  if (days <= 1) return 10
  if (days <= 3) return 7
  if (days <= 5) return 4
  if (days <= 7) return 2
  return 1
}

/** Make a single word singular-ish so "Tomatoes" matches "tomato". */
function singularize(word) {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y' // berries → berry
  if (word.length > 4 && word.endsWith('oes')) return word.slice(0, -2) // tomatoes → tomato
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1) // eggs → egg
  return word
}

/** "  Fresh Tomatoes! " → ["fresh", "tomato"] */
function toWords(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(singularize)
}

/**
 * Does this inventory item count as this recipe ingredient?
 * Every word of the recipe ingredient must appear in the item's name:
 *   recipe "cheddar cheese" ✓ item "Sharp cheddar cheese"
 *   recipe "egg"            ✗ item "Eggplant"   (whole words only)
 */
export function ingredientMatches(recipeIngredientName, inventoryItemName) {
  const recipeWords = toWords(recipeIngredientName)
  const itemWords = toWords(inventoryItemName)
  if (recipeWords.length === 0) return false
  return recipeWords.every((word) => itemWords.includes(word))
}

/**
 * Score one recipe against the user's inventory.
 * Expired items are ignored. We never want to recommend cooking with them.
 */
export function scoreRecipe(recipe, inventory) {
  // Attach "days left" to each usable item once, instead of recalculating.
  const usableItems = inventory
    .filter((item) => item.quantity > 0)
    .map((item) => ({ item, days: getDaysUntilExpiration(item.expirationDate) }))
    .filter(({ days }) => days === null || days >= 0)

  const available = [] // { ingredient, item, days, points }
  const missing = [] // recipe ingredients the user does not have

  for (const ingredient of recipe.ingredients) {
    const matches = usableItems.filter(({ item }) => ingredientMatches(ingredient.name, item.name))

    if (matches.length === 0) {
      missing.push(ingredient)
      continue
    }

    // If several items match (two bags of spinach), use the most urgent one.
    matches.sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity))
    const best = matches[0]
    available.push({
      ingredient,
      item: best.item,
      days: best.days,
      points: getUrgencyPoints(best.days),
    })
  }

  const urgencyScore = available.reduce((sum, match) => sum + match.points, 0)
  const matchRatio = recipe.ingredients.length > 0 ? available.length / recipe.ingredients.length : 0
  const finalScore = urgencyScore + matchRatio * 5

  return {
    recipe,
    available,
    missing,
    expiringSoon: available.filter((match) => match.days !== null && match.days <= 3),
    urgencyScore,
    matchRatio,
    matchPercent: Math.round(matchRatio * 100),
    finalScore: Math.round(finalScore * 10) / 10,
  }
}

/**
 * Score every recipe, drop the ones with zero matching ingredients,
 * and sort from best to worst.
 */
export function getRecommendations(recipes, inventory) {
  return recipes
    .map((recipe) => scoreRecipe(recipe, inventory))
    .filter((result) => result.available.length > 0)
    .sort((a, b) => b.finalScore - a.finalScore)
}

/** Ways the Discover page can sort results. */
export const SORT_OPTIONS = {
  score: { label: 'Best recommendation', compare: (a, b) => b.finalScore - a.finalScore },
  urgency: { label: 'Expiration urgency', compare: (a, b) => b.urgencyScore - a.urgencyScore || b.finalScore - a.finalScore },
  match: { label: 'Ingredient match %', compare: (a, b) => b.matchRatio - a.matchRatio || b.finalScore - a.finalScore },
  time: { label: 'Quickest to cook', compare: (a, b) => a.recipe.cookingTime - b.recipe.cookingTime },
}

// ---------- "Mark as Cooked" helpers ----------

const UNIT_ALIASES = {
  items: 'item', piece: 'item', pieces: 'item', pc: 'item', pcs: 'item', whole: 'item', '': 'item',
  lbs: 'lb', pound: 'lb', pounds: 'lb',
  tablespoon: 'tbsp', tablespoons: 'tbsp',
  teaspoon: 'tsp', teaspoons: 'tsp',
  ounce: 'oz', ounces: 'oz',
  gram: 'g', grams: 'g',
}

function normalizeUnit(unit = '') {
  const clean = unit.toLowerCase().trim()
  if (UNIT_ALIASES[clean] !== undefined) return UNIT_ALIASES[clean]
  return singularize(clean)
}

/**
 * Suggest how much of an inventory item to use when cooking.
 * If the units match ("cup" and "cups"), use the recipe amount.
 * If they don't ("1 cup" vs "1 carton"), we can't convert safely, so suggest 0
 * and let the user decide. That way we never wipe out an item by accident.
 */
export function suggestDeduction(ingredient, item) {
  if (normalizeUnit(ingredient.unit) !== normalizeUnit(item.unit)) return 0
  return Math.min(ingredient.amount, item.quantity)
}
