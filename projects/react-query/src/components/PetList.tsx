/**
 * Pet List Component
 *
 * Demonstrates query with parameters:
 * - useListPets hook with query parameters
 * - Pagination (limit, offset)
 * - Filtering (status)
 * - Query key exports for cache invalidation
 */

import { useState } from 'react';
import { useListPets, getListPetsQueryKey } from '../api/hooks';
import type { PetStatus } from '../api/types';

interface PetListProps {
  onSelectPet: (petId: string) => void;
  selectedPetId: string | null;
}

export function PetList({ onSelectPet, selectedPetId }: PetListProps) {
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<PetStatus | undefined>(undefined);

  // Demonstrates useListPets with query parameters
  const { data, isLoading, error, isFetching } = useListPets(
    { limit, offset, status },
    {
      // Keep previous data while fetching new page
      placeholderData: (prev) => prev,
    },
  );

  // Demonstrates exported query key - useful for cache invalidation
  const queryKey = getListPetsQueryKey({ limit, offset, status });
  console.log('Pet list query key:', queryKey);

  if (isLoading) {
    return <div>Loading pets...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error loading pets: {error.message}</div>;
  }

  const pets = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;

  return (
    <div>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
        <label>
          Status:
          <select
            value={status ?? ''}
            onChange={(e) => {
              setStatus(e.target.value ? (e.target.value as PetStatus) : undefined);
              setOffset(0);
            }}
            style={{ marginLeft: '5px' }}
          >
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="adopted">Adopted</option>
            <option value="fostered">Fostered</option>
          </select>
        </label>
        {isFetching && <span style={{ color: '#666' }}>Refreshing...</span>}
      </div>

      <div style={{ marginBottom: '10px', color: '#666' }}>
        Showing {pets.length} of {total} pets
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {pets.map((pet) => (
          <li
            key={pet.id}
            onClick={() => onSelectPet(pet.id)}
            style={{
              padding: '10px',
              marginBottom: '5px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: selectedPetId === pet.id ? '#e3f2fd' : 'white',
            }}
          >
            <strong>{pet.name}</strong>
            <span
              style={{
                marginLeft: '10px',
                padding: '2px 6px',
                borderRadius: '3px',
                backgroundColor: getStatusColor(pet.status),
                color: 'white',
                fontSize: '12px',
              }}
            >
              {pet.status}
            </span>
            {pet.species && (
              <span style={{ marginLeft: '10px', color: '#666' }}>{pet.species}</span>
            )}
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
          Previous
        </button>
        <button disabled={!hasMore} onClick={() => setOffset(offset + limit)}>
          Next
        </button>
      </div>
    </div>
  );
}

function getStatusColor(status: PetStatus): string {
  switch (status) {
    case 'available':
      return '#4caf50';
    case 'pending':
      return '#ff9800';
    case 'adopted':
      return '#2196f3';
    case 'fostered':
      return '#9c27b0';
    default:
      return '#9e9e9e';
  }
}
