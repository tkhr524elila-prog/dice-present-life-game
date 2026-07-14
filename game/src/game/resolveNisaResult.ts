import { NISA_RESULT_TABLE } from '../data/settlementData'

export const resolveNisaResult = (randomValue = Math.random()) => {
  const roll = Math.min(Math.max(randomValue, 0), 0.999999999) * 100
  let cumulativeProbability = 0

  for (const entry of NISA_RESULT_TABLE) {
    cumulativeProbability += entry.probability
    if (roll < cumulativeProbability) return entry.result
  }

  return NISA_RESULT_TABLE[NISA_RESULT_TABLE.length - 1]!.result
}

export const verifyNisaResultRules = () => {
  const cases = [
    [0, -500], [0.0999, -500], [0.1, 0], [0.2499, 0],
    [0.25, 500], [0.4999, 500], [0.5, 1_000], [0.7499, 1_000],
    [0.75, 1_500], [0.8999, 1_500], [0.9, 2_500], [0.9799, 2_500],
    [0.98, 4_000], [0.9999, 4_000],
  ] as const

  if (cases.some(([random, expected]) => resolveNisaResult(random) !== expected)) {
    throw new Error('NISA抽選テーブルの境界値テストに失敗しました。')
  }
}
