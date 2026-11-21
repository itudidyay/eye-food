import { Flame } from 'lucide-react'
import RecipeImage from './RecipeImage.jsx'
import RecipeMeta from './RecipeMeta.jsx'

// A recommendation card. `result` comes from scoreRecipe() in utils/recommendation.js.
export default function RecipeCard({ result, onSelect, compact = false }) {
  const { recipe, available, missing, expiringSoon, finalScore, matchPercent } = result

  return (
    <article className={`recipe-card card ${compact ? 'compact' : ''}`}>
      <button className="recipe-card-button" onClick={() => onSelect(recipe.id)} aria-label={`View ${recipe.name}`}>
        <RecipeImage recipe={recipe} />
        <span className="score-pill" title="Recommendation score">
          ★ {finalScore}
        </span>
      </button>

      <div className="recipe-card-body">
        <h3>
          <button className="link-button" onClick={() => onSelect(recipe.id)}>
            {recipe.name}
          </button>
        </h3>
        <RecipeMeta recipe={recipe} />

        <div className="match-bar" aria-label={`${matchPercent}% of ingredients available`}>
          <div className="match-bar-fill" style={{ width: `${matchPercent}%` }} />
        </div>
        <p className="match-text">
          <strong>{matchPercent}% match</strong> · You have {available.length} of {recipe.ingredients.length}
        </p>

        {expiringSoon.length > 0 && (
          <p className="uses-soon">
            <Flame size={15} />
            Uses {expiringSoon.map((match) => match.item.name).join(', ')}
          </p>
        )}

        {!compact && missing.length > 0 && (
          <p className="missing-text">
            <span>Missing:</span> {missing.map((ingredient) => ingredient.name).join(', ')}
          </p>
        )}
        {!compact && missing.length === 0 && <p className="have-all">✓ You have everything!</p>}
      </div>
    </article>
  )
}
