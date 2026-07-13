import './style.css'
import {
  createPrototypeGameFlow,
  type PrototypeGameFlow,
} from './game/createPrototypeGameFlow'
import { verifyStatusBoundaryRules } from './game/applyStatusChanges'
import { createGameStateStore } from './game/gameState'
import { createScene } from './three/createScene'
import { createChapterBanner } from './ui/createChapterBanner'
import { createDiceControls } from './ui/createDiceControls'
import { createPrototypeEventModal } from './ui/createPrototypeEventModal'
import { createStatusPanel } from './ui/createStatusPanel'
import { createTitleScreen } from './ui/createTitleScreen'

const app = document.querySelector<HTMLDivElement>('#app')!
let disposeScene: (() => void) | undefined

if (import.meta.env.DEV) {
  verifyStatusBoundaryRules()
}

const showThreeScene = () => {
  const sceneContainer = document.createElement('main')
  sceneContainer.className = 'scene-container scene-container--appearing'
  sceneContainer.innerHTML = `
    <p class="development-label">P2-03：ステータス管理確認</p>
  `

  app.appendChild(sceneContainer)
  const sceneController = createScene(sceneContainer)
  const gameState = createGameStateStore()
  let gameFlow: PrototypeGameFlow | undefined
  const diceControls = createDiceControls(
    () => gameFlow?.playTurn() ?? Promise.resolve(),
  )
  const chapterBanner = createChapterBanner()
  const eventModal = createPrototypeEventModal()
  const statusPanel = createStatusPanel(gameState)
  sceneContainer.appendChild(diceControls.element)
  sceneContainer.appendChild(chapterBanner.element)
  sceneContainer.appendChild(eventModal.element)
  sceneContainer.appendChild(statusPanel.element)

  gameFlow = createPrototypeGameFlow({
    gameState,
    rollDice: sceneController.rollDice,
    movePlayerTo: sceneController.movePlayerTo,
    showChapter: chapterBanner.show,
    showEvent: eventModal.show,
    setPhase: diceControls.setPhase,
    setResult: diceControls.setResult,
    setCurrentSquare: diceControls.setCurrentSquare,
    setCurrentSquareType: diceControls.setCurrentSquareType,
    setCurrentChapter: diceControls.setCurrentChapter,
  })

  disposeScene = () => {
    gameFlow?.dispose()
    chapterBanner.dispose()
    eventModal.dispose()
    statusPanel.dispose()
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
