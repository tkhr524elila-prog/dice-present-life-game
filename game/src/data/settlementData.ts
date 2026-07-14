import type { LifeCardId } from './lifeCardData'

export type NisaResultEntry = {
  result: number
  probability: number
}

export const NISA_RESULT_TABLE: readonly NisaResultEntry[] = [
  { result: -500, probability: 10 },
  { result: 0, probability: 15 },
  { result: 500, probability: 25 },
  { result: 1_000, probability: 25 },
  { result: 1_500, probability: 15 },
  { result: 2_500, probability: 8 },
  { result: 4_000, probability: 2 },
] as const

export const TROUBLE_CARD_COSTS: Readonly<
  Partial<Record<LifeCardId, number>>
> = {
  TROUBLE_PROPERTY_TAX: 800,
  TROUBLE_CAR_LOAN: 700,
  TROUBLE_CAR_REPAIR: 1_200,
  TROUBLE_HOME_REPAIR: 1_000,
  TROUBLE_CREDIT_CARD_BILL: 600,
}

export const LODGER_CARD_EFFECT = {
  points: -500,
  health: 10,
  love: 10,
  description: '毎月の出費が増えた。\nでも、毎日はもっと楽しくなった。',
} as const

export const getMedicalInsuranceBenefit = (health: number) => {
  if (health <= 19) return 2_500
  if (health <= 39) return 1_500
  if (health <= 59) return 500
  return 0
}

export const getHealthMultiplier = (health: number) => {
  const clampedHealth = Math.min(100, Math.max(0, health))
  return clampedHealth <= 40
    ? 0.7 + clampedHealth * 0.0075
    : 1 + (clampedHealth - 40) * 0.005
}

export const verifySettlementData = () => {
  const probabilityTotal = NISA_RESULT_TABLE.reduce(
    (total, entry) => total + entry.probability,
    0,
  )
  if (probabilityTotal !== 100) {
    throw new Error('NISA抽選率の合計が100%ではありません。')
  }

  const benefitCases = [
    [0, 2_500], [19, 2_500], [20, 1_500], [39, 1_500],
    [40, 500], [59, 500], [60, 0], [100, 0],
  ] as const
  const multiplierCases = [
    [0, 0.7], [1, 0.7075], [39, 0.9925], [40, 1],
    [41, 1.005], [99, 1.295], [100, 1.3],
  ] as const

  if (
    benefitCases.some(([health, expected]) =>
      getMedicalInsuranceBenefit(health) !== expected,
    ) ||
    multiplierCases.some(([health, expected]) =>
      Math.abs(getHealthMultiplier(health) - expected) > 1e-12,
    )
  ) {
    throw new Error('医療保険給付または健康倍率の境界値テストに失敗しました。')
  }
}
