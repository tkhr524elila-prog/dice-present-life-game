import type { LifeCardId } from './lifeCardData'

export type PresentDrawEntry = {
  cardId: LifeCardId
  weight: number
}

type LoveRateAnchor = {
  cardId: LifeCardId
  at0: number
  at50: number
  at100: number
}

export const LOVE_RATE_ANCHORS: readonly LoveRateAnchor[] = [
  { cardId: 'PRIZE_SUKIYA', at0: 2, at50: 8, at100: 8 },
  { cardId: 'PRIZE_MCDONALDS', at0: 1, at50: 8, at100: 8 },
  { cardId: 'PRIZE_RAMEN', at0: 1, at50: 8, at100: 6 },
  { cardId: 'PRIZE_ICE_CREAM', at0: 2, at50: 8, at100: 6 },
  { cardId: 'PRIZE_DIAPER', at0: 0.5, at50: 8, at100: 9 },
  { cardId: 'PRIZE_PICTURE_BOOK', at0: 0.5, at50: 8, at100: 9 },
  { cardId: 'PRIZE_TOY', at0: 0.5, at50: 8, at100: 9 },
  { cardId: 'TROUBLE_PROPERTY_TAX', at0: 18, at50: 8, at100: 9 },
  { cardId: 'TROUBLE_CAR_LOAN', at0: 14, at50: 7, at100: 7 },
  { cardId: 'TROUBLE_CAR_REPAIR', at0: 16, at50: 7, at100: 8 },
  { cardId: 'TROUBLE_HOME_REPAIR', at0: 16, at50: 7, at100: 8 },
  { cardId: 'TROUBLE_CREDIT_CARD_BILL', at0: 20, at50: 7, at100: 10 },
  { cardId: 'SPECIAL_LODGER', at0: 8.5, at50: 8, at100: 3 },
] as const

const clampLove = (love: number) => Math.min(100, Math.max(0, love))

export const calculateLoveDrawRates = (
  love: number,
): readonly PresentDrawEntry[] => {
  const clampedLove = clampLove(love)
  return LOVE_RATE_ANCHORS.map(({ cardId, at0, at50, at100 }) => ({
    cardId,
    weight:
      clampedLove <= 50
        ? at0 + ((at50 - at0) * clampedLove) / 50
        : at50 + ((at100 - at50) * (clampedLove - 50)) / 50,
  }))
}

export const verifyContinuousLoveDrawRates = () => {
  Array.from({ length: 101 }, (_, love) => love).forEach((love) => {
    const rates = calculateLoveDrawRates(love)
    const total = rates.reduce((sum, { weight }) => sum + weight, 0)
    if (
      Math.abs(total - 100) > 1e-9 ||
      rates.some(({ weight }) => weight < 0) ||
      new Set(rates.map(({ cardId }) => cardId)).size !== 13
    ) {
      throw new Error(`愛情${love}の連続抽選率が正しくありません。`)
    }
  })
}
