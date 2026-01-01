/**
 * Pet Detail Component
 *
 * Demonstrates:
 * - useGetPetById query with path parameter
 * - useDeletePet mutation
 * - Query invalidation after mutation
 * - Navigation after delete
 */

import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useGetPetById, useDeletePet, getGetPetByIdQueryKey } from '../api/hooks';

export function PetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const petId = parseInt(id ?? '0', 10);

  // Demonstrates useGetPetById with path parameter from route
  const { data: pet, isLoading, error } = useGetPetById({ petId });

  // Demonstrates useDeletePet mutation
  const deletePet = useDeletePet({
    onSuccess: () => {
      console.log('Pet deleted');

      // Remove from cache
      queryClient.removeQueries({
        queryKey: getGetPetByIdQueryKey({ petId }),
      });

      // Invalidate list queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === 'findPetsByStatus';
        },
      });

      // Navigate back to list
      navigate('/pets');
    },
  });

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this pet?')) {
      deletePet.mutate({ petId });
    }
  }

  function getStatusColor(status: string | undefined): string {
    switch (status) {
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
    <div className="pet-detail">
      <div className="breadcrumb">
        <Link to="/pets">Pets</Link>
        <span>/</span>
        <span>{pet?.name ?? 'Loading...'}</span>
      </div>

      {isLoading ? (
        <div className="loading">Loading pet details...</div>
      ) : error ? (
        <div className="error">Error: {error.message}</div>
      ) : !pet ? (
        <div className="not-found">Pet not found</div>
      ) : (
        <>
          <div className="header">
            <div className="title-section">
              <h1>{pet.name}</h1>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(pet.status) }}
              >
                {pet.status}
              </span>
            </div>
            <div className="actions">
              <Link to={`/pets/${id}/edit`} className="btn btn-secondary">
                Edit
              </Link>
              <button
                className="btn btn-danger"
                disabled={deletePet.isPending}
                onClick={handleDelete}
              >
                {deletePet.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="info-grid">
              <div className="info-item">
                <label>ID</label>
                <span>{pet.id}</span>
              </div>

              <div className="info-item">
                <label>Name</label>
                <span>{pet.name}</span>
              </div>

              {pet.category && (
                <div className="info-item">
                  <label>Category</label>
                  <span>{pet.category.name}</span>
                </div>
              )}

              <div className="info-item">
                <label>Status</label>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(pet.status) }}
                >
                  {pet.status}
                </span>
              </div>

              {pet.tags && pet.tags.length > 0 && (
                <div className="info-item full-width">
                  <label>Tags</label>
                  <div className="tags">
                    {pet.tags.map((tag) => (
                      <span key={tag.id} className="tag">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {pet.photoUrls && pet.photoUrls.length > 0 && (
              <div className="photo-section">
                <label>Photos</label>
                <div className="photo-grid">
                  {pet.photoUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`${pet.name} photo ${index + 1}`}
                      className="pet-photo"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
