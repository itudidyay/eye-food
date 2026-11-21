import navItems from '../data/navigation.js'
import Logo from './Logo.jsx'

// Left-hand navigation shown on desktop screens.
export default function Sidebar({ currentPage, onNavigate, urgentCount }) {
  return (
    <aside className="sidebar">
      <Logo />
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`sidebar-link ${currentPage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
            aria-current={currentPage === id ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
            {id === 'pantry' && urgentCount > 0 && <span className="nav-count">{urgentCount}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>🌱 Every meal you cook from your fridge is food that isn't wasted.</p>
      </div>
    </aside>
  )
}
