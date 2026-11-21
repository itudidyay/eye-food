// Lists used by dropdowns and autocomplete in the forms.

// Units we always offer, even on an empty pantry.
export const COMMON_UNITS = [
  'item', 'bag', 'box', 'can', 'jar', 'bottle', 'carton', 'pack',
  'cup', 'tbsp', 'tsp', 'lb', 'oz', 'g', 'kg', 'slice', 'clove', 'head', 'bunch',
]

// Special value for the "Other…" option in the unit dropdown.
export const OTHER_UNIT = '__other__'

/**
 * Units for the dropdown: the common ones first, then any other unit
 * that pantry items or saved recipes already use (sorted A–Z).
 * Case-insensitive, so "Cup" and "cup" only appear once.
 */
export function getUnitOptions(inventory = [], recipes = []) {
  const common = new Set(COMMON_UNITS.map((u) => u.toLowerCase()))
  const extras = new Map() // lowercase -> original spelling

  const consider = (unit) => {
    const clean = typeof unit === 'string' ? unit.trim() : ''
    const key = clean.toLowerCase()
    if (clean && !common.has(key) && !extras.has(key)) extras.set(key, clean)
  }

  inventory.forEach((item) => consider(item.unit))
  recipes.forEach((recipe) => recipe.ingredients?.forEach((ing) => consider(ing.unit)))

  const extraList = [...extras.values()].sort((a, b) => a.localeCompare(b))
  return [...COMMON_UNITS, ...extraList]
}

/** Unique ingredient names already in the pantry, A–Z, for autocomplete. */
export function getPantryNames(inventory = []) {
  const names = new Map()
  inventory.forEach((item) => {
    const clean = item.name.trim()
    if (clean && !names.has(clean.toLowerCase())) names.set(clean.toLowerCase(), clean)
  })
  return [...names.values()].sort((a, b) => a.localeCompare(b))
}
