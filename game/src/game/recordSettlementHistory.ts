import { calculateSettlement, type SettlementResult } from './calculateSettlement'
import { createGameStateStore, type GameStateStore } from './gameState'

export const recordSettlementHistory = (
  gameState: GameStateStore,
  settlement: Readonly<SettlementResult>,
  hasMedicalInsurance: boolean,
) => {
  const historyBase = {
    type: 'settlement' as const,
    squareId: 100,
    displayId: '100',
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

  const entries = [
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
    ...(
      settlement.nisaResults.length === 0
        ? [{
            title: 'NISA運用結果',
            description: 'NISAは始めませんでした。',
            pointsChange: 0,
            healthChange: 0,
            loveChange: 0,
            deduplicationKey: 'settlement:nisa:none',
          }]
        : settlement.nisaResults.map((value, index) => ({
            title: `NISA${index + 1}枠目の運用結果`,
            description: `${index + 1}枠目の運用結果は${value.toLocaleString('ja-JP')}ポイントだった。`,
            pointsChange: value,
            healthChange: 0,
            loveChange: 0,
            deduplicationKey: `settlement:nisa:${index + 1}`,
          }))
    ),
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
  ]
  entries.forEach((entry) => gameState.addLifeHistory({
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

  const nisaStore = createGameStateStore()
  const nisaResult = calculateSettlement({
    points: 1_000,
    health: 40,
    love: 50,
    hasNisa: true,
    hasNisaSecondSlot: true,
    hasMedicalInsurance: false,
    ownedLifeCards: [],
  }, [0, 0.9999])
  recordSettlementHistory(nisaStore, nisaResult, false)
  const nisaHistory = nisaStore.getState().lifeHistory
  if (
    nisaHistory.filter(({ title }) => title.includes('NISA1枠目')).length !== 1 ||
    nisaHistory.filter(({ title }) => title.includes('NISA2枠目')).length !== 1 ||
    nisaHistory.some(({ squareId, displayId }) => squareId !== 100 || displayId !== '100')
  ) {
    throw new Error('NISA2枠の個別結果またはゴール100の履歴記録テストに失敗しました。')
  }
}
