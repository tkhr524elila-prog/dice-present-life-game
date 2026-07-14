export type LifeCardType = 'prize' | 'trouble' | 'special'

export type LifeCardId =
  | 'PRIZE_SUKIYA'
  | 'PRIZE_MCDONALDS'
  | 'PRIZE_RAMEN'
  | 'PRIZE_ICE_CREAM'
  | 'PRIZE_DIAPER'
  | 'PRIZE_PICTURE_BOOK'
  | 'PRIZE_TOY'
  | 'TROUBLE_PROPERTY_TAX'
  | 'TROUBLE_CAR_LOAN'
  | 'TROUBLE_CAR_REPAIR'
  | 'TROUBLE_HOME_REPAIR'
  | 'TROUBLE_CREDIT_CARD_BILL'
  | 'SPECIAL_LODGER'

export type LifeCardData = {
  cardId: LifeCardId
  name: string
  type: LifeCardType
  typeLabel: string
  description: string
  icon: string
  prizeValue: number
}

export const LIFE_CARD_DATA: readonly LifeCardData[] = [
  { cardId: 'PRIZE_SUKIYA', name: 'すき家券', type: 'prize', typeLabel: '景品', description: '牛丼は、だいたい期待を裏切らない。', icon: '🍚', prizeValue: 500 },
  { cardId: 'PRIZE_MCDONALDS', name: 'マック券', type: 'prize', typeLabel: '景品', description: '今日はセットにしても大丈夫。', icon: '🍔', prizeValue: 500 },
  { cardId: 'PRIZE_RAMEN', name: 'ラーメン券', type: 'prize', typeLabel: '景品', description: 'スープまで飲むかは健康と相談。', icon: '🍜', prizeValue: 800 },
  { cardId: 'PRIZE_ICE_CREAM', name: 'アイス券', type: 'prize', typeLabel: '景品', description: '冷たい。出費には少しだけ優しい。', icon: '🍨', prizeValue: 300 },
  { cardId: 'PRIZE_DIAPER', name: 'おむつ券', type: 'prize', typeLabel: '景品', description: '消耗品は、もらうと強い。', icon: '🧷', prizeValue: 1_000 },
  { cardId: 'PRIZE_PICTURE_BOOK', name: '絵本券', type: 'prize', typeLabel: '景品', description: '同じ話を何度も読む未来が来た。', icon: '📖', prizeValue: 1_200 },
  { cardId: 'PRIZE_TOY', name: 'おもちゃ券', type: 'prize', typeLabel: '景品', description: '箱より中身に興味を持ってほしい。', icon: '🧸', prizeValue: 1_500 },
  { cardId: 'TROUBLE_PROPERTY_TAX', name: '固定資産税納付書', type: 'trouble', typeLabel: 'トラブル', description: '家を持つと、役所から季節の便りが届く。', icon: '📄', prizeValue: 0 },
  { cardId: 'TROUBLE_CAR_LOAN', name: '車ローン', type: 'trouble', typeLabel: 'トラブル', description: '車は走る。支払いは毎月やって来る。', icon: '🚗', prizeValue: 0 },
  { cardId: 'TROUBLE_CAR_REPAIR', name: '車修理', type: 'trouble', typeLabel: 'トラブル', description: '異音は、聞かなかったことにできなかった。', icon: '🔧', prizeValue: 0 },
  { cardId: 'TROUBLE_HOME_REPAIR', name: '家の修繕修理', type: 'trouble', typeLabel: 'トラブル', description: '家は黙って壊れ、見積書だけがよくしゃべる。', icon: '🏠', prizeValue: 0 },
  { cardId: 'TROUBLE_CREDIT_CARD_BILL', name: 'クレジットカード請求', type: 'trouble', typeLabel: 'トラブル', description: '使った記憶より、請求額のほうが鮮明だ。', icon: '💳', prizeValue: 0 },
  { cardId: 'SPECIAL_LODGER', name: '居候', type: 'special', typeLabel: '特殊', description: '毎月の出費が増えた。\nでも、毎日はもっと楽しくなった。', icon: '🧳', prizeValue: 0 },
] as const

const lifeCardsById = new Map(
  LIFE_CARD_DATA.map((card) => [card.cardId, card]),
)

export const getLifeCardById = (cardId: LifeCardId) => {
  const card = lifeCardsById.get(cardId)
  if (!card) throw new Error(`ライフカード${cardId}が見つかりません。`)
  return card
}
