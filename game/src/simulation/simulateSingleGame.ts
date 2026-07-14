import { getBoardSquareV2 } from '../data/v2/boardDataV2'
import { getLifeChoiceV2 } from '../data/v2/lifeChoiceDataV2'
import { getLifeCardById, LIFE_CARD_DATA } from '../data/lifeCardData'
import { calculateSettlement } from '../game/calculateSettlement'
import { drawLifeCard } from '../game/drawLifeCard'
import { createGameStateStore } from '../game/gameState'
import { resolveEventV2 } from '../game/v2/applyEventV2'
import { createMovementPathV2 } from '../game/v2/resolveRouteV2'
import type { SimulationChoices, SimulationGameResult, SimulationPattern } from './simulationTypes'

const randomBoolean = (random: () => number) => random() < 0.5
const createRandomChoices = (random: () => number): SimulationChoices => {
  const hasNisa = randomBoolean(random)
  return {
    jobType: randomBoolean(random) ? 'foreign-insurance' : 'local-agency',
    romanceType: randomBoolean(random) ? 'playboy' : 'serious',
    nisaSlots: hasNisa ? (randomBoolean(random) ? 2 : 1) : 0,
    hasMedicalInsurance: randomBoolean(random),
    isCarInsuranceActive: randomBoolean(random),
  }
}

const findChoice = (squareId: number, choices: SimulationChoices) => {
  const data = getLifeChoiceV2(squareId, choices.nisaSlots > 0)
  if (!data) throw new Error(`マス${squareId}のV2選択データがありません。`)
  const option = data.options.find(({ selection }) => {
    switch (selection.kind) {
      case 'job': return selection.value === choices.jobType
      case 'romance': return selection.value === choices.romanceType
      case 'nisa': return selection.value === (choices.nisaSlots > 0)
      case 'nisa-2': return selection.value === (choices.nisaSlots === 2)
      case 'medical-insurance': return selection.value === choices.hasMedicalInsurance
      case 'car-insurance': return selection.value === choices.isCarInsuranceActive
    }
  })
  if (!option) throw new Error(`マス${squareId}のV2選択肢がありません。`)
  return option
}

export const simulateSingleGame = (pattern: SimulationPattern, random: () => number): SimulationGameResult => {
  const choices = pattern.choices === 'random' ? createRandomChoices(random) : pattern.choices
  const state = createGameStateStore()
  let turns = 0
  let presents = 0
  let normalEvents = 0
  let guaranteedEvents = 0
  let accidentChecks = 0
  let eventPrizeCount = 0
  let drawCardCount = 0
  const normalStops: string[] = []

  while (state.getState().currentProgress < 100) {
    turns += 1
    const before = state.getState()
    const path = createMovementPathV2(before.currentPhysicalId, Math.floor(random() * 6) + 1, before.selectedRoute, before.processedForcedStops)
    const physicalId = path[path.length - 1]
    if (!physicalId) throw new Error('V2移動先がありません。')
    const square = getBoardSquareV2(physicalId)
    if (!square) throw new Error(`物理マス${physicalId}がありません。`)
    state.setCurrentPosition(physicalId, square.progress)
    if (square.squareType === 'goal') break

    if (square.squareType === 'forced-stop') {
      state.completeLifeChoice(square.progress, findChoice(square.progress, choices))
      continue
    }
    if (square.squareType === 'present-draw') {
      presents += 1
      drawCardCount += 1
      const drawState = state.getState()
      const drawn = drawLifeCard({ love: drawState.love, hasGuaranteedSukiyaTicket: drawState.hasGuaranteedSukiyaTicket, random })
      state.acquireLifeCard(drawn.card.cardId, square.progress, drawn.isGuaranteed)
      continue
    }

    normalEvents += 1
    normalStops.push(square.displayId)
    if (square.progress === 67) accidentChecks += 1
    const beforeEvent = state.getState()
    const resolved = resolveEventV2(square, beforeEvent.jobType, beforeEvent.isCarInsuranceActive)
    state.applyStatusChanges({ points: resolved.display.point, health: resolved.display.health, love: resolved.display.love })
    if (resolved.guaranteedCardId) {
      guaranteedEvents += 1
      if (getLifeCardById(resolved.guaranteedCardId).type === 'prize') eventPrizeCount += 1
      state.acquireLifeCard(resolved.guaranteedCardId, square.progress, false)
    }
  }

  const atGoal = state.getState()
  const settlement = calculateSettlement({ ...atGoal, hasNisaSecondSlot: atGoal.hasNisaSecondSlot }, Array.from({ length: choices.nisaSlots }, random))
  const cardCounts: SimulationGameResult['cardCounts'] = {}
  atGoal.ownedLifeCards.forEach(({ cardId }) => { cardCounts[cardId] = (cardCounts[cardId] ?? 0) + 1 })
  LIFE_CARD_DATA.forEach(({ cardId }) => { cardCounts[cardId] ??= 0 })
  const prizeCards = atGoal.ownedLifeCards.filter(({ cardId }) => getLifeCardById(cardId).type === 'prize')
  const troubleCount = atGoal.ownedLifeCards.filter(({ cardId }) => getLifeCardById(cardId).type === 'trouble').length
  const estimatedMinutes = turns * 0.48 + normalEvents * 0.22 + presents * 0.16 + atGoal.processedForcedStops.size * 0.42 + 2.5

  return {
    patternId: pattern.id, choices, finalCash: settlement.finalCash,
    finalHealth: settlement.finalHealth, finalLove: settlement.finalLove,
    healthMultiplier: settlement.healthMultiplier, pointsAtGoal: atGoal.points,
    lodgerPointsChange: settlement.lodgerPointsChange, troubleTotal: settlement.troubleTotal,
    nisaResult: settlement.nisaResult ?? 0, medicalInsuranceBenefit: settlement.medicalInsuranceBenefit,
    prizeValue: prizeCards.reduce((sum, { cardId }) => sum + getLifeCardById(cardId).prizeValue, 0),
    prizeCount: prizeCards.length, troubleCount, lodgerCount: settlement.lodgerCount,
    cardCounts, eventPrizeCount, drawCardCount, turnCount: turns, estimatedMinutes,
    presentStopCount: presents, normalEventCount: normalEvents,
    guaranteedCardEventCount: guaranteedEvents, accidentCheckCount: accidentChecks,
    forcedStopCount: atGoal.processedForcedStops.size, normalSquareStops: normalStops,
  }
}
