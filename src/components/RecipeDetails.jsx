import { useState } from 'react'
import RecipeImage from './RecipeImage.jsx'
import RecipeMeta from './RecipeMeta.jsx'
import { scaleResult, suggestDeduction } from '../utils/recommendation.js'
import { estimateIngredientCost, estimateRecipeCost, formatMoney } from '../utils/pricing.js'

// Full view of one recipe, shown inside a Modal. `result` comes from scoreRecipe().
export default function RecipeDetails({ result, onCook, onDelete }) {
  const { recipe } = result
  const [servings, setServings] = useState(recipe.servings)
  const [isCooking, setIsCooking] = useState(false)

  const scaled = scaleResult(result, servings / recipe.servings)
  const cost = estimateRecipeCost(scaled)

  if (isCooking) {
    return <CookPanel available={scaled.available} onBack={() => setIsCooking(false)} onConfirm={onCook} />
  }

  return (
    <div className="recipe-details">
      <div className="recipe-details-top">
        <RecipeImage recipe={recipe} size="large" />
        <div>
          <p className="muted">{recipe.description}</p>
          <RecipeMeta recipe={recipe} />
          <div className="stepper-row">
            <span className="muted small">Servings</span>
            <div className="stepper" role="group" aria-label="Servings">
              <button type="button" onClick={() => setServings((s) => Math.max(1, s - 1))} disabled={servings <= 1} aria-label="Fewer servings">
                −
              </button>
              <span>{servings}</span>
              <button type="button" onClick={() => setServings((s) => s + 1)} aria-label="More servings">
                +
              </button>
            </div>
          </div>
          <dl className="facts">
            <div>
              <dt>Cost</dt>
              <dd>{formatMoney(cost.totalCost)}</dd>
            </div>
            <div>
              <dt>To buy</dt>
              <dd>{formatMoney(cost.buyCost)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section>
        <h3 className="section-title">Ingredients</h3>
        <ul className="rows">
          {scaled.available.map(({ ingredient, item }) => (
            <li key={ingredient.name} className="row">
              <div className="row-main">
                <span className="row-name">{ingredient.name}</span>
                <span className="row-detail">
                  {ingredient.amount} {ingredient.unit} · {item.name}
                </span>
              </div>
              <span className="row-cost">{formatIngredientCost(ingredient, item)}</span>
              <span className="row-status">Have</span>
            </li>
          ))}
          {scaled.missing.map((ingredient) => (
            <li key={ingredient.name} className="row">
              <div className="row-main">
                <span className="row-name">{ingredient.name}</span>
                <span className="row-detail">
                  {ingredient.amount} {ingredient.unit}
                </span>
              </div>
              <span className="row-cost">{formatIngredientCost(ingredient, null)}</span>
              <span className="row-status to-buy">Buy</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="section-title">Steps</h3>
        <ol className="steps">
          {recipe.instructions.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </section>

      <div className="modal-footer">
        {recipe.isCustom && onDelete ? (
          <button type="button" className="text-button danger" onClick={() => onDelete(recipe)}>
            Delete recipe
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="button" onClick={() => setIsCooking(true)} disabled={scaled.available.length === 0}>
          Mark as cooked
        </button>
      </div>
    </div>
  )
}

function formatIngredientCost(ingredient, item) {
  const { cost } = estimateIngredientCost(ingredient.name, ingredient.amount, ingredient.unit, item)
  return cost === null ? 'n/a' : formatMoney(cost)
}

// Second step of "Mark as cooked": confirm how much of each item was used.
function CookPanel({ available, onBack, onConfirm }) {
  const [amounts, setAmounts] = useState(() =>
    Object.fromEntries(available.map(({ ingredient, item }) => [item.id, String(suggestDeduction(ingredient, item))])),
  )

  // Two recipe ingredients could match the same item, so list each item once.
  const rows = available.filter((match, index) => available.findIndex((m) => m.item.id === match.item.id) === index)

  function handleConfirm() {
    onConfirm(
      rows.map(({ item }) => ({
        id: item.id,
        amount: Math.max(0, Math.min(Number(amounts[item.id]) || 0, item.quantity)),
      })),
    )
  }

  return (
    <div className="cook-panel">
      <p className="muted">Adjust how much you used. Anything you use up is removed from the pantry.</p>

      <ul className="rows">
        {rows.map(({ item }) => {
          const used = Number(amounts[item.id]) || 0
          const remaining = Math.max(0, Math.round((item.quantity - used) * 100) / 100)
          return (
            <li key={item.id} className="row">
              <div className="row-main">
                <span className="row-name">{item.name}</span>
                <span className="row-detail">
                  {item.quantity} {item.unit} in pantry · {remaining} left after
                </span>
              </div>
              <label className="cook-input">
                <span className="sr-only">Amount of {item.name} used</span>
                <input
                  type="number"
                  min="0"
                  max={item.quantity}
                  step="any"
                  value={amounts[item.id]}
                  onChange={(e) => setAmounts((current) => ({ ...current, [item.id]: e.target.value }))}
                />
                <span className="muted small">{item.unit}</span>
              </label>
            </li>
          )
        })}
      </ul>

      <div className="modal-footer">
        <button type="button" className="text-button" onClick={onBack}>
          Back
        </button>
        <button type="button" className="button" onClick={handleConfirm}>
          Update pantry
        </button>
      </div>
    </div>
  )
}
