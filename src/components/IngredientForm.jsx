import { lazy, Suspense, useState } from 'react'
import { CircleAlert, CircleCheck, LoaderCircle, ScanBarcode, Search, X } from 'lucide-react'
import { dateFromToday, parseDate } from '../utils/expiration.js'
import { COMMON_UNITS } from '../utils/options.js'
import { isPlausibleBarcode, lookupProduct } from '../utils/productLookup.js'
import Autocomplete from './Autocomplete.jsx'

// The scanner library is large, so it's downloaded only when someone opens the scanner.
const BarcodeScanner = lazy(() => import('./BarcodeScanner.jsx'))
import UnitInput from './UnitInput.jsx'

// Used for both adding and editing. If `initialValues` is passed, the form starts filled in.
// Barcode scanning is offered only when adding, so editing an item never overwrites its details by accident.
export default function IngredientForm({ initialValues, onSubmit, onCancel, onDelete, pantryNames = [], unitOptions = COMMON_UNITS }) {
  const [form, setForm] = useState({
    name: initialValues?.name ?? '',
    brand: initialValues?.brand ?? '',
    imageUrl: initialValues?.imageUrl ?? '',
    barcode: initialValues?.barcode ?? '',
    quantity: initialValues?.quantity ?? 1,
    unit: initialValues?.unit ?? 'item',
    dateAdded: initialValues?.dateAdded || dateFromToday(0),
    expirationDate: initialValues?.expirationDate ?? dateFromToday(7),
    price: initialValues?.price ? String(initialValues.price) : '',
  })
  const [errors, setErrors] = useState({})
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [loading, setLoading] = useState(false)
  // { status: 'found' | 'not_found' | 'invalid' | 'unavailable', message } or null
  const [lookup, setLookup] = useState(null)

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  // Look up a barcode and fill in what we know. The user can still edit everything afterwards.
  async function runLookup(rawCode) {
    const code = rawCode.replace(/[\s-]/g, '')
    setLookup(null)
    if (!isPlausibleBarcode(code)) {
      setLookup({ status: 'invalid', message: 'That does not look like a valid barcode. Check the digits and try again.' })
      return
    }

    setLoading(true)
    const result = await lookupProduct(code)
    setLoading(false)

    if (result.status === 'found') {
      const product = result.product
      setForm((current) => ({
        ...current,
        name: product.name,
        brand: product.brand,
        imageUrl: product.imageUrl,
        barcode: product.barcode,
      }))
      setManualCode('')
      setLookup({ status: 'found', message: `Found “${product.name}”. Now add the quantity, unit and dates.` })
    } else {
      // Keep the barcode even when the product is unknown, so it is saved with the item.
      setField('barcode', code)
      setLookup({ status: result.status, message: result.message })
    }
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
    if (form.imageUrl.trim() && !/^https:\/\//.test(form.imageUrl.trim())) {
      newErrors.imageUrl = 'Picture link must start with https://'
    }
    return newErrors
  }

  function handleSubmit(event) {
    event.preventDefault()
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    onSubmit({
      name: form.name.trim(),
      brand: form.brand.trim(),
      imageUrl: form.imageUrl.trim(),
      barcode: form.barcode,
      quantity: Number(form.quantity),
      unit: form.unit.trim(),
      dateAdded: form.dateAdded,
      expirationDate: form.expirationDate,
      price: form.price === '' ? 0 : Number(form.price),
    })
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {!initialValues && (
        <div className="scan-panel">
          {scanning ? (
            <Suspense fallback={<p className="lookup-status loading"><LoaderCircle className="spin" size={18} /> Opening camera…</p>}>
              <BarcodeScanner
                onDetected={(code) => {
                  setScanning(false)
                  runLookup(code)
                }}
                onCancel={() => setScanning(false)}
              />
            </Suspense>
          ) : (
            <>
              <button
                type="button"
                className="button scan-button"
                onClick={() => {
                  setLookup(null)
                  setScanning(true)
                }}
              >
                <ScanBarcode size={20} /> Scan barcode
              </button>
              <div className="manual-barcode">
                <label htmlFor="manual-barcode">Or type the barcode number</label>
                <div className="manual-barcode-row">
                  <input
                    id="manual-barcode"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="e.g. 3017620422003"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (manualCode.trim()) runLookup(manualCode)
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="text-button"
                    disabled={!manualCode.trim() || loading}
                    onClick={() => runLookup(manualCode)}
                  >
                    <Search size={16} /> Look up
                  </button>
                </div>
              </div>
            </>
          )}

          {loading && (
            <p className="lookup-status loading" role="status">
              <LoaderCircle className="spin" size={18} /> Looking up product…
            </p>
          )}
          {lookup && !loading && (
            <p className={`lookup-status ${lookup.status === 'found' ? 'success' : 'warn'}`} role="status">
              {lookup.status === 'found' ? <CircleCheck size={18} /> : <CircleAlert size={18} />}
              {lookup.message}
            </p>
          )}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="name">Name</label>
        <Autocomplete
          id="name"
          value={form.name}
          onChange={(name) => setField('name', name)}
          suggestions={pantryNames}
          placeholder="Spinach"
          ariaLabel="Name"
          autoFocus={!initialValues}
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="brand">
          Brand <span className="optional">(optional)</span>
        </label>
        <input id="brand" value={form.brand} onChange={(e) => setField('brand', e.target.value)} placeholder="e.g. Ferrero" />
      </div>

      {form.imageUrl && (
        <div className="product-preview">
          <img
            src={form.imageUrl}
            alt={form.name ? `Photo of ${form.name}` : 'Product photo'}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <div>
            <span className="product-preview-label">Product photo</span>
            <button type="button" className="text-button danger" onClick={() => setField('imageUrl', '')}>
              <X size={14} /> Remove photo
            </button>
          </div>
        </div>
      )}
      <div className="form-field">
        <label htmlFor="imageUrl">
          Photo link <span className="optional">(optional)</span>
        </label>
        <input
          id="imageUrl"
          type="url"
          value={form.imageUrl}
          onChange={(e) => setField('imageUrl', e.target.value)}
          placeholder="https://…"
        />
        {errors.imageUrl && <p className="form-error">{errors.imageUrl}</p>}
      </div>

      {form.barcode && <p className="barcode-tag">Barcode {form.barcode}</p>}

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
