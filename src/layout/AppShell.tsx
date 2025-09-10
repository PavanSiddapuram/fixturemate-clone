// src/layout/AppShell.tsx
import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
  onImport?: () => void;
  onReset?: () => void;
  onOrientation?: (o: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso') => void;
}

export default function AppShell({ children, onImport, onReset, onOrientation }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* Top bar */}
      <header className="h-14 border-b border-gray-200 flex items-center px-4">
        <div className="w-full max-w-7xl mx-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-xl font-semibold">
            <span className="text-gray-900">fixture</span>
            <span className="text-indigo-600">mate</span>
          </div>
          <span className="text-xs text-gray-500">by trinckle</span>
        </div>

        {/* Top actions (centered-ish) */}
        <nav className="flex-1 flex justify-center">
          <div className="flex items-center gap-5 text-gray-700">
            {/* Session */}
            <button className="flex items-center gap-2 hover:text-indigo-600">
              <span className="text-sm">Session</span>
            </button>
            {/* Import */}
            <button className="flex items-center gap-2 hover:text-indigo-600" onClick={onImport} title="Import">
              <span className="text-sm">Import</span>
            </button>
            {/* View icons (placeholders) */}
            <div className="flex items-center gap-2.5">
              <span className="text-sm">View</span>
              <div className="flex items-center gap-1.5">
                <button className="h-8 w-8 rounded-md hover:bg-gray-100 grid place-items-center" title="Isometric" onClick={() => onOrientation?.('iso')}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5" y="5" width="14" height="14" rx="1.5"/></svg>
                </button>
                <button className="h-8 w-8 rounded-md hover:bg-gray-100 grid place-items-center" title="Front" onClick={() => onOrientation?.('front')}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6l16 0 0 12 -16 0z"/><path d="M4 6l8 6 8 -6"/></svg>
                </button>
                <button className="h-8 w-8 rounded-md hover:bg-gray-100 grid place-items-center" title="Reset View" onClick={onReset}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12a9 9 0 109-9"/><path d="M3 3v6h6"/></svg>
                </button>
              </div>
            </div>
            {/* State */}
            <button className="flex items-center gap-2 hover:text-indigo-600">
              <span className="text-sm">State</span>
            </button>
          </div>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2.5 text-gray-600">
          <button className="h-10 w-10 rounded-md hover:bg-gray-100 grid place-items-center" title="Support">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
          </button>
          <button className="h-10 w-10 rounded-md hover:bg-gray-100 grid place-items-center" title="Settings">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1 1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00.33 1.82V9c.66 0 1.2.53 1.2 1.2v3.6c0 .66-.54 1.2-1.2 1.2z"/></svg>
          </button>
        </div>
      </div>
      </header>

      <div className="flex-1 w-full">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-[auto_1fr_auto] grid-rows-[1fr_auto] min-h-0">
        {/* Left sidebar */}
        <aside className="w-14 border-r border-gray-200 py-3 flex flex-col items-center gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <button key={i} className="h-8 w-8 rounded-md hover:bg-gray-100 grid place-items-center">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
            </button>
          ))}
        </aside>

        {/* Main content area */}
        <section className="relative min-w-0 flex">
          <div className="flex-1 p-4 md:p-6 w-full">
            {children}
          </div>

          {/* Right overlay gizmo placeholder */}
          <div className="hidden md:block absolute right-4 top-4">
            <div className="w-28 h-28 rounded-lg border border-gray-200 bg-white/70 backdrop-blur grid place-items-center shadow-sm">
              <div className="text-xs text-gray-600">Gizmo</div>
            </div>
          </div>
        </section>

        {/* Right gutter to align like target UI */}
        <div className="w-12" />

        {/* Bottom status bar spanning content */}
        <footer className="col-span-3 h-9 border-t border-gray-200 bg-gray-50/70 px-3.5 flex items-center gap-5 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg>
            <span>Total dimensions</span>
            <span className="text-red-600">X 0.0 mm</span>
            <span>Y 0.0 mm</span>
            <span>Z 0.0 mm</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span>Height (3d-printed)</span>
            <span>2.0 mm</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span>Volume (3d-printed)</span>
            <span>0.00 cm³</span>
          </div>
          <div className="ml-auto">v0.1</div>
        </footer>
      </div>
      </div>
    </div>
  );
}
