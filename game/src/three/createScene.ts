import * as THREE from 'three'

export const createScene = (container: HTMLElement): (() => void) => {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87bce8)

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.set(8, 6, 10)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  const groundGeometry = new THREE.PlaneGeometry(30, 30)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x6fa968 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const cubeGeometry = new THREE.BoxGeometry(2, 2, 2)
  const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xf2a65a })
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
  cube.position.y = 1
  cube.castShadow = true
  scene.add(cube)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
  directionalLight.position.set(6, 10, 8)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  const resize = () => {
    const width = container.clientWidth
    const height = container.clientHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }

  window.addEventListener('resize', resize)
  resize()

  renderer.setAnimationLoop((time) => {
    const elapsedTime = time * 0.001
    cube.rotation.x = elapsedTime * 0.25
    cube.rotation.y = elapsedTime * 0.4
    renderer.render(scene, camera)
  })

  return () => {
    window.removeEventListener('resize', resize)
    renderer.setAnimationLoop(null)
    groundGeometry.dispose()
    groundMaterial.dispose()
    cubeGeometry.dispose()
    cubeMaterial.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
}
