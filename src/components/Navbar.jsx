import navItems from '../data/navigation.js'
import Logo from './Logo.jsx'

// Mobile navigation: a slim header and a tab bar at the bottom of the screen.
export default function Navbar({ currentPage, onNavigate }) {
  return (
    <>
      <header className="mobile-header">
        <Logo />
      </header>
      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map(({ id, label }) => (
          <button
            key={id}
            className={`bottom-nav-link ${currentPage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
            aria-current={currentPage === id ? 'page' : undefined}
          >
            {label}
          </button>
        ))}
      </nav>
    </>
  )
}
