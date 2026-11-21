// Cost estimates for recipes.
//
// Two sources of price:
//   1. What the user paid for an ingredient in the pantry (price ÷ quantity = price per unit).
//   2. A rough reference price (data/referencePrices.js) for things they still need to buy.
// Everything here is an ESTIMATE. The UI should say so.

import referencePrices from '../data/referencePrices.js'
import { convertAmount } from './units.js'

/** Price per one unit of a pantry item, if the user entered what they paid. */
export function getPaidUnitPrice(item) {
  if (!(item.price > 0) || !(item.quantity > 0)) return null
  return item.price / item.quantity // price per item.unit
}

/** Reference price for a recipe ingredient name, or null if we don't have one. */
export function getReferencePrice(ingredientName) {
  return referencePrices[ingredientName.trim().toLowerCase()] ?? null
}

/**
 * Estimated cost of `amount` of `unit` of an ingredient.
 * `pantryItem` is the matching item the user already has (or null if they need to buy it).
 * Returns { cost, source } where source is 'paid', 'reference' or 'unknown'.
 */
export function estimateIngredientCost(ingredientName, amount, unit, pantryItem = null) {
  if (pantryItem) {
    const paidPrice = getPaidUnitPrice(pantryItem)
    const inPaidUnits = convertAmount(amount, unit, pantryItem.unit)
    if (paidPrice !== null && inPaidUnits !== null) {
      return { cost: inPaidUnits * paidPrice, source: 'paid' }
    }
  }

  const reference = getReferencePrice(ingredientName)
  if (!reference) return { cost: null, source: 'unknown' }

  const inReferenceUnits = convertAmount(amount, unit, reference.unit)
  if (inReferenceUnits === null) return { cost: null, source: 'unknown' }
  return { cost: inReferenceUnits * reference.price, source: 'reference' }
}

/**
 * Cost summary for one scored recipe (from scoreRecipe in recommendation.js).
 * `scale` multiplies every amount (for example 2 when cooking double servings).
 *
 *   totalCost     – value of everything the recipe uses (pantry + shopping)
 *   buyCost       – just the items the user doesn't have yet ("extra to buy")
 *   hasUnknown    – true when some price couldn't be estimated, so totals are partial
 */
export function estimateRecipeCost(result, scale = 1) {
  let totalCost = 0
  let buyCost = 0
  let hasUnknown = false
  let buyHasUnknown = false

  for (const match of result.available) {
    const { ingredient, item } = match
    const { cost } = estimateIngredientCost(ingredient.name, ingredient.amount * scale, ingredient.unit, item)
    if (cost === null) hasUnknown = true
    else totalCost += cost
  }

  for (const ingredient of result.missing) {
    const { cost } = estimateIngredientCost(ingredient.name, ingredient.amount * scale, ingredient.unit, null)
    if (cost === null) {
      hasUnknown = true
      buyHasUnknown = true
    } else {
      totalCost += cost
      buyCost += cost
    }
  }

  return {
    totalCost: round2(totalCost),
    buyCost: round2(buyCost),
    hasUnknown,
    buyHasUnknown,
  }
}

export function formatMoney(value) {
  if (value === null || value === undefined) return 'price unknown'
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function round2(value) {
  return Math.round(value * 100) / 100
}
