// Friendly placeholder shown when a list has nothing in it.
export default function EmptyState({ icon: Icon, title, message, children }) {
  return (
    <div className="empty-state">
      {Icon && (
        <span className="empty-state-icon">
          <Icon size={28} />
        </span>
      )}
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {children && <div className="empty-state-actions">{children}</div>}
    </div>
  )
}
