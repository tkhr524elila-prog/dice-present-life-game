import type {
  LifeChoiceData,
  LifeChoiceOption,
} from '../data/lifeChoiceData'

type LifeChoiceModal = {
  element: HTMLElement
  show: (choice: LifeChoiceData) => Promise<LifeChoiceOption>
  dispose: () => void
}

const formatChange = (value: number) => {
  if (value > 0) return `＋${value.toLocaleString('ja-JP')}`
  if (value < 0) return `－${Math.abs(value).toLocaleString('ja-JP')}`
  return '変化なし'
}

const createOptionCard = (
  option: LifeChoiceOption,
  onSelect: (option: LifeChoiceOption) => void,
) => {
  const card = document.createElement('article')
  card.className = 'life-choice-option'

  const title = document.createElement('h3')
  title.textContent = option.label
  const description = document.createElement('p')
  description.className = 'life-choice-option-description'
  description.textContent = option.description

  const points = document.createElement('div')
  points.className = 'life-choice-option-changes'
  ;(
    [
      ['💰', 'ポイント', option.changes.points],
      ['💪', '健康', option.changes.health],
      ['❤️', '愛情', option.changes.love],
    ] as const
  ).forEach(([icon, label, value]) => {
    const item = document.createElement('span')
    const direction = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
    item.className = `life-choice-change life-choice-change--${direction}`
    item.textContent = `${icon} ${label} ${formatChange(value)}`
    points.appendChild(item)
  })

  const comparisons = document.createElement('div')
  comparisons.className = 'life-choice-comparisons'
  const merits = document.createElement('ul')
  merits.className = 'life-choice-merits'
  option.merits.forEach((merit) => {
    const item = document.createElement('li')
    item.textContent = `＋ ${merit}`
    merits.appendChild(item)
  })
  const demerits = document.createElement('ul')
  demerits.className = 'life-choice-demerits'
  option.demerits.forEach((demerit) => {
    const item = document.createElement('li')
    item.textContent = `－ ${demerit}`
    demerits.appendChild(item)
  })
  comparisons.append(merits, demerits)

  const button = document.createElement('button')
  button.className = 'life-choice-select'
  button.type = 'button'
  button.textContent = `${option.label}を選ぶ`
  button.disabled = Boolean(option.disabledReason)
  button.title = option.disabledReason ?? ''
  button.addEventListener('click', () => onSelect(option), { once: true })

  if (option.disabledReason) {
    const reason = document.createElement('p')
    reason.className = 'life-choice-disabled-reason'
    reason.textContent = option.disabledReason
    card.append(title, description, points, comparisons, reason, button)
    return card
  }

  card.append(title, description, points, comparisons, button)
  return card
}

export const createLifeChoiceModal = (): LifeChoiceModal => {
  const element = document.createElement('div')
  element.className = 'life-choice-modal'
  element.hidden = true
  element.setAttribute('role', 'dialog')
  element.setAttribute('aria-modal', 'true')
  element.setAttribute('aria-labelledby', 'life-choice-title')
  element.innerHTML = `
    <section class="life-choice-panel">
      <p class="life-choice-label">人生の選択</p>
      <h2 id="life-choice-title"></h2>
      <p class="life-choice-description"></p>
      <div class="life-choice-options"></div>
      <p class="life-choice-note">一度選ぶと変更できません。</p>
    </section>
  `

  const title = element.querySelector<HTMLElement>('#life-choice-title')!
  const description = element.querySelector<HTMLElement>(
    '.life-choice-description',
  )!
  const options = element.querySelector<HTMLElement>('.life-choice-options')!
  let pendingPromise: Promise<LifeChoiceOption> | undefined
  let resolvePending: ((option: LifeChoiceOption) => void) | undefined

  const select = (option: LifeChoiceOption) => {
    if (!resolvePending) return
    const confirmation = document.createElement('section')
    confirmation.className = 'life-choice-confirmation'
    const question = document.createElement('h3')
    question.textContent = `「${option.label}」を選択してもよろしいですか？`
    const yes = document.createElement('button')
    yes.type = 'button'
    yes.textContent = 'はい'
    const no = document.createElement('button')
    no.type = 'button'
    no.textContent = 'いいえ'
    confirmation.append(question, yes, no)
    options.replaceChildren(confirmation)
    yes.addEventListener('click', () => {
      if (!resolvePending) return
      element.hidden = true
      resolvePending(option)
      resolvePending = undefined
      pendingPromise = undefined
    }, { once: true })
    no.addEventListener('click', () => {
      options.replaceChildren(
        ...currentChoice!.options.map((currentOption) =>
          createOptionCard(currentOption, select),
        ),
      )
    }, { once: true })
    yes.focus()
  }

  let currentChoice: LifeChoiceData | undefined

  const show = (choice: LifeChoiceData) => {
    if (pendingPromise) return pendingPromise

    currentChoice = choice

    title.textContent = choice.title
    description.textContent = choice.description
    options.replaceChildren(
      ...choice.options.map((option) => createOptionCard(option, select)),
    )
    element.hidden = false
    options.querySelector<HTMLButtonElement>('button')?.focus()
    pendingPromise = new Promise<LifeChoiceOption>((resolve) => {
      resolvePending = resolve
    })
    return pendingPromise
  }

  return {
    element,
    show,
    dispose: () => {
      resolvePending = undefined
      pendingPromise = undefined
      element.remove()
    },
  }
}
