import {
  getLifeCardById,
  type LifeCardId,
} from '../data/lifeCardData'
import {
  LODGER_CARD_EFFECT,
  TROUBLE_CARD_COSTS,
} from '../data/settlementData'
import type { OwnedLifeCard } from './gameState'

export type SettledCardSummary = {
  cardId: LifeCardId
  name: string
  count: number
  amount: number
}

const countCards = (cards: readonly OwnedLifeCard[]) => {
  const counts = new Map<LifeCardId, number>()
  cards.forEach(({ cardId }) => counts.set(cardId, (counts.get(cardId) ?? 0) + 1))
  return counts
}

export const settleLifeCards = (cards: readonly OwnedLifeCard[]) => {
  const counts = countCards(cards)
  const lodgerCount = counts.get('SPECIAL_LODGER') ?? 0
  const troubleCards: SettledCardSummary[] = []
  const prizeCards: SettledCardSummary[] = []

  counts.forEach((count, cardId) => {
    const card = getLifeCardById(cardId)
    if (card.type === 'trouble') {
      const cost = TROUBLE_CARD_COSTS[cardId]
      if (cost === undefined) throw new Error(`${card.name}の精算額が未定義です。`)
      troubleCards.push({ cardId, name: card.name, count, amount: -cost * count })
    }
    if (card.type === 'prize') {
      prizeCards.push({ cardId, name: card.name, count, amount: 0 })
    }
  })

  return {
    lodgerCount,
    lodgerChanges: {
      points: LODGER_CARD_EFFECT.points * lodgerCount,
      health: LODGER_CARD_EFFECT.health * lodgerCount,
      love: LODGER_CARD_EFFECT.love * lodgerCount,
    },
    troubleCards,
    troubleTotal: troubleCards.reduce((total, card) => total + card.amount, 0),
    prizeCards,
  }
}

export const verifyLifeCardSettlementRules = () => {
  const cards: OwnedLifeCard[] = [
    'SPECIAL_LODGER', 'SPECIAL_LODGER',
    'TROUBLE_PROPERTY_TAX', 'TROUBLE_CAR_LOAN',
    'TROUBLE_CAR_REPAIR', 'TROUBLE_CAR_REPAIR',
    'TROUBLE_HOME_REPAIR', 'TROUBLE_CREDIT_CARD_BILL',
    'PRIZE_SUKIYA',
  ].map((cardId, index) => ({
    cardId: cardId as LifeCardId,
    acquiredAtSquare: 1,
    acquiredOrder: index + 1,
    loveAtAcquisition: 50,
  }))
  const result = settleLifeCards(cards)

  if (
    result.lodgerCount !== 2 ||
    result.lodgerChanges.points !== -1_000 ||
    result.lodgerChanges.health !== 20 ||
    result.lodgerChanges.love !== 20 ||
    result.troubleTotal !== -5_500 ||
    result.prizeCards.length !== 1 ||
    result.prizeCards.some(({ cardId }) => cardId.startsWith('TROUBLE_'))
  ) {
    throw new Error('ライフカード精算の種類別・複数枚テストに失敗しました。')
  }
}
