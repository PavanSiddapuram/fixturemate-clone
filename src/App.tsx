// src/App.tsx
import React, { useRef } from 'react';
import { Leva } from 'leva';
import FileImport, { FileImportHandle } from './modules/FileImport';
import AppShell from './layout/AppShell';

export default function App() {
  const fiRef = useRef<FileImportHandle>(null);
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Leva collapsed />
      <AppShell
        onImport={() => fiRef.current?.openFilePicker()}
        onReset={() => fiRef.current?.resetView()}
        onOrientation={(o) => fiRef.current?.setViewOrientation(o)}
      >
        <FileImport ref={fiRef} />
      </AppShell>
    </div>
  );
}

