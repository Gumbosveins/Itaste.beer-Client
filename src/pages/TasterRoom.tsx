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
    RoomUpdated: () => loadRoom(true),
    UserRemoved: (userId: string) => {
      if (userId === session.userId) {
        clearSession()
        setRoom(null)
        setError('The host removed you from this room. Join again with the room code if that was a mistake.')
      }
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
          <Logo className="w-40" />
          <p className="mt-6 text-lg font-medium">{error ?? 'Join the room first to start rating.'}</p>
          <Link to="/join" className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-amber shadow">Join a room</Link>
        </main>
      </div>
    )
  }

  const reviewTypes = room ? [...room.reviewTypes].sort((a, b) => a.displayOrder - b.displayOrder) : []
  const openBeer = room?.beverages.find((b) => b.beverageId === openId) ?? null
  const openDraft = openBeer ? drafts[openBeer.beverageId] : undefined

  return (
    <div className="flex min-h-screen flex-col bg-foam">
      <TopBar
        title={
          <span className="block leading-tight">
            <span className="block truncate">{room?.name ?? roomCode}</span>
            <span className="block text-xs font-normal text-white/85">{session.username} · room {roomCode.toUpperCase()}</span>
          </span>
        }
        right={<IconButton label="Leave room" onClick={leave}><PowerIcon /></IconButton>}
      />
      {!room && <div className="flex justify-center pt-16 text-pink"><Spinner className="h-10 w-10" /></div>}
      {room && (
        <main className={`mx-auto w-full max-w-xl flex-1 space-y-2.5 px-3 pt-3 ${openBeer ? 'pb-32' : 'pb-10'}`}>
          {!liveId && <p className="px-1 py-2 text-sm text-muted">The host opens each beer for voting, it pops open here.</p>}
          {room.beverages.map((beer, i) => {
            const draft = drafts[beer.beverageId]
            const open = openId === beer.beverageId
            const live = liveId === beer.beverageId
            const blind = room.isBlind
            const total = reviewTotal(draft?.values ?? {}, reviewTypes)
            return (
              <article
                key={beer.beverageId}
                className={`overflow-hidden rounded-[20px] bg-white transition ${open ? 'shadow-[0_0_0_2px_var(--color-pink),0_10px_24px_rgba(255,64,129,0.15)]' : 'shadow-[0_1px_2px_rgba(0,0,0,0.04)]'}`}
              >
                <button type="button" onClick={() => setOpenId(open ? null : beer.beverageId)} className="flex w-full items-center gap-3 p-3 text-left" aria-expanded={open}>
                  <BeerImage src={beer.imageUrlSm} hidden={blind} className={`shrink-0 ring-0 ${open ? 'h-[52px] w-[52px]' : 'h-9 w-9'} ${live ? 'pulse' : ''}`} />
                  <span className="min-w-0 flex-1">
                    {open && (
                      <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-pink">
                        {live ? 'Open now' : 'Your review'} · beer {i + 1} of {room.beverages.length}
                      </span>
                    )}
                    <span className={`block truncate ${open ? 'font-display text-[28px] leading-none' : 'text-sm font-semibold'}`}>{blind ? HIDDEN : beer.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {open
                        ? `${blind ? HIDDEN : beer.manufacturer} · ${beer.alcoholPercentage}% · IBU ${beer.ibu > 0 ? beer.ibu : 'N/A'}`
                        : draft?.reviewed
                          ? `You gave ${fmt(total)}`
                          : live
                            ? 'Open for voting'
                            : 'Locked until the host opens it'}
                    </span>
                  </span>
                  {!open && <BeerChip live={live} reviewed={Boolean(draft?.reviewed)} finalScore={draft?.finalScore ?? -1} />}
                </button>

                {open && draft && (
                  <div className="space-y-3.5 px-4 pb-4">
                    {reviewTypes.map((t) => (
                      <div key={t.reviewId}>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="font-semibold">{t.name}</span>
                          <span className="text-[#8a817a]">weighs {t.maxValue}%</span>
                        </div>
                        <div className="grid grid-cols-11 gap-[3px] rounded-xl bg-[#f1eeeb] p-[3px]" role="radiogroup" aria-label={t.name}>
                          {SCORES.map((n) => {
                            const active = (draft.values[t.reviewId] ?? 0) === n
                            return (
                              <button
                                key={n}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => patchDraft(beer.beverageId, { values: { ...draft.values, [t.reviewId]: n } })}
                                className={`h-[34px] rounded-[9px] text-[13px] font-bold transition ${active ? 'bg-pink text-white shadow-[0_2px_6px_rgba(255,64,129,0.35)]' : 'text-[#5a524c] hover:bg-white'}`}
                              >
                                {n}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    <label className="block text-[13px] font-semibold text-muted">
                      {blind ? 'Guess the beer' : 'Comment'}
                      <input
                        value={draft.comment}
                        onChange={(e) => patchDraft(beer.beverageId, { comment: e.target.value })}
                        maxLength={250}
                        className="mt-1.5 h-11 w-full rounded-xl border-[1.5px] border-[#e6e0db] px-3 text-[15px] font-normal text-ink outline-none focus:border-pink"
                      />
                    </label>
                  </div>
                )}
              </article>
            )
          })}
        </main>
      )}

      {openBeer && openDraft && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-white shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex max-w-xl items-center gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
            <div>
              <div className="text-xs text-[#8a817a]">Your score</div>
              <div className="font-display text-4xl leading-none">{fmt(reviewTotal(openDraft.values, reviewTypes))}</div>
            </div>
            <Button
              variant={openDraft.reviewed ? 'amber' : 'green'}
              className="h-[52px] flex-1 text-base"
              busy={openDraft.saving}
              onClick={() => void submit(openBeer, reviewTypes)}
            >
              {openDraft.reviewed ? 'Update review' : 'Submit review'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function BeerChip({ live, reviewed, finalScore }: { live: boolean; reviewed: boolean; finalScore: number }) {
  if (reviewed && finalScore >= 0) {
    return <span className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">Final {fmt(finalScore)}</span>
  }
  if (live) {
    return <span className="shrink-0 rounded-full bg-pink px-2.5 py-1 text-xs font-bold text-white">Live</span>
  }
  if (reviewed) {
    return <span className="shrink-0 rounded-full bg-[#ddf5e8] px-2.5 py-1 text-xs font-bold text-[#0f8a4e]">Sent</span>
  }
  return <span className="shrink-0 rounded-full bg-[#f1eeeb] px-2.5 py-1 text-xs font-bold text-muted">Up next</span>
}
