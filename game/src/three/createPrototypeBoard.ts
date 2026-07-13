import * as THREE from 'three'

const SQUARE_COUNT = 10
const SQUARE_SIZE = 1.4
const SQUARE_HEIGHT = 0.24

type PrototypeBoard = {
  group: THREE.Group
  startPosition: THREE.Vector3
  dispose: () => void
}

const createNumberTexture = (number: number, borderColor: string) => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256

  const context = canvas.getContext('2d')!
  context.fillStyle = 'rgba(255, 255, 255, 0.96)'
  context.strokeStyle = borderColor
  context.lineWidth = 18
  context.beginPath()
  context.arc(128, 128, 104, 0, Math.PI * 2)
  context.fill()
  context.stroke()

  context.fillStyle = '#2f3158'
  context.font = 'bold 128px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(String(number), 128, 140)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export const createPrototypeBoard = (): PrototypeBoard => {
  const group = new THREE.Group()
  group.name = 'PrototypeBoard'

  const positions = Array.from({ length: SQUARE_COUNT }, (_, index) => {
    const progress = index / (SQUARE_COUNT - 1)
    return new THREE.Vector3(
      (index - (SQUARE_COUNT - 1) / 2) * 1.75,
      0,
      Math.sin(progress * Math.PI * 2) * 1.5,
    )
  })

  const squareGeometry = new THREE.BoxGeometry(
    SQUARE_SIZE,
    SQUARE_HEIGHT,
    SQUARE_SIZE,
  )
  const connectorGeometry = new THREE.BoxGeometry(1, 0.08, 0.3)
  const normalMaterial = new THREE.MeshStandardMaterial({ color: 0x73cdeb })
  const startMaterial = new THREE.MeshStandardMaterial({ color: 0xffcf5a })
  const goalMaterial = new THREE.MeshStandardMaterial({ color: 0xf47eae })
  const connectorMaterial = new THREE.MeshStandardMaterial({ color: 0xd9ebaf })
  const numberTextures: THREE.CanvasTexture[] = []
  const numberMaterials: THREE.SpriteMaterial[] = []

  positions.slice(0, -1).forEach((position, index) => {
    const nextPosition = positions[index + 1]
    const deltaX = nextPosition.x - position.x
    const deltaZ = nextPosition.z - position.z
    const length = Math.hypot(deltaX, deltaZ)
    const connector = new THREE.Mesh(connectorGeometry, connectorMaterial)
    connector.position.set(
      (position.x + nextPosition.x) / 2,
      0.04,
      (position.z + nextPosition.z) / 2,
    )
    connector.rotation.y = -Math.atan2(deltaZ, deltaX)
    connector.scale.x = length
    connector.receiveShadow = true
    group.add(connector)
  })

  positions.forEach((position, index) => {
    const number = index + 1
    const isStart = number === 1
    const isGoal = number === SQUARE_COUNT
    const material = isStart
      ? startMaterial
      : isGoal
        ? goalMaterial
        : normalMaterial
    const borderColor = isStart ? '#d49319' : isGoal ? '#c33f78' : '#3586ad'

    const square = new THREE.Mesh(squareGeometry, material)
    square.name = `PrototypeSquare-${number}`
    square.position.set(position.x, SQUARE_HEIGHT / 2, position.z)
    square.scale.setScalar(isStart || isGoal ? 1.08 : 1)
    square.castShadow = true
    square.receiveShadow = true
    group.add(square)

    const numberTexture = createNumberTexture(number, borderColor)
    const numberMaterial = new THREE.SpriteMaterial({ map: numberTexture })
    const numberLabel = new THREE.Sprite(numberMaterial)
    numberLabel.name = `PrototypeSquareLabel-${number}`
    numberLabel.position.set(position.x, 1.55, position.z)
    numberLabel.scale.set(0.72, 0.72, 0.72)
    group.add(numberLabel)
    numberTextures.push(numberTexture)
    numberMaterials.push(numberMaterial)
  })

  return {
    group,
    startPosition: positions[0].clone().setY(SQUARE_HEIGHT),
    dispose: () => {
      squareGeometry.dispose()
      connectorGeometry.dispose()
      normalMaterial.dispose()
      startMaterial.dispose()
      goalMaterial.dispose()
      connectorMaterial.dispose()
      numberTextures.forEach((texture) => texture.dispose())
      numberMaterials.forEach((material) => material.dispose())
      group.clear()
    },
  }
}
