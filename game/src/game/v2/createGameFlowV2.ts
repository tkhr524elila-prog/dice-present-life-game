import { getLifeCardById, type LifeCardData } from '../../data/lifeCardData'
import { getBoardSquareV2 } from '../../data/v2/boardDataV2'
import { getLifeChoiceV2 } from '../../data/v2/lifeChoiceDataV2'
import type { ContractData, LifeChoiceData, LifeChoiceOption } from '../../data/lifeChoiceData'
import type { DiceValue } from '../../three/createPrototypeDice'
import type { DisplayEventData } from '../../ui/createPrototypeEventModal'
import type { SettlementOverview } from '../../ui/createSettlementModal'
import { calculateSettlement, type SettlementResult } from '../calculateSettlement'
import { drawLifeCard } from '../drawLifeCard'
import type { GameStateStore } from '../gameState'
import { recordSettlementHistory } from '../recordSettlementHistory'
import type { PrototypeTurnPhase } from '../createPrototypeGameFlow'
import { resolveEventV2 } from './applyEventV2'
import { createMovementPathV2 } from './resolveRouteV2'

type GameFlowV2Options = {
  gameState: GameStateStore
  rollDice: () => Promise<DiceValue>
  movePlayerTo: (physicalId: string) => Promise<void>
  setSelectedRoute: (route: 'playboy' | 'pure-love' | null) => void
  showChapter: (chapter: number, title: string) => Promise<void>
  showEvent: (event: DisplayEventData) => Promise<void>
  showLifeChoice: (choice: LifeChoiceData) => Promise<LifeChoiceOption>
  showContract: (contract: ContractData) => Promise<void>
  showPresentDraw: (card: LifeCardData, guaranteed: boolean, onReveal: () => void) => Promise<void>
  showSettlement: (result: Readonly<SettlementResult>, overview: Readonly<SettlementOverview>, onComplete: () => void) => Promise<void>
  setPhase: (phase: PrototypeTurnPhase) => void
  setResult: (value: DiceValue) => void
  setCurrentSquare: (displayId: string) => void
  setCurrentSquareType: (type: string) => void
  setCurrentChapter: (chapter: number, title: string) => void
}

const TYPE_LABELS = {
  normal: '通常イベント',
  'present-draw': 'プレゼント抽選',
  'forced-stop': '強制ストップ',
  goal: 'ゴール',
} as const

