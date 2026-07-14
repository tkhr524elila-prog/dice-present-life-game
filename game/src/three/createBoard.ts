import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { BOARD_SQUARES, type BoardSquareData } from '../data/boardData'

const FRAME_SIZE = 1.68
const CENTER_SIZE = 1.46
const FRAME_HEIGHT = 0.3
const CENTER_HEIGHT = 0.2
const CENTER_RAISE = 0.2
const UP_AXIS = new THREE.Vector3(0, 1, 0)
const PLAYER_SIDE_OFFSET = -0.42
const PLAYER_REAR_OFFSET = 0.38

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
  setCurrentSquare: (squareNumber: number) => void
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
  context.moveTo(256, 164)
  context.lineTo(356, 338)
  context.lineTo(156, 338)
  context.closePath()
  context.fill()
  context.stroke()
  context.fillStyle = '#6e1728'
  context.font = '900 120px sans-serif'
  context.fillText('!', 256, 278)
}

const drawGift = (context: CanvasRenderingContext2D) => {
  context.fillStyle = '#7a4b13'
  context.fillRect(176, 192, 160, 118)
  context.fillStyle = '#fff1a6'
  context.fillRect(244, 192, 24, 118)
  context.fillRect(160, 168, 192, 38)
  context.strokeStyle = '#7a4b13'
  context.lineWidth = 18
  context.beginPath()
  context.arc(225, 159, 38, Math.PI * 0.05, Math.PI * 1.42)
  context.stroke()
  context.beginPath()
  context.arc(287, 159, 38, Math.PI * 1.58, Math.PI * 0.95)
  context.stroke()
}

