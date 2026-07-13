import * as THREE from 'three'
import { BOARD_SQUARES, type BoardSquareData } from '../data/boardData'

const FRAME_SIZE = 1.55
const CENTER_SIZE = 1.2
const SQUARE_HEIGHT = 0.24
const UP_AXIS = new THREE.Vector3(0, 1, 0)
const PLAYER_REAR_OFFSET = 0.58

type AnimatedSquare = {
  square: BoardSquareData
  center: THREE.Mesh
  topMaterial: THREE.MeshStandardMaterial
  baseY: number
  auraMaterial?: THREE.MeshBasicMaterial
}

type Board = {
  group: THREE.Group
  startPosition: THREE.Vector3
  squarePositions: readonly THREE.Vector3[]
  update: (time: number) => void
  dispose: () => void
}

const drawStar = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  outerRadius: number,
) => {
  context.beginPath()
  for (let point = 0; point < 10; point += 1) {
    const radius = point % 2 === 0 ? outerRadius : outerRadius * 0.45
    const angle = -Math.PI / 2 + (point * Math.PI) / 5
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    if (point === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  context.closePath()
  context.fill()
}

const drawWarning = (context: CanvasRenderingContext2D) => {
  context.fillStyle = '#ffe0d8'
  context.strokeStyle = '#6e1728'
  context.lineWidth = 18
  context.lineJoin = 'round'
  context.beginPath()
  context.moveTo(256, 74)
  context.lineTo(352, 238)
  context.lineTo(160, 238)
  context.closePath()
  context.fill()
  context.stroke()
  context.fillStyle = '#6e1728'
  context.font = '900 120px sans-serif'
  context.fillText('!', 256, 184)
}

const drawGift = (context: CanvasRenderingContext2D) => {
  context.fillStyle = '#7a4b13'
  context.fillRect(176, 112, 160, 118)
  context.fillStyle = '#fff1a6'
  context.fillRect(244, 112, 24, 118)
  context.fillRect(160, 88, 192, 38)
  context.strokeStyle = '#7a4b13'
  context.lineWidth = 18
  context.beginPath()
  context.arc(225, 79, 38, Math.PI * 0.05, Math.PI * 1.42)
  context.stroke()
  context.beginPath()
  context.arc(287, 79, 38, Math.PI * 1.58, Math.PI * 0.95)
  context.stroke()
}

const getTextColor = (square: BoardSquareData) =>
  square.type === 'gift' || square.type === 'goal' ? '#4f3e18' : '#ffffff'

const drawOutlinedText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
) => {
  context.font = font
  context.lineWidth = 18
  context.strokeStyle = 'rgba(33, 32, 54, 0.68)'
  context.strokeText(text, x, y)
  context.fillStyle = color
  context.fillText(text, x, y)
}

const createSquareFaceTexture = (square: BoardSquareData) => {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')!
  const textColor = getTextColor(square)

  context.fillStyle = square.squareColor
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = 'rgba(255, 255, 255, 0.28)'
  context.lineWidth = 20
  context.strokeRect(18, 18, 476, 476)
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  if (square.type === 'gift') {
    context.save()
    context.translate(150, 214)
    context.scale(0.66, 0.66)
    context.translate(-256, -159)
    drawGift(context)
    context.restore()
    drawOutlinedText(context, '抽選', 150, 300, '900 54px sans-serif', '#4f3e18')
  } else if (square.type === 'stop') {
    drawOutlinedText(context, 'STOP', 158, 224, '900 72px sans-serif', '#fff5ec')
  } else if (square.type === 'goal') {
    drawOutlinedText(context, 'GOAL', 158, 224, '900 70px sans-serif', '#fff8d1')
  } else if (square.effectTone === 'positive') {
    context.fillStyle = '#fff2a1'
    context.strokeStyle = '#287796'
    context.lineWidth = 14
    drawStar(context, 150, 220, 62)
    context.stroke()
  } else if (square.effectTone === 'negative') {
    context.save()
    context.translate(-106, 58)
    drawWarning(context)
    context.restore()
  } else if (square.effectTone === 'mixed') {
    drawOutlinedText(context, '↕', 150, 220, '900 132px sans-serif', '#f3e9ff')
  }

  const hasMarker = square.type !== 'normal' || square.effectTone !== 'neutral'
  drawOutlinedText(
    context,
    String(square.id),
    256,
    hasMarker ? 78 : 150,
    `900 ${square.id < 10 ? 150 : 130}px sans-serif`,
    textColor,
  )

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const getAuraColor = (square: BoardSquareData) => {
  if (square.type === 'gift' || square.type === 'goal') return 0xffdf63
  if (square.type === 'stop' || square.effectTone === 'negative') return 0xd43c4f
  return undefined
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
  const auraGeometry = new THREE.RingGeometry(0.72, 0.98, 32)
  const connectorMaterial = new THREE.MeshStandardMaterial({ color: 0xdbe2c4 })
  const frameMaterials = new Map<string, THREE.MeshStandardMaterial>()
  const sideMaterials = new Map<string, THREE.MeshStandardMaterial>()
  const faceTextures: THREE.CanvasTexture[] = []
  const topMaterials: THREE.MeshStandardMaterial[] = []
  const auraMaterials: THREE.MeshBasicMaterial[] = []
  const animatedSquares: AnimatedSquare[] = []

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
    if (square.type === 'goal') frame.scale.set(1.08, 1, 1.08)
    frame.castShadow = true
    frame.receiveShadow = true
    group.add(frame)

    const faceTexture = createSquareFaceTexture(square)
    const sideMaterial = getMaterial(sideMaterials, square.squareColor)
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: faceTexture,
      emissive: square.squareColor,
      emissiveIntensity: 0.06,
      roughness: 0.64,
      metalness: square.type === 'goal' ? 0.18 : 0.03,
    })
    const center = new THREE.Mesh(centerGeometry, [
      sideMaterial,
      sideMaterial,
      topMaterial,
      sideMaterial,
      sideMaterial,
      sideMaterial,
    ])
    center.name = `SquareCenter-${square.id}-${square.type}`
    center.position.copy(position)
    center.position.y += SQUARE_HEIGHT * 0.57
    if (square.type === 'goal') center.scale.set(1.06, 1, 1.06)
    center.castShadow = true
    center.receiveShadow = true
    group.add(center)

    const auraColor = getAuraColor(square)
    let auraMaterial: THREE.MeshBasicMaterial | undefined
    if (auraColor !== undefined) {
      auraMaterial = new THREE.MeshBasicMaterial({
        color: auraColor,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      const aura = new THREE.Mesh(auraGeometry, auraMaterial)
      aura.name = `SquareAura-${square.id}`
      aura.position.copy(position)
      aura.position.y += SQUARE_HEIGHT * 0.62
      aura.rotation.x = -Math.PI / 2
      group.add(aura)
      auraMaterials.push(auraMaterial)
    }

    faceTextures.push(faceTexture)
    topMaterials.push(topMaterial)
    animatedSquares.push({
      square,
      center,
      topMaterial,
      baseY: center.position.y,
      auraMaterial,
    })
  })

  const squarePositions = rawPositions.map((position) =>
    position
      .clone()
      .add(new THREE.Vector3(0, SQUARE_HEIGHT * 1.12, PLAYER_REAR_OFFSET)),
  )

  const update = (time: number) => {
    const seconds = time / 1_000

    animatedSquares.forEach(
      ({ square, center, topMaterial, baseY, auraMaterial }) => {
        const slowWave = (Math.sin(seconds * 1.35 + square.id * 0.47) + 1) / 2

        center.position.y = baseY
        topMaterial.emissiveIntensity = 0.04
        if (auraMaterial) auraMaterial.opacity = 0.06

        if (square.type === 'gift') {
          center.position.y = baseY + Math.sin(seconds * 1.25 + square.id) * 0.045
          topMaterial.emissiveIntensity = 0.12 + slowWave * 0.16
          if (auraMaterial) auraMaterial.opacity = 0.06 + slowWave * 0.12
        } else if (square.type === 'stop') {
          topMaterial.emissiveIntensity = 0.1 + slowWave * 0.19
          if (auraMaterial) auraMaterial.opacity = 0.08 + slowWave * 0.13
        } else if (square.type === 'goal') {
          center.position.y = baseY + Math.sin(seconds * 1.05) * 0.025
          topMaterial.emissiveIntensity = 0.2 + slowWave * 0.23
          if (auraMaterial) auraMaterial.opacity = 0.11 + slowWave * 0.16
        } else if (square.effectTone === 'positive') {
          topMaterial.emissiveIntensity = 0.09 + slowWave * 0.17
        } else if (square.effectTone === 'negative') {
          topMaterial.emissiveIntensity = 0.05 + slowWave * 0.13
          if (auraMaterial) auraMaterial.opacity = 0.06 + slowWave * 0.12
        } else if (square.effectTone === 'mixed') {
          topMaterial.emissiveIntensity = 0.06 + slowWave * 0.1
        }
      },
    )
  }

  return {
    group,
    startPosition: squarePositions[0].clone(),
    squarePositions,
    update,
    dispose: () => {
      frameGeometry.dispose()
      centerGeometry.dispose()
      connectorGeometry.dispose()
      auraGeometry.dispose()
      connectorMaterial.dispose()
      frameMaterials.forEach((material) => material.dispose())
      sideMaterials.forEach((material) => material.dispose())
      faceTextures.forEach((texture) => texture.dispose())
      topMaterials.forEach((material) => material.dispose())
      auraMaterials.forEach((material) => material.dispose())
      group.clear()
    },
  }
}
