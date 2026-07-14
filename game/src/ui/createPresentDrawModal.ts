import type { LifeCardData } from '../data/lifeCardData'

type PresentDrawModal = {
  element: HTMLElement
  show: (
    card: LifeCardData,
    isGuaranteed: boolean,
    onReveal: () => void,
  ) => Promise<void>
  dispose: () => void
}

const REVEAL_DELAY = 850

export const createPresentDrawModal = (): PresentDrawModal => {
  const element = document.createElement('div')
  element.className = 'present-draw-modal'
  element.hidden = true
  element.setAttribute('role', 'dialog')
  element.setAttribute('aria-modal', 'true')
  element.setAttribute('aria-labelledby', 'present-draw-title')
  element.innerHTML = `
    <section class="present-draw-panel">
      <div class="present-draw-particles" aria-hidden="true"></div>
      <p class="present-draw-heading">プレゼント抽選</p>
      <h2 id="present-draw-title">ライフカードを抽選中</h2>
      <div class="present-draw-box" aria-hidden="true">
        <span class="present-draw-box-lid"></span>
        <span class="present-draw-box-body">🎁</span>
      </div>
      <p class="present-draw-wait">箱を開けています…</p>
      <article class="present-result-card" hidden>
        <span class="present-result-icon" aria-hidden="true"></span>
        <p class="present-result-type"></p>
        <h3 class="present-result-name"></h3>
        <p class="present-result-description"></p>
        <p class="present-result-guarantee" hidden>最初のプレゼント抽選・確定</p>
      </article>
      <button class="present-result-button" type="button" disabled>受け取る</button>
    </section>
  `

  const title = element.querySelector<HTMLElement>('#present-draw-title')!
  const panel = element.querySelector<HTMLElement>('.present-draw-panel')!
  const particles = element.querySelector<HTMLElement>('.present-draw-particles')!
  particles.replaceChildren(
    ...Array.from({ length: 14 }, (_, index) => {
      const particle = document.createElement('i')
      particle.style.setProperty('--particle-index', String(index))
      return particle
    }),
  )
  const box = element.querySelector<HTMLElement>('.present-draw-box')!
  const waitMessage = element.querySelector<HTMLElement>('.present-draw-wait')!
  const resultCard = element.querySelector<HTMLElement>('.present-result-card')!
  const resultIcon = element.querySelector<HTMLElement>('.present-result-icon')!
  const resultType = element.querySelector<HTMLElement>('.present-result-type')!
  const resultName = element.querySelector<HTMLElement>('.present-result-name')!
  const resultDescription = element.querySelector<HTMLElement>(
    '.present-result-description',
  )!
  const guarantee = element.querySelector<HTMLElement>(
    '.present-result-guarantee',
  )!
  const receiveButton = element.querySelector<HTMLButtonElement>(
    '.present-result-button',
  )!
  let pendingPromise: Promise<void> | undefined
  let resolvePending: (() => void) | undefined
  let revealTimer: number | undefined
  let hasRevealed = false

  const finish = () => {
    if (!resolvePending) return
    element.hidden = true
    receiveButton.disabled = true
    resolvePending()
    resolvePending = undefined
    pendingPromise = undefined
    hasRevealed = false
  }

  const close = () => {
    if (!hasRevealed) return
    finish()
  }

  const show = (
    card: LifeCardData,
    isGuaranteed: boolean,
    onReveal: () => void,
  ) => {
    if (pendingPromise) return pendingPromise

    title.textContent = 'ライフカードを抽選中'
    box.hidden = false
    waitMessage.hidden = false
    resultCard.hidden = true
    receiveButton.disabled = true
    guarantee.hidden = !isGuaranteed
    hasRevealed = false
    panel.classList.remove('present-draw-panel--revealing')
    element.hidden = false

    pendingPromise = new Promise<void>((resolve) => {
      resolvePending = resolve
    })

    revealTimer = window.setTimeout(() => {
      revealTimer = undefined
      box.hidden = true
      waitMessage.hidden = true
      title.textContent = 'ライフカード獲得！'
      panel.classList.add('present-draw-panel--revealing')
      resultCard.className = `present-result-card present-result-card--${card.type}`
      resultIcon.textContent = card.icon
      resultType.textContent = card.typeLabel
      resultName.textContent = card.name
      resultDescription.textContent = card.description
      resultCard.hidden = false
      hasRevealed = true
      onReveal()
      receiveButton.disabled = false
      receiveButton.focus()
    }, REVEAL_DELAY)

    return pendingPromise
  }

  receiveButton.addEventListener('click', close)

  return {
    element,
    show,
    dispose: () => {
      receiveButton.removeEventListener('click', close)
      if (revealTimer !== undefined) window.clearTimeout(revealTimer)
      revealTimer = undefined
      resolvePending?.()
      resolvePending = undefined
      pendingPromise = undefined
      element.remove()
    },
  }
}
