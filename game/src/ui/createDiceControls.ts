import type { DiceValue } from '../three/createPrototypeDice'
import type { PrototypeTurnPhase } from '../game/createPrototypeGameFlow'

type DiceControls = {
  element: HTMLElement
  setPhase: (phase: PrototypeTurnPhase) => void
  setResult: (value: DiceValue) => void
  setCurrentSquare: (squareNumber: number) => void
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
    <p class="dice-result" aria-live="polite">出目：－</p>
    <button class="dice-roll-button" type="button">サイコロを振る</button>
  `

  const result = element.querySelector<HTMLElement>('.dice-result')!
  const currentPosition = element.querySelector<HTMLElement>('.current-position')!
  const button = element.querySelector<HTMLButtonElement>('.dice-roll-button')!

  const buttonLabels: Record<PrototypeTurnPhase, string> = {
    ready: 'サイコロを振る',
    rolling: 'サイコロ回転中…',
    moving: '移動中…',
    event: 'イベント確認中…',
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
    dispose: () => {
      button.removeEventListener('click', handleRoll)
      element.remove()
    },
  }
}
