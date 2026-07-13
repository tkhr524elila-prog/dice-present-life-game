import './style.css'
import { createScene } from './three/createScene'
import { createDiceControls } from './ui/createDiceControls'
import { createTitleScreen } from './ui/createTitleScreen'

const app = document.querySelector<HTMLDivElement>('#app')!
let disposeScene: (() => void) | undefined

const showThreeScene = () => {
  const sceneContainer = document.createElement('main')
  sceneContainer.className = 'scene-container scene-container--appearing'
  sceneContainer.innerHTML = `
    <p class="development-label">P1-05：3Dサイコロ表示確認</p>
  `

  app.appendChild(sceneContainer)
  const sceneController = createScene(sceneContainer)
  const diceControls = createDiceControls(sceneController.rollDice)
  sceneContainer.appendChild(diceControls.element)
  disposeScene = () => {
    diceControls.dispose()
    sceneController.dispose()
  }

  requestAnimationFrame(() => {
    sceneContainer.classList.remove('scene-container--appearing')
  })
}

const titleScreen = createTitleScreen(showThreeScene)
app.appendChild(titleScreen.element)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    titleScreen.dispose()
    disposeScene?.()
    app.replaceChildren()
  })
}
