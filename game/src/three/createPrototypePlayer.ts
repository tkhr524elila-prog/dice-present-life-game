import * as THREE from 'three'

type PrototypePlayer = {
  group: THREE.Group
  dispose: () => void
}

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

  return {
    group,
    dispose: () => {
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
