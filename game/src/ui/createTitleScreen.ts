const TRANSITION_DURATION = 650

type TitleScreen = {
  element: HTMLElement
  dispose: () => void
}

export const createTitleScreen = (onStart: () => void): TitleScreen => {
  const element = document.createElement('section')
  element.className = 'title-screen'
  element.setAttribute('aria-labelledby', 'game-title')
  element.innerHTML = `
    <div class="title-panel">
      <h1 id="game-title" class="game-title">サイコロを振ってプレゼントが決まる、人生ゲーム的なゲーム</h1>
      <p class="game-description">
        サイコロを振り、人生を歩き、<br>
        最後にもらえるお祝いを決めよう。
      </p>
      <button class="start-button" type="button">ゲームをはじめる</button>
    </div>
  `

  const startButton = element.querySelector<HTMLButtonElement>('.start-button')!
  let transitionTimer: number | undefined

  const handleStart = () => {
    startButton.disabled = true
    element.classList.add('title-screen--leaving')

    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : TRANSITION_DURATION

    transitionTimer = window.setTimeout(() => {
      element.remove()
      onStart()
    }, delay)
  }

  startButton.addEventListener('click', handleStart, { once: true })

  return {
    element,
    dispose: () => {
      startButton.removeEventListener('click', handleStart)
      window.clearTimeout(transitionTimer)
      element.remove()
    },
  }
}
