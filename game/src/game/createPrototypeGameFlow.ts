import {
  BOARD_SQUARES,
  getBoardSquare,
  getSquareTypeLabel,
} from '../data/boardData'
import type { DiceValue } from '../three/createPrototypeDice'

export type PrototypeTurnPhase =
  | 'ready'
  | 'rolling'
  | 'moving'
  | 'chapter'
  | 'event'
  | 'finished'

type PrototypeGameFlowOptions = {
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
  let currentSquare = 1
  let isBusy = false
  let disposed = false
  const shownChapters = new Set<number>([1])
  const completedForcedStops = new Set<number>()

  options.setCurrentSquare(currentSquare)
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

      const directDestination = Math.min(
        currentSquare + diceValue,
        LAST_SQUARE,
      )
      const forcedStop = BOARD_SQUARES.find(
        (square) =>
          square.id > currentSquare &&
          square.id <= directDestination &&
          square.type === 'stop' &&
          !completedForcedStops.has(square.id),
      )
      const destination = forcedStop?.id ?? directDestination

      for (
        let nextSquare = currentSquare + 1;
        nextSquare <= destination;
        nextSquare += 1
      ) {
        await options.movePlayerTo(nextSquare)
        if (disposed) return

        currentSquare = nextSquare
        options.setCurrentSquare(currentSquare)

        const square = getBoardSquare(currentSquare)
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
            completedForcedStops.add(square.id)
          }
        }
      }

      options.setPhase('event')
      await options.showEvent()
    } finally {
      isBusy = false
      if (!disposed) {
        options.setPhase(currentSquare === LAST_SQUARE ? 'finished' : 'ready')
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
