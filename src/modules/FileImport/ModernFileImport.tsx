// src/modules/FileImport/ModernFileImport.tsx
// NOTE: Experimental implementation retained for reference only. Not used by current FileImport flow.
// The production path uses hooks/useViewer.ts via FileImport/index.tsx.
import React, { useState, useCallback, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Types
interface ImportedFile {
  file: File
  mesh: THREE.Mesh | null
  status: 'idle' | 'processing' | 'success' | 'error'
  error?: string
  metadata?: FileMetadata
}

interface FileMetadata {
  triangles: number
  boundingBox: {
    size: { x: number; y: number; z: number }
    center: { x: number; y: number; z: number }
  }
  processingTime: number
}

// Main Component
export default function ModernFileImport() {
  const [importedFile, setImportedFile] = useState<ImportedFile | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const viewerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
  } | null>(null)

  // File Upload Logic
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.stl')) {
      setImportedFile({
        file,
        mesh: null,
        status: 'error',
        error: 'Please select an STL file'
      })
      return
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      setImportedFile({
        file,
        mesh: null,
        status: 'error',
        error: 'File too large. Maximum size is 100MB'
      })
      return
    }

    setImportedFile({
      file,
      mesh: null,
      status: 'processing'
    })

    try {
      const startTime = performance.now()
      const mesh = await processSTLFile(file)
      const processingTime = performance.now() - startTime

      // Extract metadata
      const geometry = mesh.geometry as THREE.BufferGeometry
      geometry.computeBoundingBox()
      const boundingBox = geometry.boundingBox!
      const size = boundingBox.getSize(new THREE.Vector3())
      const center = boundingBox.getCenter(new THREE.Vector3())

      const metadata: FileMetadata = {
        triangles: geometry.attributes.position.count / 3,
        boundingBox: {
          size: { x: size.x, y: size.y, z: size.z },
          center: { x: center.x, y: center.y, z: center.z }
        },
        processingTime
      }

      setImportedFile({
        file,
        mesh,
        status: 'success',
        metadata
      })

      // Add to 3D scene
      if (sceneRef.current) {
        addMeshToScene(mesh)
      }

    } catch (error) {
      setImportedFile({
        file,
        mesh: null,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to process file'
      })
    }
  }, [])

  // File Processing
  const processSTLFile = async (file: File): Promise<THREE.Mesh> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer
          const loader = new STLLoader()
          const geometry = loader.parse(arrayBuffer)
          
          // Center and scale geometry
          geometry.computeBoundingBox()
          if (geometry.boundingBox) {
            const center = geometry.boundingBox.getCenter(new THREE.Vector3())
            geometry.translate(-center.x, -center.y, -center.z)
            
            const size = geometry.boundingBox.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)
            if (maxDim > 10) {
              const scale = 8 / maxDim
              geometry.scale(scale, scale, scale)
            }
          }

          geometry.computeVertexNormals()

          const material = new THREE.MeshPhongMaterial({
            color: 0x2196f3, // Modern blue
            shininess: 30,
            transparent: true,
            opacity: 0.95
          })

          const mesh = new THREE.Mesh(geometry, material)
          resolve(mesh)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  // 3D Scene Setup
  useEffect(() => {
    if (!viewerRef.current) return

    const width = viewerRef.current.clientWidth
    const height = 500

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5) // Light gray background

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(12, 8, 12)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    })
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    viewerRef.current.appendChild(renderer.domElement)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 3
    controls.maxDistance = 50

    // Professional lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
    keyLight.position.set(10, 10, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-5, 5, -5)
    scene.add(fillLight)

    // Ground plane for shadows
    const planeGeometry = new THREE.PlaneGeometry(50, 50)
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.1 })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = -5
    plane.receiveShadow = true
    scene.add(plane)

    sceneRef.current = { scene, camera, renderer, controls }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!viewerRef.current) return
      const newWidth = viewerRef.current.clientWidth
      camera.aspect = newWidth / height
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      controls.dispose()
    }
  }, [])

  // Add mesh to scene
  const addMeshToScene = (mesh: THREE.Mesh) => {
    if (!sceneRef.current) return

    // Remove previous mesh
    const existingMesh = sceneRef.current.scene.getObjectByName('importedModel')
    if (existingMesh) {
      sceneRef.current.scene.remove(existingMesh)
    }

    mesh.name = 'importedModel'
    mesh.castShadow = true
    mesh.receiveShadow = true
    sceneRef.current.scene.add(mesh)

    // Focus camera on object
    const box = new THREE.Box3().setFromObject(mesh)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const distance = maxDim * 2.5

    sceneRef.current.camera.position.set(distance, distance * 0.6, distance)
    sceneRef.current.camera.lookAt(0, 0, 0)
    sceneRef.current.controls.target.set(0, 0, 0)
    sceneRef.current.controls.update()
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    e.target.value = ''
  }, [handleFileSelect])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">3D Model Viewer</h1>
            <p className="mt-2 text-sm text-gray-600">
              Upload and visualize your 3D models with professional-grade rendering
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Upload Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Model</h2>
              
              {/* Upload Zone */}
              <div
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-all duration-200 ease-in-out
                  ${isDragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }
                  ${importedFile?.status === 'processing' ? 'pointer-events-none opacity-50' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <div className="space-y-4">
                  <div className="flex justify-center">
                    {importedFile?.status === 'processing' ? (
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    ) : (
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {importedFile?.status === 'processing' 
                        ? 'Processing file...' 
                        : 'Drop your STL file here'
                      }
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      or click to browse • STL format • Max 100MB
                    </p>
                  </div>
                </div>

                <input
                  id="file-input"
                  type="file"
                  accept=".stl"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {/* Status Messages */}
              {importedFile?.status === 'error' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{importedFile.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {importedFile?.status === 'success' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">Model loaded successfully</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Model Information */}
              {importedFile?.status === 'success' && importedFile.metadata && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Model Information</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <dt className="text-gray-500">Filename:</dt>
                      <dd className="text-gray-900 font-mono truncate ml-2" title={importedFile.file.name}>
                        {importedFile.file.name}
                      </dd>
                    </div>
                    <div className="flex justify-between text-xs">
                      <dt className="text-gray-500">File size:</dt>
                      <dd className="text-gray-900 font-mono">
                        {(importedFile.file.size / 1024 / 1024).toFixed(1)} MB
                      </dd>
                    </div>
                    <div className="flex justify-between text-xs">
                      <dt className="text-gray-500">Triangles:</dt>
                      <dd className="text-gray-900 font-mono">
                        {importedFile.metadata.triangles.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between text-xs">
                      <dt className="text-gray-500">Processing time:</dt>
                      <dd className="text-gray-900 font-mono">
                        {importedFile.metadata.processingTime.toFixed(0)}ms
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          </div>

          {/* 3D Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">3D Preview</h2>
              </div>
              
              <div 
                ref={viewerRef}
                className="w-full"
                style={{ height: '500px' }}
              />

              {importedFile?.status === 'success' && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Controls:</span> Left click + drag to rotate • Right click + drag to pan • Scroll wheel to zoom
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
