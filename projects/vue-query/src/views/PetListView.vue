<script setup lang="ts">
/**
 * Pet List View
 *
 * Demonstrates:
 * - useFindPetsByStatus query with reactive parameters
 * - Filtering by pet status
 * - Query key exports for cache invalidation
 * - Vue reactive refs for query parameters
 */

import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useFindPetsByStatus, getFindPetsByStatusQueryKey } from '../api/queries';

type PetStatus = 'available' | 'pending' | 'sold';

const status = ref<PetStatus>('available');

// Demonstrates useFindPetsByStatus with reactive parameters
const params = computed(() => ({
  status: status.value,
}));

const { data: pets, isLoading, error, isFetching } = useFindPetsByStatus(params, {
  // Keep previous data while fetching new status
  placeholderData: (prev) => prev,
});

// Demonstrates exported query key - useful for cache invalidation
const queryKey = computed(() => getFindPetsByStatusQueryKey({ status: status.value }));
console.log('Pet list query key:', queryKey.value);

function handleStatusChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as PetStatus;
  status.value = value;
}

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
</script>

<template>
  <div class="pet-list">
    <div class="header">
      <h1>Pets</h1>
      <RouterLink to="/pets/new" class="btn btn-primary">
        + Add Pet
      </RouterLink>
    </div>

    <div class="filters">
      <label class="filter">
        Status:
        <select :value="status" @change="handleStatusChange">
          <option value="available">Available</option>
          <option value="pending">Pending</option>
          <option value="sold">Sold</option>
        </select>
      </label>
      <span v-if="isFetching" class="refreshing">Refreshing...</span>
    </div>

    <div v-if="isLoading" class="loading">
      Loading pets...
    </div>

    <div v-else-if="error" class="error">
      Error loading pets: {{ error.message }}
    </div>

    <template v-else>
      <div class="stats">
        Found {{ pets?.length ?? 0 }} {{ status }} pets
      </div>

      <div v-if="!pets?.length" class="empty">
        No pets found with status "{{ status }}".
      </div>

      <ul v-else class="list">
        <li v-for="pet in pets" :key="pet.id" class="list-item">
          <RouterLink :to="`/pets/${pet.id}`" class="pet-link">
            <div class="pet-info">
              <strong class="pet-name">{{ pet.name }}</strong>
              <span
                class="status-badge"
                :style="{ backgroundColor: getStatusColor(pet.status) }"
              >
                {{ pet.status }}
              </span>
              <span v-if="pet.category?.name" class="pet-category">{{ pet.category.name }}</span>
            </div>
            <div class="pet-meta">
              <span v-if="pet.photoUrls?.length">{{ pet.photoUrls.length }} photo(s)</span>
              <span v-if="pet.tags?.length">{{ pet.tags.map(t => t.name).join(', ') }}</span>
            </div>
          </RouterLink>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.pet-list {
  max-width: 800px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #5a6fd6;
  text-decoration: none;
}

.filters {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.refreshing {
  color: #666;
  font-style: italic;
}

.loading, .error, .empty {
  padding: 40px;
  text-align: center;
}

.error {
  color: #dc3545;
}

.empty {
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}

.stats {
  margin-bottom: 15px;
  color: #666;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: box-shadow 0.2s;
}

.list-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pet-link {
  display: block;
  padding: 15px;
  text-decoration: none;
  color: inherit;
}

.pet-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.pet-name {
  font-size: 1.1rem;
  color: #333;
}

.status-badge {
  padding: 3px 8px;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.pet-category {
  color: #666;
}

.pet-meta {
  display: flex;
  gap: 15px;
  color: #888;
  font-size: 0.9rem;
}
</style>
