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
    { cardId: 'PRIZE_ICE_CREAM', weight: 15 },
    { cardId: 'PRIZE_MCDONALDS', weight: 8 },
    { cardId: 'PRIZE_RAMEN', weight: 5 },
    { cardId: 'PRIZE_DIAPER', weight: 2 },
    { cardId: 'PRIZE_PICTURE_BOOK', weight: 1 },
    { cardId: 'PRIZE_TOY', weight: 1 },
    { cardId: 'TROUBLE_PROPERTY_TAX', weight: 10 },
    { cardId: 'TROUBLE_CAR_LOAN', weight: 8 },
    { cardId: 'TROUBLE_CAR_REPAIR', weight: 8 },
    { cardId: 'TROUBLE_HOME_REPAIR', weight: 8 },
    { cardId: 'TROUBLE_CREDIT_CARD_BILL', weight: 15 },
    { cardId: 'SPECIAL_LODGER', weight: 4 },
  ],
  middle: [
    { cardId: 'PRIZE_SUKIYA', weight: 14 },
    { cardId: 'PRIZE_ICE_CREAM', weight: 14 },
    { cardId: 'PRIZE_MCDONALDS', weight: 15 },
    { cardId: 'PRIZE_RAMEN', weight: 13 },
    { cardId: 'PRIZE_DIAPER', weight: 8 },
    { cardId: 'PRIZE_PICTURE_BOOK', weight: 7 },
    { cardId: 'PRIZE_TOY', weight: 4 },
    { cardId: 'TROUBLE_PROPERTY_TAX', weight: 5 },
    { cardId: 'TROUBLE_CAR_LOAN', weight: 4 },
    { cardId: 'TROUBLE_CAR_REPAIR', weight: 4 },
    { cardId: 'TROUBLE_HOME_REPAIR', weight: 4 },
    { cardId: 'TROUBLE_CREDIT_CARD_BILL', weight: 5 },
    { cardId: 'SPECIAL_LODGER', weight: 3 },
  ],
  high: [
    { cardId: 'PRIZE_SUKIYA', weight: 8 },
    { cardId: 'PRIZE_ICE_CREAM', weight: 8 },
    { cardId: 'PRIZE_MCDONALDS', weight: 10 },
    { cardId: 'PRIZE_RAMEN', weight: 12 },
    { cardId: 'PRIZE_DIAPER', weight: 20 },
    { cardId: 'PRIZE_PICTURE_BOOK', weight: 18 },
    { cardId: 'PRIZE_TOY', weight: 15 },
    { cardId: 'TROUBLE_PROPERTY_TAX', weight: 1 },
    { cardId: 'TROUBLE_CAR_LOAN', weight: 1 },
    { cardId: 'TROUBLE_CAR_REPAIR', weight: 1 },
    { cardId: 'TROUBLE_HOME_REPAIR', weight: 1 },
    { cardId: 'TROUBLE_CREDIT_CARD_BILL', weight: 2 },
    { cardId: 'SPECIAL_LODGER', weight: 3 },
  ],
}

export const getLoveRange = (love: number): LoveRange => {
  if (love <= 29) return 'low'
  if (love <= 69) return 'middle'
  return 'high'
}
