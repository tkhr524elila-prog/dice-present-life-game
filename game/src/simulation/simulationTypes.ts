import type { LifeCardId } from '../data/lifeCardData'
import type { JobType, RomanceType } from '../data/lifeChoiceData'

export type SimulationChoices = {
  jobType: JobType
  romanceType: RomanceType
  hasNisa: boolean
  hasMedicalInsurance: boolean
  isCarInsuranceActive: boolean
}

export type SimulationPattern = {
  id: string
  choices: SimulationChoices | 'random'
}

export type SimulationGameResult = {
  patternId: string
  choices: SimulationChoices
  finalCash: number
  finalHealth: number
  finalLove: number
  healthMultiplier: number
  pointsAtGoal: number
  lodgerPointsChange: number
  troubleTotal: number
  nisaResult: number
  medicalInsuranceBenefit: number
  prizeValue: number
  prizeCount: number
  troubleCount: number
  lodgerCount: number
  cardCounts: Partial<Record<LifeCardId, number>>
  turnCount: number
  presentStopCount: number
  normalEventCount: number
  accidentCheckCount: number
  accidentOccurred: number
  forcedStopCount: number
  normalSquareStops: readonly number[]
}

export type NumberSummary = {
  average: number
  median: number
  minimum: number
  maximum: number
  standardDeviation: number
}

export type SimulationSummary = {
  games: number
  cash: NumberSummary & {
    zeroRate: number
    under3000Rate: number
    between3000And7000Rate: number
    over7000Rate: number
    atLeast10000Rate: number
  }
  prizes: {
    value: NumberSummary
    count: NumberSummary
    noneRate: number
    averageCardCounts: Partial<Record<LifeCardId, number>>
    averageTroubleCount: number
    averageLodgerCount: number
  }
  statuses: {
    health: NumberSummary
    love: NumberSummary
    healthBands: Record<string, number>
    loveBands: Record<string, number>
  }
  progress: {
    averageTurns: number
    averagePresentStops: number
    averageNormalEvents: number
    accidentLandingRate: number
    accidentRateWhenChecked: number
    averageForcedStops: number
    averageStopsByNormalSquare: Record<string, number>
  }
  economy: {
    averagePointsAtGoal: number
    averageLodgerPointsChange: number
    averageTroubleTotal: number
    averageNisaResult: number
    averageMedicalInsuranceBenefit: number
    averageHealthMultiplier: number
  }
}

export type ComparisonSummary = {
  leftLabel: string
  rightLabel: string
  left: Pick<SimulationSummary, 'games' | 'cash' | 'statuses'>
  right: Pick<SimulationSummary, 'games' | 'cash' | 'statuses'>
  differenceLeftMinusRight: {
    cashAverage: number
    healthAverage: number
    loveAverage: number
  }
}
