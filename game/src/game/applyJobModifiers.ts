import type { JobType } from '../data/lifeChoiceData'
import type { NormalEventData } from '../data/normalEventData'

export type JobModifiedEvent = NormalEventData & {
  jobModifierApplied: boolean
}

const JOB_MULTIPLIERS: Record<
  JobType,
  { point: number; healthLoss: number; familyLove: number }
> = {
  'foreign-insurance': { point: 1.5, healthLoss: 1.3, familyLove: 0.8 },
  'local-agency': { point: 0.8, healthLoss: 0.7, familyLove: 1.2 },
}

export const applyJobModifiers = (
  event: NormalEventData,
  jobType: JobType | null,
): JobModifiedEvent => {
  if (!jobType || event.jobModifierTarget === 'none') {
    return { ...event, jobModifierApplied: false }
  }

  const multipliers = JOB_MULTIPLIERS[jobType]
  const point =
    event.jobModifierTarget === 'work' && event.point > 0
      ? Math.round(event.point * multipliers.point)
      : event.point
  const health =
    event.jobModifierTarget === 'work' && event.health < 0
      ? -Math.round(Math.abs(event.health) * multipliers.healthLoss)
      : event.health
  const love =
    event.jobModifierTarget === 'family-love' && event.love > 0
      ? Math.round(event.love * multipliers.familyLove)
      : event.love

  return {
    ...event,
    point,
    health,
    love,
    jobModifierApplied:
      point !== event.point || health !== event.health || love !== event.love,
  }
}

export const verifyJobModifierRules = () => {
  const workEvent: NormalEventData = {
    eventId: 'TEST_WORK',
    title: '確認',
    description: '確認',
    point: 500,
    health: -5,
    love: -3,
    squareId: 99,
    eventType: 'normal',
    category: '仕事',
    chapter: 1,
    jobModifierTarget: 'work',
  }
  const familyEvent: NormalEventData = {
    ...workEvent,
    eventId: 'TEST_FAMILY',
    category: '家族',
    point: -100,
    health: 5,
    love: 15,
    jobModifierTarget: 'family-love',
  }

  const foreignWork = applyJobModifiers(workEvent, 'foreign-insurance')
  const localWork = applyJobModifiers(workEvent, 'local-agency')
  const foreignFamily = applyJobModifiers(familyEvent, 'foreign-insurance')
  const localFamily = applyJobModifiers(familyEvent, 'local-agency')

  if (
    foreignWork.point !== 750 ||
    foreignWork.health !== -7 ||
    localWork.point !== 400 ||
    localWork.health !== -4 ||
    foreignFamily.point !== -100 ||
    foreignFamily.health !== 5 ||
    foreignFamily.love !== 12 ||
    localFamily.love !== 18
  ) {
    throw new Error('職業補正ルールの自動検証に失敗しました。')
  }

  const negativePoint = applyJobModifiers(
    { ...workEvent, point: -100, health: 3 },
    'foreign-insurance',
  )
  if (negativePoint.point !== -100 || negativePoint.health !== 3) {
    throw new Error('マイナスポイントまたは健康増加へ倍率が適用されました。')
  }
}
