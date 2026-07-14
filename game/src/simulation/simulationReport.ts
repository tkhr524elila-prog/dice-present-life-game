import { LIFE_CARD_DATA } from '../data/lifeCardData'
import type {
  ComparisonSummary,
  NumberSummary,
  SimulationGameResult,
  SimulationSummary,
} from './simulationTypes'

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

const average = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0) / values.length

const summarizeNumbers = (values: readonly number[]): NumberSummary => {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  const mean = average(values)
  const variance = average(values.map((value) => (value - mean) ** 2))
  const median = sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!

  return {
    average: round(mean),
    median: round(median),
    minimum: sorted[0]!,
    maximum: sorted[sorted.length - 1]!,
    standardDeviation: round(Math.sqrt(variance)),
  }
}

const rate = (
  results: readonly SimulationGameResult[],
  predicate: (result: SimulationGameResult) => boolean,
) => round(results.filter(predicate).length / results.length * 100)

const summarizeBands = (
  values: readonly number[],
): Record<string, number> => ({
  '0-19': round(values.filter((value) => value <= 19).length / values.length * 100),
  '20-39': round(values.filter((value) => value >= 20 && value <= 39).length / values.length * 100),
  '40-59': round(values.filter((value) => value >= 40 && value <= 59).length / values.length * 100),
  '60-79': round(values.filter((value) => value >= 60 && value <= 79).length / values.length * 100),
  '80-100': round(values.filter((value) => value >= 80).length / values.length * 100),
})

export const summarizeSimulation = (
  results: readonly SimulationGameResult[],
): SimulationSummary => {
  if (results.length === 0) throw new Error('集計対象のゲーム結果がありません。')
  const cashValues = results.map(({ finalCash }) => finalCash)
  const prizeValues = results.map(({ prizeValue }) => prizeValue)
  const prizeCounts = results.map(({ prizeCount }) => prizeCount)
  const healthValues = results.map(({ finalHealth }) => finalHealth)
  const loveValues = results.map(({ finalLove }) => finalLove)
  const accidentChecks = results.reduce(
    (total, result) => total + result.accidentCheckCount,
    0,
  )
  const averageCardCounts: SimulationSummary['prizes']['averageCardCounts'] = {}
  const averageStopsByNormalSquare: Record<string, number> = {}
  LIFE_CARD_DATA.forEach(({ cardId }) => {
    averageCardCounts[cardId] = round(average(
      results.map(({ cardCounts }) => cardCounts[cardId] ?? 0),
    ), 4)
  })
  const stoppedIds = new Set(results.flatMap(({ normalSquareStops }) => normalSquareStops))
  stoppedIds.forEach((squareId) => {
    const stops = results.reduce(
      (total, result) => total + result.normalSquareStops.filter(
        (stoppedSquare) => stoppedSquare === squareId,
      ).length,
      0,
    )
    if (stops > 0) averageStopsByNormalSquare[squareId] = round(stops / results.length, 4)
  })

  return {
    games: results.length,
    cash: {
      ...summarizeNumbers(cashValues),
      zeroRate: rate(results, ({ finalCash }) => finalCash === 0),
      under3000Rate: rate(results, ({ finalCash }) => finalCash < 3_000),
      between3000And7000Rate: rate(
        results,
        ({ finalCash }) => finalCash >= 3_000 && finalCash <= 7_000,
      ),
      over7000Rate: rate(results, ({ finalCash }) => finalCash > 7_000),
      atLeast10000Rate: rate(results, ({ finalCash }) => finalCash >= 10_000),
    },
    prizes: {
      value: summarizeNumbers(prizeValues),
      count: summarizeNumbers(prizeCounts),
      noneRate: rate(results, ({ prizeCount }) => prizeCount === 0),
      averageCardCounts,
      averageTroubleCount: round(average(results.map(({ troubleCount }) => troubleCount))),
      averageLodgerCount: round(average(results.map(({ lodgerCount }) => lodgerCount))),
      averageEventPrizeCount: round(average(results.map(({ eventPrizeCount }) => eventPrizeCount))),
      averageDrawCardCount: round(average(results.map(({ drawCardCount }) => drawCardCount))),
    },
    statuses: {
      health: summarizeNumbers(healthValues),
      love: summarizeNumbers(loveValues),
      healthBands: summarizeBands(healthValues),
      loveBands: summarizeBands(loveValues),
    },
    progress: {
      averageTurns: round(average(results.map(({ turnCount }) => turnCount))),
      averageEstimatedMinutes: round(average(results.map(({ estimatedMinutes }) => estimatedMinutes))),
      averagePresentStops: round(average(results.map(({ presentStopCount }) => presentStopCount))),
      averageNormalEvents: round(average(results.map(({ normalEventCount }) => normalEventCount))),
      averageGuaranteedCardEvents: round(average(results.map(({ guaranteedCardEventCount }) => guaranteedCardEventCount))),
      accidentLandingRate: round(accidentChecks / results.length * 100),
      averageForcedStops: round(average(results.map(({ forcedStopCount }) => forcedStopCount))),
      averageStopsByNormalSquare,
    },
    economy: {
      averagePointsAtGoal: round(average(results.map(({ pointsAtGoal }) => pointsAtGoal))),
      averageLodgerPointsChange: round(average(results.map(({ lodgerPointsChange }) => lodgerPointsChange))),
      averageTroubleTotal: round(average(results.map(({ troubleTotal }) => troubleTotal))),
      averageNisaResult: round(average(results.map(({ nisaResult }) => nisaResult))),
      averageMedicalInsuranceBenefit: round(average(results.map(({ medicalInsuranceBenefit }) => medicalInsuranceBenefit))),
      averageHealthMultiplier: round(average(results.map(({ healthMultiplier }) => healthMultiplier)), 4),
    },
  }
}

export const compareSimulationGroups = (
  leftLabel: string,
  leftResults: readonly SimulationGameResult[],
  rightLabel: string,
  rightResults: readonly SimulationGameResult[],
): ComparisonSummary => {
  const leftSummary = summarizeSimulation(leftResults)
  const rightSummary = summarizeSimulation(rightResults)
  return {
    leftLabel,
    rightLabel,
    left: {
      games: leftSummary.games,
      cash: leftSummary.cash,
      statuses: leftSummary.statuses,
    },
    right: {
      games: rightSummary.games,
      cash: rightSummary.cash,
      statuses: rightSummary.statuses,
    },
    differenceLeftMinusRight: {
      cashAverage: round(leftSummary.cash.average - rightSummary.cash.average),
      healthAverage: round(leftSummary.statuses.health.average - rightSummary.statuses.health.average),
      loveAverage: round(leftSummary.statuses.love.average - rightSummary.statuses.love.average),
    },
  }
}
