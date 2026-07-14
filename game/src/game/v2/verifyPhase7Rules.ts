import { getLifeChoiceV2 } from '../../data/v2/lifeChoiceDataV2'
import { getBoardSquareV2 } from '../../data/v2/boardDataV2'
import { createGameStateStore } from '../gameState'
import { resolveEventV2 } from './applyEventV2'

export const verifyPhase7Rules = () => {
  const store = createGameStateStore()
  const foreignJob = getLifeChoiceV2(21)?.options[0]
  if (!foreignJob) throw new Error('Phase 7の職業選択データがありません。')

  // 確認画面で「いいえ」の間はcompleteLifeChoiceを呼ばないため、状態は変わらない。
  const beforeConfirmation = store.getState()
  if (
    beforeConfirmation.points !== 1_000 ||
    beforeConfirmation.processedForcedStops.size !== 0
  ) {
    throw new Error('選択確認前に効果が反映されています。')
  }

  const firstConfirmation = store.completeLifeChoice(21, foreignJob)
  const duplicateConfirmation = store.completeLifeChoice(21, foreignJob)
  if (
    !firstConfirmation.didApply ||
    duplicateConfirmation.didApply ||
    store.getState().points !== 3_500
  ) {
    throw new Error('選択確認後の1回反映・二重反映防止に失敗しました。')
  }

  const cardEvent = getBoardSquareV2('011')
  if (!cardEvent) throw new Error('確定カードイベントがありません。')
  const resolvedCardEvent = resolveEventV2(cardEvent, null, false)
  if (
    resolvedCardEvent.guaranteedCardId !== 'PRIZE_MCDONALDS' ||
    resolvedCardEvent.display.point !== 0
  ) {
    throw new Error('確定カードイベントでカード相当額が二重減算されています。')
  }

  const lodgerEvent = getBoardSquareV2('079')
  if (
    lodgerEvent?.guaranteedCardId !== 'SPECIAL_LODGER' ||
    !lodgerEvent.characters.includes('ひろむ') ||
    lodgerEvent.characters.includes('居候')
  ) {
    throw new Error('ひろむと居候の人物関係が正しくありません。')
  }
}
