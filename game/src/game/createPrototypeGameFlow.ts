import {
  BOARD_SQUARES,
  getBoardSquare,
  getSquareTypeLabel,
} from '../data/boardData'
import {
  getNormalEventBySquareId,
  type NormalEventData,
} from '../data/normalEventData'
import type { DiceValue } from '../three/createPrototypeDice'
import type { LifeCardData } from '../data/lifeCardData'
import { drawLifeCard } from './drawLifeCard'
import type { GameStateStore } from './gameState'

export type PrototypeTurnPhase =
  | 'ready'
  | 'rolling'
  | 'moving'
  | 'chapter'
  | 'event'
  | 'present'
  | 'inventory'
  | 'finished'

type PrototypeGameFlowOptions = {
  gameState: GameStateStore
  rollDice: () => Promise<DiceValue>
  movePlayerTo: (squareNumber: number) => Promise<void>
  showChapter: (chapterNumber: number, chapterTitle: string) => Promise<void>
  showEvent: (event: NormalEventData) => Promise<void>
  showPresentDraw: (
    card: LifeCardData,
    isGuaranteed: boolean,
    onReveal: () => void,
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
            options.setPhase('chapter')
            await options.showChapter(square.chapter, square.chapterTitle)
            if (disposed) return
            options.setPhase('moving')
          }

          if (square.type === 'stop') {
            options.gameState.markForcedStopProcessed(square.id)
          }
        }
      }

      const stoppedSquare = getBoardSquare(
        options.gameState.getState().currentSquare,
      )

      if (stoppedSquare?.type === 'goal') {
        options.gameState.setAtGoal()
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
        return
      }

      if (stoppedSquare?.type !== 'normal') return

      const event = getNormalEventBySquareId(stoppedSquare.id)
      if (!event) return

      options.setPhase('event')
      await options.showEvent(event)
      if (disposed) return

      options.gameState.applyStatusChanges({
        points: event.point,
        health: event.health,
        love: event.love,
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
