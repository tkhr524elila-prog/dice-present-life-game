import * as THREE from 'three'

type WorldGroundV2 = { group: THREE.Group; dispose: () => void }

const CHAPTERS = [
  { start: 1, end: 20, base: '#76bd72', accent: '#b8e59a', motif: 'grass' },
  { start: 21, end: 40, base: '#7b8790', accent: '#aeb7bd', motif: 'stone' },
  { start: 41, end: 60, base: '#342c51', accent: '#5f3f72', motif: 'night' },
  { start: 61, end: 80, base: '#b8815f', accent: '#dfb178', motif: 'home' },
  { start: 81, end: 100, base: '#91adbf', accent: '#dbe8ef', motif: 'mountain' },
] as const

const createTexture = (base: string, accent: string, motif: string) => {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')!
  context.fillStyle = base
  context.fillRect(0, 0, 256, 256)
  context.globalAlpha = 0.3
  context.strokeStyle = accent
  context.fillStyle = accent
  for (let index = 0; index < 42; index += 1) {
    const x = (index * 71) % 256
    const y = (index * 47) % 256
    if (motif === 'stone') {
      context.strokeRect(x - 18, y - 10, 38, 22)
    } else if (motif === 'night') {
      context.beginPath(); context.arc(x, y, index % 3 + 1.5, 0, Math.PI * 2); context.fill()
    } else if (motif === 'mountain') {
      context.beginPath(); context.moveTo(x - 18, y + 10); context.lineTo(x, y - 12); context.lineTo(x + 18, y + 10); context.stroke()
    } else if (motif === 'home') {
      context.beginPath(); context.moveTo(x - 10, y); context.lineTo(x, y - 9); context.lineTo(x + 10, y); context.lineTo(x + 10, y + 9); context.lineTo(x - 10, y + 9); context.closePath(); context.stroke()
    } else {
      context.beginPath(); context.moveTo(x, y + 8); context.quadraticCurveTo(x - 4, y, x - 7, y - 7); context.moveTo(x, y + 8); context.quadraticCurveTo(x + 4, y, x + 7, y - 7); context.stroke()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(5, 4)
  return texture
}

export const createWorldGroundV2 = (): WorldGroundV2 => {
  const group = new THREE.Group()
  group.name = 'WorldGroundV2-ChapterTextures'
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const textures: THREE.Texture[] = []
  CHAPTERS.forEach(({ start, end, base, accent, motif }) => {
    const length = (end - start + 1) * 1.72 + 5
    const texture = createTexture(base, accent, motif)
    const geometry = new THREE.PlaneGeometry(48, length)
    const material = new THREE.MeshStandardMaterial({ map: texture, color: 0xffffff, roughness: 0.96 })
    const plane = new THREE.Mesh(geometry, material)
    plane.rotation.x = -Math.PI / 2
    plane.position.set(0, -1.04, ((start + end) / 2 - 1) * 1.72)
    plane.receiveShadow = true
    group.add(plane)
    geometries.push(geometry); materials.push(material); textures.push(texture)
  })
  return { group, dispose: () => { geometries.forEach((item) => item.dispose()); materials.forEach((item) => item.dispose()); textures.forEach((item) => item.dispose()); group.clear() } }
}
