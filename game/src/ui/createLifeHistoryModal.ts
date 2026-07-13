import { CHAPTERS } from '../data/boardData'
import { getLifeCardById } from '../data/lifeCardData'
import type {
  LifeHistoryEntry,
  LifeHistoryType,
} from '../game/addLifeHistory'
import type { PrototypeTurnPhase } from '../game/createPrototypeGameFlow'
import type { GameStateStore } from '../game/gameState'

type LifeHistoryModal = {
  element: HTMLElement
  setPhase: (phase: PrototypeTurnPhase) => void
  dispose: () => void
}

const TYPE_LABELS: Record<LifeHistoryType, string> = {
  'normal-event': '通常イベント',
  'present-draw': 'プレゼント・カード',
  'card-acquired': 'カード獲得',
  'forced-stop': '人生の節目',
  'chapter-start': '章の始まり',
  goal: 'ゴール',
}

const formatChange = (value: number) => {
  if (value > 0) return `＋${value.toLocaleString('ja-JP')}`
  if (value < 0) return `－${Math.abs(value).toLocaleString('ja-JP')}`
  return '変化なし'
}

const getChangeClass = (value: number) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const createHistoryItem = (entry: Readonly<LifeHistoryEntry>) => {
  const chapter = CHAPTERS.find(({ id }) => id === entry.chapter)
  const item = document.createElement('article')
  item.className = `life-history-item life-history-item--${entry.type}`
  item.style.setProperty('--chapter-color', chapter?.borderColor ?? '#8a8499')

  const header = document.createElement('div')
  header.className = 'life-history-item-header'
  header.innerHTML = `
    <span class="life-history-order">記録 ${entry.order}</span>
    <span class="life-history-type"></span>
  `
  header.querySelector<HTMLElement>('.life-history-type')!.textContent =
    TYPE_LABELS[entry.type]

  const location = document.createElement('p')
  location.className = 'life-history-location'
  location.textContent = `第${entry.chapter}章 ${chapter?.title ?? ''}　マス${entry.squareId}`

  const title = document.createElement('h3')
  title.textContent = entry.title

  const description = document.createElement('p')
  description.className = 'life-history-description'
  description.textContent = entry.description

  item.append(header, location, title, description)

  if (entry.cardId) {
    const card = getLifeCardById(entry.cardId)
    const cardResult = document.createElement('div')
    cardResult.className = 'life-history-card-result'
    cardResult.innerHTML = `
      <span class="life-history-card-icon" aria-hidden="true"></span>
      <div>
        <strong class="life-history-card-name"></strong>
        <p class="life-history-card-love"></p>
      </div>
    `
    cardResult.querySelector<HTMLElement>('.life-history-card-icon')!
      .textContent = card.icon
    cardResult.querySelector<HTMLElement>('.life-history-card-name')!
      .textContent = `${card.name}を獲得`
    cardResult.querySelector<HTMLElement>('.life-history-card-love')!
      .textContent = `獲得時の愛情：${entry.loveAtOccurrence ?? '－'}`
    item.appendChild(cardResult)
  }

  const changes = document.createElement('dl')
  changes.className = 'life-history-changes'
  ;(
    [
      ['ポイント', entry.pointsChange],
      ['健康', entry.healthChange],
      ['愛情', entry.loveChange],
    ] as const
  ).forEach(([label, value]) => {
    const change = document.createElement('div')
    change.className = `life-history-change life-history-change--${getChangeClass(value)}`
    const term = document.createElement('dt')
    term.textContent = label
    const detail = document.createElement('dd')
    detail.textContent = formatChange(value)
    change.append(term, detail)
    changes.appendChild(change)
  })
  item.appendChild(changes)

  return item
}

export const createLifeHistoryModal = (
  gameState: GameStateStore,
  onOpenChange: (isOpen: boolean) => void,
): LifeHistoryModal => {
  const element = document.createElement('div')
  element.className = 'life-history'
  element.innerHTML = `
    <button class="life-history-button" type="button">人生ノート</button>
    <div class="life-history-modal" role="dialog" aria-modal="true" aria-labelledby="life-history-title" hidden>
      <section class="life-history-panel">
        <header class="life-history-panel-header">
          <div>
            <p class="life-history-label">これまでの歩み</p>
            <h2 id="life-history-title">人生ノート</h2>
          </div>
          <button class="life-history-close" type="button" aria-label="人生ノートを閉じる">閉じる</button>
        </header>
        <div class="life-history-list"></div>
      </section>
    </div>
  `

  const openButton = element.querySelector<HTMLButtonElement>(
    '.life-history-button',
  )!
  const modal = element.querySelector<HTMLElement>('.life-history-modal')!
  const list = element.querySelector<HTMLElement>('.life-history-list')!
  const closeButton = element.querySelector<HTMLButtonElement>(
    '.life-history-close',
  )!
  let currentPhase: PrototypeTurnPhase = 'ready'
  let isOpen = false

  const render = () => {
    const history = gameState.getState().lifeHistory
    list.replaceChildren()

    if (history.length === 0) {
      const emptyMessage = document.createElement('p')
      emptyMessage.className = 'life-history-empty'
      emptyMessage.textContent = 'まだ人生の記録がありません'
      list.appendChild(emptyMessage)
      return
    }

    history
      .slice()
      .sort((first, second) => first.order - second.order)
      .forEach((entry) => list.appendChild(createHistoryItem(entry)))
  }

  const open = () => {
    if ((currentPhase !== 'ready' && currentPhase !== 'finished') || isOpen) {
      return
    }
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
      openButton.disabled = phase !== 'ready' && phase !== 'finished'
    },
    dispose: () => {
      openButton.removeEventListener('click', open)
      closeButton.removeEventListener('click', close)
      unsubscribe()
      element.remove()
    },
  }
}
