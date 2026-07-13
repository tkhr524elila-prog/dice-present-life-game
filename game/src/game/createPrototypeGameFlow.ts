import {
  BOARD_SQUARES,
  getBoardSquare,
  getSquareTypeLabel,
} from '../data/boardData'
import type { DiceValue } from '../three/createPrototypeDice'
import type { GameStateStore } from './gameState'
import { UNIVERSITY_ENTRANCE_EVENT } from './prototypeEvent'

export type PrototypeTurnPhase =
  | 'ready'
  | 'rolling'
  | 'moving'
  | 'chapter'
  | 'event'
  | 'finished'

type PrototypeGameFlowOptions = {
  gameState: GameStateStore
  rollDice: () => Promise<DiceValue>
  movePlayerTo: (squareNumber: number) => Promise<void>
  showChapter: (chapterNumber: number, chapterTitle: string) => Promise<void>
  showEvent: () => Promise<void>
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

      options.setPhase('event')
      await options.showEvent()
      if (disposed) return

      options.gameState.applyStatusChanges(UNIVERSITY_ENTRANCE_EVENT.changes)

      if (options.gameState.getState().currentSquare === LAST_SQUARE) {
        options.gameState.setAtGoal()
      }
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
