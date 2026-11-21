// Rough reference prices (USD, typical US supermarket) used to ESTIMATE the cost
// of ingredients you don't have. These are not live prices and vary by store and
// region, so edit them to match what you actually pay.
//
// Keys are the generic recipe ingredient names. Each price is "price per `unit`".

const referencePrices = {
  avocado: { price: 1.5, unit: 'item' },
  bacon: { price: 0.6, unit: 'slice' },
  banana: { price: 0.25, unit: 'item' },
  basil: { price: 2.5, unit: 'bunch' },
  bread: { price: 0.12, unit: 'slice' },
  'bell pepper': { price: 1.0, unit: 'item' },
  broccoli: { price: 2.0, unit: 'head' },
  butter: { price: 0.16, unit: 'tbsp' },
  carrot: { price: 0.25, unit: 'item' },
  celery: { price: 0.4, unit: 'stalk' },
  'cheddar cheese': { price: 2.0, unit: 'cup' },
  'chicken breast': { price: 4.0, unit: 'lb' },
  'chicken broth': { price: 0.5, unit: 'cup' },
  cinnamon: { price: 0.15, unit: 'tsp' },
  cucumber: { price: 0.9, unit: 'item' },
  egg: { price: 0.3, unit: 'item' },
  'feta cheese': { price: 2.5, unit: 'cup' },
  garlic: { price: 0.5, unit: 'clove' },
  'green onion': { price: 0.5, unit: 'stalk' },
  'ground beef': { price: 5.0, unit: 'lb' },
  honey: { price: 0.25, unit: 'tbsp' },
  lemon: { price: 0.7, unit: 'item' },
  lettuce: { price: 2.0, unit: 'head' },
  milk: { price: 0.25, unit: 'cup' },
  mushroom: { price: 0.4, unit: 'oz' },
  oats: { price: 0.3, unit: 'cup' },
  olives: { price: 0.6, unit: 'cup' },
  onion: { price: 0.8, unit: 'item' },
  parmesan: { price: 2.0, unit: 'cup' },
  pasta: { price: 2.0, unit: 'box' },
  peas: { price: 0.9, unit: 'cup' },
  potato: { price: 0.6, unit: 'item' },
  rice: { price: 0.45, unit: 'cup' },
  'sour cream': { price: 0.6, unit: 'cup' },
  'soy sauce': { price: 0.12, unit: 'tbsp' },
  spinach: { price: 3.0, unit: 'bag' },
  strawberries: { price: 1.0, unit: 'cup' },
  'tomato sauce': { price: 1.5, unit: 'jar' },
  tomato: { price: 0.6, unit: 'item' },
  tortilla: { price: 0.4, unit: 'item' },
  yogurt: { price: 0.6, unit: 'cup' },
  zucchini: { price: 1.0, unit: 'item' },
}

export default referencePrices
