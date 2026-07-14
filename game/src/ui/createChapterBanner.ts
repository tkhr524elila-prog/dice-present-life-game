type ChapterBanner = {
  element: HTMLElement
  show: (chapterNumber: number, chapterTitle: string) => Promise<void>
  dispose: () => void
}

const DISPLAY_DURATION = 2_000

export const createChapterBanner = (): ChapterBanner => {
  const element = document.createElement('div')
  element.className = 'chapter-banner'
  element.hidden = true
  element.setAttribute('role', 'status')
  element.setAttribute('aria-live', 'polite')
  element.innerHTML = `
    <div class="chapter-banner-panel">
      <div class="chapter-banner-ornament" aria-hidden="true">✦</div>
      <p class="chapter-banner-number"></p>
      <p class="chapter-banner-title"></p>
    </div>
  `

  const number = element.querySelector<HTMLElement>('.chapter-banner-number')!
  const title = element.querySelector<HTMLElement>('.chapter-banner-title')!
  let timer: number | undefined
  let resolvePending: (() => void) | undefined

  const finish = () => {
    window.clearTimeout(timer)
    timer = undefined
    element.hidden = true
    element.classList.remove('chapter-banner--visible')
    resolvePending?.()
    resolvePending = undefined
  }

  const show = (chapterNumber: number, chapterTitle: string) => {
    finish()
    number.textContent = `第${chapterNumber}章`
    title.textContent = chapterTitle
    element.dataset.chapter = String(chapterNumber)
    element.hidden = false

    void element.offsetWidth
    element.classList.add('chapter-banner--visible')

    return new Promise<void>((resolve) => {
      resolvePending = resolve
      timer = window.setTimeout(finish, DISPLAY_DURATION)
    })
  }

  return {
    element,
    show,
    dispose: () => {
      finish()
      element.remove()
    },
  }
}
