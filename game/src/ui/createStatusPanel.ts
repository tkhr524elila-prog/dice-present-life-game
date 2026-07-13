import type {
  GameStateChange,
  GameStateStore,
} from '../game/gameState'
import type { StatusValues } from '../game/applyStatusChanges'

type StatusKey = keyof StatusValues

type StatusPanel = {
  element: HTMLElement
  dispose: () => void
}

const STATUS_DETAILS: Record<
  StatusKey,
  { icon: string; label: string }
> = {
  points: { icon: '💰', label: 'ポイント' },
  health: { icon: '💪', label: '健康' },
  love: { icon: '❤️', label: '愛情' },
}

const formatValue = (key: StatusKey, value: number) =>
  key === 'points' ? value.toLocaleString('ja-JP') : String(value)

export const createStatusPanel = (
  gameState: GameStateStore,
): StatusPanel => {
  const element = document.createElement('aside')
  element.className = 'status-panel'
  element.setAttribute('aria-label', '現在のステータス')

  const valueElements = new Map<StatusKey, HTMLElement>()
  const itemElements = new Map<StatusKey, HTMLElement>()
  const animationTimers = new Set<number>()

  ;(['points', 'health', 'love'] as const).forEach((key) => {
    const details = STATUS_DETAILS[key]
    const item = document.createElement('div')
    item.className = 'status-item'
    item.dataset.status = key
    item.innerHTML = `
      <span class="status-icon" aria-hidden="true">${details.icon}</span>
      <span class="status-label">${details.label}</span>
      <strong class="status-value">0</strong>
    `
    element.appendChild(item)
    itemElements.set(key, item)
    valueElements.set(key, item.querySelector<HTMLElement>('.status-value')!)
  })

  const showChange = (key: StatusKey, amount: number) => {
    if (amount === 0) return

    const item = itemElements.get(key)!
    const change = document.createElement('span')
    const direction = amount > 0 ? 'positive' : 'negative'
    change.className = `status-change status-change--${direction}`
    change.textContent = `${amount > 0 ? '+' : ''}${amount.toLocaleString('ja-JP')}`
    item.appendChild(change)

    item.classList.remove('status-item--positive', 'status-item--negative')
    void item.offsetWidth
    item.classList.add(`status-item--${direction}`)

    const timer = window.setTimeout(() => {
      change.remove()
      item.classList.remove(`status-item--${direction}`)
      animationTimers.delete(timer)
    }, 1_100)
    animationTimers.add(timer)
  }

  const render = ({ state, statusChanges }: GameStateChange) => {
    ;(['points', 'health', 'love'] as const).forEach((key) => {
      valueElements.get(key)!.textContent = formatValue(key, state[key])
      showChange(key, statusChanges?.[key] ?? 0)
    })
  }

  const unsubscribe = gameState.subscribe(render)

  return {
    element,
    dispose: () => {
      unsubscribe()
      animationTimers.forEach((timer) => window.clearTimeout(timer))
      element.remove()
    },
  }
}
