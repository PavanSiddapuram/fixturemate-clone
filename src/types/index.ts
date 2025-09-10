import type * as THREE from 'three';

export interface ImportResult {
  mesh: THREE.Mesh | null;
  originalFile: File;
  format: string;
}
