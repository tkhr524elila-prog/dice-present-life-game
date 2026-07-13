import type { LifeCardId } from '../data/lifeCardData'

export type LifeHistoryType =
  | 'normal-event'
  | 'present-draw'
  | 'card-acquired'
  | 'forced-stop'
  | 'chapter-start'
  | 'goal'

export type LifeHistoryEntry = {
  id: number
  type: LifeHistoryType
  squareId: number
  chapter: number
  title: string
  description: string
  pointsChange: number
  healthChange: number
  loveChange: number
  cardId: LifeCardId | null
  loveAtOccurrence: number | null
  order: number
  deduplicationKey: string
}

export type LifeHistoryInput = Omit<LifeHistoryEntry, 'id' | 'order'>

export type AddLifeHistoryResult = {
  history: readonly LifeHistoryEntry[]
  addedEntry?: Readonly<LifeHistoryEntry>
}

export const addLifeHistory = (
  history: readonly LifeHistoryEntry[],
  input: LifeHistoryInput,
): AddLifeHistoryResult => {
  if (
    history.some(
      ({ deduplicationKey }) =>
        deduplicationKey === input.deduplicationKey,
    )
  ) {
    return { history }
  }

  const addedEntry: LifeHistoryEntry = {
    ...input,
    id: history.length + 1,
    order: history.length + 1,
  }

  return {
    history: [...history, addedEntry],
    addedEntry,
  }
}

export const verifyLifeHistoryRules = () => {
  const firstInput: LifeHistoryInput = {
    type: 'normal-event',
    squareId: 2,
    chapter: 1,
    title: '一人暮らし開始',
    description: '確認用',
    pointsChange: -200,
    healthChange: 0,
    loveChange: 3,
    cardId: null,
    loveAtOccurrence: null,
    deduplicationKey: 'normal-event:EV_STUDENT_02:2',
  }
  const first = addLifeHistory([], firstInput)
  const duplicate = addLifeHistory(first.history, firstInput)
  const second = addLifeHistory(duplicate.history, {
    ...firstInput,
    squareId: 3,
    deduplicationKey: 'normal-event:EV_STUDENT_03:3',
  })

  if (
    first.addedEntry?.id !== 1 ||
    duplicate.addedEntry !== undefined ||
    duplicate.history.length !== 1 ||
    second.addedEntry?.order !== 2
  ) {
    throw new Error('人生ノートの発生順・重複防止テストに失敗しました。')
  }
}
