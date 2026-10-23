import type { Outlet } from '../data/types.ts'

// Local equirectangular projection in kilometres, centred between Surendranagar and Ahmedabad.
const LAT0 = 22.93
const LNG0 = 72.18
const KX = 111.32 * Math.cos((LAT0 * Math.PI) / 180)
const KZ = 110.57

/** x grows east, z grows south (three.js ground plane convention). */
export function project(lat: number, lng: number): [number, number] {
  return [(lng - LNG0) * KX, (LAT0 - lat) * KZ]
}

export const CITIES = [
  { name: 'Ahmedabad', lat: 23.035, lng: 72.565 },
  { name: 'Sanand', lat: 22.992, lng: 72.381 },
  { name: 'Surendranagar', lat: 22.727, lng: 71.65 },
].map((c) => ({ ...c, pos: project(c.lat, c.lng) }))

/** Distance rings are centred on the flagship Ashram Road showroom. */
export const RING_CENTRE = project(23.0362659, 72.5690763)
export const RINGS = [10, 25, 50, 100]

export const outletPos = (o: Outlet) => project(o.lat, o.lng)

export function directionsUrl(o: Outlet) {
  return `https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}
