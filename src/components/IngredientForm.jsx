import { useState } from 'react'
import { LOCATIONS } from '../utils/storage.js'
import { dateFromToday, parseDate } from '../utils/expiration.js'
import { COMMON_UNITS } from '../utils/options.js'
import Autocomplete from './Autocomplete.jsx'
import UnitInput from './UnitInput.jsx'

// Used for both adding a new ingredient and editing an existing one.
// If `initialValues` is passed, the form starts filled in (edit mode).
// `pantryNames` fills the name suggestions; `unitOptions` fills the unit dropdown.
export default function IngredientForm({ initialValues, onSubmit, onCancel, pantryNames = [], unitOptions = COMMON_UNITS }) {
  const [form, setForm] = useState({
    name: initialValues?.name ?? '',
    quantity: initialValues?.quantity ?? 1,
    unit: initialValues?.unit ?? 'item',
    dateAdded: initialValues?.dateAdded || dateFromToday(0),
    expirationDate: initialValues?.expirationDate ?? dateFromToday(7),
    location: initialValues?.location ?? 'fridge',
  })
  const [errors, setErrors] = useState({})

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleChange(event) {
    setField(event.target.name, event.target.value)
  }

  function validate() {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Please enter a name.'
    const quantity = Number(form.quantity)
    if (form.quantity === '' || !Number.isFinite(quantity) || quantity <= 0) {
      newErrors.quantity = 'Enter a number greater than 0.'
    }
    if (!form.unit.trim()) newErrors.unit = 'Please choose or type a unit.'
    if (!parseDate(form.dateAdded)) newErrors.dateAdded = 'Please pick a valid date.'
    if (!parseDate(form.expirationDate)) newErrors.expirationDate = 'Please pick a valid date.'
    return newErrors
  }

  function handleSubmit(event) {
    event.preventDefault()
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    onSubmit({
      name: form.name.trim(),
      quantity: Number(form.quantity),
      unit: form.unit.trim(),
      dateAdded: form.dateAdded,
      expirationDate: form.expirationDate,
      location: form.location,
    })
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="name">Ingredient name</label>
        <Autocomplete
          id="name"
          value={form.name}
          onChange={(name) => setField('name', name)}
          suggestions={pantryNames}
          placeholder="e.g. Spinach"
          ariaLabel="Ingredient name"
          autoFocus
        />
        <p className="form-hint">Start typing. Matching items from your pantry appear below.</p>
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="quantity">Quantity</label>
          <input id="quantity" name="quantity" type="number" min="0" step="any" value={form.quantity} onChange={handleChange} />
          {errors.quantity && <p className="form-error">{errors.quantity}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="unit">Unit</label>
          <UnitInput id="unit" value={form.unit} units={unitOptions} onChange={(unit) => setField('unit', unit)} />
          {errors.unit && <p className="form-error">{errors.unit}</p>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="dateAdded">Date bought / added</label>
          <input id="dateAdded" name="dateAdded" type="date" value={form.dateAdded} onChange={handleChange} />
          {errors.dateAdded && <p className="form-error">{errors.dateAdded}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="expirationDate">Expiration date</label>
          <input id="expirationDate" name="expirationDate" type="date" value={form.expirationDate} onChange={handleChange} />
          {errors.expirationDate && <p className="form-error">{errors.expirationDate}</p>}
        </div>
      </div>

      <fieldset className="form-field">
        <legend>Storage location</legend>
        <div className="segmented">
          {LOCATIONS.map((location) => (
            <label key={location} className={`segmented-option ${form.location === location ? 'active' : ''}`}>
              <input type="radio" name="location" value={location} checked={form.location === location} onChange={handleChange} />
              {location}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button button-primary">
          {initialValues ? 'Save changes' : 'Add ingredient'}
        </button>
      </div>
    </form>
  )
}