export const createGameFlowV2 = (options: GameFlowV2Options) => {
  let isBusy = false
  let disposed = false
  const shownChapters = new Set([1])
  options.setCurrentSquare('1')
  options.setCurrentSquareType('通常イベント')
  options.setCurrentChapter(1, '青春の草原')
  options.setSelectedRoute(null)
  options.setPhase('ready')

  const addLocationHistory = (
    square: NonNullable<ReturnType<typeof getBoardSquareV2>>,
    input: Parameters<GameStateStore['addLifeHistory']>[0],
  ) => options.gameState.addLifeHistory({ ...input, displayId: square.displayId })

  const playTurn = async () => {
    if (isBusy || disposed) return
    isBusy = true
    try {
      options.setPhase('rolling')
      const diceValue = await options.rollDice()
      if (disposed) return
      options.setResult(diceValue)
      options.setPhase('moving')

      const stateBefore = options.gameState.getState()
      const path = createMovementPathV2(
        stateBefore.currentPhysicalId,
        diceValue,
        stateBefore.selectedRoute,
        stateBefore.processedForcedStops,
      )
      for (const physicalId of path) {
        await options.movePlayerTo(physicalId)
        if (disposed) return
        const square = getBoardSquareV2(physicalId)!
        options.gameState.setCurrentPosition(physicalId, square.progress)
        options.setCurrentSquare(square.displayId)
        options.setCurrentSquareType(TYPE_LABELS[square.squareType])
        options.setCurrentChapter(square.chapter, square.chapterTitle)

        if (!shownChapters.has(square.chapter)) {
          shownChapters.add(square.chapter)
          addLocationHistory(square, {
            type: 'chapter-start', squareId: square.progress, chapter: square.chapter,
            title: `第${square.chapter}章「${square.chapterTitle}」`, description: '新しい章へ入った。',
            pointsChange: 0, healthChange: 0, loveChange: 0, cardId: null,
            loveAtOccurrence: null, deduplicationKey: `v2:chapter:${square.chapter}`,
          })
          options.setPhase('chapter')
          await options.showChapter(square.chapter, square.chapterTitle)
          options.setPhase('moving')
        }
        if (square.squareType === 'forced-stop') {
          addLocationHistory(square, {
            type: 'forced-stop', squareId: square.progress, chapter: square.chapter,
            title: square.eventTitle, description: `マス${square.displayId} ${square.eventTitle}へ到達`,
            pointsChange: 0, healthChange: 0, loveChange: 0, cardId: null,
            loveAtOccurrence: null, deduplicationKey: `v2:forced-stop:${square.progress}`,
          })
        }
      }

      const state = options.gameState.getState()
      const stopped = getBoardSquareV2(state.currentPhysicalId)
      if (!stopped) throw new Error('停止した100マス版データが見つかりません。')

      if (stopped.squareType === 'goal') {
        options.gameState.setAtGoal()
        addLocationHistory(stopped, {
          type: 'goal', squareId: 100, chapter: 5, title: 'ゴール到着',
          description: '29歳のゴール、マス100へ到着した。', pointsChange: 0,
          healthChange: 0, loveChange: 0, cardId: null, loveAtOccurrence: null,
          deduplicationKey: 'v2:goal:100',
        })
        const goalState = options.gameState.getState()
        const settlement = calculateSettlement({
          ...goalState,
          hasNisaSecondSlot: goalState.hasNisaSecondSlot,
        })
        const overview: SettlementOverview = {
          job: goalState.jobType === 'foreign-insurance' ? '外資系保険会社' : goalState.jobType === 'local-agency' ? '地元の保険代理店' : '未選択',
          romance: goalState.selectedRoute === 'playboy' ? '遊び人ルート' : goalState.selectedRoute === 'pure-love' ? '純愛ルート' : '未選択',
          hasNisa: goalState.hasNisa,
          hasNisaSecondSlot: goalState.hasNisaSecondSlot,
          hasMedicalInsurance: goalState.hasMedicalInsurance,
          isCarInsuranceActive: goalState.isCarInsuranceActive,
          lifeCardCount: goalState.ownedLifeCards.length,
        }
        options.setPhase('settlement')
        await options.showSettlement(settlement, overview, () => {
          if (!options.gameState.completeSettlement(settlement)) return
          recordSettlementHistory(options.gameState, settlement, goalState.hasMedicalInsurance)
        })
        return
      }

      if (stopped.squareType === 'forced-stop') {
        const choice = getLifeChoiceV2(stopped.progress, state.hasNisa)
        if (!choice) throw new Error(`マス${stopped.displayId}の選択が見つかりません。`)
        options.setPhase('choice')
        const selected = await options.showLifeChoice(choice)
        if (disposed) return
        if (selected.contract) {
          options.setPhase('contract')
          await options.showContract(selected.contract)
        }
        const result = options.gameState.completeLifeChoice(stopped.progress, selected)
        if (result.didApply) {
          const nextState = options.gameState.getState()
          options.setSelectedRoute(nextState.selectedRoute)
          addLocationHistory(stopped, {
            type: 'life-choice', squareId: stopped.progress, chapter: stopped.chapter,
            title: selected.historyTitle, description: selected.historyDescription,
            pointsChange: result.applied.points, healthChange: result.applied.health,
            loveChange: result.applied.love, cardId: null, loveAtOccurrence: null,
            deduplicationKey: `v2:choice:${stopped.progress}`,
          })
        }
        return
      }

      if (stopped.squareType === 'present-draw') {
        const drawState = options.gameState.getState()
        const result = drawLifeCard({ love: drawState.love, hasGuaranteedSukiyaTicket: drawState.hasGuaranteedSukiyaTicket })
        options.setPhase('present')
        await options.showPresentDraw(result.card, result.isGuaranteed, () => {
          options.gameState.acquireLifeCard(result.card.cardId, stopped.progress, result.isGuaranteed)
        })
        addLocationHistory(stopped, {
          type: 'present-draw', squareId: stopped.progress, chapter: stopped.chapter,
          title: 'プレゼント抽選', description: `${result.card.name}を獲得した。`,
          pointsChange: 0, healthChange: 0, loveChange: 0, cardId: result.card.cardId,
          loveAtOccurrence: drawState.love, deduplicationKey: `v2:present:${stopped.physicalId}`,
        })
        return
      }

      const eventState = options.gameState.getState()
      const resolved = resolveEventV2(stopped, eventState.jobType, eventState.isCarInsuranceActive)
      const cardName = resolved.guaranteedCardId
        ? getLifeCardById(resolved.guaranteedCardId).name
        : undefined
      options.setPhase(stopped.progress === 67 ? 'accident' : 'event')
      await options.showEvent({ ...resolved.display, acquiredCardName: cardName })
      if (disposed) return
      const applied = options.gameState.applyStatusChanges({
        points: resolved.display.point,
        health: resolved.display.health,
        love: resolved.display.love,
      })
      if (resolved.guaranteedCardId) {
        options.gameState.acquireLifeCard(resolved.guaranteedCardId, stopped.progress, false)
      }
      const isHiromuLodger = resolved.guaranteedCardId === 'SPECIAL_LODGER'
      addLocationHistory(stopped, {
        type: stopped.progress === 67 ? 'traffic-accident' : 'normal-event',
        squareId: stopped.progress, chapter: stopped.chapter, title: stopped.eventTitle,
        description: isHiromuLodger
          ? '友人のひろむが住み着いた。'
          : resolved.display.description,
        pointsChange: applied.points, healthChange: applied.health, loveChange: applied.love,
        cardId: resolved.guaranteedCardId,
        loveAtOccurrence: resolved.guaranteedCardId ? eventState.love : null,
        deduplicationKey: `v2:event:${stopped.eventId}`,
      })
    } finally {
      isBusy = false
      if (!disposed) options.setPhase(options.gameState.getState().isAtGoal ? 'finished' : 'ready')
    }
  }

  return { playTurn, dispose: () => { disposed = true } }
}
