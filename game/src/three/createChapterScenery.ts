import * as THREE from 'three'
import type { ChapterNumber } from '../data/boardData'
import { BOARD_SQUARES_V2 } from '../data/v2/boardDataV2'

type ChapterScenery = {
  group: THREE.Group
  setChapter: (chapter: ChapterNumber) => void
  update: (time: number) => void
  dispose: () => void
}

const getAnchor = (progress: number) => {
  const candidates = BOARD_SQUARES_V2.filter((square) => square.progress === progress)
  const positions = candidates
    .map(({ positionPlaceholder }) => positionPlaceholder)
    .filter((position) => position !== null)
  const average = positions.reduce<THREE.Vector3>(
    (sum, position) => sum.add(new THREE.Vector3(position.x, position.y, position.z)),
    new THREE.Vector3(),
  ).divideScalar(Math.max(1, positions.length))
  return average
}

const getPhysicalAnchor = (physicalId: string) => {
  const position = BOARD_SQUARES_V2.find((square) => square.physicalId === physicalId)?.positionPlaceholder
  if (!position) throw new Error(`${physicalId}の背景用座標がありません。`)
  return new THREE.Vector3(position.x, position.y, position.z)
}

export const createChapterScenery = (): ChapterScenery => {
  const group = new THREE.Group()
  group.name = 'ChapterScenery'
  const chapterGroups = new Map<ChapterNumber, THREE.Group>()
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const animated: Array<{ object: THREE.Object3D; baseY: number; speed: number }> = []
  let currentChapter: ChapterNumber = 1

  const material = (color: number, emissive = 0x000000) => {
    const value = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: emissive ? 0.4 : 0,
      roughness: 0.75,
    })
    materials.add(value)
    return value
  }
  const addMesh = (
    parent: THREE.Group,
    geometry: THREE.BufferGeometry,
    meshMaterial: THREE.Material,
    position: THREE.Vector3,
  ) => {
    geometries.add(geometry)
    materials.add(meshMaterial)
    const mesh = new THREE.Mesh(geometry, meshMaterial)
    mesh.position.copy(position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }
  const chapterGroup = (chapter: ChapterNumber) => {
    const value = new THREE.Group()
    value.name = `ChapterScenery-${chapter}`
    chapterGroups.set(chapter, value)
    group.add(value)
    return value
  }

  // 第1章：草原、花、本
  {
    const parent = chapterGroup(1)
    const green = material(0x4f9d5d)
    const flowerColors = [0xffd65a, 0xff8fa3, 0xf8f4ff]
    ;[3, 8, 13, 18].forEach((squareId, index) => {
      const anchor = getAnchor(squareId)
      const side = index % 2 === 0 ? -1 : 1
      for (let flower = 0; flower < 3; flower += 1) {
        const x = anchor.x + side * (4.5 + flower * 0.55)
        const z = anchor.z + (flower - 1) * 0.7
        addMesh(parent, new THREE.CylinderGeometry(0.035, 0.05, 0.55, 6), green, new THREE.Vector3(x, -0.78, z))
        addMesh(parent, new THREE.SphereGeometry(0.13, 10, 8), material(flowerColors[(index + flower) % flowerColors.length]!), new THREE.Vector3(x, -0.48, z))
      }
    })
    const bookAnchor = getAnchor(10)
    const book = addMesh(parent, new THREE.BoxGeometry(1.25, 0.16, 0.88), material(0x476fb3), bookAnchor.clone().add(new THREE.Vector3(6, -0.78, 0)))
    book.rotation.y = -0.28
    addMesh(parent, new THREE.BoxGeometry(1.08, 0.1, 0.74), material(0xf7e8c6), book.position.clone().add(new THREE.Vector3(0, 0.13, 0)))
  }

  // 第2章：建物と街灯
  {
    const parent = chapterGroup(2)
    ;[23, 28, 34, 39].forEach((squareId, index) => {
      const anchor = getAnchor(squareId)
      const side = index % 2 === 0 ? 1 : -1
      const building = addMesh(parent, new THREE.BoxGeometry(2.4, 3 + index * 0.35, 2.2), material(index % 2 ? 0x536c82 : 0x657f93), anchor.clone().add(new THREE.Vector3(side * 7, 0.45 + index * 0.18, 0)))
      const windowMaterial = material(0xffdc82, 0xffb43c)
      for (let floor = 0; floor < 2; floor += 1) {
        addMesh(parent, new THREE.BoxGeometry(0.38, 0.32, 0.05), windowMaterial, building.position.clone().add(new THREE.Vector3(-0.55, 0.3 + floor * 0.75, side > 0 ? -1.13 : 1.13)))
        addMesh(parent, new THREE.BoxGeometry(0.38, 0.32, 0.05), windowMaterial, building.position.clone().add(new THREE.Vector3(0.55, 0.3 + floor * 0.75, side > 0 ? -1.13 : 1.13)))
      }
      const lampX = anchor.x - side * 4
      addMesh(parent, new THREE.CylinderGeometry(0.07, 0.1, 1.8, 8), material(0x3d4650), new THREE.Vector3(lampX, -0.2, anchor.z + 0.4))
      const lamp = addMesh(parent, new THREE.SphereGeometry(0.2, 12, 8), material(0xffe6a1, 0xffc74e), new THREE.Vector3(lampX, 0.75, anchor.z + 0.4))
      animated.push({ object: lamp, baseY: lamp.position.y, speed: 0.75 + index * 0.08 })
    })
  }

  // 第3章：ネオン看板
  {
    const parent = chapterGroup(3)
    const neonColors = [0xff4fac, 0x65d8ff, 0xb98cff]
    ;[43, 48, 53, 58].forEach((squareId, index) => {
      const anchor = getAnchor(squareId)
      const side = index % 2 === 0 ? -1 : 1
      const signMaterial = material(neonColors[index % neonColors.length]!, neonColors[index % neonColors.length]!)
      const sign = addMesh(parent, new THREE.TorusGeometry(0.7, 0.08, 8, 24), signMaterial, anchor.clone().add(new THREE.Vector3(side * 6.5, 1.2, 0)))
      sign.rotation.x = Math.PI / 2
      animated.push({ object: sign, baseY: sign.position.y, speed: 1 + index * 0.12 })
      addMesh(parent, new THREE.BoxGeometry(0.1, 2.7, 0.1), material(0x392c4c), anchor.clone().add(new THREE.Vector3(side * 6.5, 0, 0)))
    })
  }

  // 第4章：家、木、公園
  {
    const parent = chapterGroup(4)
    ;[65, 72, 79].forEach((squareId, index) => {
      const anchor = getAnchor(squareId)
      const side = index % 2 === 0 ? 1 : -1
      const homePosition = anchor.clone().add(new THREE.Vector3(side * 7, -0.1, 0))
      addMesh(parent, new THREE.BoxGeometry(2.2, 1.8, 2), material(index % 2 ? 0xf1b071 : 0xe59669), homePosition)
      const roof = addMesh(parent, new THREE.ConeGeometry(1.75, 1.15, 4), material(0x9e5360), homePosition.clone().add(new THREE.Vector3(0, 1.45, 0)))
      roof.rotation.y = Math.PI / 4
      const treeX = anchor.x - side * 5
      addMesh(parent, new THREE.CylinderGeometry(0.14, 0.2, 1.5, 8), material(0x7b5230), new THREE.Vector3(treeX, -0.28, anchor.z + 0.5))
      addMesh(parent, new THREE.SphereGeometry(0.75, 14, 10), material(0x5ba65e), new THREE.Vector3(treeX, 0.75, anchor.z + 0.5))
    })
  }

  // 第5章：山、雲、金色の道標
  {
    const parent = chapterGroup(5)
    ;[84, 92, 99].forEach((squareId, index) => {
      const anchor = getAnchor(squareId)
      const side = index % 2 === 0 ? -1 : 1
      const mountain = addMesh(parent, new THREE.ConeGeometry(2.8 + index * 0.35, 5.5 + index, 5), material(index === 2 ? 0xd8c276 : 0xb7cbd7), anchor.clone().add(new THREE.Vector3(side * 8, 1.35 + index * 0.5, 1)))
      mountain.rotation.y = index * 0.35
      const cloud = new THREE.Group()
      ;[-0.45, 0, 0.48].forEach((offset, cloudIndex) => {
        addMesh(cloud, new THREE.SphereGeometry(0.55 + cloudIndex * 0.08, 12, 9), material(0xf4f9ff), new THREE.Vector3(offset, Math.abs(offset) * 0.25, 0))
      })
      cloud.position.copy(anchor).add(new THREE.Vector3(-side * 5.5, 4.4 + index * 0.5, 0))
      parent.add(cloud)
      animated.push({ object: cloud, baseY: cloud.position.y, speed: 0.4 + index * 0.08 })
    })
  }

  // 第3章：Aはネオン、Bはベンチと花で分岐を明確にする。
  {
    const parent = chapterGroups.get(3)!
    ;[42, 47, 52, 57].forEach((progress, index) => {
      const a = getPhysicalAnchor(`${String(progress).padStart(3, '0')}-A`)
      const neonColor = index % 2 ? 0xff4fa8 : 0x9c62ff
      const neon = addMesh(parent, new THREE.TorusGeometry(0.62, 0.075, 8, 24), material(neonColor, neonColor), a.clone().add(new THREE.Vector3(-2.8, 1.1, 0)))
      neon.rotation.x = Math.PI / 2
      animated.push({ object: neon, baseY: neon.position.y, speed: 1.05 + index * 0.08 })

      const b = getPhysicalAnchor(`${String(progress).padStart(3, '0')}-B`)
      const benchPosition = b.clone().add(new THREE.Vector3(2.7, -0.45, 0))
      addMesh(parent, new THREE.BoxGeometry(1.25, 0.16, 0.42), material(0xd7a97c), benchPosition)
      addMesh(parent, new THREE.BoxGeometry(0.12, 0.62, 0.12), material(0x806750), benchPosition.clone().add(new THREE.Vector3(-0.45, -0.28, 0)))
      addMesh(parent, new THREE.BoxGeometry(0.12, 0.62, 0.12), material(0x806750), benchPosition.clone().add(new THREE.Vector3(0.45, -0.28, 0)))
      ;[-0.65, 0.65].forEach((offset) => {
        addMesh(parent, new THREE.SphereGeometry(0.14, 10, 8), material(0xffd4e5, 0xff94c2), b.clone().add(new THREE.Vector3(2.7 + offset, -0.35, 0.65)))
      })
    })

    const branch = getPhysicalAnchor('040')
    const branchPost = addMesh(parent, new THREE.CylinderGeometry(0.09, 0.12, 2.2, 8), material(0x61506f), branch.clone().add(new THREE.Vector3(0, 0.1, 1.25)))
    const aSign = addMesh(parent, new THREE.BoxGeometry(1.5, 0.42, 0.12), material(0xb72d78, 0x7a2057), branchPost.position.clone().add(new THREE.Vector3(-0.75, 0.5, 0)))
    const bSign = addMesh(parent, new THREE.BoxGeometry(1.5, 0.42, 0.12), material(0xf3a8c8, 0xe788b1), branchPost.position.clone().add(new THREE.Vector3(0.75, 0, 0)))
    aSign.rotation.y = -0.22; bSign.rotation.y = 0.22

    const merge = getPhysicalAnchor('061')
    const archMaterial = material(0xf2d58c, 0xdcae42)
    addMesh(parent, new THREE.BoxGeometry(0.18, 2.5, 0.18), archMaterial, merge.clone().add(new THREE.Vector3(-1.5, 0.2, -1)))
    addMesh(parent, new THREE.BoxGeometry(0.18, 2.5, 0.18), archMaterial, merge.clone().add(new THREE.Vector3(1.5, 0.2, -1)))
    addMesh(parent, new THREE.BoxGeometry(3.2, 0.2, 0.2), archMaterial, merge.clone().add(new THREE.Vector3(0, 1.45, -1)))
  }

  // 第5章：NISA2枠目の道標と、ゴールへ近づく金色の光。
  {
    const parent = chapterGroups.get(5)!
    const nisa = getPhysicalAnchor('083')
    const signMaterial = material(0x54a7b8, 0x53d3e5)
    addMesh(parent, new THREE.CylinderGeometry(0.08, 0.11, 2.1, 8), material(0x5e6570), nisa.clone().add(new THREE.Vector3(3, 0, 0)))
    const chartSign = addMesh(parent, new THREE.BoxGeometry(1.8, 1.05, 0.12), signMaterial, nisa.clone().add(new THREE.Vector3(3, 1.05, 0)))
    chartSign.rotation.y = -0.12
    ;[96, 98, 100].forEach((progress, progressIndex) => {
      const anchor = getPhysicalAnchor(String(progress).padStart(3, '0'))
      for (let particle = 0; particle < 6 + progressIndex * 4; particle += 1) {
        const angle = particle / (6 + progressIndex * 4) * Math.PI * 2
        const light = addMesh(parent, new THREE.SphereGeometry(0.06 + progressIndex * 0.02, 8, 6), material(0xffe48c, 0xffcf43), anchor.clone().add(new THREE.Vector3(Math.cos(angle) * (2.2 + progressIndex * 0.25), 0.4 + (particle % 4) * 0.5, Math.sin(angle) * 1.4)))
        animated.push({ object: light, baseY: light.position.y, speed: 0.65 + particle * 0.025 })
      }
    })
  }

  const setChapter = (chapter: ChapterNumber) => {
    currentChapter = chapter
    chapterGroups.forEach((chapterObject, chapterNumber) => {
      chapterObject.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const materialsToUpdate = Array.isArray(object.material)
            ? object.material
            : [object.material]
          materialsToUpdate.forEach((meshMaterial) => {
            if ('opacity' in meshMaterial) {
              meshMaterial.transparent = chapterNumber !== currentChapter
              meshMaterial.opacity = chapterNumber === currentChapter ? 1 : 0.32
            }
          })
        }
      })
    })
  }
  setChapter(1)

  return {
    group,
    setChapter,
    update: (time) => {
      const seconds = time / 1_000
      animated.forEach(({ object, baseY, speed }, index) => {
        object.position.y = baseY + Math.sin(seconds * speed + index) * 0.08
        object.rotation.y += 0.0006
      })
    },
    dispose: () => {
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((value) => value.dispose())
      group.clear()
    },
  }
}
