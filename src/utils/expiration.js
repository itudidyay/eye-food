// Helpers for working with expiration dates.
// NOTE: These are friendly reminders, NOT food-safety determinations.

const MS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * Turn a "YYYY-MM-DD" string into a Date at local midnight.
 * Returns null if the string is missing or not a real date (e.g. "2026-02-30").
 */
export function parseDate(dateString) {
  if (typeof dateString !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1 // JavaScript months start at 0
  const day = Number(match[3])
  const date = new Date(year, month, day)

  // new Date(2026, 1, 30) silently becomes March 2nd, so double-check it.
  if (date.getMonth() !== month || date.getDate() !== day) return null
  return date
}

/** Today's date at local midnight. */
export function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * How many days until the item expires.
 *   0  = expires today
 *   1  = expires tomorrow
 *  -2  = expired two days ago
 * null = no valid date
 */
export function getDaysUntilExpiration(dateString) {
  const expiration = parseDate(dateString)
  if (!expiration) return null
  return Math.round((expiration - startOfToday()) / MS_PER_DAY)
}

/**
 * Turn a number of days into a status the UI can use for colors.
 * `level` is also used as a CSS class: "status-urgent", "status-fresh", ...
 */
export function getExpirationStatus(days) {
  if (days === null || days === undefined) {
    return { level: 'unknown', label: 'No date' }
  }
  if (days < 0) return { level: 'expired', label: 'Expired' } // gray
  if (days <= 1) return { level: 'urgent', label: 'Use now' } // red
  if (days <= 3) return { level: 'soon', label: 'Use soon' } // orange
  if (days <= 7) return { level: 'week', label: 'This week' } // yellow
  return { level: 'fresh', label: 'Fresh' } // green
}

/** Human-friendly text such as "Expires tomorrow" or "Expired 2 days ago". */
export function formatDaysLabel(days) {
  if (days === null || days === undefined) return 'No expiration date'
  if (days < -1) return `Expired ${Math.abs(days)} days ago`
  if (days === -1) return 'Expired yesterday'
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  return `${days} days left`
}

/** Pretty date like "Nov 22, 2026". */
export function formatDate(dateString) {
  const date = parseDate(dateString)
  if (!date) return 'Unknown date'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** A "YYYY-MM-DD" string that is `days` days from today (good for <input type="date">). */
export function dateFromToday(days) {
  const date = startOfToday()
  date.setDate(date.getDate() + days)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
