type TutorialModal = {
  element: HTMLElement
  show: () => Promise<void>
  dispose: () => void
}

export const createTutorialModal = (): TutorialModal => {
  const element = document.createElement('div')
  element.className = 'tutorial-modal'
  element.hidden = true
  element.setAttribute('role', 'dialog')
  element.setAttribute('aria-modal', 'true')
  element.setAttribute('aria-labelledby', 'tutorial-title')
  element.innerHTML = `
    <section class="tutorial-panel">
      <div class="tutorial-king" aria-hidden="true"><span>♛</span></div>
      <p class="tutorial-label">王様からの説明</p>
      <h2 id="tutorial-title">人生の旅へ出る前に</h2>
      <div class="tutorial-grid">
        <article><h3>💰 お金</h3><p>ゴール時の金額相当で、<br>好きなものをプレゼントするぞ！</p></article>
        <article><h3>🎁 景品カード</h3><p>ゲーム中に引いた景品カードも、<br>最後のプレゼントに追加されるぞ！<br><br>どんな景品が入っているかは、<br>引いてからのお楽しみじゃ！</p></article>
        <article><h3>⚠ トラブルカード</h3><p>ただし、すべてのカードがプレゼントとは限らん。<br><br>トラブルカードを引くと、<br>最後にもらえるお金が減ることがあるぞ。</p></article>
        <article><h3>❤️ 愛情</h3><p>低いほどトラブルカードが出やすく、<br>高いほど良い景品カードが出やすいぞ！</p></article>
        <article><h3>💪 健康</h3><p>ゴール時のお金に倍率がかかる！<br><br>健康であるほど、<br>もらえる金額が増えるぞ！</p></article>
      </div>
      <button class="tutorial-understood" type="button">理解した</button>
    </section>
  `
  const button = element.querySelector<HTMLButtonElement>('.tutorial-understood')!
  let resolvePending: (() => void) | undefined
  const close = () => {
    if (!resolvePending) return
    element.hidden = true
    resolvePending()
    resolvePending = undefined
  }
  button.addEventListener('click', close)
  return {
    element,
    show: () => {
      element.hidden = false
      button.focus()
      return new Promise<void>((resolve) => { resolvePending = resolve })
    },
    dispose: () => {
      button.removeEventListener('click', close)
      resolvePending?.()
      element.remove()
    },
  }
}
