import navItems from '../data/navigation.js'
import Logo from './Logo.jsx'

// Left-hand navigation on desktop screens.
export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="sidebar">
      <Logo />
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map(({ id, label }) => (
          <button
            key={id}
            className={`sidebar-link ${currentPage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
            aria-current={currentPage === id ? 'page' : undefined}
          >
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
