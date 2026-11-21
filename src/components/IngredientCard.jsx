import { Archive, Pencil, Refrigerator, Snowflake, Trash2 } from 'lucide-react'
import ExpirationBadge from './ExpirationBadge.jsx'
import { formatDate, getDaysUntilExpiration, getExpirationStatus } from '../utils/expiration.js'

export const LOCATION_ICONS = {
  fridge: Refrigerator,
  freezer: Snowflake,
  pantry: Archive,
}

// One ingredient in the pantry grid.
export default function IngredientCard({ ingredient, onEdit, onDelete }) {
  const LocationIcon = LOCATION_ICONS[ingredient.location] ?? Archive
  const status = getExpirationStatus(getDaysUntilExpiration(ingredient.expirationDate))

  return (
    <article className={`ingredient-card card status-border-${status.level}`}>
      <div className="ingredient-card-top">
        <div>
          <h3 className="ingredient-name">{ingredient.name}</h3>
          <p className="ingredient-quantity">
            {ingredient.quantity} {ingredient.unit}
          </p>
        </div>
        <div className="ingredient-actions">
          <button className="icon-button" onClick={() => onEdit(ingredient)} aria-label={`Edit ${ingredient.name}`}>
            <Pencil size={16} />
          </button>
          <button
            className="icon-button danger"
            onClick={() => onDelete(ingredient)}
            aria-label={`Delete ${ingredient.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <ExpirationBadge expirationDate={ingredient.expirationDate} />

      <div className="ingredient-meta">
        <span className="location-tag">
          <LocationIcon size={14} />
          {ingredient.location}
        </span>
        <span>{formatDate(ingredient.expirationDate)}</span>
      </div>
    </article>
  )
}
