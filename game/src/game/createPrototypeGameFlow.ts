import {
  BOARD_SQUARES,
  getBoardSquare,
  getSquareTypeLabel,
} from '../data/boardData'
import {
  getNormalEventBySquareId,
} from '../data/normalEventData'
import {
  getLifeChoiceBySquareId,
  type ContractData,
  type LifeChoiceData,
  type LifeChoiceOption,
} from '../data/lifeChoiceData'
import type { DiceValue } from '../three/createPrototypeDice'
import { getLifeCardById, type LifeCardData } from '../data/lifeCardData'
import { drawEventLifeCard } from '../data/eventLifeCardRules'
import type { DisplayEventData } from '../ui/createPrototypeEventModal'
import { drawLifeCard } from './drawLifeCard'
import { applyJobModifiers } from './applyJobModifiers'
import { resolveTrafficAccident } from './resolveTrafficAccident'
import { calculateSettlement, type SettlementResult } from './calculateSettlement'
import { recordSettlementHistory } from './recordSettlementHistory'
import type { GameStateStore } from './gameState'
import type { SettlementOverview } from '../ui/createSettlementModal'

export type PrototypeTurnPhase =
  | 'ready'
  | 'rolling'
  | 'moving'
  | 'chapter'
  | 'event'
  | 'present'
  | 'inventory'
  | 'history'
  | 'choice'
  | 'contract'
  | 'accident'
  | 'settlement'
  | 'finished'

type PrototypeGameFlowOptions = {
  gameState: GameStateStore
  rollDice: () => Promise<DiceValue>
  movePlayerTo: (squareNumber: number) => Promise<void>
  showChapter: (chapterNumber: number, chapterTitle: string) => Promise<void>
  showEvent: (event: DisplayEventData) => Promise<void>
  showLifeChoice: (choice: LifeChoiceData) => Promise<LifeChoiceOption>
  showContract: (contract: ContractData) => Promise<void>
  showPresentDraw: (
    card: LifeCardData,
    isGuaranteed: boolean,
    onReveal: () => void,
  ) => Promise<void>
  showSettlement: (
    result: Readonly<SettlementResult>,
    overview: Readonly<SettlementOverview>,
    onComplete: () => void,
  ) => Promise<void>
  setPhase: (phase: PrototypeTurnPhase) => void
  setResult: (value: DiceValue) => void
  setCurrentSquare: (squareNumber: number) => void
  setCurrentSquareType: (squareType: string) => void
  setCurrentChapter: (chapterNumber: number, chapterTitle: string) => void
}

export type PrototypeGameFlow = {
  playTurn: () => Promise<void>
  dispose: () => void
}

const LAST_SQUARE = 60

