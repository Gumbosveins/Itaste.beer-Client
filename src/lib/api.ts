import type {
  ApiResult,
  Beer,
  CreateRoomResult,
  Dashboard,
  JoinRoomResult,
  ReviewResults,
  ReviewTypeOption,
  UserRoom,
} from './types'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5082').replace(/\/$/, '')

const SUCCESS = 0

async function readError(res: Response): Promise<string> {
  const text = await res.text()
  if (!text) {
    return `Request failed (${res.status})`
  }
  try {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed === 'string') {
      return parsed
    }
    if (parsed && typeof parsed === 'object' && 'message' in parsed) {
      return String((parsed as { message: unknown }).message)
    }
  } catch {
    // plain text body, fall through
  }
  return text
}

async function request<T>(path: string, init?: RequestInit, controller = 'Taster'): Promise<T> {
  const res = await fetch(`${API_URL}/api/${controller}/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    throw new Error(await readError(res))
  }
  return (await res.json()) as T
}

// Many endpoints answer 200 with a status field; treat non success as an error
function ensureOk<T extends ApiResult>(result: T): T {
  if (result.status !== SUCCESS) {
    throw new Error(result.message || 'Something went wrong')
  }
  return result
}

const post = <T>(path: string, body: unknown): Promise<T> =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })

const q = (params: Record<string, string | number | boolean>): string =>
  new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()

export const api = {
  createRoom: async (body: { roomName: string; pin: number; blind: boolean; revealCode: string }) =>
    ensureOk(await post<CreateRoomResult>('CreateRoom', body)),

  finishRoomCreation: async (body: {
    roomCode: string
    pin: number
    beers: { id: number; displayOrder: number }[]
    categories: { id: number; maxValue: number; displayOrder: number; name: string; abbr: string; isNew: boolean }[]
  }) => ensureOk(await post<ApiResult>('FinishRoomCreation', body)),

  joinRoom: async (body: { roomCode: string; pin: number; username: string }) =>
    ensureOk(await post<JoinRoomResult>('JoinRoom', body)),


  addReview: async (body: {
    beverageId: number
    userId: string
    roomCode: string
    parts: { reviewTypeId: number; score: number }[]
    comment: string
  }) => ensureOk(await post<ApiResult>('AddReview', body)),

  getRoom: async (roomCode: string, pin: number, userId: string) =>
    ensureOk(await request<UserRoom>(`GetRoom?${q({ roomCode, pin, userId })}`)),

  getDashboard: async (roomCode: string, pin: number) =>
    ensureOk(await request<Dashboard>(`GetDashboard?${q({ roomCode, pin })}`)),

  searchForBeers: (query: string, force: boolean) =>
    request<Beer[]>(`SearchForBeers?${q({ query, force })}`),

  getReviewTypes: () => request<ReviewTypeOption[]>('GetReviewTypes'),

  unlockBeer: async (roomCode: string, beerId: number) =>
    ensureOk(await request<ApiResult>(`UnlockBeer?${q({ roomCode, beerId })}`)),

  finishReview: async (roomCode: string, beerId: number) =>
    ensureOk(await request<ReviewResults>(`FinishReview?${q({ roomCode, beerId })}`)),
}

const edit = async (path: string, body: { roomCode: string; pin: number } & Record<string, unknown>) =>
  ensureOk(await request<ApiResult>(path, { method: 'POST', body: JSON.stringify(body) }, 'EditRoom'))

export interface EditCategory {
  id: number
  name: string
  abbr: string
  isNew: boolean
  maxValue: number
  displayOrder: number
}

export const editRoom = {
  addBeverages: (roomCode: string, pin: number, beverageIds: number[]) => edit('AddBeverages', { roomCode, pin, beverageIds }),
  removeBeverage: (roomCode: string, pin: number, beverageId: number) => edit('RemoveBeverage', { roomCode, pin, beverageId }),
  reorderBeverages: (roomCode: string, pin: number, beverageIds: number[]) => edit('ReorderBeverages', { roomCode, pin, beverageIds }),
  updateCategories: (roomCode: string, pin: number, categories: EditCategory[]) => edit('UpdateCategories', { roomCode, pin, categories }),
  removeUser: (roomCode: string, pin: number, userId: string) => edit('RemoveUser', { roomCode, pin, userId }),
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong'
}
