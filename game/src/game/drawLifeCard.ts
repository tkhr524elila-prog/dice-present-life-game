import {
  getLifeCardById,
  LIFE_CARD_DATA,
  type LifeCardData,
} from '../data/lifeCardData'
import {
  calculateLoveDrawRates,
  verifyContinuousLoveDrawRates,
} from '../data/presentDrawTables'

type DrawLifeCardOptions = {
  love: number
  hasGuaranteedSukiyaTicket: boolean
  random?: () => number
}

export type LifeCardDrawResult = {
  card: LifeCardData
  isGuaranteed: boolean
}

export const drawLifeCard = ({
  love,
  hasGuaranteedSukiyaTicket,
  random = Math.random,
}: DrawLifeCardOptions): LifeCardDrawResult => {
  if (!hasGuaranteedSukiyaTicket) {
    return {
      card: getLifeCardById('PRIZE_SUKIYA'),
      isGuaranteed: true,
    }
  }

  const table = calculateLoveDrawRates(love)
  const roll = Math.min(Math.max(random(), 0), 0.999999999) * 100
  let cumulativeWeight = 0

  for (const entry of table) {
    cumulativeWeight += entry.weight
    if (roll < cumulativeWeight) {
      return {
        card: getLifeCardById(entry.cardId),
        isGuaranteed: false,
      }
    }
  }

  throw new Error('プレゼント抽選の結果を決定できませんでした。')
}

export const verifyPresentDrawRules = () => {
  if (
    LIFE_CARD_DATA.length !== 13 ||
    new Set(LIFE_CARD_DATA.map(({ cardId }) => cardId)).size !==
      LIFE_CARD_DATA.length
  ) {
    throw new Error('ライフカード定義の件数またはIDが正しくありません。')
  }

  verifyContinuousLoveDrawRates()
  calculateLoveDrawRates(50).forEach(({ cardId }) => getLifeCardById(cardId))

  const guaranteed = drawLifeCard({
    love: 50,
    hasGuaranteedSukiyaTicket: false,
    random: () => {
      throw new Error('初回確定時に通常抽選が実行されました。')
    },
  })
  if (!guaranteed.isGuaranteed || guaranteed.card.cardId !== 'PRIZE_SUKIYA') {
    throw new Error('最初のプレゼント抽選がすき家券ではありません。')
  }

  const drawAt = (love: number, value: number) =>
    drawLifeCard({
      love,
      hasGuaranteedSukiyaTicket: true,
      random: () => value,
    }).card

  if (
    drawAt(0, 0).cardId !== 'PRIZE_SUKIYA' ||
    drawAt(100, 0).cardId !== 'PRIZE_SUKIYA' ||
    drawAt(50, 0).type !== 'prize' ||
    drawAt(50, 0.99).type !== 'special' ||
    drawAt(0, 0.5).type !== 'trouble' ||
    drawAt(100, 0.5).type !== 'prize'
  ) {
    throw new Error('愛情別プレゼント抽選の境界値テストに失敗しました。')
  }

  if (drawAt(50, 0).cardId !== drawAt(50, 0).cardId) {
    throw new Error('同じライフカードを複数回抽選できません。')
  }
}
