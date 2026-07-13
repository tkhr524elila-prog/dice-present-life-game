import type { DiceValue } from '../three/createPrototypeDice'

type DiceControls = {
  element: HTMLElement
  dispose: () => void
}

export const createDiceControls = (
  rollDice: () => Promise<DiceValue>,
): DiceControls => {
  const element = document.createElement('aside')
  element.className = 'dice-controls'
  element.setAttribute('aria-label', 'サイコロ操作')
  element.innerHTML = `
    <p class="dice-result" aria-live="polite">出目：－</p>
    <button class="dice-roll-button" type="button">サイコロを振る</button>
  `

  const result = element.querySelector<HTMLElement>('.dice-result')!
  const button = element.querySelector<HTMLButtonElement>('.dice-roll-button')!
  let disposed = false

  const handleRoll = async () => {
    button.disabled = true
    button.textContent = 'サイコロ回転中…'

    const value = await rollDice()
    if (disposed) return

    result.textContent = `出目：${value}`
    button.textContent = 'サイコロを振る'
    button.disabled = false
  }

  button.addEventListener('click', handleRoll)

  return {
    element,
    dispose: () => {
      disposed = true
      button.removeEventListener('click', handleRoll)
      element.remove()
    },
  }
}
