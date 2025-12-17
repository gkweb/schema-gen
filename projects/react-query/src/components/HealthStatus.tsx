/**
 * Health Status Component
 *
 * Demonstrates basic query usage with no parameters:
 * - useGetHealth hook
 * - Loading and error states
 * - Data display
 */

import { useGetHealth } from '../api/hooks';

export function HealthStatus() {
  const { data, isLoading, error, refetch } = useGetHealth();

  if (isLoading) {
    return <div>Checking health status...</div>;
  }

  if (error) {
    return (
      <div style={{ color: 'red' }}>
        Error checking health: {error.message}
        <button onClick={() => refetch()} style={{ marginLeft: '10px' }}>
          Retry
        </button>
      </div>
    );
  }

  const statusColor = {
    healthy: 'green',
    degraded: 'orange',
    unhealthy: 'red',
  }[data?.status ?? 'unhealthy'];

  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <span
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: statusColor,
        }}
      />
      <span>API Status: {data?.status}</span>
      {data?.version && <span style={{ color: '#666' }}>v{data.version}</span>}
    </div>
  );
}
