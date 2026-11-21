import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Autocomplete from './Autocomplete.jsx'
import UnitInput from './UnitInput.jsx'
import { createId } from '../utils/storage.js'
import { COMMON_UNITS } from '../utils/options.js'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

const blankIngredient = () => ({ rowId: createId(), name: '', amount: 1, unit: 'item' })

// Turn the instructions textarea (one step per line) into a clean list.
const toSteps = (text) => text.split('\n').map((line) => line.trim()).filter(Boolean)

// Form for a recipe the user writes themselves. Calls onSubmit with clean recipe data.
export default function RecipeForm({ pantryNames = [], unitOptions = COMMON_UNITS, onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: '', description: '', cookingTime: 30, difficulty: 'Easy', instructions: '' })
  const [ingredients, setIngredients] = useState(() => [blankIngredient()])
  const [errors, setErrors] = useState({})

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateIngredient(rowId, field, value) {
    setIngredients((list) => list.map((ing) => (ing.rowId === rowId ? { ...ing, [field]: value } : ing)))
  }

  function removeIngredient(rowId) {
    setIngredients((list) => (list.length > 1 ? list.filter((ing) => ing.rowId !== rowId) : list))
  }

  function validate(filled) {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Please give your recipe a name.'
    if (!(Number(form.cookingTime) > 0)) newErrors.cookingTime = 'Enter minutes greater than 0.'
    if (filled.length === 0) newErrors.ingredients = 'Add at least one ingredient.'
    else if (filled.some((ing) => !(Number(ing.amount) > 0))) {
      newErrors.ingredients = 'Every ingredient needs an amount greater than 0.'
    }
    if (toSteps(form.instructions).length === 0) newErrors.instructions = 'Add at least one step.'
    return newErrors
  }

  function handleSubmit(event) {
    event.preventDefault()
    // Rows with no name are ignored, so an empty row doesn't cause an error.
    const filled = ingredients.filter((ing) => ing.name.trim())
    const newErrors = validate(filled)
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || 'A recipe I made myself.',
      cookingTime: Math.round(Number(form.cookingTime)),
      difficulty: form.difficulty,
      ingredients: filled.map((ing) => ({
        name: ing.name.trim(),
        amount: Number(ing.amount),
        unit: ing.unit.trim() || 'item',
      })),
      instructions: toSteps(form.instructions),
    })
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="recipe-name">Recipe name</label>
        <input
          id="recipe-name"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="e.g. Grandma's Lentil Soup"
          autoFocus
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="recipe-description">
          Short description <span className="optional">(optional)</span>
        </label>
        <textarea
          id="recipe-description"
          rows={2}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="recipe-time">Cooking time (minutes)</label>
          <input
            id="recipe-time"
            type="number"
            min="1"
            step="1"
            value={form.cookingTime}
            onChange={(e) => setField('cookingTime', e.target.value)}
          />
          {errors.cookingTime && <p className="form-error">{errors.cookingTime}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="recipe-difficulty">Difficulty</label>
          <select id="recipe-difficulty" value={form.difficulty} onChange={(e) => setField('difficulty', e.target.value)}>
            {DIFFICULTIES.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="form-field ingredient-editor">
        <legend>Ingredients</legend>
        <p className="form-hint">Amounts are used when you tap “Mark as Cooked”. Names can match your pantry items.</p>
        {ingredients.map((ing, index) => (
          <div className="recipe-ingredient-row" key={ing.rowId}>
            <Autocomplete
              id={`ing-${ing.rowId}`}
              ariaLabel={`Ingredient ${index + 1} name`}
              placeholder="Ingredient"
              value={ing.name}
              suggestions={pantryNames}
              onChange={(name) => updateIngredient(ing.rowId, 'name', name)}
            />
            <input
              aria-label={`Ingredient ${index + 1} amount`}
              type="number"
              min="0"
              step="any"
              value={ing.amount}
              onChange={(e) => updateIngredient(ing.rowId, 'amount', e.target.value)}
            />
            <UnitInput
              id={`unit-${ing.rowId}`}
              value={ing.unit}
              units={unitOptions}
              onChange={(unit) => updateIngredient(ing.rowId, 'unit', unit)}
            />
            <button
              type="button"
              className="icon-button danger"
              onClick={() => removeIngredient(ing.rowId)}
              aria-label={`Remove ingredient ${index + 1}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button type="button" className="button button-secondary add-row" onClick={() => setIngredients((l) => [...l, blankIngredient()])}>
          <Plus size={16} /> Add another ingredient
        </button>
        {errors.ingredients && <p className="form-error">{errors.ingredients}</p>}
      </fieldset>

      <div className="form-field">
        <label htmlFor="recipe-steps">Instructions</label>
        <textarea
          id="recipe-steps"
          rows={5}
          placeholder={'One step per line, e.g.\nBoil the pasta.\nAdd the sauce.'}
          value={form.instructions}
          onChange={(e) => setField('instructions', e.target.value)}
        />
        {errors.instructions && <p className="form-error">{errors.instructions}</p>}
      </div>

      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button button-primary">
          Save recipe
        </button>
      </div>
    </form>
  )
}
