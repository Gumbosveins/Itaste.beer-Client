import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { IconButton, Logo, Spinner, TopBar } from '../components/ui'
import { EyeIcon, EyeOffIcon, PowerIcon } from '../components/icons'
import { BeerList, CurrentBeer, Leaderboard, ResultReveal, UserList, type RevealState } from '../components/DashboardPanels'
import { DonateButton } from '../components/DonateButton'
import { api, errorMessage } from '../lib/api'
import { useBeerHub } from '../lib/hub'
import { clearSession } from '../lib/session'
import { counted, flashColor, playSound, soundForScore, type FlashColor } from '../lib/scoring'
import type { BeverageReview, Dashboard as DashboardData, DashboardBeverage, NewUserJoinedEvent } from '../lib/types'

const FLASH_MS = 2500
const REVEAL_STEP_MS = 1000
const REVEAL_STEPS = 6
const FINISH_APPLY_MS = 7100

function emptyReview(beverage: DashboardBeverage, user: NewUserJoinedEvent): BeverageReview {
  return {
    id: Date.now() + Math.random(),
    username: user.username,
    userId: user.userId,
    beverageId: beverage.beverageId,
    totalScore: 0,
    parts: [],
    comment: '',
    includeInCalculations: false,
  }
}

function replaceBeverage(data: DashboardData, beverageId: number, update: (b: DashboardBeverage) => DashboardBeverage): DashboardData {
  return { ...data, beverages: data.beverages.map((b) => (b.beverageId === beverageId ? update(b) : b)) }
}

