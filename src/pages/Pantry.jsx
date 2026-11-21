import { useState } from 'react'
import { Archive, LayoutGrid, Plus, Refrigerator, RotateCcw, Search, Snowflake, Trash2 } from 'lucide-react'
import EmptyState from '../components/EmptyState.jsx'
import IngredientCard from '../components/IngredientCard.jsx'
import { getDaysUntilExpiration } from '../utils/expiration.js'

const FILTERS = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'fridge', label: 'Fridge', icon: Refrigerator },
  { id: 'freezer', label: 'Freezer', icon: Snowflake },
  { id: 'pantry', label: 'Pantry', icon: Archive },
]

// Items with no date go to the end of the list.
function sortableDays(item) {
  const days = getDaysUntilExpiration(item.expirationDate)
  return days === null ? Infinity : days
}

export default function Pantry({ inventory, onAdd, onEdit, onDelete, onLoadSample, onClearAll }) {
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('all')

  const searchText = search.trim().toLowerCase()
  const visibleItems = inventory
    .filter((item) => location === 'all' || item.location === location)
    .filter((item) => item.name.toLowerCase().includes(searchText))
    .sort((a, b) => sortableDays(a) - sortableDays(b)) // soonest to expire first

  function countFor(filterId) {
    return filterId === 'all' ? inventory.length : inventory.filter((item) => item.location === filterId).length
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>My Pantry</h1>
          <p className="subtitle">Everything in your kitchen, sorted by what expires first.</p>
        </div>
        <button className="button button-primary" onClick={onAdd}>
          <Plus size={18} /> Add ingredient
        </button>
      </header>

      <div className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <span className="sr-only">Search ingredients</span>
          <input type="search" placeholder="Search ingredients…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>

        <div className="filter-chips" role="group" aria-label="Filter by storage location">
          {FILTERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`chip ${location === id ? 'active' : ''}`}
              onClick={() => setLocation(id)}
              aria-pressed={location === id}
            >
              <Icon size={16} />
              {label}
              <span className="chip-count">{countFor(id)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="legend" aria-label="Color legend">
        <span><i className="dot status-urgent" /> 0–1 days</span>
        <span><i className="dot status-soon" /> 2–3 days</span>
        <span><i className="dot status-week" /> 4–7 days</span>
        <span><i className="dot status-fresh" /> 7+ days</span>
        <span><i className="dot status-expired" /> Expired</span>
      </div>

      {inventory.length === 0 ? (
        <EmptyState icon={Refrigerator} title="Nothing tracked yet" message="Add what's in your fridge, freezer, and pantry, or load some sample data to explore.">
          <button className="button button-primary" onClick={onAdd}>
            <Plus size={18} /> Add ingredient
          </button>
          <button className="button button-secondary" onClick={onLoadSample}>
            <RotateCcw size={18} /> Load sample data
          </button>
        </EmptyState>
      ) : visibleItems.length === 0 ? (
        <EmptyState icon={Search} title="No ingredients found" message="Try a different search or location filter." />
      ) : (
        <div className="ingredient-grid">
          {visibleItems.map((item) => (
            <IngredientCard key={item.id} ingredient={item} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}

      {inventory.length > 0 && (
        <div className="page-footer-actions">
          <button className="button button-ghost" onClick={onLoadSample}>
            <RotateCcw size={16} /> Reset to sample data
          </button>
          <button className="button button-ghost danger" onClick={onClearAll}>
            <Trash2 size={16} /> Clear all
          </button>
        </div>
      )}
    </div>
  )
}
