/**
 * Pet Edit Component
 *
 * Demonstrates:
 * - useGetPetById query to load existing data
 * - useUpdatePet mutation
 * - Populating form with query data
 * - Cache invalidation and update after mutation
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useGetPetById, useUpdatePet, getGetPetByIdQueryKey } from '../api/hooks';
import { Pet_Status } from '../api/enums';

export function PetEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const petId = parseInt(id ?? '0', 10);

  // Load existing pet data
  const { data: pet, isLoading, error } = useGetPetById({ petId });

  // Form state - will be populated when pet data loads
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [status, setStatus] = useState<Pet_Status>(Pet_Status.AVAILABLE);

  // Populate form when pet data loads
  useEffect(() => {
    if (pet) {
      setName(pet.name);
      setCategory(pet.category?.name ?? '');
      setPhotoUrls([...(pet.photoUrls ?? [])]);
      setStatus((pet.status as Pet_Status) ?? Pet_Status.AVAILABLE);
    }
  }, [pet]);

  // Demonstrates useUpdatePet mutation
  const updatePet = useUpdatePet({
    onSuccess: (updatedPet) => {
      console.log('Pet updated:', updatedPet);

      // Update cache with new data
      queryClient.setQueryData(getGetPetByIdQueryKey({ petId }), updatedPet);

      // Invalidate list queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === 'findPetsByStatus';
        },
      });

      // Navigate back to detail page
      navigate(`/pets/${petId}`);
    },
  });

  function addPhotoUrl() {
    if (newPhotoUrl.trim()) {
      setPhotoUrls([...photoUrls, newPhotoUrl.trim()]);
      setNewPhotoUrl('');
    }
  }

  function removePhotoUrl(index: number) {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    updatePet.mutate({
      data: {
        id: petId,
        name,
        category: category ? { name: category } : undefined,
        photoUrls: photoUrls.length > 0 ? photoUrls : [''],
        status,
      },
    });
  }

  if (isLoading) {
    return <div className="loading">Loading pet...</div>;
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }

  if (!pet) {
    return <div className="not-found">Pet not found</div>;
  }

  return (
    <div className="pet-edit">
      <div className="breadcrumb">
        <Link to="/pets">Pets</Link>
        <span>/</span>
        <Link to={`/pets/${id}`}>{pet.name}</Link>
        <span>/</span>
        <span>Edit</span>
      </div>

      <h1>Edit {pet.name}</h1>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter pet name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Dog, Cat, Bird"
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Pet_Status)}
          >
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        <div className="form-group">
          <label>Photo URLs</label>
          <div className="photo-input">
            <input
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              placeholder="Enter photo URL"
            />
            <button type="button" onClick={addPhotoUrl}>
              Add
            </button>
          </div>
          {photoUrls.length > 0 && (
            <ul className="photo-list">
              {photoUrls.map((url, index) => (
                <li key={index}>
                  <span>{url}</span>
                  <button type="button" onClick={() => removePhotoUrl(index)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {updatePet.error && (
          <div className="error">Error: {updatePet.error.message}</div>
        )}

        <div className="form-actions">
          <Link to={`/pets/${id}`} className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={updatePet.isPending || !name}
          >
            {updatePet.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
