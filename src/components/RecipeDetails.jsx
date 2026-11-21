import { useState } from 'react'
import { ArrowLeft, CircleCheck, CircleX, CookingPot, Flame, Info } from 'lucide-react'
import ExpirationBadge from './ExpirationBadge.jsx'
import RecipeImage from './RecipeImage.jsx'
import RecipeMeta from './RecipeMeta.jsx'
import { suggestDeduction } from '../utils/recommendation.js'

// Full view of one recipe, shown inside a Modal.
// `result` comes from scoreRecipe(), so we already know what's available or missing.
export default function RecipeDetails({ result, onCook }) {
  const { recipe, available, missing, finalScore, urgencyScore, matchPercent } = result
  const [isCooking, setIsCooking] = useState(false)

  if (isCooking) {
    return <CookPanel available={available} onBack={() => setIsCooking(false)} onConfirm={onCook} />
  }

  return (
    <div className="recipe-details">
      <RecipeImage recipe={recipe} size="large" />

      <div className="recipe-details-intro">
        <p className="recipe-description">{recipe.description}</p>
        <RecipeMeta recipe={recipe} />
        <div className="score-breakdown">
          <div>
            <strong>{finalScore}</strong>
            <span>Total score</span>
          </div>
          <div>
            <strong>{urgencyScore}</strong>
            <span>Urgency points</span>
          </div>
          <div>
            <strong>{matchPercent}%</strong>
            <span>Ingredients on hand</span>
          </div>
        </div>
      </div>

      <section>
        <h3 className="section-title">Ingredients</h3>
        <ul className="ingredient-checklist">
          {available.map(({ ingredient, item, points }) => (
            <li key={ingredient.name} className="have">
              <CircleCheck size={18} />
              <span className="ingredient-line">
                {formatAmount(ingredient)} <strong>{ingredient.name}</strong>
                <small>Using your “{item.name}”{points >= 7 && <Flame size={13} className="flame" />}</small>
              </span>
              <ExpirationBadge expirationDate={item.expirationDate} />
            </li>
          ))}
          {missing.map((ingredient) => (
            <li key={ingredient.name} className="missing">
              <CircleX size={18} />
              <span className="ingredient-line">
                {formatAmount(ingredient)} <strong>{ingredient.name}</strong>
                <small>Not in your kitchen</small>
              </span>
            </li>
          ))}
        </ul>
        <p className="hint">Basic staples like salt, pepper, and oil are assumed.</p>
      </section>

      <section>
        <h3 className="section-title">Instructions</h3>
        <ol className="instructions">
          {recipe.instructions.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </section>

      <div className="sticky-actions">
        <button className="button button-primary button-large" onClick={() => setIsCooking(true)} disabled={available.length === 0}>
          <CookingPot size={18} />
          Mark as Cooked
        </button>
      </div>
    </div>
  )
}

function formatAmount(ingredient) {
  return `${ingredient.amount} ${ingredient.unit}`
}

// Step 2 of "Mark as Cooked": let the user confirm how much of each item they used.
function CookPanel({ available, onBack, onConfirm }) {
  // { [itemId]: amount as a string from the input }
  const [amounts, setAmounts] = useState(() =>
    Object.fromEntries(available.map(({ ingredient, item }) => [item.id, String(suggestDeduction(ingredient, item))])),
  )

  // Two recipe ingredients could match the same item, so list each item once.
  const rows = available.filter((match, index) => available.findIndex((m) => m.item.id === match.item.id) === index)

  function handleConfirm() {
    const deductions = rows.map(({ item }) => ({
      id: item.id,
      amount: Math.max(0, Math.min(Number(amounts[item.id]) || 0, item.quantity)),
    }))
    onConfirm(deductions)
  }

  return (
    <div className="cook-panel">
      <p className="cook-intro">
        <Info size={18} />
        Adjust how much you used. Items with some left stay in your pantry, and items you use up completely are removed.
      </p>

      <ul className="cook-list">
        {rows.map(({ ingredient, item }) => {
          const used = Number(amounts[item.id]) || 0
          const remaining = Math.max(0, Math.round((item.quantity - used) * 100) / 100)
          return (
            <li key={item.id}>
              <div className="cook-item">
                <strong>{item.name}</strong>
                <small>
                  You have {item.quantity} {item.unit} · recipe uses {formatAmount(ingredient)}
                </small>
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
                <span>{item.unit}</span>
              </label>
              <span className={`cook-remaining ${remaining === 0 ? 'used-up' : ''}`}>
                {remaining === 0 ? 'Used up' : `${remaining} left`}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="form-actions">
        <button className="button button-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="button button-primary" onClick={handleConfirm}>
          <CircleCheck size={16} /> Update my pantry
        </button>
      </div>
    </div>
  )
}
