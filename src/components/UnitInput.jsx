import Autocomplete from './Autocomplete.jsx'

// Unit box: type any unit, and the list shows units already used in the pantry and recipes.
export default function UnitInput({ id, value, onChange, units }) {
  return (
    <Autocomplete
      id={id}
      value={value}
      onChange={onChange}
      suggestions={units}
      placeholder="e.g. cup"
      ariaLabel="Unit"
    />
  )
}
