import RecipeImage from './RecipeImage.jsx'
import { estimateIngredientCost, estimateRecipeCost, formatMoney } from '../utils/pricing.js'

// The two cards shown side by side after a search.
// Both receive a result already scaled to the chosen servings (see scaleResult).

export function RecipeSummary({ recipe, result, servings, onServings, onOpen }) {
  const cost = estimateRecipeCost(result)

  return (
    <section className="card">
      <RecipeImage recipe={recipe} size="large" />
      <h2 className="card-title">{recipe.name}</h2>
      <p className="muted">{recipe.description}</p>
      <p className="muted small">
        {recipe.cookingTime} min · {recipe.difficulty}
      </p>

      <div className="stepper-row">
        <span className="muted small">Servings</span>
        <div className="stepper" role="group" aria-label="Servings">
          <button type="button" onClick={() => onServings(Math.max(1, servings - 1))} disabled={servings <= 1} aria-label="Fewer servings">
            −
          </button>
          <span>{servings}</span>
          <button type="button" onClick={() => onServings(servings + 1)} aria-label="More servings">
            +
          </button>
        </div>
      </div>

      <dl className="facts">
        <div>
          <dt>Cost</dt>
          <dd>
            {formatMoney(cost.totalCost)}
            {cost.hasUnknown && <span className="muted"> partial</span>}
          </dd>
        </div>
        <div>
          <dt>To buy</dt>
          <dd>
            {formatMoney(cost.buyCost)}
            {cost.buyHasUnknown && <span className="muted"> partial</span>}
          </dd>
        </div>
      </dl>

      <button type="button" className="button" onClick={onOpen}>
        Open recipe
      </button>
    </section>
  )
}

export function IngredientsList({ result }) {
  const rows = [
    ...result.available.map(({ ingredient, item }) => ({
      key: ingredient.name,
      ingredient,
      item,
      have: true,
    })),
    ...result.missing.map((ingredient) => ({ key: ingredient.name, ingredient, item: null, have: false })),
  ]

  return (
    <section className="card">
      <h2 className="card-title">Ingredients</h2>
      <ul className="rows">
        {rows.map(({ key, ingredient, item, have }) => (
          <li key={key} className="row">
            <div className="row-main">
              <span className="row-name">{ingredient.name}</span>
              <span className="row-detail">
                {ingredient.amount} {ingredient.unit}
                {item && ` · ${item.name}`}
              </span>
            </div>
            <span className="row-cost">{costLabel(ingredient, item)}</span>
            <span className={`row-status ${have ? '' : 'to-buy'}`}>{have ? 'Have' : 'Buy'}</span>
          </li>
        ))}
      </ul>
      <p className="muted small">Prices are estimates. Salt, pepper, oil and water are assumed.</p>
    </section>
  )
}

function costLabel(ingredient, item) {
  const { cost } = estimateIngredientCost(ingredient.name, ingredient.amount, ingredient.unit, item)
  return cost === null ? 'n/a' : formatMoney(cost)
}
