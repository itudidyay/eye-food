import { useState } from 'react'
import { dateFromToday, parseDate } from '../utils/expiration.js'
import { COMMON_UNITS } from '../utils/options.js'
import Autocomplete from './Autocomplete.jsx'
import UnitInput from './UnitInput.jsx'

// Used for both adding and editing. If `initialValues` is passed, the form starts filled in.
export default function IngredientForm({ initialValues, onSubmit, onCancel, onDelete, pantryNames = [], unitOptions = COMMON_UNITS }) {
  const [form, setForm] = useState({
    name: initialValues?.name ?? '',
    quantity: initialValues?.quantity ?? 1,
    unit: initialValues?.unit ?? 'item',
    dateAdded: initialValues?.dateAdded || dateFromToday(0),
    expirationDate: initialValues?.expirationDate ?? dateFromToday(7),
    price: initialValues?.price ? String(initialValues.price) : '',
  })
  const [errors, setErrors] = useState({})

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function validate() {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Enter a name.'
    const quantity = Number(form.quantity)
    if (form.quantity === '' || !Number.isFinite(quantity) || quantity <= 0) newErrors.quantity = 'Must be greater than 0.'
    if (!form.unit.trim()) newErrors.unit = 'Enter a unit.'
    if (!parseDate(form.dateAdded)) newErrors.dateAdded = 'Pick a date.'
    if (!parseDate(form.expirationDate)) newErrors.expirationDate = 'Pick a date.'
    if (form.price !== '' && !(Number(form.price) >= 0)) newErrors.price = 'Must be 0 or more.'
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
      price: form.price === '' ? 0 : Number(form.price),
    })
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="name">Name</label>
        <Autocomplete
          id="name"
          value={form.name}
          onChange={(name) => setField('name', name)}
          suggestions={pantryNames}
          placeholder="Spinach"
          ariaLabel="Name"
          autoFocus
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="quantity">Quantity</label>
          <input id="quantity" type="number" min="0" step="any" value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} />
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
          <label htmlFor="dateAdded">Bought</label>
          <input id="dateAdded" type="date" value={form.dateAdded} onChange={(e) => setField('dateAdded', e.target.value)} />
          {errors.dateAdded && <p className="form-error">{errors.dateAdded}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="expirationDate">Expires</label>
          <input id="expirationDate" type="date" value={form.expirationDate} onChange={(e) => setField('expirationDate', e.target.value)} />
          {errors.expirationDate && <p className="form-error">{errors.expirationDate}</p>}
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="price">Price paid</label>
        <div className="input-with-prefix">
          <span>$</span>
          <input id="price" type="number" min="0" step="0.01" placeholder="Optional" value={form.price} onChange={(e) => setField('price', e.target.value)} />
        </div>
        {errors.price && <p className="form-error">{errors.price}</p>}
      </div>

      <div className="form-actions">
        {initialValues && onDelete && (
          <button type="button" className="text-button danger form-delete" onClick={onDelete}>
            Delete
          </button>
        )}
        <button type="button" className="text-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button">
          {initialValues ? 'Save' : 'Add'}
        </button>
      </div>
    </form>
  )
}
