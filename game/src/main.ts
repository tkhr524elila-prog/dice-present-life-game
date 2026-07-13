import './style.css'
import {
  createPrototypeGameFlow,
  type PrototypeGameFlow,
} from './game/createPrototypeGameFlow'
import { createScene } from './three/createScene'
import { createDiceControls } from './ui/createDiceControls'
import { createPrototypeEventModal } from './ui/createPrototypeEventModal'
import { createTitleScreen } from './ui/createTitleScreen'

const app = document.querySelector<HTMLDivElement>('#app')!
let disposeScene: (() => void) | undefined

const showThreeScene = () => {
  const sceneContainer = document.createElement('main')
  sceneContainer.className = 'scene-container scene-container--appearing'
  sceneContainer.innerHTML = `
    <p class="development-label">P1-06：移動・仮イベント表示確認</p>
  `

  app.appendChild(sceneContainer)
  const sceneController = createScene(sceneContainer)
  let gameFlow: PrototypeGameFlow | undefined
  const diceControls = createDiceControls(
    () => gameFlow?.playTurn() ?? Promise.resolve(),
  )
  const eventModal = createPrototypeEventModal()
  sceneContainer.appendChild(diceControls.element)
  sceneContainer.appendChild(eventModal.element)

  gameFlow = createPrototypeGameFlow({
    rollDice: sceneController.rollDice,
    movePlayerTo: sceneController.movePlayerTo,
    showEvent: eventModal.show,
    setPhase: diceControls.setPhase,
    setResult: diceControls.setResult,
    setCurrentSquare: diceControls.setCurrentSquare,
  })

  disposeScene = () => {
    gameFlow?.dispose()
    eventModal.dispose()
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
