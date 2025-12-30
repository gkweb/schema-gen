<script setup lang="ts">
/**
 * Pet Detail View
 *
 * Demonstrates:
 * - useGetPet query with path parameter (petId from route)
 * - useDeletePet mutation
 * - Query invalidation after mutation
 * - Navigation after delete
 */

import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import { useGetPet, useDeletePet, getGetPetQueryKey } from '../api/queries';
import { PetStatus } from '../api/enums';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const queryClient = useQueryClient();

// Demonstrates useGetPet with path parameter from route
const params = computed(() => ({ petId: props.id }));
const { data: pet, isLoading, error } = useGetPet(params);

// Demonstrates useDeletePet mutation
const deletePet = useDeletePet({
  onSuccess: () => {
    console.log('Pet deleted');

    // Remove from cache
    queryClient.removeQueries({
      queryKey: getGetPetQueryKey({ petId: props.id }),
    });

    // Invalidate list queries
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey as string[];
        return key[0] === 'listPets';
      },
    });

    // Navigate back to list
    router.push('/pets');
  },
});

function handleDelete() {
  if (confirm('Are you sure you want to delete this pet?')) {
    deletePet.mutate({ petId: props.id });
  }
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>

<template>
  <div class="pet-detail">
    <div class="breadcrumb">
      <RouterLink to="/pets">Pets</RouterLink>
      <span>/</span>
      <span>{{ pet?.name ?? 'Loading...' }}</span>
    </div>

    <div v-if="isLoading" class="loading">
      Loading pet details...
    </div>

    <div v-else-if="error" class="error">
      Error: {{ error.message }}
    </div>

    <div v-else-if="!pet" class="not-found">
      Pet not found
    </div>

    <template v-else>
      <div class="header">
        <div class="title-section">
          <h1>{{ pet.name }}</h1>
          <span
            class="status-badge"
            :style="{ backgroundColor: getStatusColor(pet.status) }"
          >
            {{ pet.status }}
          </span>
        </div>
        <div class="actions">
          <RouterLink :to="`/pets/${id}/edit`" class="btn btn-secondary">
            Edit
          </RouterLink>
          <button
            class="btn btn-danger"
            :disabled="deletePet.isPending.value"
            @click="handleDelete"
          >
            {{ deletePet.isPending.value ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>

      <div class="card">
        <div class="info-grid">
          <div v-if="pet.species" class="info-item">
            <label>Species</label>
            <span>{{ pet.species }}</span>
          </div>

          <div v-if="pet.breed" class="info-item">
            <label>Breed</label>
            <span>{{ pet.breed }}</span>
          </div>

          <div v-if="pet.age !== undefined" class="info-item">
            <label>Age</label>
            <span>{{ pet.age }} years</span>
          </div>

          <div v-if="pet.tags && pet.tags.length > 0" class="info-item">
            <label>Tags</label>
            <div class="tags">
              <span v-for="tag in pet.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>

          <div v-if="pet.owner" class="info-item">
            <label>Owner</label>
            <RouterLink :to="`/users/${pet.owner.id}`">
              {{ pet.owner.name || pet.owner.email }}
            </RouterLink>
          </div>

          <div v-if="pet.createdAt" class="info-item">
            <label>Created</label>
            <span>{{ formatDate(pet.createdAt) }}</span>
          </div>

          <div v-if="pet.updatedAt" class="info-item">
            <label>Updated</label>
            <span>{{ formatDate(pet.updatedAt) }}</span>
          </div>
        </div>

        <div v-if="pet.photoUrl" class="photo-section">
          <label>Photo</label>
          <img :src="pet.photoUrl" :alt="pet.name" class="pet-photo" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pet-detail {
  max-width: 800px;
}

.breadcrumb {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 20px;
  color: #666;
}

.breadcrumb a {
  color: #667eea;
}

.loading, .error, .not-found {
  padding: 40px;
  text-align: center;
}

.error {
  color: #dc3545;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-section h1 {
  margin: 0;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 6px;
  color: white;
  font-size: 0.85rem;
  text-transform: uppercase;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
}

.btn-secondary {
  background: #fff;
  border-color: #ddd;
  color: #333;
}

.btn-secondary:hover {
  background: #f5f5f5;
  text-decoration: none;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item label {
  font-size: 0.85rem;
  color: #666;
  text-transform: uppercase;
  font-weight: 500;
}

.info-item span, .info-item a {
  font-size: 1rem;
  color: #333;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 4px 10px;
  background: #e8eaf6;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #5c6bc0;
}

.photo-section {
  margin-top: 25px;
  padding-top: 25px;
  border-top: 1px solid #eee;
}

.photo-section label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  text-transform: uppercase;
  font-weight: 500;
  margin-bottom: 10px;
}

.pet-photo {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  object-fit: cover;
}
</style>
