import type { Outlet } from '../data/types.ts'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toMinutes(t: string): number | null {
  const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i)
  if (!m) return null
  let h = Number(m[1]) % 12
  if (m[3].toUpperCase() === 'PM') h += 12
  return h * 60 + Number(m[2] ?? 0)
}

function coversDay(range: string, day: number): boolean {
  const parts = range.split('–').map((s) => DAYS.indexOf(s.trim()))
  if (parts.length === 1) return parts[0] === day
  const [a, b] = parts
  return a <= b ? day >= a && day <= b : day >= a || day <= b
}

/** Hours for the given weekday; the most specific matching entry wins (e.g. "Sun" over "Mon – Sun"). */
export function hoursFor(o: Outlet, day: number) {
  const matches = o.hours.filter((h) => coversDay(h.days, day))
  return matches.sort((x, y) => x.days.length - y.days.length)[0] ?? null
}

/** Current state in India Standard Time. */
export function openState(o: Outlet, now = new Date()): { label: string; open: boolean | null } {
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = ist.getDay()
  const h = hoursFor(o, day)
  if (!h) return { label: `${DAYS[day]} hours not listed — call ahead`, open: null }
  const [start, end] = h.time.split('–').map((s) => toMinutes(s))
  if (start == null || end == null) return { label: h.time, open: null }
  const mins = ist.getHours() * 60 + ist.getMinutes()
  if (mins >= start && mins < end) return { label: `Open now · until ${h.time.split('–')[1].trim()}`, open: true }
  return { label: mins < start ? `Opens today ${h.time.split('–')[0].trim()}` : `Closed now · ${h.days} ${h.time}`, open: false }
}
