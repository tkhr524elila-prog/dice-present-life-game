import type { LifeCardId } from './lifeCardData'

export type EventLifeCardRule = {
  eventId: string
  cardId: LifeCardId
  probability: number
}

export const EVENT_LIFE_CARD_RULES: readonly EventLifeCardRule[] = [
  { eventId: 'EV_FAMILY_05', cardId: 'PRIZE_MCDONALDS', probability: 0.1 },
  { eventId: 'EV_MONEY_05', cardId: 'TROUBLE_CAR_REPAIR', probability: 1 },
  { eventId: 'EV_MONEY_10', cardId: 'SPECIAL_LODGER', probability: 1 },
  { eventId: 'EV_SQUARE_40', cardId: 'TROUBLE_PROPERTY_TAX', probability: 0.3 },
  { eventId: 'EV_SQUARE_48', cardId: 'TROUBLE_HOME_REPAIR', probability: 1 },
] as const

const rulesByEventId = new Map(
  EVENT_LIFE_CARD_RULES.map((rule) => [rule.eventId, rule]),
)

export const drawEventLifeCard = (
  eventId: string,
  random: () => number = Math.random,
): LifeCardId | null => {
  const rule = rulesByEventId.get(eventId)
  if (!rule) return null
  if (rule.probability === 1 || random() < rule.probability) return rule.cardId
  return null
}

export const verifyEventLifeCardRules = () => {
  if (
    drawEventLifeCard('EV_SQUARE_40', () => 0.29) !== 'TROUBLE_PROPERTY_TAX' ||
    drawEventLifeCard('EV_SQUARE_40', () => 0.3) !== null ||
    drawEventLifeCard('EV_SQUARE_48', () => 0.99) !== 'TROUBLE_HOME_REPAIR' ||
    drawEventLifeCard('EV_MONEY_05', () => 0.99) !== 'TROUBLE_CAR_REPAIR' ||
    drawEventLifeCard('EV_MONEY_10', () => 0.99) !== 'SPECIAL_LODGER' ||
    drawEventLifeCard('EV_STUDENT_01', () => 0) !== null
  ) {
    throw new Error('通常イベント由来のカード付与ルールが一致しません。')
  }
}
