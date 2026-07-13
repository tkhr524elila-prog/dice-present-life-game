import {
  applyStatusChanges,
  type StatusChanges,
  type StatusValues,
} from './applyStatusChanges'

export type GameState = StatusValues & {
  currentSquare: number
  processedForcedStops: ReadonlySet<number>
  hasGuaranteedSukiyaTicket: boolean
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
  applyStatusChanges: (changes: StatusChanges) => Readonly<StatusValues>
}

const createInitialState = (): GameState => ({
  currentSquare: 1,
  points: 1_000,
  health: 60,
  love: 50,
  processedForcedStops: new Set<number>(),
  hasGuaranteedSukiyaTicket: false,
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
    applyStatusChanges: (changes) => {
      const result = applyStatusChanges(state, changes)
      state = { ...state, ...result.next }
      notify(result.applied)
      return result.applied
    },
  }
}
