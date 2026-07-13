import {
  applyStatusChanges,
  type StatusChanges,
  type StatusValues,
} from './applyStatusChanges'
import type { LifeCardId } from '../data/lifeCardData'
import {
  getLifeChoiceBySquareId,
  type JobType,
  type LifeChoiceOption,
  type RomanceType,
} from '../data/lifeChoiceData'
import {
  addLifeHistory,
  type LifeHistoryEntry,
  type LifeHistoryInput,
} from './addLifeHistory'

export type OwnedLifeCard = {
  cardId: LifeCardId
  acquiredAtSquare: number
  acquiredOrder: number
  loveAtAcquisition: number
}

export type GameState = StatusValues & {
  currentSquare: number
  jobType: JobType | null
  romanceType: RomanceType | null
  hasNisa: boolean
  hasMedicalInsurance: boolean
  isCarInsuranceActive: boolean
  nisaEnrollmentSquare: number | null
  medicalInsuranceEnrollmentSquare: number | null
  carInsuranceDecisionSquare: number | null
  processedForcedStops: ReadonlySet<number>
  hasGuaranteedSukiyaTicket: boolean
  ownedLifeCards: readonly OwnedLifeCard[]
  lifeHistory: readonly LifeHistoryEntry[]
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
  completeLifeChoice: (
    squareNumber: number,
    option: LifeChoiceOption,
  ) => {
    didApply: boolean
    applied: Readonly<StatusValues>
  }
  setAtGoal: () => void
  acquireLifeCard: (
    cardId: LifeCardId,
    acquiredAtSquare: number,
    completesSukiyaGuarantee: boolean,
  ) => Readonly<OwnedLifeCard>
  addLifeHistory: (
    input: LifeHistoryInput,
  ) => Readonly<LifeHistoryEntry> | undefined
  applyStatusChanges: (changes: StatusChanges) => Readonly<StatusValues>
}

