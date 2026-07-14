import { BOARD_SQUARES, getBoardSquare } from '../data/boardData'
import { drawEventLifeCard } from '../data/eventLifeCardRules'
import { getLifeCardById, LIFE_CARD_DATA } from '../data/lifeCardData'
import { getLifeChoiceBySquareId } from '../data/lifeChoiceData'
import { getNormalEventBySquareId } from '../data/normalEventData'
import { applyJobModifiers } from '../game/applyJobModifiers'
import { calculateSettlement } from '../game/calculateSettlement'
import { drawLifeCard } from '../game/drawLifeCard'
import { createGameStateStore } from '../game/gameState'
import { resolveTrafficAccident } from '../game/resolveTrafficAccident'
import type {
  SimulationChoices,
  SimulationGameResult,
  SimulationPattern,
} from './simulationTypes'

const LAST_SQUARE = 60

const randomBoolean = (random: () => number) => random() < 0.5

const createRandomChoices = (random: () => number): SimulationChoices => ({
  jobType: randomBoolean(random) ? 'foreign-insurance' : 'local-agency',
  romanceType: randomBoolean(random) ? 'playboy' : 'serious',
  hasNisa: randomBoolean(random),
  hasMedicalInsurance: randomBoolean(random),
  isCarInsuranceActive: randomBoolean(random),
})

const findChoiceOption = (
  squareId: number,
  choices: SimulationChoices,
) => {
  const choice = getLifeChoiceBySquareId(squareId)
  if (!choice) throw new Error(`マス${squareId}の選択データが見つかりません。`)

  const option = choice.options.find(({ selection }) => {
    switch (selection.kind) {
      case 'job':
        return selection.value === choices.jobType
      case 'romance':
        return selection.value === choices.romanceType
      case 'nisa':
        return selection.value === choices.hasNisa
      case 'medical-insurance':
        return selection.value === choices.hasMedicalInsurance
      case 'car-insurance':
        return selection.value === choices.isCarInsuranceActive
    }
  })

  if (!option) throw new Error(`マス${squareId}の選択肢が見つかりません。`)
  return option
}

export const simulateSingleGame = (
  pattern: SimulationPattern,
  random: () => number,
): SimulationGameResult => {
  const choices = pattern.choices === 'random'
    ? createRandomChoices(random)
    : pattern.choices
  const gameState = createGameStateStore()
  let turnCount = 0
  let presentStopCount = 0
  let normalEventCount = 0
  let accidentCheckCount = 0
  let accidentOccurred = 0
  const normalSquareStops: number[] = []

  while (gameState.getState().currentSquare < LAST_SQUARE) {
    turnCount += 1
    const diceValue = Math.floor(random() * 6) + 1
    const stateBeforeMovement = gameState.getState()
    const directDestination = Math.min(
      stateBeforeMovement.currentSquare + diceValue,
      LAST_SQUARE,
    )
    const forcedStop = BOARD_SQUARES.find(
      (square) =>
        square.id > stateBeforeMovement.currentSquare &&
        square.id <= directDestination &&
        square.type === 'stop' &&
        !stateBeforeMovement.processedForcedStops.has(square.id),
    )
    const destination = forcedStop?.id ?? directDestination
    gameState.setCurrentSquare(destination)
    const stoppedSquare = getBoardSquare(destination)
    if (!stoppedSquare) throw new Error(`マス${destination}が見つかりません。`)

    if (stoppedSquare.type === 'goal') break

    if (stoppedSquare.type === 'stop') {
      gameState.completeLifeChoice(
        stoppedSquare.id,
        findChoiceOption(stoppedSquare.id, choices),
      )
      continue
    }

    if (stoppedSquare.type === 'gift') {
      presentStopCount += 1
      const stateAtDraw = gameState.getState()
      const drawResult = drawLifeCard({
        love: stateAtDraw.love,
        hasGuaranteedSukiyaTicket: stateAtDraw.hasGuaranteedSukiyaTicket,
        random,
      })
      gameState.acquireLifeCard(
        drawResult.card.cardId,
        stoppedSquare.id,
        drawResult.isGuaranteed,
      )
      continue
    }

    normalEventCount += 1
    normalSquareStops.push(stoppedSquare.id)
    if (stoppedSquare.id === 33) {
      accidentCheckCount += 1
      const stateAtAccident = gameState.getState()
      const accident = resolveTrafficAccident(
        stateAtAccident.isCarInsuranceActive,
        random,
      )
      if (accident.event.eventId !== 'EV_ACCIDENT_NONE') accidentOccurred += 1
      gameState.applyStatusChanges({
        points: accident.event.point,
        health: accident.event.health,
        love: accident.event.love,
      })
      if (accident.cardId) {
        gameState.acquireLifeCard(accident.cardId, stoppedSquare.id, false)
      }
      continue
    }

    const stateBeforeEvent = gameState.getState()
    const baseEvent = getNormalEventBySquareId(
      stoppedSquare.id,
      stateBeforeEvent.romanceType,
    )
    if (!baseEvent) continue
    const event = applyJobModifiers(baseEvent, stateBeforeEvent.jobType)
    gameState.applyStatusChanges({
      points: event.point,
      health: event.health,
      love: event.love,
    })
    const eventCardId = drawEventLifeCard(event.eventId, random)
    if (eventCardId) {
      gameState.acquireLifeCard(eventCardId, stoppedSquare.id, false)
    }
  }

  const stateAtGoal = gameState.getState()
  const settlement = calculateSettlement(stateAtGoal, random())
  const cardCounts: SimulationGameResult['cardCounts'] = {}
  stateAtGoal.ownedLifeCards.forEach(({ cardId }) => {
    cardCounts[cardId] = (cardCounts[cardId] ?? 0) + 1
  })
  const prizeCards = stateAtGoal.ownedLifeCards.filter(
    ({ cardId }) => getLifeCardById(cardId).type === 'prize',
  )
  const prizeValue = prizeCards.reduce(
    (total, { cardId }) => total + getLifeCardById(cardId).prizeValue,
    0,
  )
  const troubleCount = stateAtGoal.ownedLifeCards.filter(
    ({ cardId }) => getLifeCardById(cardId).type === 'trouble',
  ).length

  LIFE_CARD_DATA.forEach(({ cardId }) => {
    cardCounts[cardId] ??= 0
  })

  return {
    patternId: pattern.id,
    choices,
    finalCash: settlement.finalCash,
    finalHealth: settlement.finalHealth,
    finalLove: settlement.finalLove,
    healthMultiplier: settlement.healthMultiplier,
    pointsAtGoal: stateAtGoal.points,
    lodgerPointsChange: settlement.lodgerPointsChange,
    troubleTotal: settlement.troubleTotal,
    nisaResult: settlement.nisaResult ?? 0,
    medicalInsuranceBenefit: settlement.medicalInsuranceBenefit,
    prizeValue,
    prizeCount: prizeCards.length,
    troubleCount,
    lodgerCount: settlement.lodgerCount,
    cardCounts,
    turnCount,
    presentStopCount,
    normalEventCount,
    accidentCheckCount,
    accidentOccurred,
    forcedStopCount: stateAtGoal.processedForcedStops.size,
    normalSquareStops,
  }
}
