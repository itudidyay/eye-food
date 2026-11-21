import { Leaf } from 'lucide-react'

export default function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark">
        <Leaf size={18} strokeWidth={2.5} />
      </span>
      <span className="logo-text">
        Fridge<strong>Wise</strong>
      </span>
    </div>
  )
}
