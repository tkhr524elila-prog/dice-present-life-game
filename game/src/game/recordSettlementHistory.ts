import { calculateSettlement, type SettlementResult } from './calculateSettlement'
import { createGameStateStore, type GameStateStore } from './gameState'

export const recordSettlementHistory = (
  gameState: GameStateStore,
  settlement: Readonly<SettlementResult>,
  hasMedicalInsurance: boolean,
) => {
  const historyBase = {
    type: 'settlement' as const,
    squareId: 60,
    chapter: 5,
    cardId: null,
    loveAtOccurrence: null,
  }
  const prizeNames = settlement.prizeCards.length === 0
    ? '獲得した景品はありません'
    : settlement.prizeCards
      .map((card) => `${card.name}×${card.count}`)
      .join('、')
  const troubleNames = settlement.troubleCards.length === 0
    ? 'トラブルカードなし'
    : settlement.troubleCards
      .map((card) => `${card.name}×${card.count}`)
      .join('、')

  ;[
    {
      title: '居候カード精算',
      description: settlement.lodgerCount === 0
        ? '居候はいませんでした。'
        : `居候×${settlement.lodgerCount}を精算した。`,
      pointsChange: settlement.lodgerPointsChange,
      healthChange: settlement.lodgerHealthChange,
      loveChange: settlement.lodgerLoveChange,
      deduplicationKey: 'settlement:lodger',
    },
    {
      title: 'トラブルカード精算',
      description: troubleNames,
      pointsChange: settlement.troubleTotal,
      healthChange: 0,
      loveChange: 0,
      deduplicationKey: 'settlement:trouble',
    },
    {
      title: 'NISA運用結果',
      description: settlement.nisaResult === null
        ? 'NISAは始めませんでした。'
        : `運用結果は${settlement.nisaResult.toLocaleString('ja-JP')}ポイントだった。`,
      pointsChange: settlement.nisaResult ?? 0,
      healthChange: 0,
      loveChange: 0,
      deduplicationKey: 'settlement:nisa',
    },
    {
      title: '医療保険精算',
      description: hasMedicalInsurance
        ? `最終健康${settlement.finalHealth}、給付金${settlement.medicalInsuranceBenefit.toLocaleString('ja-JP')}ポイント。`
        : '医療保険へ加入していませんでした。',
      pointsChange: settlement.medicalInsuranceBenefit,
      healthChange: 0,
      loveChange: 0,
      deduplicationKey: 'settlement:medical-insurance',
    },
    {
      title: '最終健康と健康倍率',
      description: `最終健康${settlement.finalHealth}、倍率×${settlement.healthMultiplier.toFixed(2)}を適用した。`,
      pointsChange: settlement.finalCash - settlement.pointsBeforeHealthMultiplier,
      healthChange: 0,
      loveChange: 0,
      deduplicationKey: 'settlement:health-multiplier',
    },
    {
      title: '獲得景品一覧',
      description: prizeNames,
      pointsChange: 0,
      healthChange: 0,
      loveChange: 0,
      deduplicationKey: 'settlement:prizes',
    },
    {
      title: '最終現金額',
      description: `最終現金額は${settlement.finalCash.toLocaleString('ja-JP')}円。`,
      pointsChange: 0,
      healthChange: 0,
      loveChange: 0,
      deduplicationKey: 'settlement:final-cash',
    },
    {
      title: 'ゲーム終了',
      description: '29歳までの人生の精算が完了した。',
      pointsChange: 0,
      healthChange: 0,
      loveChange: 0,
      deduplicationKey: 'settlement:game-finished',
    },
  ].forEach((entry) => gameState.addLifeHistory({
    ...historyBase,
    ...entry,
  }))
}

export const verifySettlementHistoryRules = () => {
  const store = createGameStateStore()
  const result = calculateSettlement({
    points: 1_000,
    health: 60,
    love: 50,
    hasNisa: false,
    hasMedicalInsurance: false,
    ownedLifeCards: [],
  })
  recordSettlementHistory(store, result, true)
  recordSettlementHistory(store, result, true)
  const history = store.getState().lifeHistory
  if (
    history.length !== 8 ||
    history.filter(({ type }) => type === 'settlement').length !== 8 ||
    history[history.length - 1]?.title !== 'ゲーム終了'
  ) {
    throw new Error('最終精算履歴の記録・二重防止テストに失敗しました。')
  }
}
