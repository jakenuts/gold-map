import React, { useCallback, useState } from 'react';
import { UploadIcon } from './UploadIcon';

interface Props {
  onFileSelect: (file: File) => void;
  loading: boolean;
  accept: string;
  maxSize?: number; // in bytes
}

export const FileUpload = ({ onFileSelect, loading, accept, maxSize = 10 * 1024 * 1024 }: Props) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validateFile = (file: File): boolean => {
    setError(null);
    setFileSize(formatFileSize(file.size));

    if (!file.name.match(/\.(json|geojson)$/i)) {
      setError('Please select a GeoJSON file (.json or .geojson)');
      return false;
    }

    if (maxSize && file.size > maxSize) {
      setError(`File size must be less than ${formatFileSize(maxSize)}`);
      return false;
    }

    // Quick validation of file size
    if (file.size < 50) {
      setError('File appears to be empty');
      return false;
    }

    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFileName(file.name);
      onFileSelect(file);
    }
  }, [onFileSelect, maxSize]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  return React.createElement('div', {
    className: `file-upload-container ${dragActive ? 'drag-active' : ''} ${loading ? 'loading' : ''}`,
    onDragEnter: handleDrag,
    onDragLeave: handleDrag,
    onDragOver: handleDrag,
    onDrop: handleDrop
  }, [
    React.createElement('label', {
      key: 'upload-label',
      className: 'file-upload-label'
    }, [
    React.createElement('div', {
      key: 'upload-content',
      className: 'upload-content'
    }, [
      React.createElement(UploadIcon, {
        key: 'icon',
        size: 48,
        color: loading ? '#ccc' : dragActive ? '#2196f3' : '#1976d2',
        className: loading ? 'upload-icon loading' : 'upload-icon'
      }),
      React.createElement('div', {
        key: 'upload-text',
        className: 'upload-text'
      }, [
        React.createElement('span', { key: 'main-text', className: 'main-text' },
          selectedFileName 
            ? `Selected: ${selectedFileName} (${fileSize})`
            : 'Drop GeoJSON file here or click to select'
        ),
        React.createElement('span', { key: 'sub-text', className: 'sub-text' },
          loading
            ? 'Processing GeoJSON data...'
            : `Supports JSON/GeoJSON up to ${formatFileSize(maxSize)}`
        )
      ])
    ]),
      React.createElement('input', {
        key: 'file-input',
        type: 'file',
        accept: accept,
        onChange: handleChange,
        disabled: loading,
        className: 'file-input'
      })
    ]),
    loading && React.createElement('div', {
      key: 'loading-overlay',
      className: 'loading-overlay'
    }, [
      React.createElement('div', {
        key: 'loading-spinner',
        className: 'loading-spinner'
      }),
      React.createElement('div', {
        key: 'loading-text',
        className: 'loading-text'
      }, 'Processing file...')
    ]),
    error && React.createElement('div', {
      key: 'error-message',
      className: 'error-message'
    }, error)
  ]);
};
