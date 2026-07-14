import './style.css'
import { verifyNormalEventData } from './data/normalEventData'
import { verifyLifeChoiceData } from './data/lifeChoiceData'
import { verifySettlementData } from './data/settlementData'
import { verifyEventLifeCardRules } from './data/eventLifeCardRules'
import { verifyPresentDrawRules } from './game/drawLifeCard'
import { verifyLifeHistoryRules } from './game/addLifeHistory'
import { verifyJobModifierRules } from './game/applyJobModifiers'
import { verifyTrafficAccidentRules } from './game/resolveTrafficAccident'
import { verifyNisaResultRules } from './game/resolveNisaResult'
import { verifyLifeCardSettlementRules } from './game/settleLifeCards'
import { verifySettlementCalculationRules } from './game/calculateSettlement'
import { verifySettlementHistoryRules } from './game/recordSettlementHistory'
import {
  type PrototypeGameFlow,
} from './game/createPrototypeGameFlow'
import { createGameFlowV2 } from './game/v2/createGameFlowV2'
import { verifyRouteRulesV2 } from './game/v2/resolveRouteV2'
import { verifyRouteEventMultiplierV2 } from './game/v2/applyEventV2'
import { verifyLifeChoiceDataV2 } from './data/v2/lifeChoiceDataV2'
import { validateBoardDataV2 } from './data/v2/validateBoardDataV2'
import { verifyContinuousLoveDrawRates } from './data/presentDrawTables'
import { verifyPhase7Rules } from './game/v2/verifyPhase7Rules'
import { verifyStatusBoundaryRules } from './game/applyStatusChanges'
import {
  createGameStateStore,
  verifyLifeChoiceStateRules,
  verifyLifeCardOwnershipRules,
  verifySettlementStateRules,
} from './game/gameState'
import { createScene } from './three/createScene'
import { createChapterBanner } from './ui/createChapterBanner'
import { createDiceControls } from './ui/createDiceControls'
import { createContractModal } from './ui/createContractModal'
import { createLifeCardInventory } from './ui/createLifeCardInventory'
import { createLifeChoiceModal } from './ui/createLifeChoiceModal'
import { createLifeHistoryModal } from './ui/createLifeHistoryModal'
import { createPresentDrawModal } from './ui/createPresentDrawModal'
import { createPrototypeEventModal } from './ui/createPrototypeEventModal'
import { createStatusPanel } from './ui/createStatusPanel'
import { createSettlementModal } from './ui/createSettlementModal'
import { createTitleScreen } from './ui/createTitleScreen'
import { createTutorialModal } from './ui/createTutorialModal'

const app = document.querySelector<HTMLDivElement>('#app')!
let disposeScene: (() => void) | undefined

if (import.meta.env.DEV) {
  verifyStatusBoundaryRules()
  verifyNormalEventData()
  verifyPresentDrawRules()
  verifyLifeCardOwnershipRules()
  verifyLifeHistoryRules()
  verifyLifeChoiceData()
  verifyLifeChoiceStateRules()
  verifyJobModifierRules()
  verifyTrafficAccidentRules()
  verifySettlementData()
  verifyEventLifeCardRules()
  verifyNisaResultRules()
  verifyLifeCardSettlementRules()
  verifySettlementCalculationRules()
  verifySettlementStateRules()
  verifySettlementHistoryRules()
  validateBoardDataV2()
  verifyLifeChoiceDataV2()
  verifyRouteRulesV2()
  verifyRouteEventMultiplierV2()
  verifyContinuousLoveDrawRates()
  verifyPhase7Rules()
}

const showThreeScene = () => {
  const sceneContainer = document.createElement('main')
  sceneContainer.className = 'scene-container scene-container--appearing'
  sceneContainer.innerHTML = `
    <p class="development-label">Phase 7：100マス・恋愛分岐版</p>
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
  const lifeChoiceModal = createLifeChoiceModal()
  const contractModal = createContractModal()
  const presentDrawModal = createPresentDrawModal()
  const settlementModal = createSettlementModal()
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
    sceneController.setUiFocus(
      phase !== 'ready' && phase !== 'rolling' && phase !== 'moving',
    )
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
  sceneContainer.appendChild(lifeChoiceModal.element)
  sceneContainer.appendChild(contractModal.element)
  sceneContainer.appendChild(presentDrawModal.element)
  sceneContainer.appendChild(statusPanel.element)
  sceneContainer.appendChild(lifeCardInventory.element)
  sceneContainer.appendChild(lifeHistoryModal.element)
  sceneContainer.appendChild(settlementModal.element)

  gameFlow = createGameFlowV2({
    gameState,
    rollDice: sceneController.rollDice,
    movePlayerTo: sceneController.movePlayerTo,
    setSelectedRoute: sceneController.setSelectedRoute,
    showChapter: chapterBanner.show,
    showEvent: eventModal.show,
    showLifeChoice: lifeChoiceModal.show,
    showContract: contractModal.show,
    showPresentDraw: presentDrawModal.show,
    showSettlement: settlementModal.show,
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
    lifeChoiceModal.dispose()
    contractModal.dispose()
    presentDrawModal.dispose()
    statusPanel.dispose()
    lifeCardInventory.dispose()
    lifeHistoryModal.dispose()
    settlementModal.dispose()
    diceControls.dispose()
    sceneController.dispose()
  }

  requestAnimationFrame(() => {
    sceneContainer.classList.remove('scene-container--appearing')
  })
}

const tutorialModal = createTutorialModal()
app.appendChild(tutorialModal.element)
const showTutorial = () => {
  void tutorialModal.show().then(showThreeScene)
}
const titleScreen = createTitleScreen(showTutorial)
app.appendChild(titleScreen.element)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    titleScreen.dispose()
    tutorialModal.dispose()
    disposeScene?.()
    app.replaceChildren()
  })
}
