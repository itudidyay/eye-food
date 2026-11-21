// Plain-word search for recipes. Matches recipe names, descriptions and ingredient names.
// Every word typed must match something (so "spinach pasta" needs both), and a word
// matches from its start, so "spin" finds spinach and "tomatoes" finds tomato.

/** Lowercase and drop a plural ending: "Eggs" → "egg", "tomatoes" → "tomato". */
function stem(word) {
  const lower = word.toLowerCase().replace(/[^a-z]/g, '')
  if (lower.length > 4 && lower.endsWith('es')) return lower.slice(0, -2)
  if (lower.length > 3 && lower.endsWith('s') && !lower.endsWith('ss')) return lower.slice(0, -1)
  return lower
}

/**
 * Filter scored recipes (from getRecommendations) by a query.
 * Recipes whose name matches come first, then the best recommendation score.
 */
export function searchRecipes(results, query) {
  const words = query.split(/\s+/).map(stem).filter(Boolean)
  if (words.length === 0) return []

  const scored = []
  for (const result of results) {
    const nameTokens = result.recipe.name.split(/\s+/).map(stem)
    const otherTokens = [
      ...(result.recipe.description ?? '').split(/\s+/),
      ...result.recipe.ingredients.flatMap((ingredient) => ingredient.name.split(/\s+/)),
    ].map(stem)
    const everyWord = [...nameTokens, ...otherTokens]

    const matchesAll = words.every((word) => everyWord.some((token) => token.startsWith(word)))
    if (!matchesAll) continue

    const nameHits = words.filter((word) => nameTokens.some((token) => token.startsWith(word))).length
    scored.push({ result, nameHits })
  }

  return scored
    .sort((a, b) => b.nameHits - a.nameHits || b.result.finalScore - a.result.finalScore)
    .map(({ result }) => result)
}
