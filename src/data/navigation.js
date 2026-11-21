import { ChefHat, LayoutDashboard, Refrigerator } from 'lucide-react'

// Shared by the desktop Sidebar and the mobile Navbar.
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pantry', label: 'My Pantry', icon: Refrigerator },
  { id: 'recipes', label: 'Discover Recipes', shortLabel: 'Recipes', icon: ChefHat },
]

export default navItems
