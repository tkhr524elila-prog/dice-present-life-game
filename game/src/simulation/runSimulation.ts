import type { JobType, RomanceType } from '../data/lifeChoiceData'
import { simulateSingleGame } from './simulateSingleGame'
import { compareSimulationGroups, summarizeSimulation } from './simulationReport'
import type { NisaSlots, SimulationChoices, SimulationGameResult, SimulationPattern } from './simulationTypes'

declare const process: { argv: string[] }

const seedArgument = Number(process.argv.find((value) => value.startsWith('--seed='))?.split('=')[1])
const SEED = Number.isFinite(seedArgument) ? seedArgument : 20_260_714
const GAMES_PER_FIXED_PATTERN = 1_000
const RANDOM_GAMES = 10_000

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5
    return (state >>> 0) / 4_294_967_296
  }
}

const jobs: readonly JobType[] = ['foreign-insurance', 'local-agency']
const romances: readonly RomanceType[] = ['playboy', 'serious']
const nisaSlots: readonly NisaSlots[] = [0, 1, 2]
const flags = [true, false] as const
const patterns: SimulationPattern[] = []
jobs.forEach((jobType) => romances.forEach((romanceType) => nisaSlots.forEach((slots) =>
  flags.forEach((hasMedicalInsurance) => flags.forEach((isCarInsuranceActive) => {
    const choices: SimulationChoices = { jobType, romanceType, nisaSlots: slots, hasMedicalInsurance, isCarInsuranceActive }
    patterns.push({ id: `${jobType}|${romanceType}|N${slots}|M${Number(hasMedicalInsurance)}|C${Number(isCarInsuranceActive)}`, choices })
  })),
)))

const random = createSeededRandom(SEED)
const fixedResults: SimulationGameResult[] = []
patterns.forEach((pattern) => {
  for (let game = 0; game < GAMES_PER_FIXED_PATTERN; game += 1) fixedResults.push(simulateSingleGame(pattern, random))
})
const randomPattern: SimulationPattern = { id: 'RANDOM', choices: 'random' }
const randomResults = Array.from({ length: RANDOM_GAMES }, () => simulateSingleGame(randomPattern, random))
const group = (predicate: (choices: SimulationChoices) => boolean) => fixedResults.filter(({ choices }) => predicate(choices))
const summarizeGroup = (predicate: (choices: SimulationChoices) => boolean) => summarizeSimulation(group(predicate))
const compact = (summary: ReturnType<typeof summarizeSimulation>) => ({
  games: summary.games,
  cash: summary.cash,
  prizes: summary.prizes,
  statuses: summary.statuses,
  progress: {
    averageTurns: summary.progress.averageTurns,
    averageEstimatedMinutes: summary.progress.averageEstimatedMinutes,
    averagePresentStops: summary.progress.averagePresentStops,
    averageNormalEvents: summary.progress.averageNormalEvents,
    averageGuaranteedCardEvents: summary.progress.averageGuaranteedCardEvents,
    accidentLandingRate: summary.progress.accidentLandingRate,
    averageForcedStops: summary.progress.averageForcedStops,
  },
  economy: summary.economy,
})
const groupCompact = (summary: ReturnType<typeof summarizeSimulation>) => ({
  games: summary.games,
  cash: summary.cash,
  prizeValueAverage: summary.prizes.value.average,
  prizeCountAverage: summary.prizes.count.average,
  troubleCountAverage: summary.prizes.averageTroubleCount,
  lodgerCountAverage: summary.prizes.averageLodgerCount,
  healthAverage: summary.statuses.health.average,
  loveAverage: summary.statuses.love.average,
  healthMultiplierAverage: summary.economy.averageHealthMultiplier,
})

console.log(JSON.stringify({
  version: 'Phase 7・100マス版', seed: SEED,
  fixedPatternCount: patterns.length, gamesPerFixedPattern: GAMES_PER_FIXED_PATTERN,
  fixedGames: fixedResults.length, randomGames: randomResults.length,
  totalGames: fixedResults.length + randomResults.length,
  overall: compact(summarizeSimulation(fixedResults)),
  randomSelection: compact(summarizeSimulation(randomResults)),
  routes: {
    playboy: groupCompact(summarizeGroup(({ romanceType }) => romanceType === 'playboy')),
    pureLove: groupCompact(summarizeGroup(({ romanceType }) => romanceType === 'serious')),
  },
  jobs: {
    foreign: groupCompact(summarizeGroup(({ jobType }) => jobType === 'foreign-insurance')),
    local: groupCompact(summarizeGroup(({ jobType }) => jobType === 'local-agency')),
  },
  nisa: {
    zero: groupCompact(summarizeGroup(({ nisaSlots: value }) => value === 0)),
    one: groupCompact(summarizeGroup(({ nisaSlots: value }) => value === 1)),
    two: groupCompact(summarizeGroup(({ nisaSlots: value }) => value === 2)),
  },
  comparisons: {
    job: compareSimulationGroups('外資', group(({ jobType }) => jobType === 'foreign-insurance'), '代理店', group(({ jobType }) => jobType === 'local-agency')),
    romance: compareSimulationGroups('遊び人', group(({ romanceType }) => romanceType === 'playboy'), '純愛', group(({ romanceType }) => romanceType === 'serious')),
    medical: compareSimulationGroups('医療あり', group(({ hasMedicalInsurance }) => hasMedicalInsurance), '医療なし', group(({ hasMedicalInsurance }) => !hasMedicalInsurance)),
    car: compareSimulationGroups('自動車保険更新', group(({ isCarInsuranceActive }) => isCarInsuranceActive), '未更新', group(({ isCarInsuranceActive }) => !isCarInsuranceActive)),
  },
}, null, 2))
