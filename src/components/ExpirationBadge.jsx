import { formatDaysLabel, getDaysUntilExpiration, getExpirationStatus } from '../utils/expiration.js'

// Colored pill such as "Expires tomorrow" (red) or "12 days left" (green).
export default function ExpirationBadge({ expirationDate }) {
  const days = getDaysUntilExpiration(expirationDate)
  const status = getExpirationStatus(days)

  return (
    <span className={`badge status-${status.level}`} title={status.label}>
      <span className="badge-dot" />
      {formatDaysLabel(days)}
    </span>
  )
}
