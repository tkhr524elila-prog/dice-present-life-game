import type { NormalEventData } from '../data/normalEventData'

type PrototypeEventModal = {
  element: HTMLElement
  show: (event: NormalEventData) => Promise<void>
  dispose: () => void
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

export const createPrototypeEventModal = (): PrototypeEventModal => {
  const element = document.createElement('div')
  element.className = 'prototype-event-modal'
  element.hidden = true
  element.setAttribute('role', 'dialog')
  element.setAttribute('aria-modal', 'true')
  element.setAttribute('aria-labelledby', 'prototype-event-title')
  element.innerHTML = `
    <section class="prototype-event-card">
      <p class="prototype-event-label">通常イベント</p>
      <h2 id="prototype-event-title"></h2>
      <p class="prototype-event-text"></p>
      <dl class="prototype-event-changes" aria-label="変動内容">
        <div class="prototype-event-change" data-status="point">
          <dt>ポイント</dt>
          <dd></dd>
        </div>
        <div class="prototype-event-change" data-status="health">
          <dt>健康</dt>
          <dd></dd>
        </div>
        <div class="prototype-event-change" data-status="love">
          <dt>愛情</dt>
          <dd></dd>
        </div>
      </dl>
      <p class="prototype-event-note">「次へ」を押すとステータスへ反映されます。</p>
      <button class="prototype-event-next" type="button">次へ</button>
    </section>
  `

  const nextButton = element.querySelector<HTMLButtonElement>(
    '.prototype-event-next',
  )!
  const label = element.querySelector<HTMLElement>('.prototype-event-label')!
  const title = element.querySelector<HTMLElement>('#prototype-event-title')!
  const description = element.querySelector<HTMLElement>(
    '.prototype-event-text',
  )!
  const changeElements = {
    point: element.querySelector<HTMLElement>('[data-status="point"]')!,
    health: element.querySelector<HTMLElement>('[data-status="health"]')!,
    love: element.querySelector<HTMLElement>('[data-status="love"]')!,
  }
  let pendingPromise: Promise<void> | undefined
  let resolvePending: (() => void) | undefined

  const close = () => {
    if (!resolvePending) return

    nextButton.disabled = true
    element.hidden = true
    resolvePending()
    resolvePending = undefined
    pendingPromise = undefined
  }

  const show = (event: NormalEventData) => {
    if (pendingPromise) return pendingPromise

    label.textContent = `第${event.chapter}章・${event.category}`
    title.textContent = event.title
    description.textContent = event.description

    ;(['point', 'health', 'love'] as const).forEach((status) => {
      const changeElement = changeElements[status]
      const value = event[status]
      changeElement.className =
        `prototype-event-change prototype-event-change--${getChangeClass(value)}`
      changeElement.querySelector('dd')!.textContent = formatChange(value)
    })

    element.hidden = false
    nextButton.disabled = false
    nextButton.focus()
    pendingPromise = new Promise<void>((resolve) => {
      resolvePending = resolve
    })
    return pendingPromise
  }

  nextButton.addEventListener('click', close)

  return {
    element,
    show,
    dispose: () => {
      nextButton.removeEventListener('click', close)
      close()
      element.remove()
    },
  }
}
