<script setup lang="ts">
/**
 * Health Status View
 *
 * Demonstrates:
 * - Simple useGetHealth query with no parameters
 * - Displaying query status (loading, error, success)
 * - Refetch functionality
 */

import { useGetHealth } from '../api/queries';

const { data: health, isLoading, error, isFetching, refetch } = useGetHealth();

function getStatusColor(status: string): string {
  switch (status) {
    case 'healthy':
      return '#4caf50';
    case 'degraded':
      return '#ff9800';
    case 'unhealthy':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
}

function formatUptime(seconds?: number): string {
  if (seconds === undefined) return 'Unknown';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp).toLocaleString();
}
</script>

<template>
  <div class="health-view">
    <h1>API Health Status</h1>
    <p class="subtitle">
      Monitor the health of the Petstore API
    </p>

    <div class="status-card">
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <span>Checking health status...</span>
      </div>

      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <div class="error-content">
          <h3>Unable to check health</h3>
          <p>{{ error.message }}</p>
          <button class="btn" @click="() => refetch()">
            Try Again
          </button>
        </div>
      </div>

      <template v-else-if="health">
        <div class="status-header">
          <div
            class="status-indicator"
            :style="{ backgroundColor: getStatusColor(health.status) }"
          >
            <span class="status-icon">
              {{ health.status === 'healthy' ? '✓' : health.status === 'degraded' ? '!' : '✕' }}
            </span>
          </div>
          <div class="status-info">
            <h2>{{ health.status.charAt(0).toUpperCase() + health.status.slice(1) }}</h2>
            <p>API is {{ health.status === 'healthy' ? 'operating normally' : 'experiencing issues' }}</p>
          </div>
          <button
            class="btn btn-refresh"
            :disabled="isFetching"
            @click="() => refetch()"
          >
            {{ isFetching ? 'Checking...' : 'Refresh' }}
          </button>
        </div>

        <div class="status-details">
          <div class="detail-item">
            <label>Version</label>
            <span>{{ health.version ?? 'Unknown' }}</span>
          </div>

          <div class="detail-item">
            <label>Uptime</label>
            <span>{{ formatUptime(health.uptime) }}</span>
          </div>

          <div class="detail-item">
            <label>Last Checked</label>
            <span>{{ formatTimestamp(health.timestamp) }}</span>
          </div>
        </div>
      </template>
    </div>

    <div class="info-box">
      <h3>About this view</h3>
      <p>
        This view demonstrates a simple query with no parameters using the
        generated <code>useGetHealth</code> composable.
      </p>
      <pre><code>const {
  data: health,
  isLoading,
  error,
  isFetching,
  refetch
} = useGetHealth();

// Access the data reactively
health.value?.status   // 'healthy' | 'degraded' | 'unhealthy'
health.value?.version  // API version
health.value?.uptime   // Uptime in seconds</code></pre>
    </div>
  </div>
</template>

<style scoped>
.health-view {
  max-width: 600px;
}

h1 {
  margin-bottom: 5px;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
}

.status-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 30px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #eee;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  background: #fee;
  border-radius: 8px;
}

.error-icon {
  font-size: 2rem;
}

.error-content h3 {
  margin: 0 0 5px;
  color: #c00;
}

.error-content p {
  margin: 0 0 15px;
  color: #666;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
  padding-bottom: 25px;
  border-bottom: 1px solid #eee;
}

.status-indicator {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-icon {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}

.status-info {
  flex: 1;
}

.status-info h2 {
  margin: 0 0 5px;
}

.status-info p {
  margin: 0;
  color: #666;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  font-weight: 500;
}

.btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-refresh {
  flex-shrink: 0;
}

.status-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-item label {
  font-size: 0.85rem;
  color: #666;
  text-transform: uppercase;
  font-weight: 500;
}

.detail-item span {
  font-size: 1.1rem;
  color: #333;
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
