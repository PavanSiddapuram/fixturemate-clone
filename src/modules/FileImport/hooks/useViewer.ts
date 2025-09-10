// src/modules/FileImport/hooks/useViewer.ts
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DEFAULT_VIEWER_CONFIG } from '../types';

export const useViewer = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number>(0);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const mountContainerRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;
    if (initializedRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(DEFAULT_VIEWER_CONFIG.backgroundColor);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      55,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(...DEFAULT_VIEWER_CONFIG.cameraPosition);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    // Create a dedicated mount node we control entirely
    const mount = document.createElement('div');
    mount.style.position = 'absolute';
    mount.style.inset = '0';
    // Remove any previous mount we created
    if (mountContainerRef.current && mountContainerRef.current.parentNode) {
      try {
        mountContainerRef.current.parentNode.removeChild(mountContainerRef.current);
      } catch {
        // ignore
      }
    }
    // Append mount into the React-managed container
    containerRef.current.appendChild(mount);
    // Append renderer canvas into our mount
    mount.appendChild(renderer.domElement);
    canvasRef.current = renderer.domElement;
    mountContainerRef.current = mount;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = DEFAULT_VIEWER_CONFIG.controls.enableDamping;
    controls.dampingFactor = DEFAULT_VIEWER_CONFIG.controls.dampingFactor;
    controls.minDistance = DEFAULT_VIEWER_CONFIG.controls.minDistance;
    controls.maxDistance = DEFAULT_VIEWER_CONFIG.controls.maxDistance;

    // Grid helper
    const gridHelper = new THREE.GridHelper(
      DEFAULT_VIEWER_CONFIG.gridSize,
      DEFAULT_VIEWER_CONFIG.gridDivisions,
      0x666666,
      0x2b2b2b
    );
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    // (Removed temporary scale references)

    // Lights
    const ambientLight = new THREE.AmbientLight(
      DEFAULT_VIEWER_CONFIG.lights.ambient.color,
      DEFAULT_VIEWER_CONFIG.lights.ambient.intensity
    );
    scene.add(ambientLight);

    // Hemisphere light for soft fill and better readability
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 0.5);
    scene.add(hemiLight);

    DEFAULT_VIEWER_CONFIG.lights.directional.forEach(lightConfig => {
      const light = new THREE.DirectionalLight(lightConfig.color, lightConfig.intensity);
      light.position.set(...lightConfig.position);
      scene.add(light);
    });

    // Store references
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    // Mark initialized now that renderer and mount exist
    initializedRef.current = true;

    // Return cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [containerRef]);

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    
    animationFrameId.current = requestAnimationFrame(animate);
    
    if (controlsRef.current) {
      controlsRef.current.update();
    }
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  // Initialize scene and start animation loop
  useEffect(() => {
    const cleanupScene = initScene();
    if (!initializedRef.current && rendererRef.current) {
      initializedRef.current = true;
    }
    
    // Start animation loop
    animate();
    
    // Cleanup function
    return () => {
      // Stop animation loop
      cancelAnimationFrame(animationFrameId.current);
      
      // Cleanup scene
      if (cleanupScene) {
        cleanupScene();
      }
      
      // Additional cleanup
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (mountContainerRef.current && mountContainerRef.current.parentNode) {
        try {
          mountContainerRef.current.parentNode.removeChild(mountContainerRef.current);
        } catch {
          // ignore
        }
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      // Clear refs
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      meshRef.current = null;
      mountContainerRef.current = null;
      initializedRef.current = false;
      canvasRef.current = null;
    };
  }, [initScene, animate]);

  // Reset view (fit camera to mesh using bounding sphere)
  const resetView = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !meshRef.current || !controlsRef.current) return;

    const box = new THREE.Box3().setFromObject(meshRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, 1e-6);

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const aspect = (rendererRef.current?.domElement.width || 1) / (rendererRef.current?.domElement.height || 1);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    // Fit by height; ensure width also fits
    const distHeight = radius / Math.sin(fov / 2);
    const fovH = 2 * Math.atan(Math.tan(fov / 2) * aspect);
    const distWidth = radius / Math.sin(fovH / 2);
    let distance = Math.max(distHeight, distWidth) * 1.2; // padding

    // Place camera at a pleasant iso angle relative to center
    const iso = new THREE.Vector3(1, 0.8, 1).normalize();
    const pos = iso.multiplyScalar(distance).add(center);
    camera.position.copy(pos);
    camera.lookAt(center);

    // Update near/far planes around the content
    camera.near = Math.max(0.01, distance - radius * 3);
    camera.far = distance + radius * 6;
    camera.updateProjectionMatrix();

    // Controls targeting and limits
    controls.target.copy(center);
    controls.minDistance = Math.min(Math.max(radius * 0.1, 0.01), distance);
    controls.maxDistance = Math.max(radius * 20, distance * 2);
    controls.update();
  }, []);

  // Set camera to a named orientation relative to current mesh
  const setViewOrientation = useCallback((orientation: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso') => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    // Use mesh bounding sphere to determine distance
    const target = new THREE.Vector3();
    let distance = 10;
    if (meshRef.current) {
      const box = new THREE.Box3().setFromObject(meshRef.current);
      box.getCenter(target);
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const radius = Math.max(sphere.radius, 1e-6);
      const fov = THREE.MathUtils.degToRad(cameraRef.current.fov);
      distance = (radius / Math.sin(fov / 2)) * 1.2;
    }
    const pos = new THREE.Vector3();
    switch (orientation) {
      case 'front':
        pos.set(target.x, target.y, target.z + distance);
        break;
      case 'back':
        pos.set(target.x, target.y, target.z - distance);
        break;
      case 'left':
        pos.set(target.x - distance, target.y, target.z);
        break;
      case 'right':
        pos.set(target.x + distance, target.y, target.z);
        break;
      case 'top':
        pos.set(target.x, target.y + distance, target.z);
        break;
      case 'bottom':
        pos.set(target.x, target.y - distance, target.z);
        break;
      case 'iso':
      default:
        pos.set(target.x + distance, target.y + distance * 0.8, target.z + distance);
        break;
    }
    const camera = cameraRef.current;
    camera.position.copy(pos);
    camera.lookAt(target);
    controlsRef.current.target.copy(target);
    controlsRef.current.update();
  }, []);

  // Add mesh to scene
  const addMesh = useCallback((mesh: THREE.Mesh) => {
    if (!sceneRef.current || !cameraRef.current) return;

    // Remove existing mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
    }

    // Align geometry: center on X/Z, sit on ground at Y=0
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    if (box) {
      const center = new THREE.Vector3();
      box.getCenter(center);
      const min = box.min.clone();
      // translate by -center.x/z and -min.y
      mesh.geometry.translate(-center.x, -min.y, -center.z);
    }

    // Ensure normals exist for proper lighting
    if (!mesh.geometry.attributes.normal) {
      mesh.geometry.computeVertexNormals();
    }

    // Add new mesh with proper material
    const material = new THREE.MeshStandardMaterial({
      color: 0x4f46e5, // Indigo-600
      roughness: 0.7,
      metalness: 0.3,
      flatShading: true,
    });
    
    const newMesh = new THREE.Mesh(mesh.geometry, material);
    sceneRef.current.add(newMesh);
    meshRef.current = newMesh;

    // Reset view to fit the new mesh
    resetView();
  }, [resetView]);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    addMesh,
    resetView,
    setViewOrientation,
  };
};

export default useViewer;
