import {
  getLifeCardById,
  type LifeCardId,
} from '../data/lifeCardData'
import type { PrototypeTurnPhase } from '../game/createPrototypeGameFlow'
import type { GameStateStore } from '../game/gameState'

type LifeCardInventory = {
  element: HTMLElement
  setPhase: (phase: PrototypeTurnPhase) => void
  dispose: () => void
}

export const createLifeCardInventory = (
  gameState: GameStateStore,
  onOpenChange: (isOpen: boolean) => void,
): LifeCardInventory => {
  const element = document.createElement('div')
  element.className = 'life-card-inventory'
  element.innerHTML = `
    <button class="life-card-inventory-button" type="button">
      ライフカード
      <span class="life-card-count" aria-label="所持0枚">0</span>
    </button>
    <div class="life-card-inventory-modal" role="dialog" aria-modal="true" aria-labelledby="life-card-inventory-title" hidden>
      <section class="life-card-inventory-panel">
        <p class="life-card-inventory-label">所持カード</p>
        <h2 id="life-card-inventory-title">ライフカード</h2>
        <div class="life-card-inventory-list"></div>
        <button class="life-card-inventory-close" type="button">閉じる</button>
      </section>
    </div>
  `

  const openButton = element.querySelector<HTMLButtonElement>(
    '.life-card-inventory-button',
  )!
  const count = element.querySelector<HTMLElement>('.life-card-count')!
  const modal = element.querySelector<HTMLElement>('.life-card-inventory-modal')!
  const list = element.querySelector<HTMLElement>('.life-card-inventory-list')!
  const closeButton = element.querySelector<HTMLButtonElement>(
    '.life-card-inventory-close',
  )!
  let currentPhase: PrototypeTurnPhase = 'ready'
  let isOpen = false

  const render = () => {
    const ownedCards = gameState.getState().ownedLifeCards
    count.textContent = String(ownedCards.length)
    count.setAttribute('aria-label', `所持${ownedCards.length}枚`)
    list.replaceChildren()

    if (ownedCards.length === 0) {
      const emptyMessage = document.createElement('p')
      emptyMessage.className = 'life-card-inventory-empty'
      emptyMessage.textContent = 'まだライフカードを持っていません'
      list.appendChild(emptyMessage)
      return
    }

    const quantities = new Map<LifeCardId, number>()
    ownedCards.forEach(({ cardId }) => {
      quantities.set(cardId, (quantities.get(cardId) ?? 0) + 1)
    })

    quantities.forEach((quantity, cardId) => {
      const card = getLifeCardById(cardId)
      const acquiredSquares = ownedCards
        .filter((ownedCard) => ownedCard.cardId === cardId)
        .map(({ acquiredAtSquare }) => `マス${acquiredAtSquare}`)
        .join('、')
      const item = document.createElement('article')
      item.className = `life-card-inventory-item life-card-inventory-item--${card.type}`
      item.innerHTML = `
        <span class="life-card-inventory-icon" aria-hidden="true">${card.icon}</span>
        <div>
          <p class="life-card-inventory-type">${card.typeLabel}</p>
          <h3>${card.name} <span>×${quantity}</span></h3>
          <p class="life-card-inventory-description"></p>
          <p class="life-card-inventory-location"></p>
        </div>
      `
      item.querySelector<HTMLElement>('.life-card-inventory-description')!
        .textContent = card.description
      item.querySelector<HTMLElement>('.life-card-inventory-location')!
        .textContent = `取得：${acquiredSquares}`
      list.appendChild(item)
    })
  }

  const open = () => {
    if (currentPhase !== 'ready' || isOpen) return
    isOpen = true
    render()
    modal.hidden = false
    onOpenChange(true)
    closeButton.focus()
  }

  const close = () => {
    if (!isOpen) return
    isOpen = false
    modal.hidden = true
    onOpenChange(false)
    openButton.focus()
  }

  openButton.addEventListener('click', open)
  closeButton.addEventListener('click', close)
  const unsubscribe = gameState.subscribe(render)

  return {
    element,
    setPhase: (phase) => {
      currentPhase = phase
      openButton.disabled = phase !== 'ready'
    },
    dispose: () => {
      openButton.removeEventListener('click', open)
      closeButton.removeEventListener('click', close)
      unsubscribe()
      element.remove()
    },
  }
}
