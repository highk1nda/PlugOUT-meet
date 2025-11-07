'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'lil-gui'

export default function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null)
  const animationStarted = useRef(false)
  const animationStartTime = useRef<number | null>(null)
  const animationCompleted = useRef(false)

  const [showScene, setShowScene] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (!showScene) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    mountRef.current?.appendChild(renderer.domElement)

    // === BASE LIGHT ===
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(3, 3, 3)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))

    // === CAMERA + CONTROLS ===
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enabled = false
    camera.position.z = 30

    const loader = new GLTFLoader()

    // === LIGHT SETUP ===
    const spotLight = new THREE.SpotLight(0xffffff, 0.6, 300, Math.PI / 6, 0.5, 1)
    spotLight.position.set(0, 40, 50)
    spotLight.target.position.set(0, 0, 0)
    scene.add(spotLight)
    scene.add(spotLight.target)

    const ambient = new THREE.AmbientLight(0xffffff, 0.15)
    scene.add(ambient)

    // === GUI CONTROL ===
    const gui = new GUI()
    const lightFolder = gui.addFolder('Projector Light')

    lightFolder.add(spotLight, 'intensity', 0, 2, 0.01).name('Intensity')
    lightFolder.add(spotLight.position, 'x', -100, 100, 1).name('X')
    lightFolder.add(spotLight.position, 'y', 0, 100, 1).name('Y')
    lightFolder.add(spotLight.position, 'z', -100, 100, 1).name('Z')
    lightFolder.add(spotLight, 'angle', 0.1, Math.PI / 2, 0.01).name('Angle')
    lightFolder.add(spotLight, 'distance', 0, 500, 1).name('Distance')
    lightFolder.add(spotLight, 'penumbra', 0, 1, 0.01).name('Penumbra')
    lightFolder.open()

    // === MODEL LOADING ===
    let socket: THREE.Object3D | null = null
    let plug: THREE.Object3D | null = null

    const socketStartX = 111.5
    const socketEndX = 120
    const plugStartX = -11.4
    const plugEndX = -26.2 + 11.4

    const animateConnection = (time: number) => {
      if (!plug || !socket || !animationStarted.current || animationCompleted.current) return

      if (!animationStartTime.current) animationStartTime.current = time
      const elapsed = (time - animationStartTime.current) / 1000
      const duration = 2
      const t = Math.min(elapsed / duration, 1)
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

      socket.position.x = socketStartX + (socketEndX - socketStartX) * ease
      plug.position.x = plugStartX + (plugEndX - plugStartX) * ease

      if (t >= 1) {
        animationCompleted.current = true
        socket.position.x = socketEndX
        plug.position.x = plugEndX

        setFadeOut(true)
        setTimeout(() => setShowScene(false), 1500)
      }
    }

    loader.load('/models/soket/scene.gltf', (gltf) => {
      socket = gltf.scene
      socket.scale.set(99.7, 75.3, 58.1)
      socket.rotation.y = Math.PI / 2
      socket.position.set(socketStartX, -1.6, 106.6)
      scene.add(socket)

      loader.load('/models/plug2/PLUGmy_custom_3d_model.gltf', (gltf2) => {
        plug = gltf2.scene
        plug.scale.set(1, 1, 1)
        plug.position.set(plugStartX, 0, -6.5)
        scene.add(plug)
      })
    })

    const renderLoop = (time: number) => {
      requestAnimationFrame(renderLoop)
      animateConnection(time)
      renderer.render(scene, camera)
    }
    renderLoop(0)

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      gui.destroy()
      window.removeEventListener('resize', handleResize)
      mountRef.current?.removeChild(renderer.domElement)
    }
  }, [showScene])

  if (!showScene) {
    return (
      <main className="w-full h-screen flex items-center justify-center text-3xl bg-white text-black">
        aaand here goes our main UI and stuff
      </main>
    )
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />
      <button
        onClick={() => {
          animationStarted.current = true
          animationStartTime.current = null
          animationCompleted.current = false
        }}
        className="absolute top-6 left-6 px-4 py-2 bg-white text-black font-semibold rounded-md hover:bg-gray-300 transition"
      >
        Start Animation
      </button>

      <div
        className={`absolute inset-0 bg-white transition-opacity duration-[1200ms] pointer-events-none ${
          fadeOut ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
