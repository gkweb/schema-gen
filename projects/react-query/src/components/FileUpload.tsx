/**
 * File Upload Component
 *
 * Demonstrates FormData mutation usage:
 * - useUploadFile mutation with multipart/form-data
 * - File input handling
 * - FormData builder integration (toFormData)
 */

import { useState, useRef } from 'react';
import { useUploadFile } from '../api/hooks';

export function FileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ id: string; url: string } | null>(null);

  // Demonstrates useUploadFile mutation with FormData
  const uploadFile = useUploadFile({
    onSuccess: (response) => {
      console.log('File uploaded:', response);
      setUploadedFile(response);
      setSelectedFile(null);
      setFilename('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilename(file.name);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    // The mutation expects FormData-compatible data
    // Our toFormData utility will convert this to FormData
    uploadFile.mutate({
      data: {
        file: selectedFile,
        filename: filename || selectedFile.name,
      },
    });
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px' }}>
      <h3>Upload a File</h3>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Demonstrates FormData mutation with multipart/form-data
      </p>

      <div style={{ marginBottom: '15px' }}>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx"
        />
      </div>

      {selectedFile && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Selected:</strong> {selectedFile.name} (
            {(selectedFile.size / 1024).toFixed(1)} KB)
          </div>

          <label>
            Custom filename:
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={selectedFile.name}
              style={{ marginLeft: '10px', width: '200px' }}
            />
          </label>
        </div>
      )}

      <button onClick={handleUpload} disabled={!selectedFile || uploadFile.isPending}>
        {uploadFile.isPending ? 'Uploading...' : 'Upload File'}
      </button>

      {uploadFile.error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Upload failed: {uploadFile.error.message}
        </div>
      )}

      {uploadedFile && (
        <div
          style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#e8f5e9',
            borderRadius: '4px',
          }}
        >
          <strong>Uploaded successfully!</strong>
          <div style={{ marginTop: '5px' }}>
            <span style={{ color: '#666' }}>ID:</span> {uploadedFile.id}
          </div>
          <div>
            <span style={{ color: '#666' }}>URL:</span>{' '}
            <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer">
              {uploadedFile.url}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
