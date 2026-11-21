import { useState } from 'react'

// A text box that shows a filtered list of suggestions below it as you type.
// Matches that start with what you typed come first, then matches that contain it.
// Works with the mouse (click), or the keyboard (↑ ↓ to move, Enter to pick, Esc to close).
export default function Autocomplete({ id, value, onChange, suggestions = [], placeholder, ariaLabel, autoFocus = false }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const query = value.trim().toLowerCase()
  const startsWith = []
  const contains = []
  suggestions.forEach((item) => {
    const lower = item.toLowerCase()
    if (!query || lower.startsWith(query)) startsWith.push(item)
    else if (lower.includes(query)) contains.push(item)
  })
  const matches = [...startsWith, ...contains]
  const listId = `${id}-suggestions`
  const showList = open && matches.length > 0

  function choose(item) {
    onChange(item)
    setOpen(false)
    setActive(-1)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!showList) {
      if (event.key === 'ArrowDown' && matches.length > 0) {
        setOpen(true)
        setActive(0)
        event.preventDefault()
      }
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => (index + 1) % matches.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => (index <= 0 ? matches.length - 1 : index - 1))
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault()
      choose(matches[active])
    }
  }

  return (
    <div className="autocomplete">
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {showList && (
        <ul id={listId} role="listbox" className="autocomplete-list">
          {matches.map((item, index) => (
            <li
              key={item}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              className={index === active ? 'active' : ''}
              // mouseDown (not click) fires before the input loses focus, so the list stays open long enough to pick.
              onMouseDown={(event) => {
                event.preventDefault()
                choose(item)
              }}
              onMouseEnter={() => setActive(index)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
