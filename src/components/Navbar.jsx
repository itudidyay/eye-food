import navItems from '../data/navigation.js'
import Logo from './Logo.jsx'

// Mobile navigation: a slim top bar plus a tab bar at the bottom of the screen.
export default function Navbar({ currentPage, onNavigate, urgentCount }) {
  return (
    <>
      <header className="mobile-header">
        <Logo />
      </header>
      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map(({ id, label, shortLabel, icon: Icon }) => (
          <button
            key={id}
            className={`bottom-nav-link ${currentPage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
            aria-current={currentPage === id ? 'page' : undefined}
          >
            <span className="bottom-nav-icon">
              <Icon size={22} />
              {id === 'pantry' && urgentCount > 0 && <span className="nav-dot" />}
            </span>
            <span>{shortLabel ?? label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
