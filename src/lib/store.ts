import { useSyncExternalStore } from 'react'

export interface UIState {
  /** Section currently in the middle of the viewport (data-section id). */
  section: string
  /** Theme of that section — drives header contrast. */
  theme: 'dark' | 'light'
  testDrive: { open: boolean; model?: string; outlet?: string; type?: 'test-drive' | 'price' | 'service' }
  conciergeOpen: boolean
  /** A question queued for the concierge to send when it opens. */
  conciergeAsk: string | null
  /** Outlet selected on the network map. */
  outlet: string | null
  menuOpen: boolean
}

let state: UIState = {
  section: 'hero',
  theme: 'light',
  testDrive: { open: false },
  conciergeOpen: false,
  conciergeAsk: null,
  outlet: null,
  menuOpen: false,
}
const listeners = new Set<() => void>()

export const ui = {
  get: () => state,
  set(patch: Partial<UIState>) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}

export function useUI<T>(select: (s: UIState) => T): T {
  return useSyncExternalStore(ui.subscribe, () => select(state))
}

export const openTestDrive = (opts: Omit<UIState['testDrive'], 'open'> = {}) => ui.set({ testDrive: { open: true, ...opts }, conciergeOpen: false, menuOpen: false })
export const closeTestDrive = () => ui.set({ testDrive: { ...state.testDrive, open: false } })
export const askConcierge = (q?: string) => ui.set({ conciergeOpen: true, conciergeAsk: q ?? null, menuOpen: false })
