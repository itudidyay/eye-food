import { useState } from 'react'
import useShoppingList from '../hooks/useShoppingList.js'

// Beyond this many items the list scrolls inside the paper, so the note never runs off the wall.
const MAX_VISIBLE = 7

// A notepad taped to the kitchen wall, left of the fridge. Type an item and press Enter
// to add it, tick it off once it is in the basket, or remove it with the cross.
// `active` is false while the fridge is opening or open, so the list cannot be tabbed into
// when it is off screen.
export default function ShoppingList({ active }) {
  const { items, addItem, toggleItem, removeItem, clearDone } = useShoppingList()
  const [draft, setDraft] = useState('')
  const tabIndex = active ? 0 : -1
  const doneCount = items.filter((item) => item.done).length

  function handleSubmit(event) {
    event.preventDefault()
    addItem(draft)
    setDraft('')
  }

  return (
    <div className="wall-sign wall-list">
      <div className="wall-list-paper">
        <p className="wall-note-title">Shopping list</p>

        {items.length > 0 && (
          <ul className={`wall-list-items ${items.length > MAX_VISIBLE ? "is-long" : ""}`}>
            {items.map((item) => (
              <li key={item.id} className={item.done ? 'is-done' : ''}>
                <label>
                  <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} tabIndex={tabIndex} />
                  <span>{item.text}</span>
                </label>
                <button type="button" onClick={() => removeItem(item.id)} tabIndex={tabIndex} aria-label={`Remove ${item.text}`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={items.length === 0 ? 'What do we need?' : 'Add another…'}
            aria-label="Add an item to the shopping list"
            autoComplete="off"
            maxLength={60}
            tabIndex={tabIndex}
          />
        </form>

        {doneCount > 0 && (
          <button type="button" className="wall-list-clear" onClick={clearDone} tabIndex={tabIndex}>
            Clear {doneCount} ticked
          </button>
        )}
      </div>
    </div>
  )
}
