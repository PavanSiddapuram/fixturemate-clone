// src/modules/FileImport/FileUploadWith3D.tsx
import React, { useState } from 'react'
import Fixed3DViewer from './Fixed3DViewer'

export default function FileUploadWith3D() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name)
    setSelectedFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>STL File Viewer</h1>
      
      {/* File Upload */}
      <div style={{ marginBottom: '30px' }}>
        <div
          style={{
            border: dragActive ? '2px solid blue' : '2px dashed gray',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#f0f8ff' : '#fafafa',
            cursor: 'pointer',
            maxWidth: '800px',
            margin: '0 auto'
          }}
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <p>Drop STL file here or click to browse</p>
          <input
            id="file-input"
            type="file"
            onChange={handleFileInput}
            accept=".stl"
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* 3D Viewer */}
      <Fixed3DViewer file={selectedFile} />
    </div>
  )
}

