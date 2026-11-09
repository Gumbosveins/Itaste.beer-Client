import { useMemo } from 'react'
import { BeerImage, Button, HIDDEN, Spinner } from './ui'
import { counted, fmt, userAverage, weightedAverage, type FlashColor, type UserAverage } from '../lib/scoring'
import type { BeverageReview, Dashboard, DashboardBeverage, DashboardUser, ReviewResults, ReviewType } from '../lib/types'

const panel = 'panel min-h-0 overflow-y-auto'
const panelTitle = 'font-display text-[26px] leading-none tracking-wide'

const AVATAR_COLORS = ['#7B61FF', '#FF9800', '#2E9CCA', '#C2185B', '#0F9D58', '#8D6E63', '#E64A19', '#5C6BC0']

function avatarColor(id: string): string {
  const hash = [...id].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function Avatar({ id, name, className = 'h-[34px] w-[34px] text-sm' }: { id: string; name: string; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`} style={{ backgroundColor: avatarColor(id) }}>
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

type BeerState = 'done' | 'live' | 'next'

function beerState(beer: DashboardBeverage, currentId: number | null): BeerState {
  if (beer.reviewFinished) {
    return 'done'
  }
  return beer.beverageId === currentId ? 'live' : 'next'
}

interface BeerListProps {
  data: Dashboard
  hidden: boolean
  currentId: number | null
  busyId: number | null
  onOpen: (beer: DashboardBeverage) => void
}

export function BeerList({ data, hidden, currentId, busyId, onOpen }: BeerListProps) {
  const done = data.beverages.filter((b) => b.reviewFinished).length
  return (
    <section className={`${panel} p-[18px]`}>
      <div className="flex items-baseline justify-between px-1 pb-2">
        <h2 className={panelTitle}>Beers</h2>
        <span className="text-[13px] text-muted">{done} of {data.beverages.length} done</span>
      </div>
      <ol className="space-y-1.5">
        {data.beverages.map((beer, i) => {
          const state = beerState(beer, currentId)
          return (
            <li key={beer.beverageId}>
              <button
                type="button"
                onClick={() => onOpen(beer)}
                className={`flex w-full items-center gap-3 rounded-[14px] border-[1.5px] p-2.5 text-left transition ${state === 'live' ? 'border-pink bg-[#fff1f5]' : 'border-transparent hover:bg-foam'}`}
              >
                {busyId === beer.beverageId ? (
                  <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center text-pink"><Spinner className="h-7 w-7" /></span>
                ) : (
                  <BeerImage src={beer.imageUrlSm} hidden={hidden} className="h-[52px] w-[52px] shrink-0 ring-0" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold">{i + 1}. {hidden ? HIDDEN : beer.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {hidden ? HIDDEN : beer.typeName} · {beer.alcoholPercentage}%
                  </span>
                </span>
                <StateChip state={state} score={beer.results.totalScore} />
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function StateChip({ state, score }: { state: BeerState; score: number }) {
  const styles: Record<BeerState, string> = {
    done: 'bg-ink text-white',
    live: 'bg-pink text-white',
    next: 'bg-[#f1eeeb] text-muted',
  }
  const label: Record<BeerState, string> = { done: fmt(score), live: 'Live', next: 'Up next' }
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${styles[state]}`}>{label[state]}</span>
}

export function UserList({ users, roomCode, onDelete }: { users: DashboardUser[]; roomCode: string; onDelete: (id: string, name: string) => void }) {
  return (
    <div className="p-6">
      <h2 className="font-display text-[40px] leading-none tracking-wide">Waiting for tasters</h2>
      <p className="mt-2 text-muted">
        Join at <b className="text-ink">itaste.beer</b> with room code <b className="font-mono tracking-widest text-pink">{roomCode}</b>. When everyone is in, open the first beer on the left.
      </p>
      <h3 className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-muted">{users.length} {users.length === 1 ? 'taster' : 'tasters'}</h3>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2">
        {users.map((u) => (
          <li key={u.id} className="group flex items-center gap-3 rounded-[14px] bg-foam px-3 py-2.5">
            <Avatar id={u.id} name={u.username} />
            <span className="flex-1 truncate font-semibold">{u.username}</span>
            <button type="button" onClick={() => onDelete(u.id, u.username)} className="text-xs text-ink/30 opacity-0 transition group-hover:opacity-100 hover:text-red-600 focus:opacity-100">
              Remove
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

interface CurrentBeerProps {
  beverage: DashboardBeverage
  index: number
  total: number
  hidden: boolean
  busy: boolean
  reviewTypes: ReviewType[]
  allReviews: BeverageReview[]
  flashes: Record<string, FlashColor>
  onFinish: () => void
}

export function CurrentBeer({ beverage, index, total, hidden, busy, reviewTypes, allReviews, flashes, onFinish }: CurrentBeerProps) {
  const votes = counted(beverage.reviews).length
  const voters = beverage.reviews.length
  const pct = voters === 0 ? 0 : Math.round((votes / voters) * 100)
  return (
    <div className="flex min-h-full flex-col gap-3.5 px-6 py-5">
      <div className="flex items-center gap-4">
        <BeerImage src={beverage.imageUrlMed ?? beverage.imageUrlSm} hidden={hidden} className="h-[76px] w-[76px] shrink-0 ring-4 ring-pink" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-pink">Now tasting · beer {index} of {total}</div>
          <div className="truncate font-display text-[46px] leading-none">{hidden ? HIDDEN : beverage.name}</div>
          <div className="truncate text-sm text-muted">
            {hidden ? HIDDEN : `${beverage.manufacturer} · ${beverage.typeName}`} · {beverage.alcoholPercentage}% · IBU {beverage.ibu > 0 ? beverage.ibu : 'N/A'}
          </div>
        </div>
        <div className="flex w-44 shrink-0 flex-col items-end gap-2">
          <span className="text-sm text-muted"><b className="text-xl text-ink">{votes}</b> of {voters} voted</span>
          <div className="h-2.5 w-full rounded-full bg-line">
            <div className="h-2.5 rounded-full bg-pink transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <ReviewTable beverage={beverage} reviewTypes={reviewTypes} allReviews={allReviews} flashes={flashes} />

      <div className="flex-1" />
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="green" className="h-[52px] px-6 text-base" busy={busy} onClick={onFinish}>
          Review finished, reveal score
        </Button>
        <span className="text-[13px] text-ink/50">Green is above the taster's own average, red is below it</span>
      </div>
    </div>
  )
}

interface ReviewTableProps {
  beverage: DashboardBeverage
  reviewTypes: ReviewType[]
  allReviews: BeverageReview[]
  flashes: Record<string, FlashColor>
}

const UP = 'text-[#0f8a4e]'
const DOWN = 'text-[#d03a3a]'

const compare = (value: number, average: number): string => {
  if (value > average) {
    return UP
  }
  if (value < average) {
    return DOWN
  }
  return ''
}

function totalPill(review: BeverageReview, ave: UserAverage): string {
  if (!review.includeInCalculations) {
    return 'bg-[#f1eeeb] text-ink/40'
  }
  if (review.totalScore > ave.aveScore) {
    return `bg-[#ddf5e8] ${UP}`
  }
  if (review.totalScore < ave.aveScore) {
    return `bg-[#fce4e4] ${DOWN}`
  }
  return 'bg-[#f1eeeb] text-ink'
}

function ReviewTable({ beverage, reviewTypes, allReviews, flashes }: ReviewTableProps) {
  const types = useMemo(() => [...reviewTypes].sort((a, b) => a.displayOrder - b.displayOrder), [reviewTypes])

  const rows = useMemo(() => {
    const withAve = beverage.reviews.map((r) => ({ review: r, ave: userAverage(allReviews, types, r.userId) }))
    const anyVoted = withAve.some((r) => r.review.includeInCalculations)
    return [...withAve].sort((a, b) => {
      if (a.review.includeInCalculations !== b.review.includeInCalculations) {
        return a.review.includeInCalculations ? -1 : 1
      }
      return anyVoted ? b.review.totalScore - a.review.totalScore : b.ave.aveScore - a.ave.aveScore
    })
  }, [beverage.reviews, allReviews, types])

  const extremes = useMemo(() => columnExtremes(rows.map((r) => r.ave), types), [rows, types])
  const grid = { gridTemplateColumns: `28px minmax(0,1fr) repeat(${types.length}, 56px) 84px` }

  return (
    <div className="text-sm">
      <div className="grid items-end gap-x-2.5 border-b border-line px-2.5 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#8a817a]" style={grid}>
        <span>#</span>
        <span>Taster</span>
        {types.map((t) => <span key={t.reviewId} className="text-center" title={t.name}>{t.abbr}</span>)}
        <span className="text-right">Total</span>
      </div>
      {rows.map(({ review, ave }, i) => {
        const flash = flashes[review.userId]
        const voted = review.includeInCalculations
        const partFor = (id: number) => review.parts?.find((p) => p.reviewTypeId === id)?.score
        return (
          <div
            key={review.userId}
            className={`mt-1 grid items-center gap-x-2.5 rounded-xl px-2.5 py-1.5 transition-colors duration-700 ${voted ? '' : 'opacity-55'} ${i === 0 && voted && !flash ? 'bg-[#f2fbf6]' : ''}`}
            style={{ ...grid, ...(flash ? { backgroundColor: flash.background, color: flash.text } : {}) }}
          >
            <span className="font-bold text-[#8a817a]">{i + 1}</span>
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar id={review.userId} name={review.username} />
              <div className="min-w-0">
                <div className="truncate text-base font-bold">{review.username}</div>
                <div className="truncate text-[13px] italic text-muted">
                  {voted ? (review.comment ? `“${review.comment}”` : '') : 'still tasting'}
                </div>
              </div>
            </div>
            {types.map((t, idx) => {
              const score = partFor(t.reviewId)
              const avePart = ave.aveParts[idx]?.score ?? 0
              return (
                <div key={t.reviewId} className="text-center leading-tight">
                  <div className={`text-base font-semibold tabular-nums ${voted && score !== undefined && !flash ? compare(score, avePart) : ''}`}>
                    {voted && score !== undefined ? fmt(score, 0) : ''}
                  </div>
                  <div className={`text-[11px] tabular-nums text-ink/40 ${extremeClass(avePart, extremes.parts[t.reviewId])}`} title="Taster's average">
                    {fmt(avePart)}
                  </div>
                </div>
              )
            })}
            <div className="flex flex-col items-end leading-tight">
              <span className={`min-w-16 rounded-[10px] px-2.5 py-1.5 text-center text-lg font-extrabold tabular-nums ${totalPill(review, ave)}`}>
                {voted ? fmt(review.totalScore, 2) : '…'}
              </span>
              <span className={`mt-0.5 text-[11px] tabular-nums text-ink/40 ${extremeClass(ave.aveScore, extremes.total)}`} title="Taster's average">
                avg {fmt(ave.aveScore)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface Range {
  min: number
  max: number
}

function range(values: number[]): Range {
  return values.length ? { min: Math.min(...values), max: Math.max(...values) } : { min: 0, max: 0 }
}

function columnExtremes(aves: UserAverage[], types: ReviewType[]): { total: Range; parts: Record<number, Range> } {
  return {
    total: range(aves.map((a) => a.aveScore)),
    parts: Object.fromEntries(types.map((t) => [t.reviewId, range(aves.map((a) => a.aveParts.find((p) => p.reviewTypeId === t.reviewId)?.score ?? 0))])),
  }
}

function extremeClass(value: number, r: Range | undefined): string {
  if (!r || r.min === r.max) {
    return ''
  }
  if (value === r.max) {
    return `font-semibold ${UP}`
  }
  if (value === r.min) {
    return `font-semibold ${DOWN}`
  }
  return ''
}

export interface RevealState {
  beer: DashboardBeverage
  result: ReviewResults
  rank: number
  highest: BeverageReview | null
  lowest: BeverageReview | null
  step: number
}

export function ResultReveal({ reveal, hidden }: { reveal: RevealState; hidden: boolean }) {
  const { beer, result, rank, highest, lowest, step } = reveal
  const show = (n: number) => (step >= n ? 'reveal' : 'opacity-0')
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="font-display text-5xl leading-none">{hidden ? HIDDEN : beer.name}</div>
      <div className="text-muted">{hidden ? HIDDEN : beer.manufacturer}</div>
      <BeerImage src={beer.imageUrlMed ?? beer.imageUrlSm} hidden={hidden} className="h-44 w-44 shadow-xl ring-0" />
      <div className="mt-2 flex gap-4">
        <div className={`${show(1)} min-w-48 rounded-2xl bg-[#f2fbf6] px-5 py-3`}>
          <div className={`text-xs font-bold uppercase tracking-[0.12em] ${UP}`}>Highest rating</div>
          <div className="text-xl font-bold">{highest?.username} <span className={UP}>{fmt(highest?.totalScore ?? 0, 2)}</span></div>
        </div>
        <div className={`${show(2)} min-w-48 rounded-2xl bg-[#fdf0f0] px-5 py-3`}>
          <div className={`text-xs font-bold uppercase tracking-[0.12em] ${DOWN}`}>Lowest rating</div>
          <div className="text-xl font-bold">{lowest?.username} <span className={DOWN}>{fmt(lowest?.totalScore ?? 0, 2)}</span></div>
        </div>
      </div>
      <div className={`${show(4)} mt-3 text-xs font-bold uppercase tracking-[0.12em] text-muted`}>Final score</div>
      <div className={show(5)}>
        <div className="pulse flex h-36 w-36 items-center justify-center rounded-full bg-pink font-display text-6xl text-white shadow-[0_16px_40px_rgba(255,64,129,0.4)]">
          {fmt(result.totalScore, 2)}
        </div>
      </div>
      <div className={`${show(6)} text-xl font-semibold`}>Current ranking: <span className="text-pink">#{rank}</span></div>
    </div>
  )
}

const MEDALS = ['#E0A100', '#8E8E93', '#B87333']

export function Leaderboard({ data, hidden }: { data: Dashboard; hidden: boolean }) {
  const ranked = useMemo(
    () =>
      data.beverages
        .filter((b) => b.reviewFinished)
        .map((b) => ({ beer: b, weighted: weightedAverage(b.reviews) }))
        .sort((a, b) => b.beer.results.totalScore - a.beer.results.totalScore),
    [data.beverages],
  )
  const remaining = data.beverages.length - ranked.length

  return (
    <section className={`${panel} flex flex-col gap-2.5 p-[18px]`}>
      <h2 className={`${panelTitle} px-1 pb-1`}>Leaderboard</h2>
      {ranked.map(({ beer, weighted }, i) => {
        const medal = MEDALS[i] ?? '#cfc8c2'
        return (
          <div key={beer.beverageId} className="flex flex-col gap-2 rounded-[14px] bg-[#faf8f6] p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-extrabold text-white" style={{ backgroundColor: medal }}>{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{hidden ? HIDDEN : beer.name}</span>
              <span className="font-display text-[34px] leading-none">{fmt(beer.results.totalScore)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-line">
              <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, beer.results.totalScore * 10)}%`, backgroundColor: medal }} />
            </div>
            <span className="text-xs text-muted">
              {(beer.results.partResults ?? []).map((p) => `${p.abbr} ${fmt(p.score)}`).join(' · ')}
              {' · '}
              <span title="Weighted average, outliers count less">weighted {fmt(weighted)}</span>
            </span>
          </div>
        )
      })}
      <div className="flex-1" />
      <p className="rounded-xl bg-[#faf8f6] p-3 text-[13px] text-muted">
        {ranked.length === 0 ? 'Finished beers show up here.' : remaining > 0 ? `${remaining} ${remaining === 1 ? 'beer' : 'beers'} still to come` : 'All beers tasted. Cheers!'}
      </p>
    </section>
  )
}
