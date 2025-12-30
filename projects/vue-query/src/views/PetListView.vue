<script setup lang="ts">
/**
 * Pet List View
 *
 * Demonstrates:
 * - useListPets query with reactive parameters
 * - Pagination (limit, offset)
 * - Filtering (status)
 * - Query key exports for cache invalidation
 * - Vue reactive refs for query parameters
 */

import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useListPets, getListPetsQueryKey } from '../api/queries';
import { PetStatus } from '../api/enums';

const limit = ref(10);
const offset = ref(0);
const status = ref<PetStatus | undefined>(undefined);

// Demonstrates useListPets with reactive parameters
const params = computed(() => ({
  limit: limit.value,
  offset: offset.value,
  status: status.value,
}));

const { data, isLoading, error, isFetching } = useListPets(params, {
  // Keep previous data while fetching new page
  placeholderData: (prev) => prev,
});

// Demonstrates exported query key - useful for cache invalidation
const queryKey = computed(() => getListPetsQueryKey(params.value));
console.log('Pet list query key:', queryKey.value);

const pets = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.total ?? 0);
const hasMore = computed(() => data.value?.hasMore ?? false);

const currentPage = computed(() => Math.floor(offset.value / limit.value) + 1);
const totalPages = computed(() => Math.ceil(total.value / limit.value));

function goToPrevPage() {
  offset.value = Math.max(0, offset.value - limit.value);
}

function goToNextPage() {
  offset.value = offset.value + limit.value;
}

function handleStatusChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  status.value = value ? (value as PetStatus) : undefined;
  offset.value = 0; // Reset to first page
}

function getStatusColor(petStatus: PetStatus): string {
  switch (petStatus) {
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
        <select :value="status ?? ''" @change="handleStatusChange">
          <option value="">All</option>
          <option value="available">Available</option>
          <option value="pending">Pending</option>
          <option value="adopted">Adopted</option>
          <option value="fostered">Fostered</option>
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
        Showing {{ pets.length }} of {{ total }} pets
        <span v-if="totalPages > 1">(Page {{ currentPage }} of {{ totalPages }})</span>
      </div>

      <ul class="list">
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
              <span v-if="pet.species" class="pet-species">{{ pet.species }}</span>
            </div>
            <div class="pet-meta">
              <span v-if="pet.breed">{{ pet.breed }}</span>
              <span v-if="pet.age !== undefined">{{ pet.age }} years old</span>
            </div>
          </RouterLink>
        </li>
      </ul>

      <div class="pagination">
        <button :disabled="offset === 0" @click="goToPrevPage">
          Previous
        </button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button :disabled="!hasMore" @click="goToNextPage">
          Next
        </button>
      </div>
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

.loading, .error {
  padding: 40px;
  text-align: center;
}

.error {
  color: #dc3545;
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

.pet-species {
  color: #666;
}

.pet-meta {
  display: flex;
  gap: 15px;
  color: #888;
  font-size: 0.9rem;
}

.pagination {
  display: flex;
  gap: 15px;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.page-info {
  color: #666;
}
</style>
