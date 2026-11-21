import { formatDaysLabel, getDaysUntilExpiration, getExpirationStatus, parseDate } from '../utils/expiration.js'
import { getIngredientIcon } from '../utils/ingredientIcons.js'

const ITEMS_PER_SHELF = 9
const MIN_SHELVES = 3

// Ways to order the shelves. Items missing the sorted-by date go last.
export const PANTRY_SORTS = {
  expiration: {
    label: 'Expiring first',
    compare: (a, b) => (getDaysUntilExpiration(a.expirationDate) ?? Infinity) - (getDaysUntilExpiration(b.expirationDate) ?? Infinity),
  },
  name: {
    label: 'A to Z',
    compare: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  },
  bought: {
    label: 'Newest bought',
    compare: (a, b) => (parseDate(b.dateAdded)?.getTime() ?? -Infinity) - (parseDate(a.dateAdded)?.getTime() ?? -Infinity),
  },
}

function formatBought(dateString) {
  const date = parseDate(dateString)
  if (!date) return 'No purchase date'
  return `Bought ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}

// The inside of the fridge, full screen: lit walls, glass shelves, and the pantry
// lined up on them in the chosen order.
// On the Pantry tab it is `interactive`: each item is a button that opens it for editing.
// Behind the recipe cards it is only a backdrop.
export default function FridgeShelves({ items, interactive = false, onSelect, sortBy = 'expiration' }) {
  const sort = PANTRY_SORTS[sortBy] ?? PANTRY_SORTS.expiration
  const sorted = [...items].sort(sort.compare)
  // Add shelves as the pantry grows so items never crowd off the glass.
  const shelfCount = Math.max(MIN_SHELVES, Math.ceil(sorted.length / ITEMS_PER_SHELF))
  const perShelf = Math.max(1, Math.ceil(sorted.length / shelfCount))
  const shelves = Array.from({ length: shelfCount }, (_, i) => sorted.slice(i * perShelf, (i + 1) * perShelf))

  return (
    <div className="interior" aria-hidden={!interactive} style={{ '--shelves': shelfCount }}>
      <div className="interior-inner">
        <div className="interior-wall interior-wall-left" />
        <div className="interior-wall interior-wall-right" />
        <div className="interior-ceiling" />
        <div className="interior-lamp" />

        <div className="interior-shelves">
          {shelves.map((shelf, index) => (
            <div className="glass-shelf" key={index}>
              <div className="shelf-items">
                {shelf.map((item) => {
                  const days = getDaysUntilExpiration(item.expirationDate)
                  const { level } = getExpirationStatus(days)
                  return (
                    <button
                      type="button"
                      className="food"
                      key={item.id}
                      onClick={() => onSelect?.(item)}
                      tabIndex={interactive ? 0 : -1}
                      title={`${item.name}: ${item.quantity} ${item.unit}`}
                    >
                      <span className="food-icon">{getIngredientIcon(item.name)}</span>
                      <span className="food-name">{item.name}</span>
                      {/* The line under the name shows whatever the shelves are sorted by. */}
                      {sortBy === 'bought' ? (
                        <span className="food-expiry">{formatBought(item.dateAdded)}</span>
                      ) : (
                        <span className={`food-expiry expiry-${level}`}>{formatDaysLabel(days)}</span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="shelf-surface" />
              <div className="shelf-edge" />
            </div>
          ))}
        </div>

        <div className="crisper">
          <div className="crisper-drawer" />
          <div className="crisper-drawer" />
        </div>
      </div>
    </div>
  )
}
