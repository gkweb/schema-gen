/**
 * Pet Details Component
 *
 * Demonstrates:
 * - Query with path parameters (useGetPet)
 * - Mutation with path parameters (useUpdatePet, useDeletePet)
 * - Query options for prefetching
 * - Optimistic updates
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetPet,
  useUpdatePet,
  useDeletePet,
  getGetPetQueryKey,
  getListPetsQueryKey,
} from '../api/hooks';
import type { PetStatus } from '../api/types';

interface PetDetailsProps {
  petId: string;
  onClose: () => void;
}

export function PetDetails({ petId, onClose }: PetDetailsProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Demonstrates useGetPet with path parameter
  const { data: pet, isLoading, error } = useGetPet({ petId });

  // Demonstrates useUpdatePet with path parameter and body
  const updatePet = useUpdatePet({
    onSuccess: (updatedPet) => {
      console.log('Pet updated:', updatedPet);

      // Update the cache directly
      queryClient.setQueryData(getGetPetQueryKey({ petId }), updatedPet);

      // Invalidate list queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === 'listPets';
        },
      });

      setIsEditing(false);
    },
  });

  // Demonstrates useDeletePet with path parameter only (no body)
  const deletePet = useDeletePet({
    onSuccess: () => {
      console.log('Pet deleted');

      // Remove from cache
      queryClient.removeQueries({
        queryKey: getGetPetQueryKey({ petId }),
      });

      // Invalidate list queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === 'listPets';
        },
      });

      onClose();
    },
  });

  if (isLoading) {
    return <div>Loading pet details...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error.message}</div>;
  }

  if (!pet) {
    return <div>Pet not found</div>;
  }

  if (isEditing) {
    return (
      <EditPetForm
        pet={pet}
        onSave={(updates) => {
          updatePet.mutate({
            petId,
            data: {
              name: updates.name,
              status: updates.status,
              species: updates.species,
              breed: updates.breed,
              age: updates.age,
            },
          });
        }}
        onCancel={() => setIsEditing(false)}
        isLoading={updatePet.isPending}
      />
    );
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ margin: 0 }}>{pet.name}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          &times;
        </button>
      </div>

      <dl style={{ marginTop: '15px' }}>
        <dt style={{ fontWeight: 'bold' }}>Status</dt>
        <dd>{pet.status}</dd>

        {pet.species && (
          <>
            <dt style={{ fontWeight: 'bold', marginTop: '10px' }}>Species</dt>
            <dd>{pet.species}</dd>
          </>
        )}

        {pet.breed && (
          <>
            <dt style={{ fontWeight: 'bold', marginTop: '10px' }}>Breed</dt>
            <dd>{pet.breed}</dd>
          </>
        )}

        {pet.age !== undefined && (
          <>
            <dt style={{ fontWeight: 'bold', marginTop: '10px' }}>Age</dt>
            <dd>{pet.age} years</dd>
          </>
        )}

        {pet.tags && pet.tags.length > 0 && (
          <>
            <dt style={{ fontWeight: 'bold', marginTop: '10px' }}>Tags</dt>
            <dd>{pet.tags.join(', ')}</dd>
          </>
        )}

        {pet.createdAt && (
          <>
            <dt style={{ fontWeight: 'bold', marginTop: '10px' }}>Created</dt>
            <dd>{new Date(pet.createdAt).toLocaleDateString()}</dd>
          </>
        )}
      </dl>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this pet?')) {
              deletePet.mutate({ petId });
            }
          }}
          disabled={deletePet.isPending}
          style={{ backgroundColor: '#f44336', color: 'white' }}
        >
          {deletePet.isPending ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

interface EditPetFormProps {
  pet: {
    name: string;
    status: PetStatus;
    species?: string;
    breed?: string;
    age?: number;
    tags?: string[];
  };
  onSave: (updates: {
    name: string;
    status: PetStatus;
    species?: string;
    breed?: string;
    age?: number;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function EditPetForm({ pet, onSave, onCancel, isLoading }: EditPetFormProps) {
  const [name, setName] = useState(pet.name);
  const [status, setStatus] = useState(pet.status);
  const [species, setSpecies] = useState(pet.species ?? '');
  const [breed, setBreed] = useState(pet.breed ?? '');
  const [age, setAge] = useState<number | ''>(pet.age ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      status,
      species: species || undefined,
      breed: breed || undefined,
      age: age !== '' ? age : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ddd', padding: '15px' }}>
      <h3>Edit Pet</h3>

      <div style={{ marginBottom: '10px' }}>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ marginLeft: '10px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>
          Status:
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PetStatus)}
            style={{ marginLeft: '10px' }}
          >
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="adopted">Adopted</option>
            <option value="fostered">Fostered</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>
          Species:
          <input
            type="text"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            style={{ marginLeft: '10px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>
          Breed:
          <input
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            style={{ marginLeft: '10px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>
          Age:
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
            min={0}
            style={{ marginLeft: '10px', width: '80px' }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
      </div>
    </form>
  );
}
