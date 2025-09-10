// src/modules/FileImport/Fixed3DViewer.tsx
// NOTE: Experimental viewer retained for reference. Not used by the current FileImport flow.
// The primary implementation uses the custom Three.js hook in hooks/useViewer.ts and FileImport/index.tsx.
import React, { useEffect, useRef, useState } from 'react'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as THREE from 'three'

interface Fixed3DViewerProps {
  file: File | null
}

export default function Fixed3DViewer({ file }: Fixed3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('Ready')
  const sceneRef = useRef<{
    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    camera: THREE.PerspectiveCamera
    controls?: OrbitControls
  } | null>(null)

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return

    const width = 800
    const height = 500

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x111111) // Very dark background

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(8, 8, 8)
    camera.lookAt(0, 0, 0)

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    })
    renderer.setSize(width, height)
    renderer.setClearColor(0x111111, 1) // Dark background
    
    // Make sure the canvas is visible
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.border = '3px solid #ba202fff' // Red border for debugging
    renderer.domElement.style.backgroundColor = '#000000'

    const mountNode = mountRef.current
    mountNode.appendChild(renderer.domElement)

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(10, 10, 5)
    scene.add(directionalLight)

    // Add another light from different angle
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
    directionalLight2.position.set(-10, 5, -5)
    scene.add(directionalLight2)

    // Add orbit controls for mouse interaction
    import('three/examples/jsm/controls/OrbitControls.js').then(({ OrbitControls }) => {
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.minDistance = 2
      controls.maxDistance = 50

      if (sceneRef.current) {
        sceneRef.current.controls = controls
      }

      // Animation loop
      function animate() {
        requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
      }
      animate()
    })

    // Store scene reference
    sceneRef.current = { scene, renderer, camera }
    setStatus('3D Scene Ready - Upload an STL file')

    // Cleanup
    return () => {
      if (mountNode && renderer.domElement) {
        mountNode.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // Load STL file
  useEffect(() => {
    if (!file || !sceneRef.current) return

    setIsLoading(true)
    setStatus(`Loading ${file.name}...`)

    // Clear previous meshes
    const meshesToRemove = sceneRef.current.scene.children.filter(
      child => child instanceof THREE.Mesh && child.userData.isSTLMesh
    )
    meshesToRemove.forEach(mesh => {
      sceneRef.current!.scene.remove(mesh)
      if (mesh instanceof THREE.Mesh) {
        mesh.geometry.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose())
        } else {
          mesh.material.dispose()
        }
      }
    })

    // Load STL
    import('three/examples/jsm/loaders/STLLoader.js').then(({ STLLoader }) => {
      const loader = new STLLoader()
      const reader = new FileReader()

      reader.onload = (event) => {
        if (!event.target?.result || !sceneRef.current) return

        try {
          setStatus('Parsing STL data...')
          
          const geometry = loader.parse(event.target.result as ArrayBuffer)
          
          // Center the geometry
          geometry.computeBoundingBox()
          if (geometry.boundingBox) {
            const center = geometry.boundingBox.getCenter(new THREE.Vector3())
            const size = geometry.boundingBox.getSize(new THREE.Vector3())
            
            // Center
            geometry.translate(-center.x, -center.y, -center.z)
            
            // Scale to reasonable size
            const maxDim = Math.max(size.x, size.y, size.z)
            const targetSize = 6 // Target size
            const scale = targetSize / maxDim
            geometry.scale(scale, scale, scale)
          }

          geometry.computeVertexNormals()

          // Create bright material for visibility
          const material = new THREE.MeshLambertMaterial({
            color: 0x00ff88, // Bright green
            side: THREE.DoubleSide,
            transparent: false
          })

          const mesh = new THREE.Mesh(geometry, material)
          mesh.userData.isSTLMesh = true
          
          sceneRef.current.scene.add(mesh)
          
          // Reset camera position for better view
          if (sceneRef.current.controls) {
            sceneRef.current.controls.reset()
            sceneRef.current.camera.position.set(10, 10, 10)
            sceneRef.current.controls.update()
          }

          setStatus(`${file.name} loaded successfully - Use mouse to rotate`)
          setIsLoading(false)

        } catch (error) {
          setStatus(`Error loading STL: ${error}`)
          setIsLoading(false)
        }
      }

      reader.onerror = () => {
        setStatus('Error reading file')
        setIsLoading(false)
      }

      reader.readAsArrayBuffer(file)
    })
  }, [file])

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: isLoading ? '#fff3cd' : '#d4edda',
        border: `1px solid ${isLoading ? '#ffeaa7' : '#c3e6cb'}`,
        borderRadius: '5px',
        color: isLoading ? '#856404' : '#155724'
      }}>
        <strong>Status:</strong> {status}
      </div>

      <div 
        ref={mountRef} 
        style={{ 
          display: 'inline-block',
          margin: '0 auto',
          border: '2px solid #333',
          borderRadius: '8px',
          backgroundColor: '#000'
        }}
      />

      <div style={{ 
        marginTop: '15px', 
        fontSize: '14px', 
        color: '#666',
        maxWidth: '800px',
        margin: '15px auto 0'
      }}>
        <p><strong>Controls:</strong></p>
        <p>• Left click + drag: Rotate view</p>
        <p>• Right click + drag: Pan view</p>
        <p>• Mouse wheel: Zoom in/out</p>
        {file && <p>• Model: {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
      </div>
    </div>
  )
}
