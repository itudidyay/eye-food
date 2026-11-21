import { Clock, Gauge } from 'lucide-react'

// Small "⏱ 20 min · Easy" line used on cards and in the detail view.
export default function RecipeMeta({ recipe }) {
  return (
    <div className="recipe-meta">
      <span>
        <Clock size={15} /> {recipe.cookingTime} min
      </span>
      <span className={`difficulty difficulty-${recipe.difficulty.toLowerCase()}`}>
        <Gauge size={15} /> {recipe.difficulty}
      </span>
    </div>
  )
}