export const createPrototypeGameFlow = (
  options: PrototypeGameFlowOptions,
): PrototypeGameFlow => {
  let isBusy = false
  let disposed = false
  const shownChapters = new Set<number>([1])

  options.setCurrentSquare(options.gameState.getState().currentSquare)
  options.setCurrentSquareType('通常イベント')
  options.setCurrentChapter(1, '青春の草原')
  options.setPhase('ready')

  const playTurn = async () => {
    if (isBusy || disposed) return

    isBusy = true

    try {
      options.setPhase('rolling')
      const diceValue = await options.rollDice()
      if (disposed) return

      options.setResult(diceValue)
      options.setPhase('moving')

      const stateBeforeMovement = options.gameState.getState()
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

      for (
        let nextSquare = stateBeforeMovement.currentSquare + 1;
        nextSquare <= destination;
        nextSquare += 1
      ) {
        await options.movePlayerTo(nextSquare)
        if (disposed) return

        options.gameState.setCurrentSquare(nextSquare)
        options.setCurrentSquare(nextSquare)

        const square = getBoardSquare(nextSquare)
        if (square) {
          options.setCurrentSquareType(getSquareTypeLabel(square.type))
          options.setCurrentChapter(square.chapter, square.chapterTitle)

          if (!shownChapters.has(square.chapter)) {
            shownChapters.add(square.chapter)
            options.gameState.addLifeHistory({
              type: 'chapter-start',
              squareId: square.id,
              chapter: square.chapter,
              title: `第${square.chapter}章「${square.chapterTitle}」`,
              description: '新しい章へ入った。',
              pointsChange: 0,
              healthChange: 0,
              loveChange: 0,
              cardId: null,
              loveAtOccurrence: null,
              deduplicationKey: `chapter-start:${square.chapter}`,
            })
            options.setPhase('chapter')
            await options.showChapter(square.chapter, square.chapterTitle)
            if (disposed) return
            options.setPhase('moving')
          }

          if (square.type === 'stop') {
            options.gameState.addLifeHistory({
              type: 'forced-stop',
              squareId: square.id,
              chapter: square.chapter,
              title: square.label,
              description: `マス${square.id} ${square.label}へ到達`,
              pointsChange: 0,
              healthChange: 0,
              loveChange: 0,
              cardId: null,
              loveAtOccurrence: null,
              deduplicationKey: `forced-stop:${square.id}`,
            })
          }
        }
      }

      const stoppedSquare = getBoardSquare(
        options.gameState.getState().currentSquare,
      )

      if (stoppedSquare?.type === 'goal') {
        options.gameState.setAtGoal()
        options.gameState.addLifeHistory({
          type: 'goal',
          squareId: stoppedSquare.id,
          chapter: stoppedSquare.chapter,
          title: 'ゴール到着',
          description: '29歳のゴールへ到着した。',
          pointsChange: 0,
          healthChange: 0,
          loveChange: 0,
          cardId: null,
          loveAtOccurrence: null,
          deduplicationKey: `goal:${stoppedSquare.id}`,
        })
        const stateAtGoal = options.gameState.getState()
        const settlement = calculateSettlement(stateAtGoal)
        const overview: SettlementOverview = {
          job: stateAtGoal.jobType === 'foreign-insurance'
            ? '外資系保険会社'
            : stateAtGoal.jobType === 'local-agency'
              ? '地元の保険代理店'
              : '未選択',
          romance: stateAtGoal.romanceType === 'playboy'
            ? '遊び人ルート'
            : stateAtGoal.romanceType === 'serious'
              ? '真面目な恋愛ルート'
              : '未選択',
          hasNisa: stateAtGoal.hasNisa,
          hasMedicalInsurance: stateAtGoal.hasMedicalInsurance,
          isCarInsuranceActive: stateAtGoal.isCarInsuranceActive,
          lifeCardCount: stateAtGoal.ownedLifeCards.length,
        }
        options.setPhase('settlement')
        await options.showSettlement(settlement, overview, () => {
          if (!options.gameState.completeSettlement(settlement)) return
          recordSettlementHistory(
            options.gameState,
            settlement,
            stateAtGoal.hasMedicalInsurance,
          )
        })
        return
      }

      if (stoppedSquare?.type === 'stop') {
        const choice = getLifeChoiceBySquareId(stoppedSquare.id)
        if (!choice) {
          throw new Error(`マス${stoppedSquare.id}の人生の選択が見つかりません。`)
        }

        options.setPhase('choice')
        const selectedOption = await options.showLifeChoice(choice)
        if (disposed) return

        if (selectedOption.contract) {
          options.setPhase('contract')
          await options.showContract(selectedOption.contract)
          if (disposed) return
        }

        const result = options.gameState.completeLifeChoice(
          stoppedSquare.id,
          selectedOption,
        )
        if (result.didApply) {
          options.gameState.addLifeHistory({
            type: 'life-choice',
            squareId: stoppedSquare.id,
            chapter: stoppedSquare.chapter,
            title: selectedOption.historyTitle,
            description: selectedOption.historyDescription,
            pointsChange: result.applied.points,
            healthChange: result.applied.health,
            loveChange: result.applied.love,
            cardId: null,
            loveAtOccurrence: null,
            deduplicationKey: `life-choice:${stoppedSquare.id}`,
          })
        }
        return
      }

      if (stoppedSquare?.type === 'gift') {
        const stateAtDraw = options.gameState.getState()
        const drawResult = drawLifeCard({
          love: stateAtDraw.love,
          hasGuaranteedSukiyaTicket:
            stateAtDraw.hasGuaranteedSukiyaTicket,
        })
        options.setPhase('present')
        await options.showPresentDraw(
          drawResult.card,
          drawResult.isGuaranteed,
          () => {
            options.gameState.acquireLifeCard(
              drawResult.card.cardId,
              stoppedSquare.id,
              drawResult.isGuaranteed,
            )
          },
        )
        if (disposed) return

        options.gameState.addLifeHistory({
          type: 'present-draw',
          squareId: stoppedSquare.id,
          chapter: stoppedSquare.chapter,
          title: 'プレゼント抽選',
          description: `${drawResult.card.name}を獲得した。`,
          pointsChange: 0,
          healthChange: 0,
          loveChange: 0,
          cardId: drawResult.card.cardId,
          loveAtOccurrence: stateAtDraw.love,
          deduplicationKey: `present-draw:${stoppedSquare.id}`,
        })
        return
      }

      if (stoppedSquare?.type !== 'normal') return

      if (stoppedSquare.id === 33) {
        const stateAtAccident = options.gameState.getState()
        const accident = resolveTrafficAccident(
          stateAtAccident.isCarInsuranceActive,
        )
        options.setPhase('accident')
        await options.showEvent({
          ...accident.event,
          outcomeLabel: accident.outcomeLabel,
          acquiredCardName: accident.cardId ? '車修理' : undefined,
        })
        if (disposed) return

        const appliedChanges = options.gameState.applyStatusChanges({
          points: accident.event.point,
          health: accident.event.health,
          love: accident.event.love,
        })
        if (accident.cardId) {
          options.gameState.acquireLifeCard(accident.cardId, 33, false)
        }
        options.gameState.addLifeHistory({
          type: 'traffic-accident',
          squareId: 33,
          chapter: stoppedSquare.chapter,
          title: accident.historyTitle,
          description: accident.historyDescription,
          pointsChange: appliedChanges.points,
          healthChange: appliedChanges.health,
          loveChange: appliedChanges.love,
          cardId: accident.cardId,
          loveAtOccurrence: accident.cardId ? stateAtAccident.love : null,
          deduplicationKey: 'traffic-accident:33',
        })
        return
      }

      const stateBeforeEvent = options.gameState.getState()
      const baseEvent = getNormalEventBySquareId(
        stoppedSquare.id,
        stateBeforeEvent.romanceType,
      )
      if (!baseEvent) return
      const event = applyJobModifiers(baseEvent, stateBeforeEvent.jobType)
      const eventCardId = drawEventLifeCard(event.eventId)

      options.setPhase('event')
      await options.showEvent({
        ...event,
        acquiredCardName: eventCardId
          ? getLifeCardById(eventCardId).name
          : undefined,
      })
      if (disposed) return

      const appliedChanges = options.gameState.applyStatusChanges({
        points: event.point,
        health: event.health,
        love: event.love,
      })
      if (eventCardId) {
        options.gameState.acquireLifeCard(eventCardId, stoppedSquare.id, false)
      }
      options.gameState.addLifeHistory({
        type: 'normal-event',
        squareId: stoppedSquare.id,
        chapter: stoppedSquare.chapter,
        title: event.title,
        description: event.description,
        pointsChange: appliedChanges.points,
        healthChange: appliedChanges.health,
        loveChange: appliedChanges.love,
        cardId: eventCardId,
        loveAtOccurrence: eventCardId ? stateBeforeEvent.love : null,
        deduplicationKey: `normal-event:${event.eventId}:${stoppedSquare.id}`,
      })
    } finally {
      isBusy = false
      if (!disposed) {
        options.setPhase(
          options.gameState.getState().isAtGoal ? 'finished' : 'ready',
        )
      }
    }
  }

  return {
    playTurn,
    dispose: () => {
      disposed = true
    },
  }
}
