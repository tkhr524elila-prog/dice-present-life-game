import * as THREE from 'three'

type PrototypePlayer = {
  group: THREE.Group
  moveTo: (targetPosition: THREE.Vector3) => Promise<void>
  update: (time: number) => void
  dispose: () => void
}

type MovementState = {
  start: THREE.Vector3
  target: THREE.Vector3
  startTime?: number
  resolve: () => void
}

const MOVE_DURATION = 450
const smoothStep = (progress: number) =>
  progress * progress * (3 - 2 * progress)

export const createPrototypePlayer = (
  startPosition: THREE.Vector3,
): PrototypePlayer => {
  const group = new THREE.Group()
  group.name = 'PrototypePlayer'
  group.position.copy(startPosition)

  const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.7, 20)
  const headGeometry = new THREE.SphereGeometry(0.28, 24, 16)
  const directionMarkerGeometry = new THREE.ConeGeometry(0.13, 0.42, 4)

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x6257c9 })
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffd1ad })
  const directionMarkerMaterial = new THREE.MeshStandardMaterial({
    color: 0xff7043,
  })

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 0.38
  body.castShadow = true
  group.add(body)

  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.y = 0.92
  head.castShadow = true
  group.add(head)

  const directionMarker = new THREE.Mesh(
    directionMarkerGeometry,
    directionMarkerMaterial,
  )
  directionMarker.name = 'PrototypePlayerDirectionMarker'
  directionMarker.position.set(0.38, 0.92, 0)
  directionMarker.rotation.z = -Math.PI / 2
  directionMarker.castShadow = true
  group.add(directionMarker)

  let movementState: MovementState | undefined

  const moveTo = (targetPosition: THREE.Vector3) => {
    if (group.position.equals(targetPosition)) {
      return Promise.resolve()
    }

    const direction = targetPosition.clone().sub(group.position)
    group.rotation.y = -Math.atan2(direction.z, direction.x)

    return new Promise<void>((resolve) => {
      movementState = {
        start: group.position.clone(),
        target: targetPosition.clone(),
        resolve,
      }
    })
  }

  const update = (time: number) => {
    if (!movementState) return

    movementState.startTime ??= time
    const progress = Math.min(
      (time - movementState.startTime) / MOVE_DURATION,
      1,
    )
    group.position.lerpVectors(
      movementState.start,
      movementState.target,
      smoothStep(progress),
    )

    if (progress === 1) {
      const completedMovement = movementState
      group.position.copy(completedMovement.target)
      movementState = undefined
      completedMovement.resolve()
    }
  }

  return {
    group,
    moveTo,
    update,
    dispose: () => {
      movementState?.resolve()
      movementState = undefined
      bodyGeometry.dispose()
      headGeometry.dispose()
      directionMarkerGeometry.dispose()
      bodyMaterial.dispose()
      headMaterial.dispose()
      directionMarkerMaterial.dispose()
      group.clear()
    },
  }
}
