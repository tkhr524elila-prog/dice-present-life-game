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
  | 'history'
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
            options.gameState.markForcedStopProcessed(square.id)
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

      const event = getNormalEventBySquareId(stoppedSquare.id)
      if (!event) return

      options.setPhase('event')
      await options.showEvent(event)
      if (disposed) return

      const appliedChanges = options.gameState.applyStatusChanges({
        points: event.point,
        health: event.health,
        love: event.love,
      })
      options.gameState.addLifeHistory({
        type: 'normal-event',
        squareId: stoppedSquare.id,
        chapter: stoppedSquare.chapter,
        title: event.title,
        description: event.description,
        pointsChange: appliedChanges.points,
        healthChange: appliedChanges.health,
        loveChange: appliedChanges.love,
        cardId: null,
        loveAtOccurrence: null,
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
