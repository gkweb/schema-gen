/**
 * Pet List Component
 *
 * Demonstrates:
 * - useFindPetsByStatus query with dynamic parameters
 * - Filtering by pet status
 * - Query key exports for cache invalidation
 * - keepPreviousData for smooth transitions
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFindPetsByStatus, getFindPetsByStatusQueryKey } from '../api/hooks';

type PetStatus = 'available' | 'pending' | 'sold';

export function PetList() {
  const [status, setStatus] = useState<PetStatus>('available');

  // Demonstrates useFindPetsByStatus with dynamic parameters
  const { data: pets, isLoading, error, isFetching } = useFindPetsByStatus(
    { status },
    {
      // Keep previous data while fetching new status
      placeholderData: (prev) => prev,
    }
  );

  // Demonstrates exported query key - useful for cache invalidation
  const queryKey = getFindPetsByStatusQueryKey({ status });
  console.log('Pet list query key:', queryKey);

  function getStatusColor(petStatus: string | undefined): string {
    switch (petStatus) {
      case 'available':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'sold':
        return '#2196f3';
      default:
        return '#9e9e9e';
    }
  }

  return (
    <div className="pet-list">
      <div className="header">
        <h1>Pets</h1>
        <Link to="/pets/new" className="btn btn-primary">
          + Add Pet
        </Link>
      </div>

      <div className="filters">
        <label className="filter">
          Status:
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PetStatus)}
          >
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
          </select>
        </label>
        {isFetching && <span className="refreshing">Refreshing...</span>}
      </div>

      {isLoading ? (
        <div className="loading">Loading pets...</div>
      ) : error ? (
        <div className="error">Error loading pets: {error.message}</div>
      ) : (
        <>
          <div className="stats">
            Found {pets?.length ?? 0} {status} pets
          </div>

          {!pets?.length ? (
            <div className="empty">No pets found with status "{status}".</div>
          ) : (
            <ul className="list">
              {pets.map((pet) => (
                <li key={pet.id} className="list-item">
                  <Link to={`/pets/${pet.id}`} className="pet-link">
                    <div className="pet-info">
                      <strong className="pet-name">{pet.name}</strong>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(pet.status) }}
                      >
                        {pet.status}
                      </span>
                      {pet.category?.name && (
                        <span className="pet-category">{pet.category.name}</span>
                      )}
                    </div>
                    <div className="pet-meta">
                      {pet.photoUrls?.length && (
                        <span>{pet.photoUrls.length} photo(s)</span>
                      )}
                      {pet.tags?.length && (
                        <span>{pet.tags.map((t) => t.name).join(', ')}</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
