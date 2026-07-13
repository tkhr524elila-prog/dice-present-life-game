import {
  applyStatusChanges,
  type StatusChanges,
  type StatusValues,
} from './applyStatusChanges'
import type { LifeCardId } from '../data/lifeCardData'

export type OwnedLifeCard = {
  cardId: LifeCardId
  acquiredAtSquare: number
  acquiredOrder: number
  loveAtAcquisition: number
}

export type GameState = StatusValues & {
  currentSquare: number
  processedForcedStops: ReadonlySet<number>
  hasGuaranteedSukiyaTicket: boolean
  ownedLifeCards: readonly OwnedLifeCard[]
  isAtGoal: boolean
}

export type GameStateChange = {
  state: Readonly<GameState>
  statusChanges?: Readonly<StatusValues>
}

export type GameStateStore = {
  getState: () => Readonly<GameState>
  subscribe: (listener: (change: GameStateChange) => void) => () => void
  setCurrentSquare: (squareNumber: number) => void
  markForcedStopProcessed: (squareNumber: number) => void
  setAtGoal: () => void
  acquireLifeCard: (
    cardId: LifeCardId,
    acquiredAtSquare: number,
    completesSukiyaGuarantee: boolean,
  ) => Readonly<OwnedLifeCard>
  applyStatusChanges: (changes: StatusChanges) => Readonly<StatusValues>
}

const createInitialState = (): GameState => ({
  currentSquare: 1,
  points: 1_000,
  health: 60,
  love: 50,
  processedForcedStops: new Set<number>(),
  hasGuaranteedSukiyaTicket: false,
  ownedLifeCards: [],
  isAtGoal: false,
})

export const createGameStateStore = (): GameStateStore => {
  let state = createInitialState()
  const listeners = new Set<(change: GameStateChange) => void>()

  const notify = (statusChanges?: StatusValues) => {
    const change = { state, statusChanges }
    listeners.forEach((listener) => listener(change))
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      listener({ state })
      return () => listeners.delete(listener)
    },
    setCurrentSquare: (squareNumber) => {
      state = { ...state, currentSquare: squareNumber }
      notify()
    },
    markForcedStopProcessed: (squareNumber) => {
      state = {
        ...state,
        processedForcedStops: new Set([
          ...state.processedForcedStops,
          squareNumber,
        ]),
      }
      notify()
    },
    setAtGoal: () => {
      state = { ...state, isAtGoal: true }
      notify()
    },
    acquireLifeCard: (
      cardId,
      acquiredAtSquare,
      completesSukiyaGuarantee,
    ) => {
      const ownedLifeCard = {
        cardId,
        acquiredAtSquare,
        acquiredOrder: state.ownedLifeCards.length + 1,
        loveAtAcquisition: state.love,
      }
      state = {
        ...state,
        hasGuaranteedSukiyaTicket:
          state.hasGuaranteedSukiyaTicket || completesSukiyaGuarantee,
        ownedLifeCards: [...state.ownedLifeCards, ownedLifeCard],
      }
      notify()
      return ownedLifeCard
    },
    applyStatusChanges: (changes) => {
      const result = applyStatusChanges(state, changes)
      state = { ...state, ...result.next }
      notify(result.applied)
      return result.applied
    },
  }
}

export const verifyLifeCardOwnershipRules = () => {
  const store = createGameStateStore()
  const initialStatus = store.getState()
  store.acquireLifeCard('PRIZE_SUKIYA', 8, true)
  store.acquireLifeCard('PRIZE_SUKIYA', 16, false)
  const result = store.getState()

  if (
    result.ownedLifeCards.length !== 2 ||
    result.ownedLifeCards[0]?.acquiredOrder !== 1 ||
    result.ownedLifeCards[1]?.acquiredOrder !== 2 ||
    !result.hasGuaranteedSukiyaTicket
  ) {
    throw new Error('ライフカードの複数所持テストに失敗しました。')
  }

  if (
    result.points !== initialStatus.points ||
    result.health !== initialStatus.health ||
    result.love !== initialStatus.love
  ) {
    throw new Error('カード取得時にステータスが変化しました。')
  }
}
