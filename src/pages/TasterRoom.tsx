import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { BeerImage, Button, HIDDEN, IconButton, Logo, Spinner, TopBar } from '../components/ui'
import { PowerIcon } from '../components/icons'
import { api, errorMessage } from '../lib/api'
import { useBeerHub } from '../lib/hub'
import { clearSession, readSession } from '../lib/session'
import { fmt, reviewTotal } from '../lib/scoring'
import type { FinalScoreEvent, ReviewType, UserBeverage, UserRoom } from '../lib/types'

interface BeerDraft {
  values: Record<number, number>
  comment: string
  reviewed: boolean
  saving: boolean
  finalScore: number
}

// Delay so the taster sees the final score at the same moment the dashboard reveal finishes
const FINAL_SCORE_DELAY_MS = 7100
const SCORES = Array.from({ length: 11 }, (_, i) => i)

function initialDraft(beer: UserBeverage): BeerDraft {
  const parts = beer.review?.parts ?? null
  return {
    values: Object.fromEntries((parts ?? []).map((p) => [p.reviewTypeId, p.score])),
    comment: beer.review?.comment ?? '',
    reviewed: parts !== null,
    saving: false,
    finalScore: beer.finalScore,
  }
}

export default function TasterRoom() {
  const { roomCode = '' } = useParams()
  const navigate = useNavigate()
  const session = readSession()
  const [room, setRoom] = useState<UserRoom | null>(null)
  const [drafts, setDrafts] = useState<Record<number, BeerDraft>>({})
  const [openId, setOpenId] = useState<number | null>(null)
  const [liveId, setLiveId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const liveRef = useRef<number | null>(null)
  liveRef.current = liveId

  const missingSession = !session.userId || !session.pin || session.roomCode?.toUpperCase() !== roomCode.toUpperCase()

  // Loads the room; on refresh keeps drafts the taster has not submitted yet
  const loadRoom = useCallback(
    (keepDrafts: boolean) => {
      if (missingSession) {
        return
      }
      api
        .getRoom(roomCode, Number(session.pin), session.userId!)
        .then((data) => {
          const ordered = { ...data, beverages: [...data.beverages].sort((a, b) => a.displayOrder - b.displayOrder) }
          setRoom(ordered)
          setDrafts((prev) =>
            Object.fromEntries(
              ordered.beverages.map((b) => {
                const fresh = initialDraft(b)
                const existing = keepDrafts ? prev[b.beverageId] : undefined
                return [b.beverageId, existing ? { ...existing, finalScore: fresh.finalScore } : fresh]
              }),
            ),
          )
          const unlocked = ordered.beverages.find((b) => !b.isLocked)
          if (unlocked && liveRef.current !== unlocked.beverageId) {
            setLiveId(unlocked.beverageId)
            setOpenId(unlocked.beverageId)
          }
        })
        .catch((e: unknown) => {
          if (!keepDrafts) {
            setError(errorMessage(e))
          }
        })
    },
    // session values are read once per mount
    [roomCode, missingSession],
  )

  useEffect(() => {
    loadRoom(false)
  }, [loadRoom])

  const patchDraft = useCallback((id: number, patch: Partial<BeerDraft>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }, [])

  useBeerHub(missingSession ? undefined : roomCode, 'JoinRoomAsUser', {
    OpenBeer: (beerId: number) => {
      setLiveId(beerId)
      setOpenId(beerId)
      if ('vibrate' in navigator) {
        navigator.vibrate(150)
      }
    },
    PushFinalScore: (data: FinalScoreEvent) => {
      window.setTimeout(() => patchDraft(data.beerId, { finalScore: data.finalScore }), FINAL_SCORE_DELAY_MS)
    },
  }, () => loadRoom(true))

  const submit = async (beer: UserBeverage, reviewTypes: ReviewType[]) => {
    const draft = drafts[beer.beverageId]
    patchDraft(beer.beverageId, { saving: true })
    try {
      await api.addReview({
        beverageId: beer.beverageId,
        userId: session.userId!,
        roomCode: roomCode.toUpperCase(),
        comment: draft.comment,
        parts: reviewTypes.map((t) => ({ reviewTypeId: t.reviewId, score: draft.values[t.reviewId] ?? 0 })),
      })
      toast.success(draft.reviewed ? 'Review updated' : 'Review submitted')
      patchDraft(beer.beverageId, { saving: false, reviewed: true })
      setOpenId(null)
    } catch (e) {
      toast.error(errorMessage(e))
      patchDraft(beer.beverageId, { saving: false })
    }
  }

  const leave = () => {
    clearSession()
    navigate('/')
  }

  if (missingSession || error) {
    return (
      <div className="min-h-screen bg-amber">
        <TopBar title="Taster room" />
        <main className="mx-auto max-w-md px-4 pt-8 text-center text-white">
          <Logo className="w-48" />
          <p className="mt-6 text-lg font-medium">{error ?? 'Join the room first to start rating.'}</p>
          <Link to="/join" className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-amber shadow">Join a room</Link>
        </main>
      </div>
    )
  }

  const reviewTypes = room ? [...room.reviewTypes].sort((a, b) => a.displayOrder - b.displayOrder) : []

  return (
    <div className="min-h-screen bg-foam">
      <TopBar title={room?.name ?? roomCode} right={<IconButton label="Leave room" onClick={leave}><PowerIcon /></IconButton>} />
      {!room && <div className="flex justify-center pt-16 text-pink"><Spinner className="h-10 w-10" /></div>}
      {room && (
        <main className="mx-auto max-w-xl space-y-3 px-3 pb-16 pt-4">
          <p className="px-1 text-sm text-ink/60">Hi {session.username}. The host opens each beer for voting, it will pop open here.</p>
          {room.beverages.map((beer, i) => {
            const draft = drafts[beer.beverageId]
            const open = openId === beer.beverageId
            const live = liveId === beer.beverageId
            const blind = room.isBlind
            return (
              <article key={beer.beverageId} className={`overflow-hidden rounded-2xl bg-white shadow ring-1 transition ${live ? 'ring-2 ring-pink' : 'ring-black/5'}`}>
                <button type="button" onClick={() => setOpenId(open ? null : beer.beverageId)} className="flex w-full items-center gap-3 p-4 text-left">
                  <span className="relative">
                    <BeerImage src={beer.imageUrlSm} hidden={blind} className={`h-14 w-14 ${live ? 'pulse' : ''}`} />
                    <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{i + 1}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{blind ? HIDDEN : beer.name}</span>
                    <span className="block truncate text-sm text-ink/60">{blind ? HIDDEN : beer.manufacturer}</span>
                    <span className="block text-xs text-ink/50">
                      {blind ? HIDDEN : beer.typeName} · {beer.alcoholPercentage}% · IBU {beer.ibu > 0 ? beer.ibu : 'N/A'}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-xs text-ink/50">You</span>
                    <span className={`block text-xl font-bold ${draft?.reviewed ? 'text-emerald-600' : 'text-ink/30'}`}>{fmt(reviewTotal(draft?.values ?? {}, reviewTypes))}</span>
                    {draft && draft.finalScore >= 0 && (
                      <span className="block text-xs font-semibold text-pink">Final {fmt(draft.finalScore)}</span>
                    )}
                  </span>
                </button>

                {open && draft && (
                  <div className="space-y-4 border-t border-black/5 bg-foam/60 p-4">
                    {reviewTypes.map((t) => (
                      <div key={t.reviewId}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium">{t.name}</span>
                          <span className="text-ink/50">{t.maxValue}%</span>
                        </div>
                        <div className="grid grid-cols-11 gap-1">
                          {SCORES.map((n) => {
                            const active = (draft.values[t.reviewId] ?? 0) === n
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => patchDraft(beer.beverageId, { values: { ...draft.values, [t.reviewId]: n } })}
                                className={`aspect-square rounded-lg text-sm font-semibold transition ${active ? 'bg-pink text-white shadow' : 'bg-white text-ink/70 ring-1 ring-black/10 hover:bg-pink/10'}`}
                                aria-pressed={active}
                              >
                                {n}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    <input
                      value={draft.comment}
                      onChange={(e) => patchDraft(beer.beverageId, { comment: e.target.value })}
                      placeholder={blind ? 'Guess the beer' : 'Comment'}
                      maxLength={300}
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-pink"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink/60">Your score <b className="text-lg text-ink">{fmt(reviewTotal(draft.values, reviewTypes))}</b></span>
                      <Button variant={draft.reviewed ? 'amber' : 'green'} busy={draft.saving} onClick={() => void submit(beer, reviewTypes)}>
                        {draft.reviewed ? 'Update review' : 'Submit review'}
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </main>
      )}
    </div>
  )
}
