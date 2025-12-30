<script setup lang="ts">
/**
 * Files View
 *
 * Demonstrates:
 * - useUploadFile mutation with FormData
 * - useDeleteFile mutation
 * - File upload handling in Vue
 */

import { ref } from 'vue';
import { useUploadFile, useDeleteFile } from '../api/queries';

interface UploadedFile {
  id: string;
  url: string;
  size?: number;
  contentType?: string;
}

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const filename = ref('');
const uploadedFiles = ref<UploadedFile[]>([]);

const uploadFile = useUploadFile({
  onSuccess: (response) => {
    console.log('File uploaded:', response);
    uploadedFiles.value.push(response);
    resetForm();
  },
  onError: (error) => {
    console.error('Upload failed:', error);
  },
});

const deleteFile = useDeleteFile({
  onSuccess: (_, variables) => {
    console.log('File deleted');
    uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== variables.fileId);
  },
});

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0];
    filename.value = input.files[0].name;
  }
}

function handleUpload() {
  if (!selectedFile.value) return;

  uploadFile.mutate({
    data: {
      // Cast File to any since the generated type expects string
      // but actual FormData file uploads need File objects
      file: selectedFile.value as unknown as string,
      filename: filename.value || undefined,
    },
  });
}

function handleDelete(fileId: string) {
  if (confirm('Are you sure you want to delete this file?')) {
    deleteFile.mutate({ fileId });
  }
}

function resetForm() {
  selectedFile.value = null;
  filename.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<template>
  <div class="files-view">
    <h1>File Upload</h1>
    <p class="subtitle">
      Demonstrates FormData mutations with file upload
    </p>

    <div class="upload-section">
      <h2>Upload a File</h2>

      <div class="upload-form">
        <div class="form-group">
          <label for="file">Select File</label>
          <input
            id="file"
            ref="fileInput"
            type="file"
            @change="handleFileChange"
          />
        </div>

        <div class="form-group">
          <label for="filename">Custom Filename (optional)</label>
          <input
            id="filename"
            v-model="filename"
            type="text"
            placeholder="Leave empty to use original filename"
          />
        </div>

        <div v-if="selectedFile" class="selected-file">
          <strong>Selected:</strong> {{ selectedFile.name }}
          ({{ formatFileSize(selectedFile.size) }})
        </div>

        <div v-if="uploadFile.error.value" class="error">
          Error: {{ uploadFile.error.value.message }}
        </div>

        <button
          class="btn btn-primary"
          :disabled="!selectedFile || uploadFile.isPending.value"
          @click="handleUpload"
        >
          {{ uploadFile.isPending.value ? 'Uploading...' : 'Upload File' }}
        </button>
      </div>
    </div>

    <div v-if="uploadedFiles.length > 0" class="uploaded-section">
      <h2>Uploaded Files</h2>

      <ul class="file-list">
        <li v-for="file in uploadedFiles" :key="file.id" class="file-item">
          <div class="file-info">
            <span class="file-icon">📄</span>
            <div class="file-details">
              <a :href="file.url" target="_blank" class="file-url">
                {{ file.url }}
              </a>
              <div class="file-meta">
                <span>ID: {{ file.id }}</span>
                <span v-if="file.size">Size: {{ formatFileSize(file.size) }}</span>
                <span v-if="file.contentType">Type: {{ file.contentType }}</span>
              </div>
            </div>
          </div>
          <button
            class="btn btn-small btn-danger"
            :disabled="deleteFile.isPending.value"
            @click="handleDelete(file.id)"
          >
            Delete
          </button>
        </li>
      </ul>
    </div>

    <div class="info-box">
      <h3>How it works</h3>
      <p>
        This view demonstrates how to use the generated <code>useUploadFile</code> mutation
        with FormData. The mutation automatically converts the request body to FormData
        using the configured <code>toFormData</code> function.
      </p>
      <pre><code>const uploadFile = useUploadFile({
  onSuccess: (response) => {
    console.log('Uploaded:', response);
  },
});

// Call the mutation with a file
uploadFile.mutate({
  data: {
    file: selectedFile,
    filename: 'custom-name.txt',
  },
});</code></pre>
    </div>
  </div>
</template>

<style scoped>
.files-view {
  max-width: 800px;
}

h1 {
  margin-bottom: 5px;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
}

.upload-section {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
}

.upload-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.2rem;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input[type="file"] {
  padding: 10px;
  border: 2px dashed #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.form-group input[type="text"] {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.selected-file {
  padding: 10px;
  background: #e8f5e9;
  border-radius: 6px;
  color: #2e7d32;
}

.error {
  padding: 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  color: #c00;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: #667eea;
  color: white;
  align-self: flex-start;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd6;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.85rem;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.uploaded-section {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
}

.uploaded-section h2 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 1.5rem;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-url {
  color: #667eea;
  word-break: break-all;
}

.file-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: #666;
}

.info-box {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 25px;
}

.info-box h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.info-box p {
  margin-bottom: 15px;
}

.info-box code {
  background: #e8eaf6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.info-box pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0;
}

.info-box pre code {
  background: none;
  padding: 0;
}
</style>
