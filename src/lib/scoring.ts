import type { BeverageReview, ReviewType } from './types'

export interface AveragePart {
  reviewTypeId: number
  score: number
}

export interface UserAverage {
  aveScore: number
  aveParts: AveragePart[]
}

const sum = (values: number[]): number => values.reduce((acc, v) => acc + v, 0)
const mean = (values: number[]): number => (values.length === 0 ? 0 : sum(values) / values.length)

export const counted = (reviews: BeverageReview[]): BeverageReview[] => reviews.filter((r) => r.includeInCalculations)

/** Average of a taster's submitted reviews across every beer in the room, overall and per category */
export function userAverage(allReviews: BeverageReview[], reviewTypes: ReviewType[], userId: string): UserAverage {
  const mine = counted(allReviews).filter((r) => r.userId === userId)
  const parts = mine.flatMap((r) => r.parts ?? [])
  return {
    aveScore: mean(mine.map((r) => r.totalScore)),
    aveParts: reviewTypes.map((t) => ({
      reviewTypeId: t.reviewId,
      score: mean(parts.filter((p) => p.reviewTypeId === t.reviewId).map((p) => p.score)),
    })),
  }
}

/**
 * Weighted average that dampens outliers: each score is weighted by how close it is to a trimmed mean
 * (top and bottom two dropped when there are more than four reviews).
 */
export function weightedAverage(reviews: BeverageReview[]): number {
  const scores = counted(reviews).map((r) => r.totalScore)
  if (scores.length === 0) {
    return 0
  }
  const sorted = [...scores].sort((a, b) => b - a)
  const trimmed = sorted.length > 4 ? sorted.slice(2, -2) : sorted
  const center = mean(trimmed)
  const weights = scores.map((s) => Math.pow(100 - Math.abs(center - s), 3))
  return sum(scores.map((s, i) => s * weights[i])) / sum(weights)
}

/** Total for a taster's in progress review, each category scored 0 to 10 and weighted by its max value percentage */
export function reviewTotal(values: Record<number, number>, reviewTypes: ReviewType[]): number {
  return sum(reviewTypes.map((t) => (values[t.reviewId] ?? 0) * (t.maxValue / 100)))
}

export interface FlashColor {
  background: string
  text: string
}

const FLASH_STEPS: [number, FlashColor][] = [
  [1, { background: '#ff6666', text: '#fff' }],
  [2, { background: '#ffc0cb', text: '#fff' }],
  [3, { background: '#ffa500', text: '#fff' }],
  [4, { background: '#ffc966', text: '#fff' }],
  [5, { background: '#ffff00', text: '#555' }],
  [6, { background: '#ffffb2', text: '#555' }],
  [8, { background: '#b2d8b2', text: '#fff' }],
  [Infinity, { background: '#008000', text: '#fff' }],
]

export function flashColor(total: number): FlashColor {
  return (FLASH_STEPS.find(([max]) => total <= max) ?? FLASH_STEPS[FLASH_STEPS.length - 1])[1]
}

const SOUND_STEPS: [number, string][] = [
  [2, '/sounds/boo.mp3'],
  [3, '/sounds/crowdboo.wav'],
  [4.5, '/sounds/airhorn.mp3'],
  [7, '/sounds/applause.mp3'],
  [7.5, '/sounds/ohyeah.mp3'],
  [8, '/sounds/cheer.mp3'],
  [8.5, '/sounds/hallelujah.mp3'],
  [Infinity, '/sounds/uefa.mp3'],
]

export function soundForScore(total: number): string {
  return (SOUND_STEPS.find(([below]) => total < below) ?? SOUND_STEPS[SOUND_STEPS.length - 1])[1]
}

export function playSound(src: string): void {
  const audio = new Audio(src)
  audio.play().catch(() => {
    // autoplay blocked until the host interacts with the page
  })
}

export const fmt = (value: number, digits = 1): string => (Number.isFinite(value) ? value.toFixed(digits) : '0')
