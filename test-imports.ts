import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { createSlice } from '@reduxjs/toolkit';
// Test path aliases
import type { ImportResult } from './src/types';

// Use the imports so ESLint doesn't flag them as unused
const ok = Boolean(THREE) && Boolean(Canvas) && Boolean(STLLoader) && Boolean(createSlice);
type _Smoke = ImportResult | null;
const smoke: _Smoke = null;
console.log('All imports successful', ok, smoke);
