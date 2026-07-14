import type { JobType } from '../../data/lifeChoiceData'
import type { LifeCardId } from '../../data/lifeCardData'
import type { BoardSquareV2 } from '../../data/v2/boardTypesV2'
import type { DisplayEventData } from '../../ui/createPrototypeEventModal'

type ResolvedEventV2 = {
  display: DisplayEventData
  guaranteedCardId: LifeCardId | null
}

const round = (value: number) => Math.round(value)

export const resolveEventV2 = (
  square: BoardSquareV2,
  jobType: JobType | null,
  isCarInsuranceActive: boolean,
): ResolvedEventV2 => {
  let points = square.resolvedPoints
  let health = square.resolvedHealth
  let love = square.resolvedLove
  let guaranteedCardId = square.guaranteedCardId
  let outcomeLabel: string | undefined

  if (square.progress === 67) {
    const outcome = square.conditionalOutcomes.find(({ condition }) =>
      condition === (isCarInsuranceActive ? 'car-insurance-active' : 'car-insurance-inactive'),
    )
    if (!outcome) throw new Error('交通事故の条件別結果が見つかりません。')
    points = outcome.points
    health = outcome.health
    love = outcome.love
    guaranteedCardId = outcome.guaranteedCardId
    outcomeLabel = isCarInsuranceActive ? '自動車保険が適用された' : '車修理カードを獲得'
  }

  const isWork = square.eventCategory.includes('仕事')
  const isFamily = square.eventCategory.includes('家族')
  const multipliers = jobType === 'foreign-insurance'
    ? { point: 1.5, health: 1.3, love: 0.8 }
    : jobType === 'local-agency'
      ? { point: 0.8, health: 0.7, love: 1.2 }
      : null
  let jobModifierApplied = false
  if (multipliers && square.route === 'common') {
    if (isWork && points > 0) {
      points = round(points * multipliers.point)
      jobModifierApplied = true
    }
    if (isWork && health < 0) {
      health = -round(Math.abs(health) * multipliers.health)
      jobModifierApplied = true
    }
    if (isFamily && love > 0) {
      love = round(love * multipliers.love)
      jobModifierApplied = true
    }
  }

  const selectedBoss = jobType === 'foreign-insurance'
    ? '菊田さん'
    : jobType === 'local-agency'
      ? '平さん'
      : null
  const characterNames = square.characters
    .filter((name) => name !== '菊田さん' && name !== '平さん')
  if (selectedBoss && square.characters.some((name) => name === '菊田さん' || name === '平さん')) {
    characterNames.push(selectedBoss)
  }
  const characterText = characterNames.length > 0
    ? `登場人物：${characterNames.join('、')}`
    : square.eventTitle

  return {
    display: {
      eventId: square.eventId,
      title: square.eventTitle,
      description: characterText,
      point: points,
      health,
      love,
      squareId: square.progress,
      displayId: square.displayId,
      eventType: 'normal',
      category: square.eventCategory,
      chapter: square.chapter,
      jobModifierTarget: isWork ? 'work' : isFamily ? 'family-love' : 'none',
      jobModifierApplied,
      outcomeLabel,
    },
    guaranteedCardId,
  }
}

export const verifyRouteEventMultiplierV2 = () => {
  const playboy: BoardSquareV2 = {
    physicalId: 'TEST-A', progress: 41, route: 'playboy', displayId: '41-A', chapter: 3,
    chapterTitle: '欲望の夜街', squareType: 'normal', eventId: 'TEST-A', eventTitle: '確認',
    eventCategory: '恋愛', basePoints: 300, baseHealth: -5, baseLove: -8,
    resolvedPoints: 600, resolvedHealth: -5, resolvedLove: -16,
    points: 600, health: -5, love: -16, guaranteedCardId: null,
    guaranteedCardCondition: null, forcedStopType: null, characters: [], conditionalOutcomes: [],
    isBranchStart: false, isBranchEnd: false, nextPhysicalIds: [], positionPlaceholder: null,
  }
  const resolved = resolveEventV2(playboy, null, false).display
  if (resolved.point !== 600 || resolved.love !== -16 || resolved.health !== -5) {
    throw new Error('遊び人ルートの実反映値へ倍率が二重適用されています。')
  }
  const pure = resolveEventV2({ ...playboy, physicalId: 'TEST-B', route: 'pure-love', displayId: '41-B', resolvedPoints: 300, resolvedLove: 8, points: 300, love: 8 }, null, false).display
  if (pure.point !== 300 || pure.love !== 8 || pure.health !== -5) {
    throw new Error('純愛ルートへ追加倍率が適用されています。')
  }
}
