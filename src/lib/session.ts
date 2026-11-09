// Persists the taster/host session in localStorage, same keys as the legacy app so old sessions still resume

export interface Session {
  roomCode: string | null
  pin: string | null
  userId: string | null
  username: string | null
}

const KEYS = ['roomCode', 'pin', 'userId', 'username'] as const

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function readSession(): Session {
  return {
    roomCode: safeGet('roomCode'),
    pin: safeGet('pin'),
    userId: safeGet('userId'),
    username: safeGet('username'),
  }
}

export function writeSession(values: Partial<Session>): void {
  try {
    Object.entries(values).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, value)
      }
    })
  } catch {
    // storage blocked (private mode), the app still works for this page view
  }
}

export function clearSession(): void {
  try {
    KEYS.forEach((key) => localStorage.removeItem(key))
  } catch {
    // ignore
  }
}

export function hasTasterSession(session: Session): boolean {
  return Boolean(session.roomCode && session.pin && session.userId && session.username)
}
