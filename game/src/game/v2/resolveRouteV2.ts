import { getBoardSquareV2 } from '../../data/v2/boardDataV2'

export type SelectedRouteV2 = 'playboy' | 'pure-love'

export const resolveNextPhysicalIdV2 = (
  physicalId: string,
  selectedRoute: SelectedRouteV2 | null,
) => {
  const square = getBoardSquareV2(physicalId)
  if (!square || square.nextPhysicalIds.length === 0) return undefined
  if (square.progress !== 40) return square.nextPhysicalIds[0]
  if (!selectedRoute) return undefined
  return selectedRoute === 'playboy' ? '041-A' : '041-B'
}

export const createMovementPathV2 = (
  startPhysicalId: string,
  diceValue: number,
  selectedRoute: SelectedRouteV2 | null,
  processedForcedStops: ReadonlySet<number>,
) => {
  const path: string[] = []
  let currentId = startPhysicalId
  for (let step = 0; step < diceValue; step += 1) {
    const nextId = resolveNextPhysicalIdV2(currentId, selectedRoute)
    if (!nextId) break
    path.push(nextId)
    currentId = nextId
    const square = getBoardSquareV2(nextId)!
    if (
      square.squareType === 'goal' ||
      (square.squareType === 'forced-stop' && !processedForcedStops.has(square.progress))
    ) break
  }
  return path
}

export const verifyRouteRulesV2 = () => {
  const playboy = createMovementPathV2('040', 25, 'playboy', new Set([63]))
  const pureLove = createMovementPathV2('040', 25, 'pure-love', new Set([63]))
  if (
    playboy[0] !== '041-A' ||
    !playboy.includes('060-A') ||
    playboy[20] !== '061' ||
    playboy.some((id) => id.endsWith('-B')) ||
    pureLove[0] !== '041-B' ||
    !pureLove.includes('060-B') ||
    pureLove[20] !== '061' ||
    pureLove.some((id) => id.endsWith('-A'))
  ) {
    throw new Error('A/Bルートの分岐または61への合流が正しくありません。')
  }
  const goalPath = createMovementPathV2('098', 6, 'pure-love', new Set())
  if (goalPath.join(',') !== '099,100') {
    throw new Error('進行度100で停止する処理が正しくありません。')
  }
}
