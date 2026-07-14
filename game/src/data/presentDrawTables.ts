import type { LifeCardId } from './lifeCardData'

export type PresentDrawEntry = {
  cardId: LifeCardId
  weight: number
}

export type LoveRange = 'low' | 'middle' | 'high'

export const PRESENT_DRAW_TABLES: Record<
  LoveRange,
  readonly PresentDrawEntry[]
> = {
  low: [
    { cardId: 'PRIZE_SUKIYA', weight: 15 },
    { cardId: 'PRIZE_ICE_CREAM', weight: 12 },
    { cardId: 'PRIZE_MCDONALDS', weight: 8 },
    { cardId: 'PRIZE_RAMEN', weight: 7 },
    { cardId: 'PRIZE_DIAPER', weight: 8 },
    { cardId: 'PRIZE_PICTURE_BOOK', weight: 8 },
    { cardId: 'PRIZE_TOY', weight: 12 },
    { cardId: 'TROUBLE_PROPERTY_TAX', weight: 6 },
    { cardId: 'TROUBLE_CAR_LOAN', weight: 5 },
    { cardId: 'TROUBLE_CAR_REPAIR', weight: 5 },
    { cardId: 'TROUBLE_HOME_REPAIR', weight: 5 },
    { cardId: 'TROUBLE_CREDIT_CARD_BILL', weight: 6 },
    { cardId: 'SPECIAL_LODGER', weight: 3 },
  ],
  middle: [
    { cardId: 'PRIZE_SUKIYA', weight: 6 },
    { cardId: 'PRIZE_ICE_CREAM', weight: 4 },
    { cardId: 'PRIZE_MCDONALDS', weight: 7 },
    { cardId: 'PRIZE_RAMEN', weight: 7 },
    { cardId: 'PRIZE_DIAPER', weight: 18 },
    { cardId: 'PRIZE_PICTURE_BOOK', weight: 20 },
    { cardId: 'PRIZE_TOY', weight: 32 },
    { cardId: 'TROUBLE_PROPERTY_TAX', weight: 1 },
    { cardId: 'TROUBLE_CAR_LOAN', weight: 0 },
    { cardId: 'TROUBLE_CAR_REPAIR', weight: 1 },
    { cardId: 'TROUBLE_HOME_REPAIR', weight: 1 },
    { cardId: 'TROUBLE_CREDIT_CARD_BILL', weight: 1 },
    { cardId: 'SPECIAL_LODGER', weight: 2 },
  ],
  high: [
    { cardId: 'PRIZE_SUKIYA', weight: 1 },
    { cardId: 'PRIZE_ICE_CREAM', weight: 1 },
    { cardId: 'PRIZE_MCDONALDS', weight: 2 },
    { cardId: 'PRIZE_RAMEN', weight: 2 },
    { cardId: 'PRIZE_DIAPER', weight: 8 },
    { cardId: 'PRIZE_PICTURE_BOOK', weight: 20 },
    { cardId: 'PRIZE_TOY', weight: 62 },
    { cardId: 'TROUBLE_PROPERTY_TAX', weight: 1 },
    { cardId: 'TROUBLE_CAR_LOAN', weight: 0 },
    { cardId: 'TROUBLE_CAR_REPAIR', weight: 0 },
    { cardId: 'TROUBLE_HOME_REPAIR', weight: 1 },
    { cardId: 'TROUBLE_CREDIT_CARD_BILL', weight: 1 },
    { cardId: 'SPECIAL_LODGER', weight: 1 },
  ],
}

export const getLoveRange = (love: number): LoveRange => {
  if (love <= 29) return 'low'
  if (love <= 69) return 'middle'
  return 'high'
}
