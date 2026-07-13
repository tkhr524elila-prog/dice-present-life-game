import * as THREE from 'three'
import { createPrototypeBoard } from './createPrototypeBoard'
import { createPrototypeDice, type DiceValue } from './createPrototypeDice'
import { createPrototypePlayer } from './createPrototypePlayer'

type SceneController = {
  rollDice: () => Promise<DiceValue>
  movePlayerTo: (squareNumber: number) => Promise<void>
  dispose: () => void
}

export const createScene = (container: HTMLElement): SceneController => {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87bce8)

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
  const cameraTarget = new THREE.Vector3(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.domElement.setAttribute(
    'aria-label',
    '仮マス10個、仮主人公、3Dサイコロを表示する確認画面',
  )
  container.appendChild(renderer.domElement)

  const groundGeometry = new THREE.PlaneGeometry(24, 12)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x76b978 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const prototypeBoard = createPrototypeBoard()
  scene.add(prototypeBoard.group)

  const prototypePlayer = createPrototypePlayer(prototypeBoard.startPosition)
  scene.add(prototypePlayer.group)

  const prototypeDice = createPrototypeDice()
  scene.add(prototypeDice.group)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
  directionalLight.position.set(6, 10, 8)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  const resize = () => {
    const width = Math.max(container.clientWidth, 1)
    const height = Math.max(container.clientHeight, 1)
    const aspect = width / height
    const cameraDistanceScale = Math.max(1, 1.5 / aspect)

    camera.aspect = aspect
    camera.position.set(
      0,
      10 * cameraDistanceScale,
      15 * cameraDistanceScale,
    )
    camera.lookAt(cameraTarget)
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }

  window.addEventListener('resize', resize)
  resize()

  renderer.setAnimationLoop((time) => {
    prototypeDice.update(time)
    prototypePlayer.update(time)
    renderer.render(scene, camera)
  })

  return {
    rollDice: prototypeDice.roll,
    movePlayerTo: (squareNumber) => {
      const targetPosition = prototypeBoard.squarePositions[squareNumber - 1]
      return targetPosition
        ? prototypePlayer.moveTo(targetPosition)
        : Promise.resolve()
    },
    dispose: () => {
      window.removeEventListener('resize', resize)
      renderer.setAnimationLoop(null)
      scene.remove(prototypeDice.group)
      scene.remove(prototypePlayer.group)
      scene.remove(prototypeBoard.group)
      prototypeDice.dispose()
      prototypePlayer.dispose()
      prototypeBoard.dispose()
      groundGeometry.dispose()
      groundMaterial.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
