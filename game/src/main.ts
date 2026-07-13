import './style.css'
import { createScene } from './three/createScene'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="scene-container">
    <p class="development-label">P1-02：Three.js表示確認</p>
  </main>
`

const sceneContainer = document.querySelector<HTMLElement>('.scene-container')!
const disposeScene = createScene(sceneContainer)

if (import.meta.hot) {
  import.meta.hot.dispose(disposeScene)
}
