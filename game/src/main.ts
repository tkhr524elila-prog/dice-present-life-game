import './style.css'
import { verifyNormalEventData } from './data/normalEventData'
import { verifyPresentDrawRules } from './game/drawLifeCard'
import { verifyLifeHistoryRules } from './game/addLifeHistory'
import {
  createPrototypeGameFlow,
  type PrototypeGameFlow,
} from './game/createPrototypeGameFlow'
import { verifyStatusBoundaryRules } from './game/applyStatusChanges'
import {
  createGameStateStore,
  verifyLifeCardOwnershipRules,
} from './game/gameState'
import { createScene } from './three/createScene'
import { createChapterBanner } from './ui/createChapterBanner'
import { createDiceControls } from './ui/createDiceControls'
import { createLifeCardInventory } from './ui/createLifeCardInventory'
import { createLifeHistoryModal } from './ui/createLifeHistoryModal'
import { createPresentDrawModal } from './ui/createPresentDrawModal'
import { createPrototypeEventModal } from './ui/createPrototypeEventModal'
import { createStatusPanel } from './ui/createStatusPanel'
import { createTitleScreen } from './ui/createTitleScreen'

const app = document.querySelector<HTMLDivElement>('#app')!
let disposeScene: (() => void) | undefined

if (import.meta.env.DEV) {
  verifyStatusBoundaryRules()
  verifyNormalEventData()
  verifyPresentDrawRules()
  verifyLifeCardOwnershipRules()
  verifyLifeHistoryRules()
}

const showThreeScene = () => {
  const sceneContainer = document.createElement('main')
  sceneContainer.className = 'scene-container scene-container--appearing'
  sceneContainer.innerHTML = `
    <p class="development-label">P2-06：人生ノート確認</p>
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
  const presentDrawModal = createPresentDrawModal()
  const statusPanel = createStatusPanel(gameState)
  let updateInventoryPhase:
    | ((phase: Parameters<typeof diceControls.setPhase>[0]) => void)
    | undefined
  let updateHistoryPhase:
    | ((phase: Parameters<typeof diceControls.setPhase>[0]) => void)
    | undefined
  const setGamePhase = (phase: Parameters<typeof diceControls.setPhase>[0]) => {
    diceControls.setPhase(phase)
    updateInventoryPhase?.(phase)
    updateHistoryPhase?.(phase)
  }
  const lifeCardInventory = createLifeCardInventory(
    gameState,
    (isOpen) => {
      setGamePhase(
        isOpen
          ? 'inventory'
          : gameState.getState().isAtGoal
            ? 'finished'
            : 'ready',
      )
    },
  )
  updateInventoryPhase = lifeCardInventory.setPhase
  const lifeHistoryModal = createLifeHistoryModal(
    gameState,
    (isOpen) => {
      setGamePhase(
        isOpen
          ? 'history'
          : gameState.getState().isAtGoal
            ? 'finished'
            : 'ready',
      )
    },
  )
  updateHistoryPhase = lifeHistoryModal.setPhase
  sceneContainer.appendChild(diceControls.element)
  sceneContainer.appendChild(chapterBanner.element)
  sceneContainer.appendChild(eventModal.element)
  sceneContainer.appendChild(presentDrawModal.element)
  sceneContainer.appendChild(statusPanel.element)
  sceneContainer.appendChild(lifeCardInventory.element)
  sceneContainer.appendChild(lifeHistoryModal.element)

  gameFlow = createPrototypeGameFlow({
    gameState,
    rollDice: sceneController.rollDice,
    movePlayerTo: sceneController.movePlayerTo,
    showChapter: chapterBanner.show,
    showEvent: eventModal.show,
    showPresentDraw: presentDrawModal.show,
    setPhase: setGamePhase,
    setResult: diceControls.setResult,
    setCurrentSquare: diceControls.setCurrentSquare,
    setCurrentSquareType: diceControls.setCurrentSquareType,
    setCurrentChapter: diceControls.setCurrentChapter,
  })

  disposeScene = () => {
    gameFlow?.dispose()
    chapterBanner.dispose()
    eventModal.dispose()
    presentDrawModal.dispose()
    statusPanel.dispose()
    lifeCardInventory.dispose()
    lifeHistoryModal.dispose()
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
