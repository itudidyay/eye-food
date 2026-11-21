// "20 min · Easy", shown on recipe cards and in the detail view.
export default function RecipeMeta({ recipe }) {
  return (
    <span className="muted small">
      {recipe.cookingTime} min · {recipe.difficulty}
    </span>
  )
}
