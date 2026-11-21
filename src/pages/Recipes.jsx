import { useState } from 'react'
import { ChefHat, Info, Plus, Search } from 'lucide-react'
import EmptyState from '../components/EmptyState.jsx'
import RecipeCard from '../components/RecipeCard.jsx'
import { SORT_OPTIONS } from '../utils/recommendation.js'

export default function Recipes({ recommendations, totalRecipes, onSelectRecipe, onNavigate, onAddRecipe }) {
  const [sortBy, setSortBy] = useState('score')
  const [search, setSearch] = useState('')

  const searchText = search.trim().toLowerCase()
  const visible = recommendations
    .filter(({ recipe }) => recipe.name.toLowerCase().includes(searchText))
    .sort(SORT_OPTIONS[sortBy].compare) // .filter() already made a copy, so sorting is safe

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Discover Recipes</h1>
          <p className="subtitle">
            {recommendations.length} of {totalRecipes} recipes use something you have. Ingredients close to expiring push a recipe up the list.
          </p>
        </div>
        <button className="button button-primary" onClick={onAddRecipe}>
          <Plus size={18} /> Add recipe
        </button>
      </header>

      <details className="how-it-works">
        <summary>
          <Info size={16} /> How are recipes scored?
        </summary>
        <p>
          Each ingredient you have earns <strong>urgency points</strong> based on how soon it expires:
        </p>
        <ul className="points-table">
          <li><span className="dot status-urgent" /> 0–1 days <strong>10 pts</strong></li>
          <li><span className="dot status-soon" /> 2–3 days <strong>7 pts</strong></li>
          <li><span className="dot status-week" /> 4–5 days <strong>4 pts</strong></li>
          <li><span className="dot status-week" /> 6–7 days <strong>2 pts</strong></li>
          <li><span className="dot status-fresh" /> 7+ days <strong>1 pt</strong></li>
        </ul>
        <p>
          <code>score = urgency points + (ingredient match % × 5)</code>. Expired items are never used.
        </p>
      </details>

      <div className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <span className="sr-only">Search recipes</span>
          <input type="search" placeholder="Search recipes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label className="select-box">
          <span>Sort by</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {Object.entries(SORT_OPTIONS).map(([id, option]) => (
              <option key={id} value={id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {recommendations.length === 0 ? (
        <EmptyState icon={ChefHat} title="No recipe matches yet" message="Add ingredients to your pantry and we'll find recipes that use them.">
          <button className="button button-primary" onClick={() => onNavigate('pantry')}>
            Go to My Pantry
          </button>
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState icon={Search} title="No recipes found" message="Try a different search." />
      ) : (
        <div className="recipe-grid">
          {visible.map((result) => (
            <RecipeCard key={result.recipe.id} result={result} onSelect={onSelectRecipe} />
          ))}
        </div>
      )}
    </div>
  )
}
