// src/modules/FileImport/types/index.ts
import * as THREE from 'three';

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface ProcessedFile extends FileMetadata {
  mesh: THREE.Mesh | null;
  status: 'idle' | 'processing' | 'success' | 'error';
  error?: string;
  metadata?: {
    triangles: number;
    boundingBox: {
      size: { x: number; y: number; z: number };
      center: { x: number; y: number; z: number };
    };
    processingTime: number;
  };
}

export type FileType = 'stl' | 'step' | '3mf' | 'sldprt';

export const SUPPORTED_FORMATS: Record<FileType, string[]> = {
  stl: ['.stl'],
  step: ['.step', '.stp'],
  '3mf': ['.3mf'],
  sldprt: ['.sldprt']
};

export interface ViewerConfig {
  backgroundColor: number;
  gridSize: number;
  gridDivisions: number;
  cameraPosition: [number, number, number];
  controls: {
    enableDamping: boolean;
    dampingFactor: number;
    minDistance: number;
    maxDistance: number;
  };
  lights: {
    ambient: {
      color: number;
      intensity: number;
    };
    directional: Array<{
      color: number;
      intensity: number;
      position: [number, number, number];
    }>;
  };
}

export const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
  backgroundColor: 0x2a2a2a,
  gridSize: 200,
  gridDivisions: 20,
  cameraPosition: [10, 10, 10],
  controls: {
    enableDamping: true,
    dampingFactor: 0.05,
    minDistance: 1,
    maxDistance: 1000,
  },
  lights: {
    ambient: {
      color: 0x404040,
      intensity: 0.4,
    },
    directional: [
      {
        color: 0xffffff,
        intensity: 0.6,
        position: [10, 10, 5],
      },
      {
        color: 0xffffff,
        intensity: 0.4,
        position: [-10, 5, -5],
      },
    ],
  },
};
