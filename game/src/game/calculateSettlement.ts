import {
  getHealthMultiplier,
  getMedicalInsuranceBenefit,
} from '../data/settlementData'
import { resolveNisaResult } from './resolveNisaResult'
import { settleLifeCards, type SettledCardSummary } from './settleLifeCards'
import type { OwnedLifeCard } from './gameState'

export type SettlementInput = {
  points: number
  health: number
  love: number
  hasNisa: boolean
  hasNisaSecondSlot?: boolean
  hasMedicalInsurance: boolean
  ownedLifeCards: readonly OwnedLifeCard[]
}

export type SettlementResult = {
  startingPoints: number
  startingHealth: number
  startingLove: number
  lodgerCount: number
  lodgerPointsChange: number
  lodgerHealthChange: number
  lodgerLoveChange: number
  troubleCards: readonly SettledCardSummary[]
  troubleTotal: number
  nisaResult: number | null
  nisaResults: readonly number[]
  finalHealth: number
  finalLove: number
  medicalInsuranceBenefit: number
  pointsBeforeHealthMultiplier: number
  healthMultiplier: number
  pointsAfterHealthMultiplier: number
  finalCash: number
  prizeCards: readonly SettledCardSummary[]
}

const clampStatus = (value: number) => Math.min(100, Math.max(0, value))

export const calculateSettlement = (
  input: SettlementInput,
  randomValues: number | readonly number[] = Math.random(),
): SettlementResult => {
  const cardSettlement = settleLifeCards(input.ownedLifeCards)
  const finalHealth = clampStatus(
    input.health + cardSettlement.lodgerChanges.health,
  )
  const finalLove = clampStatus(input.love + cardSettlement.lodgerChanges.love)
  const values = Array.isArray(randomValues) ? randomValues : [randomValues]
  const nisaDrawCount = input.hasNisa ? (input.hasNisaSecondSlot ? 2 : 1) : 0
  const nisaResults = Array.from({ length: nisaDrawCount }, (_, index) =>
    resolveNisaResult(values[index] ?? Math.random()),
  )
  const nisaResult = nisaResults.length === 0
    ? null
    : nisaResults.reduce((sum, result) => sum + result, 0)
  const medicalInsuranceBenefit = input.hasMedicalInsurance
    ? getMedicalInsuranceBenefit(finalHealth)
    : 0
  const pointsBeforeHealthMultiplier =
    input.points +
    cardSettlement.lodgerChanges.points +
    cardSettlement.troubleTotal +
    (nisaResult ?? 0) +
    medicalInsuranceBenefit
  const healthMultiplier = getHealthMultiplier(finalHealth)
  const pointsAfterHealthMultiplier = Math.floor(
    pointsBeforeHealthMultiplier * healthMultiplier,
  )
  const finalCash = Math.max(0, pointsAfterHealthMultiplier)

  return {
    startingPoints: input.points,
    startingHealth: input.health,
    startingLove: input.love,
    lodgerCount: cardSettlement.lodgerCount,
    lodgerPointsChange: cardSettlement.lodgerChanges.points,
    lodgerHealthChange: cardSettlement.lodgerChanges.health,
    lodgerLoveChange: cardSettlement.lodgerChanges.love,
    troubleCards: cardSettlement.troubleCards,
    troubleTotal: cardSettlement.troubleTotal,
    nisaResult,
    nisaResults,
    finalHealth,
    finalLove,
    medicalInsuranceBenefit,
    pointsBeforeHealthMultiplier,
    healthMultiplier,
    pointsAfterHealthMultiplier,
    finalCash,
    prizeCards: cardSettlement.prizeCards,
  }
}

const createCards = (cardIds: readonly OwnedLifeCard['cardId'][]) =>
  cardIds.map((cardId, index) => ({
    cardId,
    acquiredAtSquare: 1,
    acquiredOrder: index + 1,
    loveAtAcquisition: 50,
  }))

export const verifySettlementCalculationRules = () => {
  const patternA = calculateSettlement({
    points: 5_000,
    health: 10,
    love: 40,
    hasNisa: true,
    hasMedicalInsurance: true,
    ownedLifeCards: createCards([
      'SPECIAL_LODGER',
      'TROUBLE_CAR_REPAIR',
      'TROUBLE_PROPERTY_TAX',
    ]),
  }, [0])
  if (
    patternA.finalHealth !== 20 ||
    patternA.finalLove !== 50 ||
    patternA.nisaResult !== -500 ||
    patternA.medicalInsuranceBenefit !== 1_500 ||
    patternA.pointsBeforeHealthMultiplier !== 3_500 ||
    patternA.nisaResults.length !== 1 ||
    patternA.healthMultiplier !== 0.85 ||
    patternA.finalCash !== 2_975
  ) {
    throw new Error('精算テストA（契約あり・低健康・トラブルあり）に失敗しました。')
  }

  const patternB = calculateSettlement({
    points: 1_001,
    health: 90,
    love: 80,
    hasNisa: false,
    hasMedicalInsurance: false,
    ownedLifeCards: createCards(['PRIZE_SUKIYA', 'PRIZE_TOY']),
  }, 0)
  if (
    patternB.nisaResult !== null ||
    patternB.medicalInsuranceBenefit !== 0 ||
    patternB.pointsAfterHealthMultiplier !== 1_251 ||
    patternB.finalCash !== 1_251 ||
    patternB.prizeCards.length !== 2 ||
    patternB.troubleCards.length !== 0
  ) {
    throw new Error('精算テストB（契約なし・高健康・景品のみ）に失敗しました。')
  }

  const patternC = calculateSettlement({
    points: -100,
    health: 95,
    love: 95,
    hasNisa: false,
    hasMedicalInsurance: false,
    ownedLifeCards: createCards([
      'SPECIAL_LODGER', 'SPECIAL_LODGER', 'SPECIAL_LODGER',
    ]),
  }, 0)
  if (
    patternC.finalHealth !== 100 ||
    patternC.finalLove !== 100 ||
    patternC.lodgerPointsChange !== -1_500 ||
    patternC.pointsAfterHealthMultiplier !== -2_080 ||
    patternC.finalCash !== 0
  ) {
    throw new Error('精算テストC（居候複数・上限補正・0円補正）に失敗しました。')
  }

  const nisaTwoSlots = calculateSettlement({
    points: 1_000,
    health: 40,
    love: 50,
    hasNisa: true,
    hasNisaSecondSlot: true,
    hasMedicalInsurance: false,
    ownedLifeCards: [],
  }, [0, 0.9999])
  if (
    nisaTwoSlots.nisaResults.length !== 2 ||
    nisaTwoSlots.nisaResults[0] !== -500 ||
    nisaTwoSlots.nisaResults[1] !== 4_000 ||
    nisaTwoSlots.nisaResult !== 3_500
  ) {
    throw new Error('NISA2枠目の個別抽選・合算テストに失敗しました。')
  }
}
