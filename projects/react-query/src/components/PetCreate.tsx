/**
 * Pet Create Component
 *
 * Demonstrates:
 * - useAddPet mutation
 * - Form handling
 * - Query invalidation after creation
 * - Navigation after success
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAddPet } from '../api/hooks';
import { Pet_Status } from '../api/enums';

export function PetCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [status, setStatus] = useState<Pet_Status>(Pet_Status.AVAILABLE);

  // Demonstrates useAddPet mutation
  const addPet = useAddPet({
    onSuccess: (newPet) => {
      console.log('Pet created:', newPet);

      // Invalidate pet list queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === 'findPetsByStatus';
        },
      });

      // Navigate to the new pet's detail page
      navigate(`/pets/${newPet.id}`);
    },
    onError: (error) => {
      console.error('Failed to create pet:', error);
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

    addPet.mutate({
      data: {
        name,
        category: category ? { name: category } : undefined,
        photoUrls: photoUrls.length > 0 ? photoUrls : [''],
        status,
      },
    });
  }

  return (
    <div className="pet-create">
      <div className="breadcrumb">
        <Link to="/pets">Pets</Link>
        <span>/</span>
        <span>Add Pet</span>
      </div>

      <h1>Add New Pet</h1>

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

        {addPet.error && (
          <div className="error">Error: {addPet.error.message}</div>
        )}

        <div className="form-actions">
          <Link to="/pets" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={addPet.isPending || !name}
          >
            {addPet.isPending ? 'Creating...' : 'Create Pet'}
          </button>
        </div>
      </form>
    </div>
  );
}
