# 🌱 FridgeWise

**Cook what you have before it goes to waste.**

FridgeWise tracks the ingredients in your fridge, freezer, and pantry and recommends recipes that use your *most urgent* ingredients first.

## Run it

```bash
npm install      # first time only
npm run dev      # start at http://localhost:5173
npm run build    # production build into dist/
```

On the first visit the app loads **sample data** so it looks alive. Use **My Pantry → Clear all** or **Reset to sample data** to change that.

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

Expired items are never used, and recipes with zero matches are hidden. Logic: `src/utils/recommendation.js`.

## Project map

```
src/
  App.jsx                 Page switching, pop-ups, and toast messages. Connects everything.
  App.css                 All styles. Colors live in :root at the top.
  hooks/useInventory.js   Inventory state: add, edit, delete, deduct. Auto-saves to localStorage.
  utils/
    expiration.js         Days-until-expiry math and status colors.
    recommendation.js     ⭐ The scoring algorithm and ingredient name matching.
    storage.js            localStorage load/save, data cleanup, and sample data.
  data/
    recipes.js            22 recipes. Add more here!
    navigation.js         Sidebar and bottom-nav links.
  pages/                  Dashboard, Pantry, Recipes
  components/             Reusable UI pieces (cards, form, modal, badges...)
```

## Ideas for the team

- **Add a recipe:** copy an object in `src/data/recipes.js`, give it a new `id`, and you're done.
- **Use real photos:** put images in `public/images/` and set `image: '/images/pasta.jpg'`.
- **Change the colors:** edit the variables at the top of `App.css`.

> Expiration indicators are reminders, not food-safety guidance.
