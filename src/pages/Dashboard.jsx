import { ArrowRight, BellRing, ChefHat, CircleAlert, Clock, Package, Plus, Refrigerator, Sparkles } from 'lucide-react'
import EmptyState from '../components/EmptyState.jsx'
import ExpirationBadge from '../components/ExpirationBadge.jsx'
import RecipeCard from '../components/RecipeCard.jsx'
import { getDaysUntilExpiration } from '../utils/expiration.js'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard({ inventory, recommendations, onNavigate, onSelectRecipe, onAddIngredient }) {
  // Work out the days left for each item once, then reuse it below.
  const withDays = inventory.map((item) => ({ item, days: getDaysUntilExpiration(item.expirationDate) }))

  const expiringSoon = withDays
    .filter(({ days }) => days !== null && days >= 0 && days <= 3)
    .sort((a, b) => a.days - b.days)
  const expired = withDays.filter(({ days }) => days !== null && days < 0)
  const topRecipes = recommendations.slice(0, 3)

  return (
    <div className="page">
      <header className="page-header hero">
        <div>
          <p className="eyebrow">{getGreeting()} 👋</p>
          <h1>Let's cook before it spoils.</h1>
          <p className="subtitle">
            FridgeWise tracks what's in your kitchen and recommends recipes that use up your most urgent ingredients first.
          </p>
        </div>
        <div className="hero-actions">
          <button className="button button-primary" onClick={onAddIngredient}>
            <Plus size={18} /> Add ingredient
          </button>
          <button className="button button-secondary" onClick={() => onNavigate('recipes')}>
            <ChefHat size={18} /> Find recipes
          </button>
        </div>
      </header>

      <section className="stats-grid" aria-label="Inventory summary">
        <StatCard icon={Package} tone="green" value={inventory.length} label="Ingredients tracked" onClick={() => onNavigate('pantry')} />
        <StatCard icon={Clock} tone="orange" value={expiringSoon.length} label="Expiring within 3 days" onClick={() => onNavigate('pantry')} />
        <StatCard icon={CircleAlert} tone="gray" value={expired.length} label="Already expired" onClick={() => onNavigate('pantry')} />
      </section>

      {expiringSoon.length > 0 && (
        <section className="alert-card" role="status">
          <div className="alert-header">
            <span className="alert-icon">
              <BellRing size={20} />
            </span>
            <div>
              <h2>Use these soon!</h2>
              <p>
                {expiringSoon.length} {expiringSoon.length === 1 ? 'ingredient is' : 'ingredients are'} close to expiring.
                Recipes that use them are ranked first.
              </p>
            </div>
          </div>
          <ul className="alert-list">
            {expiringSoon.slice(0, 6).map(({ item }) => (
              <li key={item.id}>
                <span className="alert-item-name">{item.name}</span>
                <ExpirationBadge expirationDate={item.expirationDate} />
              </li>
            ))}
          </ul>
          {expiringSoon.length > 6 && (
            <button className="link-button" onClick={() => onNavigate('pantry')}>
              + {expiringSoon.length - 6} more in your pantry
            </button>
          )}
        </section>
      )}

      {expired.length > 0 && (
        <p className="notice">
          <CircleAlert size={16} />
          {expired.length} {expired.length === 1 ? 'item has' : 'items have'} passed {expired.length === 1 ? 'its' : 'their'} date.
          Check {expired.length === 1 ? 'it' : 'them'} and remove if needed.{' '}
          <button className="link-button" onClick={() => onNavigate('pantry')}>Review pantry</button>
        </p>
      )}

      <section>
        <div className="section-header">
          <h2>
            <Sparkles size={20} /> Top picks for you
          </h2>
          {topRecipes.length > 0 && (
            <button className="link-button" onClick={() => onNavigate('recipes')}>
              See all <ArrowRight size={16} />
            </button>
          )}
        </div>

        {inventory.length === 0 ? (
          <EmptyState icon={Refrigerator} title="Your kitchen is empty" message="Add a few ingredients and we'll suggest what to cook.">
            <button className="button button-primary" onClick={onAddIngredient}>
              <Plus size={18} /> Add your first ingredient
            </button>
          </EmptyState>
        ) : topRecipes.length === 0 ? (
          <EmptyState icon={ChefHat} title="No matches yet" message="None of our recipes use your current ingredients. Try adding a few staples!" />
        ) : (
          <div className="recipe-grid">
            {topRecipes.map((result) => (
              <RecipeCard key={result.recipe.id} result={result} onSelect={onSelectRecipe} compact />
            ))}
          </div>
        )}
      </section>

      <p className="disclaimer">
        Expiration indicators are reminders, not food-safety guidance. Always use your judgment.
      </p>
    </div>
  )
}

function StatCard({ icon: Icon, tone, value, label, onClick }) {
  return (
    <button className={`stat-card card tone-${tone}`} onClick={onClick}>
      <span className="stat-icon">
        <Icon size={22} />
      </span>
      <span className="stat-text">
        <strong>{value}</strong>
        <span>{label}</span>
      </span>
    </button>
  )
}
