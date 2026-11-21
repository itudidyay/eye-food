// Picks a picture for an ingredient so the fridge shelves show food, not labels.
// The first keyword found in the name wins, so more specific words come first.
const ICONS = [
  ['tomato sauce', '🥫'],
  ['soy sauce', '🍶'],
  ['sour cream', '🥛'],
  ['bell pepper', '🫑'],
  ['green onion', '🧅'],
  ['broth', '🥫'],
  ['chicken', '🍗'],
  ['beef', '🥩'],
  ['bacon', '🥓'],
  ['egg', '🥚'],
  ['milk', '🥛'],
  ['yogurt', '🥛'],
  ['butter', '🧈'],
  ['cheese', '🧀'],
  ['cheddar', '🧀'],
  ['parmesan', '🧀'],
  ['feta', '🧀'],
  ['spinach', '🥬'],
  ['lettuce', '🥬'],
  ['celery', '🥬'],
  ['basil', '🌿'],
  ['broccoli', '🥦'],
  ['mushroom', '🍄'],
  ['tomato', '🍅'],
  ['carrot', '🥕'],
  ['cucumber', '🥒'],
  ['zucchini', '🥒'],
  ['pepper', '🫑'],
  ['onion', '🧅'],
  ['garlic', '🧄'],
  ['potato', '🥔'],
  ['avocado', '🥑'],
  ['lemon', '🍋'],
  ['banana', '🍌'],
  ['strawberr', '🍓'],
  ['olive', '🫒'],
  ['peas', '🫛'],
  ['bread', '🍞'],
  ['tortilla', '🫓'],
  ['pasta', '🍝'],
  ['rice', '🍚'],
  ['oat', '🥣'],
  ['honey', '🍯'],
]

const FALLBACK = '🫙'

export function getIngredientIcon(name) {
  const lower = name.toLowerCase()
  const match = ICONS.find(([keyword]) => lower.includes(keyword))
  return match ? match[1] : FALLBACK
}
