// Shows a recipe's image. `recipe.image` can be an emoji or a URL/path to a photo.
export default function RecipeImage({ recipe, size = 'medium' }) {
  const isUrl = /^(https?:)?\/|^data:|\.(png|jpe?g|webp|gif|svg)$/i.test(recipe.image ?? '')

  return (
    <div className={`recipe-image recipe-image-${size}`} style={{ background: recipe.color ?? '#ecfdf5' }}>
      {isUrl ? (
        <img src={recipe.image} alt={recipe.name} />
      ) : (
        <span role="img" aria-label={recipe.name}>
          {recipe.image || '🍽️'}
        </span>
      )}
    </div>
  )
}
