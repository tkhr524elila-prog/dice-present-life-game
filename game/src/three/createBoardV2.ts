import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { BOARD_SQUARES_V2 } from '../data/v2/boardDataV2'
import type { BoardSquareV2, RouteTypeV2 } from '../data/v2/boardTypesV2'

type BoardV2 = {
  group: THREE.Group
  startPosition: THREE.Vector3
  squarePositions: ReadonlyMap<string, THREE.Vector3>
  setCurrentSquare: (physicalId: string) => void
  setSelectedRoute: (route: 'playboy' | 'pure-love' | null) => void
  update: (time: number) => void
  dispose: () => void
}

const CHAPTER_COLORS = ['#66d177', '#4d9fe0', '#a16bd1', '#ee9948', '#e3ce6b']
const UP = new THREE.Vector3(0, 1, 0)

const getTone = (square: BoardSquareV2) => {
  const values = [square.points, square.health, square.love]
  const positive = values.some((value) => value > 0)
  const negative = values.some((value) => value < 0)
  if (positive && negative) return 'mixed'
  if (positive) return 'positive'
  if (negative) return 'negative'
  return 'neutral'
}

const getSquareColor = (square: BoardSquareV2) => {
  if (square.route === 'playboy') return '#b72d78'
  if (square.route === 'pure-love') return '#f3a8c8'
  if (square.squareType === 'present-draw') return '#f1c644'
  if (square.squareType === 'forced-stop') return '#eb873d'
  if (square.squareType === 'goal') return '#fff8d1'
  return {
    positive: '#48bfe3', negative: '#a85064', mixed: '#806caf', neutral: '#f1f3f4',
  }[getTone(square)]
}

const createFaceTexture = (square: BoardSquareV2) => {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')!
  const color = getSquareColor(square)
  const gradient = context.createLinearGradient(0, 0, 0, 512)
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(0.1, color)
  gradient.addColorStop(1, color)
  context.fillStyle = gradient
  context.fillRect(0, 0, 512, 512)
  context.strokeStyle = 'rgba(255,255,255,.5)'
  context.lineWidth = 16
  context.strokeRect(20, 20, 472, 472)
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.strokeStyle = 'rgba(34,29,53,.72)'
  context.lineWidth = 14
  context.fillStyle = square.route === 'pure-love' ? '#53354a' : '#ffffff'

  const centralLabel = square.squareType === 'present-draw'
    ? '🎁'
    : square.squareType === 'forced-stop'
      ? 'STOP'
      : square.squareType === 'goal'
        ? 'GOAL'
        : getTone(square) === 'positive'
          ? '★'
          : getTone(square) === 'negative'
            ? '⚠'
            : getTone(square) === 'mixed'
              ? '↕'
              : ''
  if (centralLabel) {
    context.font = centralLabel.length > 2 ? '900 82px sans-serif' : '900 142px sans-serif'
    context.strokeText(centralLabel, 256, 275)
    context.fillText(centralLabel, 256, 275)
  }
  context.textAlign = 'left'
  context.textBaseline = 'top'
  context.font = '900 58px sans-serif'
  context.strokeText(square.displayId, 38, 34)
  context.fillText(square.displayId, 38, 34)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.center.set(0.5, 0.5)
  texture.rotation = Math.PI
  return texture
}

