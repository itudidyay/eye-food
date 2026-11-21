// Unit handling for cost and "do I have enough" maths.
//
// Only units in the same family can be converted:
//   mass   → g, kg, oz, lb
//   volume → ml, l, tsp, tbsp, cup, fl oz
//   count  → item (and any other unit the app doesn't know, compared by name)
// Anything else returns null, so callers can say "unknown" instead of guessing.

const ALIASES = {
  pound: 'lb', pounds: 'lb', lbs: 'lb',
  ounce: 'oz', ounces: 'oz',
  gram: 'g', grams: 'g',
  kilogram: 'kg', kilograms: 'kg',
  milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  tablespoon: 'tbsp', tablespoons: 'tbsp',
  teaspoon: 'tsp', teaspoons: 'tsp',
  cups: 'cup',
  items: 'item', piece: 'item', pieces: 'item', pc: 'item', pcs: 'item', whole: 'item', '': 'item',
}

// Size of one unit in grams (mass) or millilitres (volume).
const MASS_G = { g: 1, kg: 1000, oz: 28.35, lb: 453.6 }
const VOLUME_ML = { ml: 1, l: 1000, tsp: 4.93, tbsp: 14.79, 'fl oz': 29.57, cup: 236.6 }

/** "Cups" → "cup", "LBS" → "lb", "fl. oz" → "fl oz". */
export function normalizeUnit(unit = '') {
  const clean = String(unit).toLowerCase().replace(/\./g, '').trim()
  return ALIASES[clean] ?? clean
}

/**
 * Convert `amount` from one unit to another.
 * Returns the converted number, or null if the units can't be compared.
 */
export function convertAmount(amount, fromUnit, toUnit) {
  const from = normalizeUnit(fromUnit)
  const to = normalizeUnit(toUnit)
  if (from === to) return amount

  if (MASS_G[from] && MASS_G[to]) return (amount * MASS_G[from]) / MASS_G[to]
  if (VOLUME_ML[from] && VOLUME_ML[to]) return (amount * VOLUME_ML[from]) / VOLUME_ML[to]
  return null
}
