<script setup lang="ts">
/**
 * User Pets View
 *
 * Demonstrates:
 * - Nested resource route (/users/:id/pets)
 * - useGetUserPets query with parent ID parameter
 * - Combined data from multiple queries (user + pets)
 */

import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useGetUser, useGetUserPets } from '../api/queries';
import { PetStatus } from '../api/enums';

const props = defineProps<{
  id: string;
}>();

const status = ref<PetStatus | undefined>(undefined);

// Get user data for breadcrumb
const userParams = computed(() => ({ userId: parseInt(props.id, 10) }));
const { data: user } = useGetUser(userParams);

// Get user's pets
const petsParams = computed(() => ({
  userId: parseInt(props.id, 10),
  status: status.value,
}));

const { data: pets, isLoading, error, isFetching } = useGetUserPets(petsParams);

function handleStatusChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  status.value = value ? (value as PetStatus) : undefined;
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
  <div class="user-pets">
    <div class="breadcrumb">
      <RouterLink to="/users">Users</RouterLink>
      <span>/</span>
      <RouterLink :to="`/users/${id}`">{{ user?.name ?? user?.email ?? 'Loading...' }}</RouterLink>
      <span>/</span>
      <span>Pets</span>
    </div>

    <h1>{{ user?.name ?? "User's" }} Pets</h1>

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
        {{ pets?.length ?? 0 }} pets found
      </div>

      <ul v-if="pets?.length" class="list">
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

      <div v-else class="empty">
        <p>This user doesn't have any pets yet.</p>
        <RouterLink to="/pets/new" class="btn btn-primary">
          + Add a Pet
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.user-pets {
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

h1 {
  margin-bottom: 20px;
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

.empty {
  text-align: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 8px;
}

.empty p {
  margin-bottom: 20px;
  color: #666;
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
}

.btn-primary:hover {
  background: #5a6fd6;
  text-decoration: none;
}
</style>
