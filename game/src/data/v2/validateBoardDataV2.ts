import { LIFE_CARD_DATA } from '../lifeCardData'
import { BOARD_SQUARES_V2 } from './boardDataV2'
import type { BoardDataValidationResultV2 } from './boardTypesV2'

const expect = (condition: boolean, message: string) => {
  if (!condition) throw new Error(`[100マスデータ検証] ${message}`)
}

export const validateBoardDataV2 = (): BoardDataValidationResultV2 => {
  const commonSquares = BOARD_SQUARES_V2.filter(({ route }) => route === 'common')
  const playboySquares = BOARD_SQUARES_V2.filter(({ route }) => route === 'playboy')
  const pureLoveSquares = BOARD_SQUARES_V2.filter(({ route }) => route === 'pure-love')
  const physicalIds = new Set(BOARD_SQUARES_V2.map(({ physicalId }) => physicalId))
  const eventIds = new Set(BOARD_SQUARES_V2.map(({ eventId }) => eventId))
  const progressValues = new Set(BOARD_SQUARES_V2.map(({ progress }) => progress))
  const cardIds = new Set(LIFE_CARD_DATA.map(({ cardId }) => cardId))

  expect(BOARD_SQUARES_V2.length === 120, '物理マス総数が120ではありません。')
  expect(commonSquares.length === 80, '共通マス数が80ではありません。')
  expect(playboySquares.length === 20, 'Aルートが20マスではありません。')
  expect(pureLoveSquares.length === 20, 'Bルートが20マスではありません。')
  expect(physicalIds.size === 120, 'physicalIdが重複しています。')
  expect(eventIds.size === 120, 'eventIdが重複しています。')
  expect(progressValues.size === 100, '進行度1～100に欠落があります。')

  for (let progress = 1; progress <= 100; progress += 1) {
    expect(progressValues.has(progress), `進行度${progress}がありません。`)
    const squares = BOARD_SQUARES_V2.filter((square) => square.progress === progress)
    expect(
      progress >= 41 && progress <= 60
        ? squares.length === 2 && squares.every(({ route }) => route !== 'common')
        : squares.length === 1 && squares[0]?.route === 'common',
      `進行度${progress}のルート構成が正しくありません。`,
    )
  }

  const square40 = physicalIds.has('040')
    ? BOARD_SQUARES_V2.find(({ physicalId }) => physicalId === '040')
    : undefined
  expect(
    square40?.nextPhysicalIds.join(',') === '041-A,041-B',
    'マス40が41-Aと41-Bへ分岐していません。',
  )
  expect(
    BOARD_SQUARES_V2.find(({ physicalId }) => physicalId === '060-A')?.nextPhysicalIds[0] === '061' &&
      BOARD_SQUARES_V2.find(({ physicalId }) => physicalId === '060-B')?.nextPhysicalIds[0] === '061',
    '60-Aまたは60-Bが61へ合流していません。',
  )

  BOARD_SQUARES_V2.forEach((square) => {
    square.nextPhysicalIds.forEach((nextId) => {
      expect(physicalIds.has(nextId), `${square.physicalId}の接続先${nextId}が存在しません。`)
    })
    if (square.guaranteedCardId) {
      expect(cardIds.has(square.guaranteedCardId), `${square.physicalId}の確定カードIDが存在しません。`)
    }
    square.conditionalOutcomes.forEach(({ guaranteedCardId }) => {
      if (guaranteedCardId) {
        expect(cardIds.has(guaranteedCardId), `${square.physicalId}の条件付きカードIDが存在しません。`)
      }
    })
  })

  playboySquares.forEach((square) => {
    expect(
      square.nextPhysicalIds.every((id) => id.endsWith('-A') || id === '061'),
      `${square.physicalId}からBルートへ混線しています。`,
    )
  })
  pureLoveSquares.forEach((square) => {
    expect(
      square.nextPhysicalIds.every((id) => id.endsWith('-B') || id === '061'),
      `${square.physicalId}からAルートへ混線しています。`,
    )
  })

  const presentSquares = BOARD_SQUARES_V2.filter(
    ({ squareType }) => squareType === 'present-draw',
  )
  const logicalPresentProgress = new Set(presentSquares.map(({ progress }) => progress))
  expect(logicalPresentProgress.size === 20, 'プレゼント抽選の論理数が20ではありません。')
  expect(presentSquares.length === 22, 'プレゼント抽選の物理数が22ではありません。')

  const goals = BOARD_SQUARES_V2.filter(({ squareType }) => squareType === 'goal')
  expect(goals.length === 1 && goals[0]?.progress === 100, 'ゴールが進行度100に1つだけ存在しません。')

  const forcedStops = BOARD_SQUARES_V2.filter(
    ({ squareType }) => squareType === 'forced-stop',
  )
  expect(forcedStops.length === 6, '強制ストップが6か所ではありません。')
  expect(new Set(forcedStops.map(({ forcedStopType }) => forcedStopType)).size === 6, '強制ストップ種別が重複しています。')

  const characters = new Set(BOARD_SQUARES_V2.flatMap(({ characters }) => characters))
  ;['ひろむ', 'れいな', '田中さん', '平さん', '菊田さん', 'かな', 'いと'].forEach((name) => {
    expect(characters.has(name), `人物「${name}」がイベントデータに存在しません。`)
  })
  expect(!characters.has('居候'), 'ひろむと居候が別人物として定義されています。')
  expect(
    BOARD_SQUARES_V2.find(({ guaranteedCardId }) => guaranteedCardId === 'SPECIAL_LODGER')?.characters.includes('ひろむ') === true,
    '居候カードの人物がひろむになっていません。',
  )

  return {
    physicalSquareCount: BOARD_SQUARES_V2.length,
    commonSquareCount: commonSquares.length,
    playboySquareCount: playboySquares.length,
    pureLoveSquareCount: pureLoveSquares.length,
    logicalProgressCount: progressValues.size,
    logicalPresentDrawCount: logicalPresentProgress.size,
    physicalPresentDrawCount: presentSquares.length,
    forcedStopCount: forcedStops.length,
    directGuaranteedCardEventCount: BOARD_SQUARES_V2.filter(({ guaranteedCardId }) => guaranteedCardId !== null).length,
    conditionalGuaranteedCardEventCount: BOARD_SQUARES_V2.filter(({ conditionalOutcomes }) => conditionalOutcomes.some(({ guaranteedCardId }) => guaranteedCardId !== null)).length,
  }
}
