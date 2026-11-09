import { useMemo } from 'react'
import { BeerImage, Button, HIDDEN, Spinner } from './ui'
import { counted, fmt, userAverage, weightedAverage, type FlashColor, type UserAverage } from '../lib/scoring'
import type { BeverageReview, Dashboard, DashboardBeverage, DashboardUser, ReviewResults, ReviewType } from '../lib/types'

const panel = 'min-h-0 overflow-y-auto rounded-2xl bg-white shadow'

interface BeerListProps {
  data: Dashboard
  hidden: boolean
  currentId: number | null
  busyId: number | null
  onOpen: (beer: DashboardBeverage) => void
  onFinish: (beer: DashboardBeverage) => void
}

export function BeerList({ data, hidden, currentId, busyId, onOpen, onFinish }: BeerListProps) {
  return (
    <section className={panel}>
      <h2 className="sticky top-0 z-10 border-b border-black/5 bg-white px-4 py-3 font-display text-2xl tracking-wide">Beers</h2>
      <ol>
        {data.beverages.map((beer, i) => {
          const current = beer.beverageId === currentId
          const votes = counted(beer.reviews).length
          return (
            <li key={beer.beverageId} className={`border-b border-black/5 ${current ? 'bg-pink/5' : ''}`}>
              <button type="button" onClick={() => onOpen(beer)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02]">
                <span className="relative">
                  {busyId === beer.beverageId ? (
                    <span className="flex h-14 w-14 items-center justify-center text-pink"><Spinner className="h-8 w-8" /></span>
                  ) : (
                    <BeerImage src={beer.imageUrlSm} hidden={hidden} className={`h-14 w-14 ${current ? 'ring-pink' : ''}`} />
                  )}
                  <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{i + 1}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{hidden ? HIDDEN : beer.name}</span>
                  <span className="block truncate text-sm text-ink/60">{hidden ? HIDDEN : beer.manufacturer}</span>
                  <span className="block text-xs text-ink/50">
                    {hidden ? HIDDEN : beer.typeName} · {beer.alcoholPercentage}% · IBU {beer.ibu > 0 ? beer.ibu : 'N/A'}
                  </span>
                </span>
                {current ? (
                  <span className="text-center">
                    <span className="block text-xs font-semibold uppercase text-pink">Voted</span>
                    <span className="block text-lg font-bold">{votes}/{beer.reviews.length}</span>
                  </span>
                ) : (
                  beer.reviewFinished && <span className="rounded-lg bg-ink px-2 py-1 text-lg font-bold text-white">{fmt(beer.results.totalScore)}</span>
                )}
              </button>
              {current && (
                <div className="flex gap-3 px-4 pb-4">
                  {!hidden && beer.imageUrlMed && <img src={beer.imageUrlMed} alt="" className="h-24 w-24 rounded-xl object-contain" />}
                  <div className="min-w-0 flex-1">
                    {!hidden && beer.desc && <p className="line-clamp-4 text-sm text-ink/70">{beer.desc}</p>}
                    <Button variant="green" className="mt-2" busy={busyId === beer.beverageId} onClick={() => onFinish(beer)}>
                      Review finished
                    </Button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function UserList({ users, roomCode, onDelete }: { users: DashboardUser[]; roomCode: string; onDelete: (id: string, name: string) => void }) {
  return (
    <div className="p-6">
      <h2 className="font-display text-3xl tracking-wide">Tasters ({users.length})</h2>
      <p className="mt-1 text-ink/60">
        Join at <b>itaste.beer</b> with room code <b className="font-mono tracking-widest text-pink">{roomCode}</b>. Click a beer on the left to open it for voting.
      </p>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {users.map((u, i) => (
          <li key={u.id} className="group flex items-center justify-between rounded-xl bg-foam px-4 py-3">
            <span><span className="mr-2 text-ink/40">{i + 1}.</span><span className="font-medium">{u.username}</span></span>
            <button type="button" onClick={() => onDelete(u.id, u.username)} className="text-xs text-ink/30 opacity-0 transition group-hover:opacity-100 hover:text-red-600">
              Remove
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

interface ReviewTableProps {
  beverage: DashboardBeverage
  reviewTypes: ReviewType[]
  allReviews: BeverageReview[]
  flashes: Record<string, FlashColor>
}

const compare = (value: number, average: number): string => {
  if (value > average) {
    return 'text-emerald-600'
  }
  if (value < average) {
    return 'text-red-500'
  }
  return ''
}

export function ReviewTable({ beverage, reviewTypes, allReviews, flashes }: ReviewTableProps) {
  const types = useMemo(() => [...reviewTypes].sort((a, b) => a.displayOrder - b.displayOrder), [reviewTypes])

  const rows = useMemo(() => {
    const withAve = beverage.reviews.map((r) => ({ review: r, ave: userAverage(allReviews, types, r.userId) }))
    const anyVoted = withAve.some((r) => r.review.includeInCalculations)
    return [...withAve].sort((a, b) => (anyVoted ? b.review.totalScore - a.review.totalScore : b.ave.aveScore - a.ave.aveScore))
  }, [beverage.reviews, allReviews, types])

  const extremes = useMemo(() => columnExtremes(rows.map((r) => r.ave), types), [rows, types])

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10 bg-white text-left text-xs uppercase tracking-wide text-ink/50">
        <tr className="border-b border-black/10">
          <th className="px-3 py-3">#</th>
          <th className="px-3 py-3">Name</th>
          {types.map((t) => <th key={t.reviewId} className="px-2 py-3 text-right" title={t.name}>{t.abbr}</th>)}
          <th className="px-3 py-3 text-right">Total</th>
        </tr>
      </thead>
      {rows.map(({ review, ave }, i) => {
        const flash = flashes[review.userId]
        const partFor = (id: number) => review.parts?.find((p) => p.reviewTypeId === id)?.score
        return (
          <tbody key={review.userId} className="border-b border-black/5">
            <tr style={flash ? { backgroundColor: flash.background, color: flash.text } : undefined} className="text-base transition-colors duration-700">
              <td className="px-3 pt-2 text-ink/40">{i + 1}</td>
              <td className="px-3 pt-2 font-semibold">{review.username}</td>
              {types.map((t, idx) => {
                const score = partFor(t.reviewId)
                return (
                  <td key={t.reviewId} className={`px-2 pt-2 text-right tabular-nums ${score !== undefined && !flash ? compare(score, ave.aveParts[idx].score) : ''}`}>
                    {review.includeInCalculations && score !== undefined ? fmt(score, 0) : ''}
                  </td>
                )
              })}
              <td className={`px-3 pt-2 text-right text-lg font-bold tabular-nums ${review.includeInCalculations && !flash ? compare(review.totalScore, ave.aveScore) : 'text-ink/30'}`}>
                {review.includeInCalculations ? fmt(review.totalScore, 2) : 'waiting'}
              </td>
            </tr>
            <tr className="text-xs text-ink/50">
              <td />
              <td className="px-3 pb-2">Average</td>
              {ave.aveParts.map((p) => (
                <td key={p.reviewTypeId} className={`px-2 pb-2 text-right tabular-nums ${extremeClass(p.score, extremes.parts[p.reviewTypeId])}`}>{fmt(p.score)}</td>
              ))}
              <td className={`px-3 pb-2 text-right tabular-nums ${extremeClass(ave.aveScore, extremes.total)}`}>{fmt(ave.aveScore)}</td>
            </tr>
            {review.comment && review.includeInCalculations && (
              <tr>
                <td />
                <td colSpan={types.length + 2} className="px-3 pb-2 italic text-ink/70">“{review.comment}”</td>
              </tr>
            )}
          </tbody>
        )
      })}
    </table>
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
    return 'font-semibold text-emerald-600'
  }
  if (value === r.min) {
    return 'font-semibold text-red-500'
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
    <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-white to-pink/10 p-6 text-center">
      <div className="font-display text-4xl tracking-wide">{hidden ? HIDDEN : beer.name}</div>
      <div className="text-ink/60">{hidden ? HIDDEN : beer.manufacturer}</div>
      <BeerImage src={beer.imageUrlMed ?? beer.imageUrlSm} hidden={hidden} className="h-48 w-48 shadow-xl" />
      <div className={`${show(1)} mt-2`}>
        <div className="text-sm font-semibold uppercase text-emerald-600">Highest rating</div>
        <div className="text-2xl font-bold">{highest?.username} <span className="text-emerald-600">{fmt(highest?.totalScore ?? 0, 2)}</span></div>
      </div>
      <div className={show(2)}>
        <div className="text-sm font-semibold uppercase text-red-500">Lowest rating</div>
        <div className="text-2xl font-bold">{lowest?.username} <span className="text-red-500">{fmt(lowest?.totalScore ?? 0, 2)}</span></div>
      </div>
      <div className={`${show(4)} mt-4 text-sm font-semibold uppercase text-ink/60`}>Final score</div>
      <div className={show(5)}>
        <div className="pulse flex h-36 w-36 items-center justify-center rounded-full bg-pink font-display text-6xl text-white shadow-2xl">
          {fmt(result.totalScore, 2)}
        </div>
      </div>
      <div className={`${show(6)} text-xl font-semibold`}>Current ranking: <span className="text-pink">#{rank}</span></div>
    </div>
  )
}

export function Leaderboard({ data, hidden }: { data: Dashboard; hidden: boolean }) {
  const ranked = useMemo(
    () =>
      data.beverages
        .filter((b) => b.reviewFinished)
        .map((b) => ({ beer: b, weighted: weightedAverage(b.reviews) }))
        .sort((a, b) => b.beer.results.totalScore - a.beer.results.totalScore),
    [data.beverages],
  )

  return (
    <section className={panel}>
      <h2 className="sticky top-0 z-10 border-b border-black/5 bg-white px-4 py-3 font-display text-2xl tracking-wide">Leaderboard</h2>
      {ranked.length === 0 && <p className="p-4 text-sm text-ink/50">Finished beers show up here.</p>}
      <ol>
        {ranked.map(({ beer, weighted }, i) => (
          <li key={beer.beverageId} className="flex items-center gap-3 border-b border-black/5 px-4 py-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${i === 0 ? 'bg-amber text-white' : 'bg-black/5'}`}>{i + 1}</span>
            <BeerImage src={beer.imageUrlSm} hidden={hidden} className="h-10 w-10" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{hidden ? HIDDEN : beer.name}</div>
              <div className="flex flex-wrap gap-x-2 text-xs text-ink/50">
                {(beer.results.partResults ?? []).map((p) => (
                  <span key={p.reviewTypeId}><b>{p.abbr}</b> {fmt(p.score)}</span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{fmt(beer.results.totalScore)}</div>
              <div className="text-xs text-ink/50" title="Weighted average, outliers count less">w {fmt(weighted)}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
