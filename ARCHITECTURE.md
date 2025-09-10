# Fixturemate Clone – Architecture Overview

This document summarizes the current approach and conventions for the File Import and 3D Viewer.

## Chosen Approach
- Custom Three.js + React hooks (no react-three-fiber in the production path).
- Main flow lives in `src/modules/FileImport/index.tsx` and uses `hooks/useViewer.ts` for the 3D scene.
- File processing is handled by `hooks/useFileProcessing.ts`.

## Module Structure
- `src/modules/FileImport/`
  - `index.tsx` – main UI screen that wires the pieces together.
  - `hooks/useViewer.ts` – encapsulates Three.js scene, camera, renderer, controls, render loop.
  - `hooks/useFileProcessing.ts` – validates and processes files (e.g. STL), returns mesh and metadata.
  - `components/FileDropzone.tsx` – reusable drag-and-drop upload component.
  - `types.ts` – shared types and config constants (e.g. `DEFAULT_VIEWER_CONFIG`).
  - `Fixed3DViewer.tsx` – experimental viewer (not used in production).
  - `ModernFileImport.tsx` – experimental implementation (not used in production).

## Key Conventions
- Ref typing for DOM elements passed to hooks:
  - Accept `React.RefObject<HTMLDivElement | null>` in hooks (e.g. `useViewer(containerRef)`), and always null-check internally.
  - Create refs with `useRef<HTMLDivElement>(null)` in components.
- Three.js examples imports (OrbitControls, loaders):
  - Use explicit `.js` suffix, e.g. `import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'`.
  - This matches our TypeScript config (`moduleResolution: bundler`) and Three ESM examples.
- Strict TypeScript:
  - `strict: true` is enabled. Prefer precise types; avoid non-null assertions except in guaranteed post-mount code.

## Dependencies
- Required: `three`
- Optional utilities: `three-stdlib`
- We currently do not use the `@react-three/*` packages in the production path. They can be removed to simplify the stack if desired.

## Future Options
- If desired, migrate to `@react-three/fiber` + `@react-three/drei` for a declarative scene. If that route is chosen, retire `useViewer.ts` and replace the viewer with an R3F-based component.

## Build and Tooling
- Vite + React.
- `tsconfig.json` uses `"moduleResolution": "bundler"` to play well with ESM and Three examples.
- ESLint is configured for TypeScript + React hooks.

## How Things Flow
1. `FileDropzone` emits a `File` to `index.tsx`.
2. `useFileProcessing` parses/validates the file and returns `ProcessedFile` including a Three `Mesh`.
3. `useViewer` owns the Three scene; `index.tsx` passes the container ref and calls `addMesh` and `resetView` as needed.

## Experimental Files
- `Fixed3DViewer.tsx` and `ModernFileImport.tsx` are marked as experimental and not part of the production flow. Keep for reference, or move to a `src/experiments/` folder.
