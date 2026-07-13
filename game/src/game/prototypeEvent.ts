import type { StatusChanges } from './applyStatusChanges'

export type PrototypeEvent = {
  title: string
  text: string
  changes: StatusChanges
}

export const UNIVERSITY_ENTRANCE_EVENT: PrototypeEvent = {
  title: '大学入学',
  text: '自由を手に入れた。時間割はまだ他人が決める。',
  changes: {
    points: 100,
    health: 0,
    love: 5,
  },
}
