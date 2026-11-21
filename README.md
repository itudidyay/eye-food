# 🌱 EyeFood

**Cook what you have before it goes to waste.**

EyeFood tracks what is in your fridge, freezer, and pantry (with expiry dates and what you paid), suggests recipes that use your *most urgent* ingredients first, estimates what each recipe costs, and shows nearby grocery shops on an OpenStreetMap map.

## Run it

```bash
npm install      # first time only
npm run dev      # start at http://localhost:5173
npm run build    # production build into dist/
```

On the first visit the app loads **sample data** so it looks alive. Use **Pantry → Clear all** or **Reset to sample** to change that.

## How recommendations work

Each recipe ingredient you have earns urgency points based on how soon it expires:

| Days left | Points |
|---|---:|
| 0–1 | 10 |
| 2–3 | 7 |
| 4–5 | 4 |
| 6–7 | 2 |
| 7+ | 1 |

```
finalScore = urgencyScore + (ingredientMatchRatio * 5)
```

Expired items are never used. Search covers every recipe that uses at least one thing you have, and shows the extra cost for anything you still need to buy. Logic: `src/utils/recommendation.js`.

## Costs and stores

- **Recipe cost:** ingredients you own are valued at the price you entered (price ÷ quantity), and anything else uses a rough reference price from `src/data/referencePrices.js`. Costs scale with the servings stepper.
- **Stores:** `src/utils/stores.js` uses OpenStreetMap. Overpass finds grocery shops within 3 km, Nominatim turns a typed city or postcode into a location, and the map tiles come from OpenStreetMap.
- **Limits:** OpenStreetMap has no stock levels or prices, so shop costs are estimates and are the same at every shop. Edit the reference prices to match what you pay.

## Project map

```
src/
  App.jsx                 Page switching, pop-ups, and toast messages. Connects everything.
  App.css                 All styles. Colors live in :root at the top.
  hooks/useInventory.js   Inventory state: add, edit, delete, deduct. Auto-saves to localStorage.
  utils/
    expiration.js         Days-until-expiry math and status colors.
    recommendation.js     ⭐ The scoring algorithm and ingredient name matching.
    units.js              Unit conversion (g/kg/oz/lb, ml/tsp/tbsp/cup).
    pricing.js            Recipe and shopping-list cost estimates.
    stores.js             OpenStreetMap lookups: nearby shops and place search.
    storage.js            localStorage load/save, data cleanup, and sample data.
  data/
    recipes.js            22 recipes. Add more here!
    referencePrices.js    Rough per-unit prices used for cost estimates.
    navigation.js         Sidebar and bottom-nav links.
  pages/                  Fridge (the Search and Pantry tabs), Stores (full-screen map)
  FridgeScene.css         The 3D fridge scene.
  components/             Reusable UI pieces (cards, form, modal, badges...)
```

## Ideas for the team

- **Add a recipe:** copy an object in `src/data/recipes.js`, give it a new `id`, and you're done.
- **Use real photos:** put images in `public/images/` and set `image: '/images/pasta.jpg'`.
- **Change the colors:** edit the variables at the top of `App.css`.

> Expiration indicators are reminders, not food-safety guidance. Cost figures are estimates.
