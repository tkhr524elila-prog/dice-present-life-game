import * as THREE from 'three'
import { BOARD_SQUARES, type BoardSquareData } from '../data/boardData'

const FRAME_SIZE = 1.55
const CENTER_SIZE = 1.2
const SQUARE_HEIGHT = 0.24
const UP_AXIS = new THREE.Vector3(0, 1, 0)

type Board = {
  group: THREE.Group
  startPosition: THREE.Vector3
  squarePositions: readonly THREE.Vector3[]
  dispose: () => void
}

const drawGiftMark = (context: CanvasRenderingContext2D) => {
  context.fillStyle = '#7c5120'
  context.fillRect(84, 132, 88, 62)
  context.fillStyle = '#fff3b0'
  context.fillRect(121, 132, 14, 62)
  context.fillRect(77, 119, 102, 20)
  context.strokeStyle = '#7c5120'
  context.lineWidth = 10
  context.beginPath()
  context.arc(111, 113, 21, Math.PI * 0.05, Math.PI * 1.42)
  context.stroke()
  context.beginPath()
  context.arc(145, 113, 21, Math.PI * 1.58, Math.PI * 0.95)
  context.stroke()
}

const createSquareLabelTexture = (square: BoardSquareData) => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')!

  context.fillStyle = 'rgba(255, 255, 255, 0.94)'
  context.strokeStyle = square.chapterColor
  context.lineWidth = 14
  context.beginPath()
  context.roundRect(18, 18, 220, 220, 38)
  context.fill()
  context.stroke()

  context.fillStyle = '#30304f'
  context.font = `800 ${square.type === 'normal' ? 112 : 76}px sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(String(square.id), 128, square.type === 'normal' ? 132 : 73)

  if (square.type === 'gift') {
    drawGiftMark(context)
  } else if (square.type === 'stop') {
    context.fillStyle = '#a94b1f'
    context.font = '900 45px sans-serif'
    context.fillText('STOP', 128, 163)
  } else if (square.type === 'goal') {
    context.fillStyle = '#9b791a'
    context.font = '900 43px sans-serif'
    context.fillText('GOAL', 128, 163)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export const createBoard = (): Board => {
  const group = new THREE.Group()
  group.name = 'Board-60Squares'

  const frameGeometry = new THREE.BoxGeometry(
    FRAME_SIZE,
    SQUARE_HEIGHT,
    FRAME_SIZE,
  )
  const centerGeometry = new THREE.BoxGeometry(
    CENTER_SIZE,
    SQUARE_HEIGHT * 1.08,
    CENTER_SIZE,
  )
  const connectorGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1, 10)
  const connectorMaterial = new THREE.MeshStandardMaterial({ color: 0xdbe2c4 })
  const frameMaterials = new Map<string, THREE.MeshStandardMaterial>()
  const centerMaterials = new Map<string, THREE.MeshStandardMaterial>()
  const labelTextures: THREE.CanvasTexture[] = []
  const labelMaterials: THREE.SpriteMaterial[] = []

  const getMaterial = (
    cache: Map<string, THREE.MeshStandardMaterial>,
    color: string,
  ) => {
    const existing = cache.get(color)
    if (existing) return existing

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.72,
      metalness: 0.04,
    })
    cache.set(color, material)
    return material
  }

  const rawPositions = BOARD_SQUARES.map(
    ({ position }) => new THREE.Vector3(...position),
  )

  rawPositions.slice(0, -1).forEach((position, index) => {
    const nextPosition = rawPositions[index + 1]
    const direction = nextPosition.clone().sub(position)
    const connector = new THREE.Mesh(connectorGeometry, connectorMaterial)
    connector.name = `Path-${index + 1}-${index + 2}`
    connector.position.copy(position).add(nextPosition).multiplyScalar(0.5)
    connector.quaternion.setFromUnitVectors(
      UP_AXIS,
      direction.clone().normalize(),
    )
    connector.scale.y = direction.length()
    connector.castShadow = true
    connector.receiveShadow = true
    group.add(connector)
  })

  BOARD_SQUARES.forEach((square, index) => {
    const position = rawPositions[index]

    const frame = new THREE.Mesh(
      frameGeometry,
      getMaterial(frameMaterials, square.chapterColor),
    )
    frame.name = `SquareFrame-${square.id}`
    frame.position.copy(position)
    frame.castShadow = true
    frame.receiveShadow = true
    group.add(frame)

    const center = new THREE.Mesh(
      centerGeometry,
      getMaterial(centerMaterials, square.squareColor),
    )
    center.name = `SquareCenter-${square.id}-${square.type}`
    center.position.copy(position)
    center.position.y += SQUARE_HEIGHT * 0.57
    center.castShadow = true
    center.receiveShadow = true
    group.add(center)

    const labelTexture = createSquareLabelTexture(square)
    const labelMaterial = new THREE.SpriteMaterial({
      map: labelTexture,
      depthTest: false,
    })
    const label = new THREE.Sprite(labelMaterial)
    label.name = `SquareLabel-${square.id}`
    label.position.copy(position)
    label.position.y += 1.55
    label.scale.setScalar(square.type === 'normal' ? 0.76 : 0.92)
    label.renderOrder = 2
    group.add(label)
    labelTextures.push(labelTexture)
    labelMaterials.push(labelMaterial)
  })

  const squarePositions = rawPositions.map((position) =>
    position.clone().add(new THREE.Vector3(0, SQUARE_HEIGHT * 1.12, 0)),
  )

  return {
    group,
    startPosition: squarePositions[0].clone(),
    squarePositions,
    dispose: () => {
      frameGeometry.dispose()
      centerGeometry.dispose()
      connectorGeometry.dispose()
      connectorMaterial.dispose()
      frameMaterials.forEach((material) => material.dispose())
      centerMaterials.forEach((material) => material.dispose())
      labelTextures.forEach((texture) => texture.dispose())
      labelMaterials.forEach((material) => material.dispose())
      group.clear()
    },
  }
}
