import { BOARD_EVENTS_BY_PHYSICAL_ID_V2 } from './eventDataV2'
import type {
  BoardSquareV2,
  ChapterNumberV2,
  RouteTypeV2,
  SquareTypeV2,
} from './boardTypesV2'

const padProgress = (progress: number) => String(progress).padStart(3, '0')

const COMMON_PHYSICAL_IDS = [
  ...Array.from({ length: 40 }, (_, index) => padProgress(index + 1)),
  ...Array.from({ length: 40 }, (_, index) => padProgress(index + 61)),
]
const PLAYBOY_PHYSICAL_IDS = Array.from(
  { length: 20 },
  (_, index) => `${padProgress(index + 41)}-A`,
)
const PURE_LOVE_PHYSICAL_IDS = Array.from(
  { length: 20 },
  (_, index) => `${padProgress(index + 41)}-B`,
)

const getProgress = (physicalId: string) => Number(physicalId.slice(0, 3))

const getRoute = (physicalId: string): RouteTypeV2 => {
  if (physicalId.endsWith('-A')) return 'playboy'
  if (physicalId.endsWith('-B')) return 'pure-love'
  return 'common'
}

const getChapter = (progress: number): ChapterNumberV2 => {
  if (progress <= 20) return 1
  if (progress <= 40) return 2
  if (progress <= 60) return 3
  if (progress <= 80) return 4
  return 5
}

const CHAPTER_TITLES = {
  1: '青春の草原',
  2: '社会人の城下町',
  3: '欲望の夜街',
  4: '家族の王国',
  5: '人生の山脈',
} as const

const getSquareType = (
  eventCategory: string,
  forcedStopType: string | null,
  progress: number,
): SquareTypeV2 => {
  if (progress === 100) return 'goal'
  if (forcedStopType) return 'forced-stop'
  if (eventCategory === 'プレゼント抽選') return 'present-draw'
  return 'normal'
}

const getNextPhysicalIds = (
  progress: number,
  route: RouteTypeV2,
): readonly string[] => {
  if (progress === 100) return []
  if (progress === 40) return ['041-A', '041-B']
  if (progress === 60) return ['061']
  if (route === 'playboy') return [`${padProgress(progress + 1)}-A`]
  if (route === 'pure-love') return [`${padProgress(progress + 1)}-B`]
  return [padProgress(progress + 1)]
}

const getCommonX = (progress: number) =>
  Math.sin(progress * 0.31) * 3.4 + Math.sin(progress * 0.09) * 1.6

const createPosition = (
  progress: number,
  route: RouteTypeV2,
) => {
  const z = (progress - 1) * 1.72
  const y = 1.05 + Math.sin(progress * 0.25) * 0.8 + Math.sin(progress * 0.07) * 0.45

  if (route === 'common') {
    return { x: getCommonX(progress), y, z }
  }

  const routeProgress = (progress - 40) / 21
  const centerX =
    getCommonX(40) + (getCommonX(61) - getCommonX(40)) * routeProgress
  const separation = Math.sin(Math.PI * routeProgress) * 6.4
  return {
    x: centerX + (route === 'playboy' ? -separation : separation),
    y: y + (route === 'playboy' ? 0.15 : -0.15),
    z,
  }
}

const createSquare = (physicalId: string): BoardSquareV2 => {
  const boardEvent = BOARD_EVENTS_BY_PHYSICAL_ID_V2.get(physicalId)
  if (!boardEvent) {
    throw new Error(`物理マス${physicalId}のイベントが見つかりません。`)
  }

  const progress = getProgress(physicalId)
  const route = getRoute(physicalId)
  const chapter = getChapter(progress)

  return {
    physicalId,
    progress,
    route,
    displayId:
      route === 'common'
        ? String(progress)
        : `${progress}-${route === 'playboy' ? 'A' : 'B'}`,
    chapter,
    chapterTitle: CHAPTER_TITLES[chapter],
    squareType: getSquareType(
      boardEvent.eventCategory,
      boardEvent.forcedStopType,
      progress,
    ),
    ...boardEvent,
    points: boardEvent.resolvedPoints,
    health: boardEvent.resolvedHealth,
    love: boardEvent.resolvedLove,
    isBranchStart: progress === 40,
    isBranchEnd: progress === 60,
    nextPhysicalIds: getNextPhysicalIds(progress, route),
    positionPlaceholder: createPosition(progress, route),
  }
}

export const BOARD_SQUARES_V2: readonly BoardSquareV2[] = [
  ...COMMON_PHYSICAL_IDS,
  ...PLAYBOY_PHYSICAL_IDS,
  ...PURE_LOVE_PHYSICAL_IDS,
].map(createSquare)

export const BOARD_SQUARES_BY_PHYSICAL_ID_V2 = new Map(
  BOARD_SQUARES_V2.map((square) => [square.physicalId, square]),
)

export const getBoardSquareV2 = (physicalId: string) =>
  BOARD_SQUARES_BY_PHYSICAL_ID_V2.get(physicalId)
