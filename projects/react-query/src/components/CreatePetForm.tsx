/**
 * Create Pet Form Component
 *
 * Demonstrates mutation usage:
 * - useCreatePet mutation hook
 * - Mutation variables (request body)
 * - Loading and error states
 * - Query invalidation after mutation
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreatePet, getListPetsQueryKey } from '../api/hooks';
import type { PetStatus } from '../api/types';

interface CreatePetFormProps {
  onSuccess: () => void;
}

export function CreatePetForm({ onSuccess }: CreatePetFormProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [status, setStatus] = useState<PetStatus>('available');

  // Demonstrates useCreatePet mutation
  const createPet = useCreatePet({
    onSuccess: (newPet) => {
      console.log('Pet created:', newPet);

      // Invalidate pet list queries to refetch
      // Demonstrates using exported query key for cache invalidation
      queryClient.invalidateQueries({
        queryKey: getListPetsQueryKey({ limit: 10, offset: 0 }),
      });

      // Also invalidate all pet list queries (any params)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === 'listPets';
        },
      });

      onSuccess();
    },
    onError: (error) => {
      console.error('Failed to create pet:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createPet.mutate({
      data: {
        name,
        species: species || undefined,
        breed: breed || undefined,
        age: age !== '' ? age : undefined,
        status,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create New Pet</h3>

      <div style={{ marginBottom: '10px' }}>
        <label>
          Name: *
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ marginLeft: '10px', width: '200px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>
          Species:
          <input
            type="text"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            placeholder="Dog, Cat, etc."
            style={{ marginLeft: '10px', width: '200px' }}
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
            style={{ marginLeft: '10px', width: '200px' }}
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
            max={100}
            style={{ marginLeft: '10px', width: '80px' }}
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

      {createPet.error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          Error: {createPet.error.message}
        </div>
      )}

      <button type="submit" disabled={createPet.isPending || !name}>
        {createPet.isPending ? 'Creating...' : 'Create Pet'}
      </button>
    </form>
  );
}
