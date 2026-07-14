import * as THREE from 'three'
import {
  getBoardSquare,
  getChapter,
  type BoardSquareData,
} from '../data/boardData'
import { createBoard } from './createBoard'
import { createPrototypeDice, type DiceValue } from './createPrototypeDice'
import { createPrototypePlayer } from './createPrototypePlayer'
import { createChapterScenery } from './createChapterScenery'

type SceneController = {
  rollDice: () => Promise<DiceValue>
  movePlayerTo: (squareNumber: number) => Promise<void>
  setUiFocus: (isFocused: boolean) => void
  dispose: () => void
}

export const createScene = (container: HTMLElement): SceneController => {
  const scene = new THREE.Scene()
  const initialChapter = getChapter(1)
  const backgroundColor = new THREE.Color(
    initialChapter.environment.background,
  )
  scene.background = backgroundColor
  scene.fog = new THREE.Fog(initialChapter.environment.fog, 14, 40)

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80)
  const cameraLookAt = new THREE.Vector3()
  const cameraLookAtGoal = new THREE.Vector3()
  const cameraPositionGoal = new THREE.Vector3()
  const squarePositionScratch = new THREE.Vector3()
  const nextSquarePositionScratch = new THREE.Vector3()
  const lookAheadScratch = new THREE.Vector3()
  const cameraOffsetScratch = new THREE.Vector3()
  const diceOffset = new THREE.Vector3(4.4, 1.05, 0)
  let cameraDistanceScale = 1
  let cameraPullback = 1
  let isUiFocused = false
  let currentSquareNumber = 1
  let currentChapterNumber = 1

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.domElement.setAttribute(
    'aria-label',
    '60マス、5章、仮主人公、3Dサイコロを表示する確認画面',
  )
  container.appendChild(renderer.domElement)

  const groundGeometry = new THREE.PlaneGeometry(40, 126)
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: initialChapter.environment.ground,
    roughness: 0.95,
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(0, -1.1, 48)
  ground.receiveShadow = true
  scene.add(ground)

  const board = createBoard()
  scene.add(board.group)

  const chapterScenery = createChapterScenery()
  scene.add(chapterScenery.group)

  const prototypePlayer = createPrototypePlayer(board.startPosition)
  scene.add(prototypePlayer.group)

  const prototypeDice = createPrototypeDice()
  scene.add(prototypeDice.group)

  const ambientLight = new THREE.AmbientLight(
    initialChapter.environment.ambientLight,
    1.5,
  )
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(
    initialChapter.environment.directionalLight,
    2.5,
  )
  directionalLight.position.set(6, 10, 8)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  const environmentTargets = {
    background: backgroundColor.clone(),
    ground: groundMaterial.color.clone(),
    fog: scene.fog.color.clone(),
    ambientLight: ambientLight.color.clone(),
    directionalLight: directionalLight.color.clone(),
  }

  const setEnvironmentForSquare = (square: BoardSquareData) => {
    const environment = getChapter(square.chapter).environment
    environmentTargets.background.set(environment.background)
    environmentTargets.ground.set(environment.ground)
    environmentTargets.fog.set(environment.fog)
    environmentTargets.ambientLight.set(environment.ambientLight)
    environmentTargets.directionalLight.set(environment.directionalLight)
  }

  const updateViewForSquare = (squareNumber: number, immediate = false) => {
    const square = getBoardSquare(squareNumber)
    if (!square) return

    currentSquareNumber = squareNumber
    const squarePosition = squarePositionScratch.set(...square.position)
    const nextSquare = getBoardSquare(Math.min(60, squareNumber + 2))
    const lookAhead = nextSquare
      ? nextSquarePositionScratch.set(...nextSquare.position).sub(squarePosition).multiplyScalar(0.38)
      : lookAheadScratch.set(0, 0, 2.5)
    cameraLookAtGoal.copy(squarePosition).add(lookAhead)
    cameraLookAtGoal.y += 0.35
    const viewScale = cameraDistanceScale * cameraPullback
    cameraOffsetScratch.set(6.2 * viewScale, 8.2 * viewScale, -9.2 * viewScale)
    cameraPositionGoal.copy(squarePosition).add(cameraOffsetScratch)

    prototypeDice.group.position
      .copy(squarePosition)
      .add(diceOffset)

    if (immediate) {
      camera.position.copy(cameraPositionGoal)
      cameraLookAt.copy(cameraLookAtGoal)
      camera.lookAt(cameraLookAt)
    }
  }

  updateViewForSquare(1, true)

  const resize = () => {
    const width = Math.max(container.clientWidth, 1)
    const height = Math.max(container.clientHeight, 1)
    const aspect = width / height
    cameraDistanceScale = Math.max(1, 1.5 / aspect)

    camera.aspect = aspect
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
    updateViewForSquare(currentSquareNumber, true)
  }

  window.addEventListener('resize', resize)
  resize()

  let previousTime = 0

  renderer.setAnimationLoop((time) => {
    const deltaSeconds = Math.min(Math.max((time - previousTime) / 1_000, 0), 0.1)
    previousTime = time
    cameraPullback += (1 - cameraPullback) * (1 - Math.exp(-deltaSeconds * 0.9))
    updateViewForSquare(currentSquareNumber)
    const interpolation = 1 - Math.exp(-deltaSeconds * (isUiFocused ? 1.8 : 3.4))

    prototypeDice.update(time)
    prototypePlayer.update(time)
    board.update(time)
    chapterScenery.update(time)
    camera.position.lerp(cameraPositionGoal, interpolation)
    cameraLookAt.lerp(cameraLookAtGoal, interpolation)
    camera.lookAt(cameraLookAt)
    backgroundColor.lerp(environmentTargets.background, interpolation)
    groundMaterial.color.lerp(environmentTargets.ground, interpolation)
    scene.fog?.color.lerp(environmentTargets.fog, interpolation)
    ambientLight.color.lerp(environmentTargets.ambientLight, interpolation)
    directionalLight.color.lerp(
      environmentTargets.directionalLight,
      interpolation,
    )
    renderer.render(scene, camera)
  })

  return {
    rollDice: prototypeDice.roll,
    movePlayerTo: (squareNumber) => {
      const targetPosition = board.squarePositions[squareNumber - 1]
      const square = getBoardSquare(squareNumber)
      if (!targetPosition || !square) return Promise.resolve()

      if (square.chapter !== currentChapterNumber) {
        currentChapterNumber = square.chapter
        cameraPullback = 1.28
        chapterScenery.setChapter(square.chapter)
      }
      board.setCurrentSquare(squareNumber)
      updateViewForSquare(squareNumber)
      return prototypePlayer.moveTo(targetPosition).then(() => {
        setEnvironmentForSquare(square)
      })
    },
    setUiFocus: (isFocused) => {
      isUiFocused = isFocused
    },
    dispose: () => {
      window.removeEventListener('resize', resize)
      renderer.setAnimationLoop(null)
      scene.remove(prototypeDice.group)
      scene.remove(prototypePlayer.group)
      scene.remove(board.group)
      scene.remove(chapterScenery.group)
      prototypeDice.dispose()
      prototypePlayer.dispose()
      board.dispose()
      chapterScenery.dispose()
      groundGeometry.dispose()
      groundMaterial.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