export default function Dashboard() {
  const { roomCode = '', pin = '' } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [hidden, setHidden] = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [flashes, setFlashes] = useState<Record<string, FlashColor>>({})
  const [reveal, setReveal] = useState<RevealState | null>(null)
  const currentRef = useRef<number | null>(null)
  currentRef.current = currentId
  const dataRef = useRef<DashboardData | null>(null)
  dataRef.current = data
  const timers = useRef<number[]>([])

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  useEffect(() => {
    api
      .getDashboard(roomCode, Number(pin))
      .then((d) => {
        setData({ ...d, beverages: [...d.beverages].sort((a, b) => a.displayOrder - b.displayOrder) })
        setHidden(d.isBlind)
        const unlocked = d.beverages.find((b) => !b.isLocked && !b.reviewFinished)
        setCurrentId(unlocked?.beverageId ?? null)
      })
      .catch((e: unknown) => {
        toast.error(errorMessage(e))
        navigate('/opendashboard')
      })
  }, [roomCode, pin, navigate])

  useBeerHub(data ? roomCode : undefined, 'JoinRoom', {
    NewUserJoined: (user: NewUserJoinedEvent) => {
      setData((prev) =>
        prev && !prev.users.some((u) => u.id === user.userId)
          ? {
              ...prev,
              users: [...prev.users, { id: user.userId, username: user.username }],
              beverages: prev.beverages.map((b) => ({ ...b, reviews: [...b.reviews, emptyReview(b, user)] })),
            }
          : prev,
      )
      toast.success(`${user.username} joined`)
    },
    NewReview: (review: BeverageReview) => {
      const before = dataRef.current?.beverages.find((b) => b.beverageId === review.beverageId)?.reviews.find((r) => r.userId === review.userId)
      if (review.beverageId === currentRef.current && !before?.includeInCalculations) {
        playSound('/sounds/bell.wav')
      }
      setData((prev) => {
        if (!prev) {
          return prev
        }
        return replaceBeverage(prev, review.beverageId, (b) => {
          const previous = b.reviews.find((r) => r.userId === review.userId)
          const next: BeverageReview = { ...previous, ...review, username: previous?.username ?? review.username, includeInCalculations: true }
          return {
            ...b,
            reviews: previous ? b.reviews.map((r) => (r.userId === review.userId ? next : r)) : [...b.reviews, next],
          }
        })
      })
      setFlashes((prev) => ({ ...prev, [review.userId]: flashColor(review.totalScore) }))
      later(FLASH_MS, () =>
        setFlashes((prev) => {
          const { [review.userId]: _removed, ...rest } = prev
          return rest
        }),
      )
    },
  }, (reconnected) => {
    // Reviews and joins sent while the connection was down were missed, reload them
    if (!reconnected) {
      return
    }
    api
      .getDashboard(roomCode, Number(pin))
      .then((d) => setData((prev) => ({ ...d, beverages: [...d.beverages].sort((a, b) => a.displayOrder - b.displayOrder), blindRevealCode: d.blindRevealCode ?? prev?.blindRevealCode ?? null })))
      .catch((e: unknown) => toast.error(errorMessage(e)))
  })

  const openBeer = async (beer: DashboardBeverage) => {
    if (beer.beverageId === currentId && !reveal) {
      return
    }
    setBusyId(beer.beverageId)
    try {
      await api.unlockBeer(roomCode, beer.beverageId)
      setCurrentId(beer.beverageId)
      setReveal(null)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  const finishReview = async (beer: DashboardBeverage) => {
    if (!data) {
      return
    }
    setBusyId(beer.beverageId)
    try {
      const result = await api.finishReview(roomCode, beer.beverageId)
      const others = data.beverages.filter((b) => b.reviewFinished && b.beverageId !== beer.beverageId).map((b) => b.results.totalScore)
      const rank = others.filter((score) => score > result.totalScore).length + 1
      const scored = counted(beer.reviews)
      const byScore = [...scored].sort((a, b) => b.totalScore - a.totalScore)
      setReveal({ beer, result, rank, highest: byScore[0] ?? null, lowest: byScore[byScore.length - 1] ?? null, step: 0 })
      for (let step = 1; step <= REVEAL_STEPS; step++) {
        later(step * REVEAL_STEP_MS, () => setReveal((prev) => (prev ? { ...prev, step } : prev)))
      }
      later(REVEAL_STEPS * REVEAL_STEP_MS + 500, () => playSound(soundForScore(result.totalScore)))
      later(FINISH_APPLY_MS, () =>
        setData((prev) => (prev ? replaceBeverage(prev, beer.beverageId, (b) => ({ ...b, results: result, reviewFinished: true })) : prev)),
      )
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  const deleteUser = async (userId: string, username: string) => {
    const typed = window.prompt(`Type "${username}" to remove this taster from the room`)
    if (typed !== username) {
      return
    }
    try {
      await api.deleteUser(userId)
      toast.success(`${username} removed`)
      setData((prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.filter((u) => u.id !== userId),
              beverages: prev.beverages.map((b) => ({ ...b, reviews: b.reviews.filter((r) => r.userId !== userId) })),
            }
          : prev,
      )
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const toggleHidden = () => {
    if (!data) {
      return
    }
    if (!hidden) {
      setHidden(true)
      return
    }
    const code = window.prompt('Reveal code')
    if (code === null) {
      return
    }
    if (code === data.blindRevealCode) {
      setHidden(false)
    } else {
      toast.error('Wrong reveal code')
    }
  }

  const logout = () => {
    clearSession()
    navigate('/')
  }

  const current = useMemo(() => data?.beverages.find((b) => b.beverageId === currentId) ?? null, [data, currentId])
  const allReviews = useMemo(() => data?.beverages.flatMap((b) => b.reviews) ?? [], [data])

  const currentIndex = data && current ? data.beverages.indexOf(current) + 1 : 0

  return (
    <div className="flex h-screen flex-col bg-foam">
      <TopBar
        title={data?.name}
        right={
          <>
            {data && (
              <span className="mr-2 hidden items-center gap-3 md:flex">
                <span className="text-sm text-white/85">Join at <b className="text-white">itaste.beer</b> with</span>
                <span className="rounded-[10px] bg-white pl-4 pr-2 pt-0.5 font-display text-[34px] leading-tight tracking-[0.25em] text-pink">{data.code}</span>
              </span>
            )}
            <span className="hidden lg:block"><DonateButton /></span>
            {data?.isBlind && (
              <IconButton label={hidden ? 'Reveal beers' : 'Hide beers'} onClick={toggleHidden}>{hidden ? <EyeIcon /> : <EyeOffIcon />}</IconButton>
            )}
            <IconButton label="Close dashboard" onClick={logout}><PowerIcon /></IconButton>
          </>
        }
      />
      {!data && (
        <div className="flex flex-1 flex-col items-center justify-center bg-pink">
          <Logo className="w-60" />
          <Spinner className="mt-6 h-10 w-10 text-white" />
        </div>
      )}
      {data && (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-5 pb-5 pt-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)_minmax(0,340px)] lg:overflow-hidden">
          <BeerList data={data} hidden={hidden} currentId={currentId} busyId={reveal ? null : busyId} onOpen={(b) => void openBeer(b)} />
          <section className="panel min-h-0 overflow-y-auto">
            {reveal ? (
              <ResultReveal reveal={reveal} hidden={hidden} />
            ) : current ? (
              <CurrentBeer
                beverage={current}
                index={currentIndex}
                total={data.beverages.length}
                hidden={hidden}
                busy={busyId === current.beverageId}
                reviewTypes={data.reviewTypes}
                allReviews={allReviews}
                flashes={flashes}
                onFinish={() => void finishReview(current)}
              />
            ) : (
              <UserList users={data.users} roomCode={data.code} onDelete={(id, name) => void deleteUser(id, name)} />
            )}
          </section>
          <Leaderboard data={data} hidden={hidden} />
        </div>
      )}
    </div>
  )
}
