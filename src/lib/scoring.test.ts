import { describe, expect, it } from 'vitest'
import { flashColor, reviewTotal, soundForScore, userAverage, weightedAverage } from './scoring'
import type { BeverageReview, ReviewType } from './types'

const types: ReviewType[] = [
  { id: 1, reviewId: 10, displayOrder: 0, name: 'Taste', maxValue: 60, abbr: 'TST' },
  { id: 2, reviewId: 20, displayOrder: 1, name: 'Smell', maxValue: 40, abbr: 'SM' },
]

const review = (userId: string, totalScore: number, included = true, parts: [number, number][] = []): BeverageReview => ({
  id: Math.random(),
  username: userId,
  userId,
  beverageId: 1,
  totalScore,
  parts: parts.map(([reviewTypeId, score], i) => ({ id: i, displayOrder: i, reviewTypeId, score })),
  comment: '',
  includeInCalculations: included,
})

describe('reviewTotal', () => {
  it('weights each category by its max value', () => {
    expect(reviewTotal({ 10: 10, 20: 5 }, types)).toBeCloseTo(8)
  })
  it('treats missing values as zero', () => {
    expect(reviewTotal({}, types)).toBe(0)
  })
})

describe('weightedAverage', () => {
  it('returns 0 without counted reviews', () => {
    expect(weightedAverage([review('a', 5, false)])).toBe(0)
  })
  it('equals the mean when scores agree', () => {
    expect(weightedAverage([review('a', 6), review('b', 6)])).toBeCloseTo(6)
  })
  it('ignores reviews not yet submitted', () => {
    expect(weightedAverage([review('a', 8), review('b', 0, false)])).toBeCloseTo(8)
  })
  it('stays finite with many reviews', () => {
    const scores = [1, 5, 6, 6, 7, 10].map((s, i) => review(String(i), s))
    const result = weightedAverage(scores)
    expect(result).toBeGreaterThan(5)
    expect(result).toBeLessThan(7)
  })
})

describe('userAverage', () => {
  it('averages only that users counted reviews per category', () => {
    const all = [
      review('a', 6, true, [[10, 6], [20, 4]]),
      review('a', 8, true, [[10, 8], [20, 8]]),
      review('b', 1, true, [[10, 1], [20, 1]]),
      review('a', 0, false),
    ]
    const ave = userAverage(all, types, 'a')
    expect(ave.aveScore).toBe(7)
    expect(ave.aveParts).toEqual([
      { reviewTypeId: 10, score: 7 },
      { reviewTypeId: 20, score: 6 },
    ])
  })
})

describe('thresholds', () => {
  it('maps scores to colors and sounds', () => {
    expect(flashColor(0.5).background).toBe('#ff6666')
    expect(flashColor(9.5).background).toBe('#008000')
    expect(soundForScore(1)).toBe('/sounds/boo.mp3')
    expect(soundForScore(9)).toBe('/sounds/uefa.mp3')
  })
})
