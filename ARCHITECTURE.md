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

---

## End-to-End Architecture (v1)

This section defines the full architecture approach for the project as it stands (single module: File Import + 3D Viewer) and how it scales to additional modules.

### Goals
- Clarity-first UI with a stable app shell and modular feature areas.
- Deterministic, performant 3D viewport that gracefully handles very small and very large STL models.
- Clean separation between UI, processing, and rendering so each can evolve independently.
- Production-ready build tooling with Tailwind CSS, TypeScript, and ESLint.

### Tech Stack
- React + TypeScript + Vite
- Tailwind CSS (class-based dark mode; currently using light theme)
- Three.js (direct ESM usage, no R3F in production path)
- ESLint + Vitest (unit/integration testing)

### High-Level Structure
- `src/layout/AppShell.tsx` — application chrome (top bar, side bar, status bar), contains module content via `children`.
- `src/App.tsx` — wires the shell with the active module and exposes imperative controls to the shell (import/reset/orientation).
- `src/modules/FileImport/` — the production File Import module.
  - `index.tsx` — module composition and UI (left: upload; center/right: 3D viewer; optional right: metadata).
  - `hooks/useFileProcessing.ts` — reads/validates files, produces a Three `Mesh` and derived metadata.
  - `hooks/useViewer.ts` — owns Three.js scene, camera, renderer, controls, render loop, and mesh lifecycle.
  - `components/FileDropzone.tsx` — reusable upload UI component.
  - `types/index.ts` — shared types and viewer defaults (`DEFAULT_VIEWER_CONFIG`).

### Runtime Flow (File Import)
1. `FileDropzone` emits a `File` to `FileImport/index.tsx` via `onFileSelected`.
2. `useFileProcessing.processFile(file)` returns `{ mesh, metadata }` or throws an error (also exposed via `error`).
3. On success, `FileImport` calls `useViewer.addMesh(mesh)` to display the model and then `resetView()` to fit the camera.
4. `AppShell` top bar actions call down into `FileImport` via `ref`/`FileImportHandle` (`openFilePicker`, `resetView`, `setViewOrientation`).

### UI Architecture
- The app uses a shell-with-slots pattern: `AppShell` renders chrome; modules render inside as `children`.
- Tailwind governs layout/spacing/typography. Global CSS (`src/index.css`) keeps styles minimal and light-themed.
- Icon sizes are normalized in the shell and modules for balance (compact buttons and 16px icons by default).

### 3D Viewer Architecture (`useViewer.ts`)
- Initializes a Three.js scene only once per mount (tracked by internal refs).
- Camera: `PerspectiveCamera` with robust fit logic based on model bounding sphere.
- Controls: `OrbitControls` with damping; `min/maxDistance` scaled from model size.
- Lights: ambient + hemisphere + directional for clear readability; background color configurable via `DEFAULT_VIEWER_CONFIG`.
- Helpers: grid and axes helpers for orientation; model is aligned to sit on ground (minY = 0) and centered on X/Z.
- Performance:
  - Pixel ratio capped to `min(devicePixelRatio, 2)`.
  - Continuous render loop with `requestAnimationFrame` and controls damping.
  - Materials: `MeshStandardMaterial` with reasonable roughness/metalness for visual clarity.

### File Processing (`useFileProcessing.ts`)
- Validates extension/size against `SUPPORTED_FORMATS` and configured `maxSize`.
- Parses STL (and future formats) into a Three `BufferGeometry`.
- Computes metadata: triangles, bounding box dimensions, center, and processing time.
- Returns `ProcessedFile` including the constructed `Mesh`.

### Error Handling
- UI-level: upload panel shows inline errors and disables controls while processing.
- Hook-level: `useFileProcessing` exposes `error` and `isProcessing` to drive UI state.
- Viewer-level: guard clauses ensure viewer actions no-op when not ready.

### Orientation & Camera Fit
- `resetView()` computes distance from the bounding sphere so the model is consistently framed across aspect ratios.
- `setViewOrientation(o)` uses the bounding sphere to place the camera for named orientations (`front/back/left/right/top/bottom/iso`).

### Performance Considerations
- Large STL handling: capped pixel ratio, simple PBR material, camera planes adjusted around the content.
- Future: optional mesh decimation or BVH for heavy scenes; progressive loading for other formats.

### Accessibility & UX
- Buttons have `title`/`aria-label` for clarity.
- Drag-and-drop plus click-to-upload; keyboard navigable controls.
- Empty-state and disabled states communicate clearly.

### Testing Strategy
- Unit: pure utilities (e.g., metadata derivation) and hook-level logic that can be isolated.
- Integration: simulate file drops and ensure viewer hooks receive mesh; verify error paths.
- Visual/manual: snapshot of icon sizes, viewer min-height and camera fit across example STLs.

### Build & Environments
- Vite dev server (`npm run dev`) and production build (`npm run build`).
- Tailwind configured in `tailwind.config.js` (content scanning for `src/**/*`).
- PostCSS pipeline enabled via Tailwind and Autoprefixer.

### Coding Conventions
- TypeScript strict mode enabled.
- ESM imports for Three examples with explicit `.js` suffix.
- React hooks for complex side-effects (`useViewer`, `useFileProcessing`), components kept mostly declarative.
- Avoid inline imports in the middle of files; imports must be at the top.

### Roadmap (Adding More Modules)
- New modules live under `src/modules/<ModuleName>/` with the same pattern:
  - `index.tsx` (UI composition)
  - `components/` (presentational + small logic components)
  - `hooks/` (side effects/stateful logic)
  - `types/` (module contracts/config)
- The module exports a `Ref` handle to integrate with `AppShell` actions if necessary.
- Keep experimental spikes in `src/experiments/` or separate branches to avoid polluting production paths.

### Clean-up Candidates (v1)
- Experimental files not in production flow:
  - `src/modules/FileImport/ModernFileImport.tsx`
  - `src/modules/FileImport/Fixed3DViewer.tsx`
  - `src/modules/FileImport/FileUploadWith3D.tsx`
- Unused global CSS from Vite starter: `src/App.css` (not imported).

### Deployment (Future)
- CI: lint, build, and test on push (GitHub Actions suggested).
- Host static build (e.g., Netlify/Vercel). No server required for current client-only app.

