import { useState } from 'react'
import { LOCATIONS } from '../utils/storage.js'
import { dateFromToday, parseDate } from '../utils/expiration.js'

const COMMON_UNITS = ['item', 'bag', 'box', 'can', 'jar', 'bottle', 'carton', 'cup', 'tbsp', 'lb', 'oz', 'g', 'kg', 'slice', 'clove', 'head', 'bunch', 'pack']

// Used for both adding a new ingredient and editing an existing one.
// If `initialValues` is passed, the form starts filled in (edit mode).
export default function IngredientForm({ initialValues, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initialValues?.name ?? '',
    quantity: initialValues?.quantity ?? 1,
    unit: initialValues?.unit ?? 'item',
    expirationDate: initialValues?.expirationDate ?? dateFromToday(7),
    location: initialValues?.location ?? 'fridge',
  })
  const [errors, setErrors] = useState({})

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function validate() {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Please enter a name.'
    const quantity = Number(form.quantity)
    if (form.quantity === '' || !Number.isFinite(quantity) || quantity <= 0) {
      newErrors.quantity = 'Enter a number greater than 0.'
    }
    if (!form.unit.trim()) newErrors.unit = 'Please enter a unit.'
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
      expirationDate: form.expirationDate,
      location: form.location,
    })
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="name">Ingredient name</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Spinach" autoFocus />
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
          <input id="unit" name="unit" list="unit-options" value={form.unit} onChange={handleChange} />
          <datalist id="unit-options">
            {COMMON_UNITS.map((unit) => (
              <option key={unit} value={unit} />
            ))}
          </datalist>
          {errors.unit && <p className="form-error">{errors.unit}</p>}
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="expirationDate">Expiration date</label>
        <input id="expirationDate" name="expirationDate" type="date" value={form.expirationDate} onChange={handleChange} />
        {errors.expirationDate && <p className="form-error">{errors.expirationDate}</p>}
      </div>

      <fieldset className="form-field">
        <legend>Storage location</legend>
        <div className="segmented">
          {LOCATIONS.map((location) => (
            <label key={location} className={`segmented-option ${form.location === location ? 'active' : ''}`}>
              <input
                type="radio"
                name="location"
                value={location}
                checked={form.location === location}
                onChange={handleChange}
              />
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
