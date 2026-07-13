type PrototypeEventModal = {
  element: HTMLElement
  show: () => Promise<void>
  dispose: () => void
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
      <p class="prototype-event-label">仮イベント</p>
      <h2 id="prototype-event-title">${UNIVERSITY_ENTRANCE_EVENT.title}</h2>
      <p class="prototype-event-text">${UNIVERSITY_ENTRANCE_EVENT.text}</p>
      <dl class="prototype-event-changes" aria-label="変動内容">
        <div class="prototype-event-change prototype-event-change--positive">
          <dt>ポイント</dt>
          <dd>＋100</dd>
        </div>
        <div class="prototype-event-change prototype-event-change--neutral">
          <dt>健康</dt>
          <dd>変化なし</dd>
        </div>
        <div class="prototype-event-change prototype-event-change--positive">
          <dt>愛情</dt>
          <dd>＋5</dd>
        </div>
      </dl>
      <p class="prototype-event-note">「次へ」を押すとステータスへ反映されます。</p>
      <button class="prototype-event-next" type="button">次へ</button>
    </section>
  `

  const nextButton = element.querySelector<HTMLButtonElement>(
    '.prototype-event-next',
  )!
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

  const show = () => {
    if (pendingPromise) return pendingPromise

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
import { UNIVERSITY_ENTRANCE_EVENT } from '../game/prototypeEvent'
