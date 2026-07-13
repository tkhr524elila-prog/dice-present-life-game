import type { DiceValue } from '../three/createPrototypeDice'
import type { PrototypeTurnPhase } from '../game/createPrototypeGameFlow'

type DiceControls = {
  element: HTMLElement
  setPhase: (phase: PrototypeTurnPhase) => void
  setResult: (value: DiceValue) => void
  setCurrentSquare: (squareNumber: number) => void
  setCurrentSquareType: (squareType: string) => void
  setCurrentChapter: (chapterNumber: number, chapterTitle: string) => void
  dispose: () => void
}

export const createDiceControls = (
  onRoll: () => Promise<void>,
): DiceControls => {
  const element = document.createElement('aside')
  element.className = 'dice-controls'
  element.setAttribute('aria-label', 'サイコロ操作')
  element.innerHTML = `
    <p class="current-position" aria-live="polite">現在位置：マス1</p>
    <p class="current-square-type" aria-live="polite">マスの種類：通常イベント</p>
    <p class="current-chapter" aria-live="polite">現在の章：第1章「青春の草原」</p>
    <p class="dice-result" aria-live="polite">出目：－</p>
    <button class="dice-roll-button" type="button">サイコロを振る</button>
    <div class="board-legend" aria-label="マスの色の説明">
      <span><i class="legend-color legend-color--positive"></i>良い効果</span>
      <span><i class="legend-color legend-color--negative"></i>悪い効果</span>
      <span><i class="legend-color legend-color--mixed"></i>複合効果</span>
      <span><i class="legend-color legend-color--gift"></i>プレゼント抽選</span>
      <span><i class="legend-color legend-color--stop"></i>強制ストップ</span>
      <span><i class="legend-border"></i>外枠＝章</span>
    </div>
  `

  const result = element.querySelector<HTMLElement>('.dice-result')!
  const currentPosition = element.querySelector<HTMLElement>('.current-position')!
  const currentChapter = element.querySelector<HTMLElement>('.current-chapter')!
  const currentSquareType = element.querySelector<HTMLElement>(
    '.current-square-type',
  )!
  const button = element.querySelector<HTMLButtonElement>('.dice-roll-button')!

  const buttonLabels: Record<PrototypeTurnPhase, string> = {
    ready: 'サイコロを振る',
    rolling: 'サイコロ回転中…',
    moving: '移動中…',
    chapter: '章タイトル表示中…',
    event: 'イベント確認中…',
    present: 'プレゼント抽選中…',
    inventory: 'カード確認中…',
    history: '人生ノート確認中…',
    finished: 'ゴール到着',
  }

  const handleRoll = () => {
    void onRoll()
  }

  button.addEventListener('click', handleRoll)

  return {
    element,
    setPhase: (phase) => {
      button.textContent = buttonLabels[phase]
      button.disabled = phase !== 'ready'
    },
    setResult: (value) => {
      result.textContent = `出目：${value}`
    },
    setCurrentSquare: (squareNumber) => {
      currentPosition.textContent = `現在位置：マス${squareNumber}`
    },
    setCurrentSquareType: (squareType) => {
      currentSquareType.textContent = `マスの種類：${squareType}`
    },
    setCurrentChapter: (chapterNumber, chapterTitle) => {
      currentChapter.textContent = `現在の章：第${chapterNumber}章「${chapterTitle}」`
    },
    dispose: () => {
      button.removeEventListener('click', handleRoll)
      element.remove()
    },
  }
}
