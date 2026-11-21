import { lazy, Suspense, useState } from 'react'
import { CircleAlert, CircleCheck, Camera, ImagePlus, Keyboard, LoaderCircle, ScanBarcode, Search, X } from 'lucide-react'
import { dateFromToday, parseDate } from '../utils/expiration.js'
import { COMMON_UNITS } from '../utils/options.js'
import { isPlausibleBarcode, lookupProduct } from '../utils/productLookup.js'
import { isStorablePhoto, readPhotoFile } from '../utils/photos.js'
import Autocomplete from './Autocomplete.jsx'
import UnitInput from './UnitInput.jsx'

// The scanner library is large, so it's downloaded only when someone opens the camera.
const BarcodeScanner = lazy(() => import('./BarcodeScanner.jsx'))

// Used for both adding and editing. If `initialValues` is passed, the form starts filled in.
// Barcode lookup is offered only when adding, so editing an item never overwrites its details by accident.
export default function IngredientForm({ initialValues, onSubmit, onCancel, onDelete, pantryNames = [], unitOptions = COMMON_UNITS }) {
  const [form, setForm] = useState({
    name: initialValues?.name ?? '',
    photo: initialValues?.imageUrl ?? '', // a web link, or a photo uploaded from the device
    barcode: initialValues?.barcode ?? '',
    quantity: initialValues?.quantity ?? 1,
    unit: initialValues?.unit ?? 'item',
    dateAdded: initialValues?.dateAdded || dateFromToday(0),
    expirationDate: initialValues?.expirationDate ?? dateFromToday(7),
  })
  const [errors, setErrors] = useState({})

  // Barcode panel: opened by the Barcode button, showing either the camera or a typed number.
  const [panelOpen, setPanelOpen] = useState(false)
  const [barcodeMode, setBarcodeMode] = useState('camera') // 'camera' or 'type'
  const [manualCode, setManualCode] = useState('')
  const [loading, setLoading] = useState(false)
  // { status: 'found' | 'not_found' | 'invalid' | 'unavailable', message } or null
  const [lookup, setLookup] = useState(null)

  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function openPanel() {
    setLookup(null)
    setPanelOpen(true)
  }

  function closePanel() {
    setPanelOpen(false)
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
        photo: product.imageUrl,
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

  async function handlePhotoFile(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // lets the same file be chosen again later
    if (!file) return

    setPhotoBusy(true)
    setPhotoError('')
    try {
      setField('photo', await readPhotoFile(file))
    } catch (error) {
      setPhotoError(error.message)
    } finally {
      setPhotoBusy(false)
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
    if (form.photo && !isStorablePhoto(form.photo.trim())) {
      newErrors.photo = 'Photo link must start with https://'
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
      imageUrl: form.photo.trim(),
      barcode: form.barcode,
      quantity: Number(form.quantity),
      unit: form.unit.trim(),
      dateAdded: form.dateAdded,
      expirationDate: form.expirationDate,
      // Price is no longer entered here, so an existing item keeps the price it already had.
      price: initialValues?.price ?? 0,
    })
  }

  const photoIsUpload = form.photo.startsWith('data:')

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
          autoFocus={!initialValues}
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      <div className="form-field">
        <span className="field-label">
          Photo <span className="optional">(optional)</span>
        </span>
        {form.photo && (
          <div className="product-preview">
            <img
              src={form.photo}
              alt={form.name ? `Photo of ${form.name}` : 'Product photo'}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div>
              <span className="product-preview-label">{photoIsUpload ? 'Your photo' : 'Product photo'}</span>
              <button type="button" className="text-button danger" onClick={() => setField('photo', '')}>
                <X size={14} /> Remove photo
              </button>
            </div>
          </div>
        )}
        <div className="photo-actions">
          <label className={`button button-secondary photo-upload ${photoBusy ? 'is-busy' : ''}`} htmlFor="photo-file">
            {photoBusy ? <LoaderCircle className="spin" size={16} /> : <ImagePlus size={16} />}
            {photoBusy ? 'Preparing photo…' : 'Upload photo'}
          </label>
          <input id="photo-file" className="sr-only" type="file" accept="image/*" onChange={handlePhotoFile} disabled={photoBusy} />
        </div>
        {photoError && <p className="form-error">{photoError}</p>}
        <label htmlFor="photo-link" className="sub-label">
          Or paste a photo link
        </label>
        <input
          id="photo-link"
          type="url"
          value={photoIsUpload ? '' : form.photo}
          onChange={(e) => {
            setPhotoError('')
            setField('photo', e.target.value)
          }}
          placeholder={photoIsUpload ? 'Using your uploaded photo' : 'https://…'}
        />
        {errors.photo && <p className="form-error">{errors.photo}</p>}
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

      {form.barcode && <p className="barcode-tag">Barcode {form.barcode}</p>}

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

      {panelOpen && !initialValues && (
        <div className="barcode-panel">
          <div className="barcode-modes" role="group" aria-label="How to add the barcode">
            <button
              type="button"
              className="barcode-mode"
              aria-pressed={barcodeMode === 'camera'}
              onClick={() => setBarcodeMode('camera')}
            >
              <Camera size={16} /> Use camera
            </button>
            <button
              type="button"
              className="barcode-mode"
              aria-pressed={barcodeMode === 'type'}
              onClick={() => setBarcodeMode('type')}
            >
              <Keyboard size={16} /> Type number
            </button>
          </div>

          {barcodeMode === 'camera' ? (
            <Suspense
              fallback={
                <p className="lookup-status loading">
                  <LoaderCircle className="spin" size={18} /> Opening camera…
                </p>
              }
            >
              <BarcodeScanner
                onDetected={(code) => {
                  setPanelOpen(false)
                  runLookup(code)
                }}
                onCancel={closePanel}
              />
            </Suspense>
          ) : (
            <div className="manual-barcode">
              <label htmlFor="manual-barcode">Barcode number</label>
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
                      if (manualCode.trim()) {
                        closePanel()
                        runLookup(manualCode)
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="text-button"
                  disabled={!manualCode.trim() || loading}
                  onClick={() => {
                    closePanel()
                    runLookup(manualCode)
                  }}
                >
                  <Search size={16} /> Look up
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="form-actions">
        {!initialValues && (
          <button
            type="button"
            className="text-button barcode-button"
            aria-expanded={panelOpen}
            onClick={() => (panelOpen ? closePanel() : openPanel())}
          >
            <ScanBarcode size={16} /> {panelOpen ? 'Close barcode' : 'Barcode'}
          </button>
        )}
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
