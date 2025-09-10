// src/modules/FileImport/index.tsx
import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { useFileProcessing } from './hooks/useFileProcessing';
import { useViewer } from './hooks/useViewer';
import FileDropzone from './components/FileDropzone';
import { ProcessedFile } from './types';

export type FileImportHandle = {
  openFilePicker: () => void;
  resetView: () => void;
  setViewOrientation: (o: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso') => void;
};

const FileImport = forwardRef<FileImportHandle>(function FileImport(_props, ref) {
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processFile, isProcessing, error: processingError } = useFileProcessing();
  const { addMesh, resetView, setViewOrientation } = useViewer(viewerContainerRef);

  const handleFileSelected = async (file: File) => {
    try {
      const result = await processFile(file);
      setProcessedFile(result);
      
      if (result.mesh) {
        addMesh(result.mesh);
      }
    } catch (err) {
      console.error('Error processing file:', err);
      // Error is already set by useFileProcessing
    }
  };

  // Expose imperative API for parent (AppShell/App)
  useImperativeHandle(ref, () => ({
    openFilePicker: () => fileInputRef.current?.click(),
    resetView: () => resetView(),
    setViewOrientation: (o) => setViewOrientation(o),
  }), [resetView, setViewOrientation]);

  return (
    <div className="flex flex-col gap-6">

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-6 overflow-hidden max-w-7xl w-full mx-auto">
        {/* Left panel - File upload */}
        <div className="w-full md:w-96 flex-shrink-0 flex flex-col space-y-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Upload Model</h2>
              <p className="mt-1 text-sm text-gray-500">
                Supported formats: .stl, .step, .3mf
              </p>
            </div>
            
            <div className="p-4">
              <FileDropzone 
                onFileSelected={handleFileSelected} 
                disabled={isProcessing}
                className="h-72 md:h-80"
                inputRef={fileInputRef}
              />
            </div>
          
            {isProcessing && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm font-medium text-blue-800">Processing model...</span>
                </div>
              </div>
            )}

            {processingError && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error processing file</h3>
                    <div className="mt-1 text-sm text-red-700">
                      <p>{processingError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {processedFile && (
          <div className="w-full md:w-96 flex-shrink-0 flex flex-col space-y-6 overflow-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Model Information</h2>
              </div>
              <div className="p-4">
                <dl className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-sm font-medium text-gray-500">File Name</dt>
                    <dd className="text-sm text-gray-900 font-medium truncate max-w-[200px]" title={processedFile.name}>
                      {processedFile.name}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-sm font-medium text-gray-500">File Size</dt>
                    <dd className="text-sm text-gray-900">
                      {(processedFile.size / 1024 / 1024).toFixed(2)} MB
                    </dd>
                  </div>
                  {processedFile.metadata && (
                    <>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <dt className="text-sm font-medium text-gray-500">Triangles</dt>
                        <dd className="text-sm text-gray-900">
                          {processedFile.metadata.triangles.toLocaleString()}
                        </dd>
                      </div>
                      <div className="py-2 border-b border-gray-100">
                        <dt className="text-sm font-medium text-gray-500 mb-1">Dimensions (mm)</dt>
                        <dd className="text-sm text-gray-900 flex justify-between">
                          <span>W: {processedFile.metadata.boundingBox.size.x.toFixed(2)}</span>
                          <span>H: {processedFile.metadata.boundingBox.size.y.toFixed(2)}</span>
                          <span>D: {processedFile.metadata.boundingBox.size.z.toFixed(2)}</span>
                        </dd>
                      </div>
                      <div className="flex justify-between py-2">
                        <dt className="text-sm font-medium text-gray-500">Processed In</dt>
                        <dd className="text-sm text-gray-900">
                          {processedFile.metadata.processingTime.toFixed(0)} ms
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            </div>
          </div>
        )}
        

        {/* Right panel - 3D Viewer */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">3D Preview</h2>
            <button
              onClick={resetView}
              disabled={!processedFile}
              aria-disabled={!processedFile}
              title={processedFile ? 'Reset camera to fit the model' : 'Load a model to enable'}
              className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                processedFile
                  ? 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                  : 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
            >
              <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset View
            </button>
          </div>
          
          <div 
            ref={viewerContainerRef} 
            className="flex-1 w-full relative"
            style={{ minHeight: '600px' }}
          >
            {!processedFile && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center p-6 max-w-md">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-3">
                    <svg className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">No model loaded</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Upload a 3D model to see the preview here
                  </p>
                  <p className="text-xs text-gray-500 mb-4">Supported formats: .stl, .step, .3mf</p>
                  <button
                    type="button"
                    aria-label="Upload a file"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className="inline-flex items-center px-3.5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <svg className="-ml-1 mr-2 h-4.5 w-4.5" aria-hidden="true" focusable="false" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload a File
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
})
;

export default FileImport;