export const createBoardV2 = (): BoardV2 => {
  const group = new THREE.Group()
  group.name = 'Board-120PhysicalSquares'
  const frameGeometry = new RoundedBoxGeometry(1.68, 0.3, 1.68, 3, 0.13)
  const centerGeometry = new RoundedBoxGeometry(1.46, 0.2, 1.46, 3, 0.085)
  const connectorGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1, 10)
  const connectorMaterials = {
    common: new THREE.MeshStandardMaterial({ color: 0xdbe2c4 }),
    playboy: new THREE.MeshStandardMaterial({ color: 0x9c4bb1 }),
    'pure-love': new THREE.MeshStandardMaterial({ color: 0xf4d8e7 }),
  } as const
  const materials = new Set<THREE.Material>(Object.values(connectorMaterials))
  const sharedMaterials = new Map<string, THREE.MeshStandardMaterial>()
  const textures = new Set<THREE.Texture>()
  const textureCache = new Map<string, THREE.Texture>()
  const topMaterials = new Map<string, THREE.MeshStandardMaterial>()
  const squarePositions = new Map<string, THREE.Vector3>()
  const routeObjects = new Map<RouteTypeV2, THREE.Object3D[]>()
  const animated: Array<{
    square: BoardSquareV2
    center: THREE.Mesh
    material: THREE.MeshStandardMaterial
    baseY: number
  }> = []
  let selectedRoute: 'playboy' | 'pure-love' | null = null
  let currentPhysicalId = '001'

  const getSharedMaterial = (key: string, color: string, roughness: number) => {
    const cached = sharedMaterials.get(key)
    if (cached) return cached
    const value = new THREE.MeshStandardMaterial({ color, roughness })
    sharedMaterials.set(key, value)
    materials.add(value)
    return value
  }

  BOARD_SQUARES_V2.forEach((square) => {
    const source = square.positionPlaceholder
    if (!source) throw new Error(`${square.physicalId}の3D座標がありません。`)
    squarePositions.set(square.physicalId, new THREE.Vector3(source.x, source.y, source.z))
    routeObjects.set(square.route, routeObjects.get(square.route) ?? [])
  })

  const addRouteObject = (route: RouteTypeV2, object: THREE.Object3D) => {
    routeObjects.get(route)!.push(object)
    group.add(object)
  }

  const connectorKeys = new Set<string>()
  BOARD_SQUARES_V2.forEach((square) => {
    const from = squarePositions.get(square.physicalId)!
    square.nextPhysicalIds.forEach((nextId) => {
      const key = `${square.physicalId}:${nextId}`
      if (connectorKeys.has(key)) return
      connectorKeys.add(key)
      const to = squarePositions.get(nextId)
      if (!to) return
      const direction = to.clone().sub(from)
      const connectorRoute = square.progress === 40 || nextId === '061' ? 'common' : square.route
      const connector = new THREE.Mesh(connectorGeometry, connectorMaterials[connectorRoute])
      connector.name = `PathV2-${key}`
      connector.position.copy(from).add(to).multiplyScalar(0.5)
      connector.quaternion.setFromUnitVectors(UP, direction.clone().normalize())
      connector.scale.y = direction.length()
      connector.castShadow = true
      addRouteObject(
        connectorRoute,
        connector,
      )
    })
  })

  BOARD_SQUARES_V2.forEach((square) => {
    const position = squarePositions.get(square.physicalId)!
    const frameColor = square.route === 'playboy'
      ? '#6f3a9b'
      : square.route === 'pure-love'
        ? '#fff0f7'
        : CHAPTER_COLORS[square.chapter - 1]!
    const squareColor = getSquareColor(square)
    const frameMaterial = getSharedMaterial(`frame:${frameColor}`, frameColor, 0.58)
    const sideMaterial = getSharedMaterial(`side:${squareColor}`, squareColor, 0.62)
    const texture = textureCache.get(square.physicalId) ?? createFaceTexture(square)
    textureCache.set(square.physicalId, texture)
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: texture,
      emissive: getSquareColor(square),
      emissiveIntensity: 0.07,
      roughness: 0.6,
    })
    materials.add(frameMaterial)
    materials.add(sideMaterial)
    materials.add(topMaterial)
    textures.add(texture)
    topMaterials.set(square.physicalId, topMaterial)

    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    frame.name = `SquareV2-Frame-${square.physicalId}`
    frame.position.copy(position)
    frame.castShadow = true
    const center = new THREE.Mesh(centerGeometry, [
      sideMaterial, sideMaterial, topMaterial, sideMaterial, sideMaterial, sideMaterial,
    ])
    center.name = `SquareV2-${square.physicalId}-${square.squareType}`
    center.position.copy(position)
    center.position.y += 0.2
    center.castShadow = true
    addRouteObject(square.route, frame)
    addRouteObject(square.route, center)
    if (square.squareType !== 'normal') {
      animated.push({ square, center, material: topMaterial, baseY: center.position.y })
    }
  })

  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide,
  })
  materials.add(markerMaterial)
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.12, 40), markerMaterial)
  marker.rotation.x = -Math.PI / 2
  marker.position.copy(squarePositions.get('001')!)
  marker.position.y += 0.38
  group.add(marker)

  const updateRouteVisibility = () => {
    ;(['playboy', 'pure-love'] as const).forEach((route) => {
      const active = selectedRoute === null || selectedRoute === route
      routeObjects.get(route)?.forEach((object) => {
        object.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return
          const meshMaterials = Array.isArray(child.material) ? child.material : [child.material]
          meshMaterials.forEach((material) => {
            material.transparent = !active
            material.opacity = active ? 1 : 0.3
          })
        })
      })
    })
  }

  return {
    group,
    startPosition: squarePositions.get('001')!.clone().add(new THREE.Vector3(-0.4, 0.4, 0.35)),
    squarePositions,
    setCurrentSquare: (physicalId) => {
      const previousMaterial = topMaterials.get(currentPhysicalId)
      if (previousMaterial) previousMaterial.emissiveIntensity = 0.07
      currentPhysicalId = physicalId
      const currentMaterial = topMaterials.get(currentPhysicalId)
      if (currentMaterial) currentMaterial.emissiveIntensity = 0.38
      const position = squarePositions.get(physicalId)
      if (position) marker.position.set(position.x, position.y + 0.38, position.z)
    },
    setSelectedRoute: (route) => {
      selectedRoute = route
      updateRouteVisibility()
    },
    update: (time) => {
      const seconds = time / 1_000
      animated.forEach(({ square, center, material, baseY }) => {
        const wave = (Math.sin(seconds * 1.2 + square.progress * 0.4) + 1) / 2
        center.position.y = baseY
        material.emissiveIntensity = square.physicalId === currentPhysicalId ? 0.38 : 0.05
        if (square.squareType === 'present-draw') {
          center.position.y += Math.sin(seconds * 1.25 + square.progress) * 0.045
          material.emissiveIntensity += 0.1 + wave * 0.12
        } else if (square.squareType === 'forced-stop' || square.squareType === 'goal') {
          material.emissiveIntensity += 0.1 + wave * 0.18
        }
      })
      markerMaterial.opacity = 0.58 + Math.sin(seconds * 2.2) * 0.18
    },
    dispose: () => {
      frameGeometry.dispose()
      centerGeometry.dispose()
      connectorGeometry.dispose()
      materials.forEach((material) => material.dispose())
      textures.forEach((texture) => texture.dispose())
      textureCache.clear()
      sharedMaterials.clear()
      topMaterials.clear()
      group.clear()
    },
  }
}
