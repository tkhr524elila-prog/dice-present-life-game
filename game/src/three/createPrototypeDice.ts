import * as THREE from 'three'

export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6

type RollState = {
  value: DiceValue
  duration: number
  startTime?: number
  lastTime?: number
  settleStart?: THREE.Quaternion
  target: THREE.Quaternion
  resolve: (value: DiceValue) => void
}

type PrototypeDice = {
  group: THREE.Group
  roll: () => Promise<DiceValue>
  update: (time: number) => void
  dispose: () => void
}

const FACE_VALUES = [3, 4, 1, 6, 2, 5] as const
const UP_AXIS = new THREE.Vector3(0, 1, 0)

const PIP_POSITIONS: Record<DiceValue, Array<[number, number]>> = {
  1: [[0.5, 0.5]],
  2: [[0.3, 0.3], [0.7, 0.7]],
  3: [[0.3, 0.3], [0.5, 0.5], [0.7, 0.7]],
  4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]],
  5: [[0.3, 0.3], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.7, 0.7]],
  6: [[0.3, 0.27], [0.7, 0.27], [0.3, 0.5], [0.7, 0.5], [0.3, 0.73], [0.7, 0.73]],
}

const createFaceTexture = (value: DiceValue) => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')!

  context.fillStyle = '#fffdf8'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#cfd4df'
  context.lineWidth = 12
  context.strokeRect(6, 6, canvas.width - 12, canvas.height - 12)

  context.fillStyle = value === 1 ? '#d63b3b' : '#202238'
  PIP_POSITIONS[value].forEach(([x, y]) => {
    context.beginPath()
    context.arc(x * canvas.width, y * canvas.height, 22, 0, Math.PI * 2)
    context.fill()
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const getTargetQuaternion = (value: DiceValue) => {
  const topRotation = new THREE.Quaternion()

  switch (value) {
    case 1:
      break
    case 2:
      topRotation.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
      break
    case 3:
      topRotation.setFromEuler(new THREE.Euler(0, 0, Math.PI / 2))
      break
    case 4:
      topRotation.setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2))
      break
    case 5:
      topRotation.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))
      break
    case 6:
      topRotation.setFromEuler(new THREE.Euler(Math.PI, 0, 0))
      break
  }

  const yawSteps = Math.floor(Math.random() * 4)
  const yawRotation = new THREE.Quaternion().setFromAxisAngle(
    UP_AXIS,
    yawSteps * Math.PI / 2,
  )
  return yawRotation.multiply(topRotation)
}

const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3

export const createPrototypeDice = (): PrototypeDice => {
  const group = new THREE.Group()
  group.name = 'PrototypeDice'
  group.position.set(0, 0.78, 4.2)

  const diceGeometry = new THREE.BoxGeometry(1.4, 1.4, 1.4)
  const faceTextures = FACE_VALUES.map((value) => createFaceTexture(value))
  const faceMaterials = faceTextures.map(
    (texture) => new THREE.MeshStandardMaterial({ map: texture }),
  )
  const dice = new THREE.Mesh(diceGeometry, faceMaterials)
  dice.castShadow = true
  dice.receiveShadow = true
  group.add(dice)

  const edgeGeometry = new THREE.EdgesGeometry(diceGeometry)
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x8d93a3 })
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
  group.add(edges)

  let rollState: RollState | undefined

  const roll = () => {
    if (rollState) {
      return Promise.resolve(rollState.value)
    }

    const value = (Math.floor(Math.random() * 6) + 1) as DiceValue

    return new Promise<DiceValue>((resolve) => {
      rollState = {
        value,
        duration: 1_000 + Math.random() * 300,
        target: getTargetQuaternion(value),
        resolve,
      }
    })
  }

  const update = (time: number) => {
    if (!rollState) return

    rollState.startTime ??= time
    rollState.lastTime ??= time
    const elapsed = time - rollState.startTime
    const progress = Math.min(elapsed / rollState.duration, 1)

    if (progress < 0.68) {
      const deltaSeconds = (time - rollState.lastTime) / 1_000
      const speed = 13 - progress * 7
      group.rotateX(deltaSeconds * speed)
      group.rotateY(deltaSeconds * speed * 0.82)
      group.rotateZ(deltaSeconds * speed * 0.58)
    } else {
      rollState.settleStart ??= group.quaternion.clone()
      const settleProgress = (progress - 0.68) / 0.32
      group.quaternion.slerpQuaternions(
        rollState.settleStart,
        rollState.target,
        easeOutCubic(settleProgress),
      )
    }

    rollState.lastTime = time

    if (progress === 1) {
      const completedRoll = rollState
      group.quaternion.copy(completedRoll.target)
      rollState = undefined
      completedRoll.resolve(completedRoll.value)
    }
  }

  return {
    group,
    roll,
    update,
    dispose: () => {
      rollState = undefined
      diceGeometry.dispose()
      edgeGeometry.dispose()
      edgeMaterial.dispose()
      faceTextures.forEach((texture) => texture.dispose())
      faceMaterials.forEach((material) => material.dispose())
      group.clear()
    },
  }
}