const getTextColor = (square: BoardSquareData) =>
  square.type === 'gift' ||
  square.type === 'goal' ||
  square.effectTone === 'neutral'
    ? '#3e3d4a'
    : '#ffffff'

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
  canvas.width = 768
  canvas.height = 768
  const context = canvas.getContext('2d')!
  context.scale(1.5, 1.5)
  const textColor = getTextColor(square)

  const surfaceGradient = context.createLinearGradient(0, 0, 0, 512)
  surfaceGradient.addColorStop(0, '#ffffff')
  surfaceGradient.addColorStop(0.07, square.squareColor)
  surfaceGradient.addColorStop(1, square.squareColor)
  context.fillStyle = surfaceGradient
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = 'rgba(255, 255, 255, 0.42)'
  context.lineWidth = 18
  context.strokeRect(22, 22, 468, 468)
  context.fillStyle = 'rgba(255, 255, 255, 0.1)'
  context.beginPath()
  context.arc(256, 272, 170, 0, Math.PI * 2)
  context.fill()
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  if (square.type === 'gift') {
    drawGift(context)
    drawOutlinedText(context, '抽選', 256, 382, '900 58px sans-serif', '#4f3e18')
  } else if (square.type === 'stop') {
    drawOutlinedText(context, 'STOP', 256, 280, '900 92px sans-serif', '#fff5ec')
  } else if (square.type === 'goal') {
    drawOutlinedText(context, 'GOAL', 256, 280, '900 86px sans-serif', '#fff8d1')
    context.fillStyle = '#fff8d1'
    drawStar(context, 400, 160, 24)
    drawStar(context, 402, 390, 17)
  } else if (square.effectTone === 'positive') {
    context.fillStyle = '#fff2a1'
    context.strokeStyle = '#287796'
    context.lineWidth = 14
    drawStar(context, 256, 280, 104)
    context.stroke()
  } else if (square.effectTone === 'negative') {
    drawWarning(context)
  } else if (square.effectTone === 'mixed') {
    drawOutlinedText(context, '↕', 256, 282, '900 168px sans-serif', '#f3e9ff')
  }

  context.textAlign = 'left'
  context.textBaseline = 'top'
  drawOutlinedText(
    context,
    String(square.id),
    46,
    42,
    `900 ${square.id < 10 ? 68 : 62}px sans-serif`,
    textColor,
  )

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.center.set(0.5, 0.5)
  texture.rotation = Math.PI
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

  const frameGeometry = new RoundedBoxGeometry(
    FRAME_SIZE,
    FRAME_HEIGHT,
    FRAME_SIZE,
    3,
    0.13,
  )
  const centerGeometry = new RoundedBoxGeometry(
    CENTER_SIZE,
    CENTER_HEIGHT,
    CENTER_SIZE,
    3,
    0.085,
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
  let currentSquareNumber = 1

  const getMaterial = (
    cache: Map<string, THREE.MeshStandardMaterial>,
    color: string,
  ) => {
    const existing = cache.get(color)
    if (existing) return existing

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.58,
      metalness: 0.06,
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
    center.position.y += CENTER_RAISE
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
      aura.position.y += CENTER_RAISE + CENTER_HEIGHT * 0.52
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

  const currentMarkerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const currentMarker = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1.12, 40),
    currentMarkerMaterial,
  )
  currentMarker.name = 'CurrentSquareMarker'
  currentMarker.rotation.x = -Math.PI / 2
  currentMarker.position.copy(rawPositions[0]!)
  currentMarker.position.y += CENTER_RAISE + CENTER_HEIGHT * 0.66
  group.add(currentMarker)

  const sparklePositions = new Float32Array(18 * 3)
  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * Math.PI * 2
    sparklePositions[index * 3] = Math.cos(angle) * (1.25 + (index % 3) * 0.2)
    sparklePositions[index * 3 + 1] = 0.35 + (index % 5) * 0.32
    sparklePositions[index * 3 + 2] = Math.sin(angle) * (1.25 + (index % 3) * 0.2)
  }
  const sparkleGeometry = new THREE.BufferGeometry()
  sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3))
  const sparkleMaterial = new THREE.PointsMaterial({
    color: 0xffdf70,
    size: 0.17,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  })
  const goalSparkles = new THREE.Points(sparkleGeometry, sparkleMaterial)
  goalSparkles.position.copy(rawPositions[59]!)
  goalSparkles.position.y += 0.4
  group.add(goalSparkles)

  const squarePositions = rawPositions.map((position) =>
    position
      .clone()
      .add(
        new THREE.Vector3(
          PLAYER_SIDE_OFFSET,
          CENTER_RAISE + CENTER_HEIGHT * 0.52,
          PLAYER_REAR_OFFSET,
        ),
      ),
  )

  const update = (time: number) => {
    const seconds = time / 1_000

    animatedSquares.forEach(
      ({ square, center, topMaterial, baseY, auraMaterial }) => {
        const slowWave = (Math.sin(seconds * 1.35 + square.id * 0.47) + 1) / 2

        center.position.y = baseY
        topMaterial.emissiveIntensity = square.id < currentSquareNumber ? 0.025 : 0.04
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

        if (square.id === currentSquareNumber) {
          topMaterial.emissiveIntensity += 0.28 + slowWave * 0.2
        } else if (square.id > currentSquareNumber && square.id <= currentSquareNumber + 3) {
          topMaterial.emissiveIntensity += 0.06
        }
      },
    )
    currentMarkerMaterial.opacity = 0.5 + Math.sin(seconds * 2.1) * 0.18
    currentMarker.scale.setScalar(1 + Math.sin(seconds * 1.8) * 0.035)
    goalSparkles.rotation.y = seconds * 0.28
    sparkleMaterial.opacity = currentSquareNumber === 60
      ? 0.55 + Math.sin(seconds * 2.4) * 0.25
      : 0
  }

  return {
    group,
    startPosition: squarePositions[0].clone(),
    squarePositions,
    setCurrentSquare: (squareNumber) => {
      currentSquareNumber = Math.min(60, Math.max(1, squareNumber))
      const position = rawPositions[currentSquareNumber - 1]
      if (!position) return
      currentMarker.position.copy(position)
      currentMarker.position.y += CENTER_RAISE + CENTER_HEIGHT * 0.66
      currentMarkerMaterial.color.set(currentSquareNumber === 60 ? 0xffdc69 : 0xffffff)
    },
    update,
    dispose: () => {
      frameGeometry.dispose()
      centerGeometry.dispose()
      connectorGeometry.dispose()
      auraGeometry.dispose()
      currentMarker.geometry.dispose()
      currentMarkerMaterial.dispose()
      sparkleGeometry.dispose()
      sparkleMaterial.dispose()
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