const createInitialState = (): GameState => ({
  currentSquare: 1,
  jobType: null,
  romanceType: null,
  hasNisa: false,
  hasMedicalInsurance: false,
  isCarInsuranceActive: false,
  nisaEnrollmentSquare: null,
  medicalInsuranceEnrollmentSquare: null,
  carInsuranceDecisionSquare: null,
  points: 1_000,
  health: 60,
  love: 50,
  processedForcedStops: new Set<number>(),
  hasGuaranteedSukiyaTicket: false,
  ownedLifeCards: [],
  lifeHistory: [],
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
    completeLifeChoice: (squareNumber, option) => {
      if (state.processedForcedStops.has(squareNumber)) {
        return {
          didApply: false,
          applied: { points: 0, health: 0, love: 0 },
        }
      }

      const statusResult = applyStatusChanges(state, option.changes)
      const decisionPatch: Partial<GameState> = {}

      switch (option.selection.kind) {
        case 'job':
          if (squareNumber !== 13) throw new Error('職業選択のマスが不正です。')
          decisionPatch.jobType = option.selection.value
          break
        case 'nisa':
          if (squareNumber !== 20) throw new Error('NISA選択のマスが不正です。')
          decisionPatch.hasNisa = option.selection.value
          decisionPatch.nisaEnrollmentSquare = squareNumber
          break
        case 'medical-insurance':
          if (squareNumber !== 25) throw new Error('医療保険選択のマスが不正です。')
          decisionPatch.hasMedicalInsurance = option.selection.value
          decisionPatch.medicalInsuranceEnrollmentSquare = squareNumber
          break
        case 'romance':
          if (squareNumber !== 27) throw new Error('恋愛選択のマスが不正です。')
          decisionPatch.romanceType = option.selection.value
          break
        case 'car-insurance':
          if (squareNumber !== 32) throw new Error('自動車保険選択のマスが不正です。')
          decisionPatch.isCarInsuranceActive = option.selection.value
          decisionPatch.carInsuranceDecisionSquare = squareNumber
          break
      }

      state = {
        ...state,
        ...statusResult.next,
        ...decisionPatch,
        processedForcedStops: new Set([
          ...state.processedForcedStops,
          squareNumber,
        ]),
      }
      notify(statusResult.applied)
      return { didApply: true, applied: statusResult.applied }
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
    addLifeHistory: (input) => {
      const result = addLifeHistory(state.lifeHistory, input)
      if (!result.addedEntry) return undefined

      state = { ...state, lifeHistory: result.history }
      notify()
      return result.addedEntry
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

export const verifyLifeChoiceStateRules = () => {
  const store = createGameStateStore()
  const jobChoice = getLifeChoiceBySquareId(13)?.options[0]
  const nisaChoice = getLifeChoiceBySquareId(20)?.options[0]
  if (!jobChoice || !nisaChoice) {
    throw new Error('人生の選択テスト用データが見つかりません。')
  }

  const firstJobResult = store.completeLifeChoice(13, jobChoice)
  const duplicateJobResult = store.completeLifeChoice(13, jobChoice)
  const nisaResult = store.completeLifeChoice(20, nisaChoice)
  const state = store.getState()

  if (
    !firstJobResult.didApply ||
    duplicateJobResult.didApply ||
    !nisaResult.didApply ||
    state.jobType !== 'foreign-insurance' ||
    state.points !== 1_000 ||
    state.health !== 55 ||
    state.love !== 45 ||
    !state.hasNisa ||
    state.nisaEnrollmentSquare !== 20 ||
    state.processedForcedStops.size !== 2
  ) {
    throw new Error('人生の選択保存・二重反映防止テストに失敗しました。')
  }


  const contractStore = createGameStateStore()
  const medicalChoice = getLifeChoiceBySquareId(25)?.options[0]
  const carChoice = getLifeChoiceBySquareId(32)?.options[0]
  if (!medicalChoice || !carChoice) {
    throw new Error('契約状態のテスト用データが見つかりません。')
  }
  contractStore.completeLifeChoice(20, nisaChoice)
  contractStore.completeLifeChoice(25, medicalChoice)
  contractStore.completeLifeChoice(32, carChoice)
  const contractState = contractStore.getState()
  if (
    contractState.points !== -300 ||
    !contractState.hasNisa ||
    !contractState.hasMedicalInsurance ||
    !contractState.isCarInsuranceActive ||
    contractState.medicalInsuranceEnrollmentSquare !== 25 ||
    contractState.carInsuranceDecisionSquare !== 32
  ) {
    throw new Error('契約の加入・更新状態テストに失敗しました。')
  }

  const alternativeStore = createGameStateStore()
  const localJob = getLifeChoiceBySquareId(13)?.options[1]
  const skipNisa = getLifeChoiceBySquareId(20)?.options[1]
  const skipMedical = getLifeChoiceBySquareId(25)?.options[1]
  const seriousRomance = getLifeChoiceBySquareId(27)?.options[1]
  const skipCar = getLifeChoiceBySquareId(32)?.options[1]
  if (!localJob || !skipNisa || !skipMedical || !seriousRomance || !skipCar) {
    throw new Error('未加入側のテスト用データが見つかりません。')
  }
  alternativeStore.completeLifeChoice(13, localJob)
  alternativeStore.completeLifeChoice(20, skipNisa)
  alternativeStore.completeLifeChoice(25, skipMedical)
  alternativeStore.completeLifeChoice(27, seriousRomance)
  alternativeStore.completeLifeChoice(32, skipCar)
  const alternativeState = alternativeStore.getState()
  if (
    alternativeState.jobType !== 'local-agency' ||
    alternativeState.romanceType !== 'serious' ||
    alternativeState.hasNisa ||
    alternativeState.hasMedicalInsurance ||
    alternativeState.isCarInsuranceActive ||
    alternativeState.points !== 900 ||
    alternativeState.health !== 70 ||
    alternativeState.love !== 70
  ) {
    throw new Error('未加入・別ルートの状態保存テストに失敗しました。')
  }
}
