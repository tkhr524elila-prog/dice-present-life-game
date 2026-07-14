import type { JobType, RomanceType } from '../data/lifeChoiceData'
import { simulateSingleGame } from './simulateSingleGame'
import {
  compareSimulationGroups,
  summarizeSimulation,
} from './simulationReport'
import type {
  SimulationChoices,
  SimulationGameResult,
  SimulationPattern,
} from './simulationTypes'

const SEED = 20_260_714
const GAMES_PER_FIXED_PATTERN = 1_000
const RANDOM_GAMES = 10_000

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4_294_967_296
  }
}

const jobs: readonly JobType[] = ['foreign-insurance', 'local-agency']
const romances: readonly RomanceType[] = ['playboy', 'serious']
const booleans = [true, false] as const

const choiceKey = (choices: SimulationChoices) => [
  choices.jobType,
  choices.romanceType,
  choices.hasNisa,
  choices.hasMedicalInsurance,
  choices.isCarInsuranceActive,
].join('|')

const majorPatterns: Record<string, SimulationChoices> = {
  A: {
    jobType: 'foreign-insurance', romanceType: 'playboy', hasNisa: true,
    hasMedicalInsurance: true, isCarInsuranceActive: true,
  },
  B: {
    jobType: 'foreign-insurance', romanceType: 'serious', hasNisa: false,
    hasMedicalInsurance: false, isCarInsuranceActive: false,
  },
  C: {
    jobType: 'local-agency', romanceType: 'playboy', hasNisa: true,
    hasMedicalInsurance: false, isCarInsuranceActive: false,
  },
  D: {
    jobType: 'local-agency', romanceType: 'serious', hasNisa: true,
    hasMedicalInsurance: true, isCarInsuranceActive: true,
  },
}

const majorIdsByKey = new Map(
  Object.entries(majorPatterns).map(([id, choices]) => [choiceKey(choices), id]),
)

const fixedPatterns: SimulationPattern[] = []
let generatedPatternNumber = 1
jobs.forEach((jobType) => {
  romances.forEach((romanceType) => {
    booleans.forEach((hasNisa) => {
      booleans.forEach((hasMedicalInsurance) => {
        booleans.forEach((isCarInsuranceActive) => {
          const choices: SimulationChoices = {
            jobType,
            romanceType,
            hasNisa,
            hasMedicalInsurance,
            isCarInsuranceActive,
          }
          fixedPatterns.push({
            id: majorIdsByKey.get(choiceKey(choices)) ?? `F${generatedPatternNumber}`,
            choices,
          })
          generatedPatternNumber += 1
        })
      })
    })
  })
})

const random = createSeededRandom(SEED)
const fixedResults: SimulationGameResult[] = []
fixedPatterns.forEach((pattern) => {
  for (let game = 0; game < GAMES_PER_FIXED_PATTERN; game += 1) {
    fixedResults.push(simulateSingleGame(pattern, random))
  }
})

const randomPattern: SimulationPattern = { id: 'RANDOM', choices: 'random' }
const randomResults = Array.from(
  { length: RANDOM_GAMES },
  () => simulateSingleGame(randomPattern, random),
)

const byChoice = (
  predicate: (choices: SimulationChoices) => boolean,
) => fixedResults.filter(({ choices }) => predicate(choices))

const comparisons = {
  job: compareSimulationGroups(
    '外資系保険会社',
    byChoice(({ jobType }) => jobType === 'foreign-insurance'),
    '地元の保険代理店',
    byChoice(({ jobType }) => jobType === 'local-agency'),
  ),
  romance: compareSimulationGroups(
    '遊び人',
    byChoice(({ romanceType }) => romanceType === 'playboy'),
    '真面目な恋愛',
    byChoice(({ romanceType }) => romanceType === 'serious'),
  ),
  nisa: compareSimulationGroups(
    'NISAあり',
    byChoice(({ hasNisa }) => hasNisa),
    'NISAなし',
    byChoice(({ hasNisa }) => !hasNisa),
  ),
  medicalInsurance: compareSimulationGroups(
    '医療保険あり',
    byChoice(({ hasMedicalInsurance }) => hasMedicalInsurance),
    '医療保険なし',
    byChoice(({ hasMedicalInsurance }) => !hasMedicalInsurance),
  ),
  carInsurance: compareSimulationGroups(
    '自動車保険更新',
    byChoice(({ isCarInsuranceActive }) => isCarInsuranceActive),
    '自動車保険未更新',
    byChoice(({ isCarInsuranceActive }) => !isCarInsuranceActive),
  ),
}

const majorPatternResults = Object.fromEntries(
  Object.keys(majorPatterns).map((id) => [
    id,
    summarizeSimulation(fixedResults.filter(({ patternId }) => patternId === id)),
  ]),
)

console.log(JSON.stringify({
  seed: SEED,
  fixedPatternCount: fixedPatterns.length,
  gamesPerFixedPattern: GAMES_PER_FIXED_PATTERN,
  fixedGames: fixedResults.length,
  randomGames: randomResults.length,
  totalGames: fixedResults.length + randomResults.length,
  overall: summarizeSimulation(fixedResults),
  randomSelection: summarizeSimulation(randomResults),
  majorPatterns: majorPatternResults,
  comparisons,
}, null, 2))
