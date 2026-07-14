import type { LifeCardId } from '../lifeCardData'

export type RouteTypeV2 = 'common' | 'playboy' | 'pure-love'
export type ChapterNumberV2 = 1 | 2 | 3 | 4 | 5
export type SquareTypeV2 =
  | 'normal'
  | 'present-draw'
  | 'forced-stop'
  | 'goal'

export type ForcedStopTypeV2 =
  | 'job'
  | 'nisa-1'
  | 'medical-insurance'
  | 'romance'
  | 'car-insurance'
  | 'nisa-2'

export type PositionPlaceholderV2 = {
  x: number
  y: number
  z: number
}

export type ConditionalOutcomeV2 = {
  condition: string
  points: number
  health: number
  love: number
  guaranteedCardId: LifeCardId | null
}

export type BoardEventV2 = {
  eventId: string
  eventTitle: string
  eventCategory: string
  basePoints: number
  baseHealth: number
  baseLove: number
  resolvedPoints: number
  resolvedHealth: number
  resolvedLove: number
  guaranteedCardId: LifeCardId | null
  guaranteedCardCondition: string | null
  forcedStopType: ForcedStopTypeV2 | null
  characters: readonly string[]
  conditionalOutcomes: readonly ConditionalOutcomeV2[]
}

export type BoardSquareV2 = BoardEventV2 & {
  physicalId: string
  progress: number
  route: RouteTypeV2
  displayId: string
  chapter: ChapterNumberV2
  chapterTitle: string
  squareType: SquareTypeV2
  points: number
  health: number
  love: number
  isBranchStart: boolean
  isBranchEnd: boolean
  nextPhysicalIds: readonly string[]
  positionPlaceholder: PositionPlaceholderV2 | null
}

export type BoardDataValidationResultV2 = {
  physicalSquareCount: number
  commonSquareCount: number
  playboySquareCount: number
  pureLoveSquareCount: number
  logicalProgressCount: number
  logicalPresentDrawCount: number
  physicalPresentDrawCount: number
  forcedStopCount: number
  directGuaranteedCardEventCount: number
  conditionalGuaranteedCardEventCount: number
}
