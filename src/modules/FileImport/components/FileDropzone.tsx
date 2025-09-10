
// src/modules/FileImport/components/FileDropzone.tsx
import React, { useCallback, useState, useRef, ChangeEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileType, SUPPORTED_FORMATS } from '../types';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  accept?: FileType[];
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  inputRef?: React.MutableRefObject<HTMLInputElement | null>;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelected,
  accept = ['stl', 'step', '3mf'],
  maxSize = 100 * 1024 * 1024, // 100MB
  disabled = false,
  className = '',
  inputRef,
}) => {
  const [error, setError] = useState<string | null>(null);
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = inputRef || internalFileInputRef;

  // Get accepted file extensions
  const acceptedExtensions = accept.flatMap(type => SUPPORTED_FORMATS[type] || []);
  const acceptedMimeTypes = {
    'application/octet-stream': ['.stl', '.step', '.stp', '.3mf'],
    'application/vnd.ms-pki.stl': ['.stl'],
    'application/sla': ['.stl'],
    'model/stl': ['.stl'],
    'model/step': ['.step', '.stp'],
    'model/3mf': ['.3mf'],
  };

  const validateFile = React.useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: `File too large. Max size is ${maxSize / (1024 * 1024)}MB` };
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isValidExtension = acceptedExtensions.some(ext => ext.toLowerCase() === `.${extension}`);

    if (!isValidExtension) {
      return { 
        valid: false, 
        error: `Unsupported file format. Supported formats: ${acceptedExtensions.join(', ')}` 
      };
    }

    return { valid: true };
  }, [acceptedExtensions, maxSize]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const file = acceptedFiles[0];
      
      if (!file) return;
      
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }
      
      onFileSelected(file);
    },
    [onFileSelected, validateFile]
  );

  const { getRootProps, getInputProps, isDragActive: isDragActiveDropzone } = useDropzone({
    onDrop,
    accept: acceptedMimeTypes,
    multiple: false,
    disabled,
  });

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file);
      if (validation.valid) {
        onFileSelected(file);
      } else {
        setError(validation.error || 'Invalid file');
      }
    }
  };

  const dropzoneClasses = `
    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
    transition-colors duration-200
    ${isDragActiveDropzone ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 dark:hover:border-blue-500'}
    ${className}
  `;

  return (
    <div className="h-full flex flex-col">
      <div
        {...getRootProps()}
        className={dropzoneClasses}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) handleClick();
        }}
      >
        <input 
          {...getInputProps()} 
          ref={fileInputRef} 
          onChange={handleFileInputChange} 
          className="hidden" 
          accept={acceptedExtensions.join(',')}
        />
        <div className="space-y-2">
          <div className="flex justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">
            {isDragActiveDropzone ? 'Drop the file here' : 'Drag and drop your file here'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            or click to browse
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Supported formats: {acceptedExtensions.join(', ')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Max size: {maxSize / (1024 * 1024)}MB
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
