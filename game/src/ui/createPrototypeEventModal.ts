import type { NormalEventData } from '../data/normalEventData'

export type DisplayEventData = NormalEventData & {
  jobModifierApplied?: boolean
  outcomeLabel?: string
  acquiredCardName?: string
}

type PrototypeEventModal = {
  element: HTMLElement
  show: (event: DisplayEventData) => Promise<void>
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
      <p class="prototype-event-outcome" hidden></p>
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
      <p class="prototype-event-card-notice" hidden></p>
      <p class="prototype-event-modifier" hidden>職業補正適用</p>
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
  const outcome = element.querySelector<HTMLElement>(
    '.prototype-event-outcome',
  )!
  const cardNotice = element.querySelector<HTMLElement>(
    '.prototype-event-card-notice',
  )!
  const modifier = element.querySelector<HTMLElement>(
    '.prototype-event-modifier',
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

  const show = (event: DisplayEventData) => {
    if (pendingPromise) return pendingPromise

    label.textContent = `第${event.chapter}章・${event.category}`
    title.textContent = event.title
    description.textContent = event.description
    outcome.textContent = event.outcomeLabel ?? ''
    outcome.hidden = !event.outcomeLabel
    cardNotice.textContent = event.acquiredCardName
      ? `${event.acquiredCardName}カードを獲得`
      : ''
    cardNotice.hidden = !event.acquiredCardName
    modifier.hidden = !event.jobModifierApplied

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
