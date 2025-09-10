// src/modules/FileImport/hooks/useFileProcessing.ts
import { useState, useCallback } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ProcessedFile, SUPPORTED_FORMATS } from '../types';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const useFileProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large. Maximum size is 100MB' };
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isValidFormat = Object.values(SUPPORTED_FORMATS)
      .flat()
      .some(ext => ext.toLowerCase() === `.${extension}`);

    if (!isValidFormat) {
      return { 
        valid: false, 
        error: `Unsupported file format. Supported formats: ${Object.values(SUPPORTED_FORMATS).flat().join(', ')}` 
      };
    }

    return { valid: true };
  }, []);

  const processSTLFile = useCallback(async (file: File): Promise<THREE.Mesh> => {
    return new Promise((resolve, reject) => {
      const loader = new STLLoader();
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          if (!event.target?.result) {
            throw new Error('Failed to read file');
          }

          const geometry = loader.parse(event.target.result as ArrayBuffer);
          const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            roughness: 0.7,
            metalness: 0.3,
          });

          const mesh = new THREE.Mesh(geometry, material);
          resolve(mesh);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to parse STL file';
          reject(new Error(message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }, []);

  const processFile = useCallback(async (file: File): Promise<ProcessedFile> => {
    setIsProcessing(true);
    setError(null);

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setIsProcessing(false);
      throw new Error(validation.error || 'Invalid file');
    }

    try {
      const startTime = performance.now();
      const mesh = await processSTLFile(file);
      const processingTime = performance.now() - startTime;

      // Calculate mesh metadata
      const geometry = mesh.geometry;
      geometry.computeBoundingBox();
      const boundingBox = geometry.boundingBox!;
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      boundingBox.getSize(size);
      boundingBox.getCenter(center);

      const processedFile: ProcessedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        mesh,
        status: 'success',
        metadata: {
          triangles: geometry.attributes.position.count / 3,
          boundingBox: {
            size: { x: size.x, y: size.y, z: size.z },
            center: { x: center.x, y: center.y, z: center.z },
          },
          processingTime,
        },
      };

      return processedFile;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to process file';
      setError(error);
      throw new Error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [processSTLFile, validateFile]);

  return {
    processFile,
    isProcessing,
    error,
  };
};

export default useFileProcessing;
