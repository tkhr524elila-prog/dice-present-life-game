import type { ContractData } from '../data/lifeChoiceData'

type ContractModal = {
  element: HTMLElement
  show: (contract: ContractData) => Promise<void>
  dispose: () => void
}

export const createContractModal = (): ContractModal => {
  const element = document.createElement('div')
  element.className = 'contract-modal'
  element.hidden = true
  element.setAttribute('role', 'dialog')
  element.setAttribute('aria-modal', 'true')
  element.setAttribute('aria-labelledby', 'contract-title')
  element.innerHTML = `
    <section class="contract-panel">
      <p class="contract-label">契約手続き</p>
      <article class="contract-document">
        <h2 id="contract-title"></h2>
        <p class="contract-summary"></p>
        <dl class="contract-details">
          <div><dt>今回</dt><dd class="contract-cost"></dd></div>
          <div><dt>メリット</dt><dd class="contract-benefit"></dd></div>
          <div><dt>注意</dt><dd class="contract-risk"></dd></div>
        </dl>
        <div class="contract-stamp" aria-label="五十嵐の印鑑">五十嵐</div>
        <p class="contract-established">契約成立</p>
        <p class="contract-filed">人生ノートへ記録</p>
      </article>
      <button class="contract-confirm" type="button">契約する</button>
    </section>
  `

  const panel = element.querySelector<HTMLElement>('.contract-panel')!
  const title = element.querySelector<HTMLElement>('#contract-title')!
  const summary = element.querySelector<HTMLElement>('.contract-summary')!
  const cost = element.querySelector<HTMLElement>('.contract-cost')!
  const benefit = element.querySelector<HTMLElement>('.contract-benefit')!
  const risk = element.querySelector<HTMLElement>('.contract-risk')!
  const stamp = element.querySelector<HTMLElement>('.contract-stamp')!
  const established = element.querySelector<HTMLElement>(
    '.contract-established',
  )!
  const documentElement = element.querySelector<HTMLElement>(
    '.contract-document',
  )!
  const filed = element.querySelector<HTMLElement>('.contract-filed')!
  const confirmButton = element.querySelector<HTMLButtonElement>(
    '.contract-confirm',
  )!
  const timers = new Set<number>()
  let pendingPromise: Promise<void> | undefined
  let resolvePending: (() => void) | undefined

  const schedule = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.delete(timer)
      callback()
    }, delay)
    timers.add(timer)
  }

  const confirm = () => {
    if (!resolvePending || confirmButton.disabled) return
    confirmButton.disabled = true
    confirmButton.textContent = '押印中…'
    schedule(() => {
      stamp.classList.add('contract-stamp--pressed')
      panel.classList.add('contract-panel--impact')
    }, 220)
    schedule(() => {
      established.classList.add('contract-established--visible')
      confirmButton.textContent = '契約成立'
    }, 700)
    schedule(() => {
      established.classList.remove('contract-established--visible')
      filed.classList.add('contract-filed--visible')
      documentElement.classList.add('contract-document--filed')
    }, 1_150)
    schedule(() => {
      element.hidden = true
      resolvePending?.()
      resolvePending = undefined
      pendingPromise = undefined
    }, 1_750)
  }

  const show = (contract: ContractData) => {
    if (pendingPromise) return pendingPromise

    title.textContent = contract.title
    summary.textContent = contract.summary
    cost.textContent = contract.cost
    benefit.textContent = contract.benefit
    risk.textContent = contract.risk
    stamp.classList.remove('contract-stamp--pressed')
    established.classList.remove('contract-established--visible')
    filed.classList.remove('contract-filed--visible')
    documentElement.classList.remove('contract-document--filed')
    panel.classList.remove('contract-panel--impact')
    confirmButton.disabled = false
    confirmButton.textContent = '契約する'
    element.hidden = false
    confirmButton.focus()
    pendingPromise = new Promise<void>((resolve) => {
      resolvePending = resolve
    })
    return pendingPromise
  }

  confirmButton.addEventListener('click', confirm)

  return {
    element,
    show,
    dispose: () => {
      confirmButton.removeEventListener('click', confirm)
      timers.forEach((timer) => window.clearTimeout(timer))
      resolvePending?.()
      resolvePending = undefined
      pendingPromise = undefined
      element.remove()
    },
  }
}
