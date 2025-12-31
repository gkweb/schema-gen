<script setup lang="ts">
/**
 * Pet Edit View
 *
 * Demonstrates:
 * - useGetPetById query to load existing data
 * - useUpdatePet mutation
 * - Populating form with query data
 * - Cache invalidation and update after mutation
 */

import { ref, watch, computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import { useGetPetById, useUpdatePet, getGetPetByIdQueryKey } from '../api/queries';
import { Pet_Status } from '../api/enums';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const queryClient = useQueryClient();

// Load existing pet data
const params = computed(() => ({ petId: parseInt(props.id, 10) }));
const { data: pet, isLoading, error } = useGetPetById(params);

// Form state - will be populated when pet data loads
const name = ref('');
const category = ref('');
const photoUrls = ref<string[]>([]);
const newPhotoUrl = ref('');
const status = ref<Pet_Status>(Pet_Status.AVAILABLE);

// Populate form when pet data loads
watch(pet, (newPet) => {
  if (newPet) {
    name.value = newPet.name;
    category.value = newPet.category?.name ?? '';
    photoUrls.value = [...(newPet.photoUrls ?? [])];
    status.value = (newPet.status as Pet_Status) ?? Pet_Status.AVAILABLE;
  }
}, { immediate: true });

// Demonstrates useUpdatePet mutation
const updatePet = useUpdatePet({
  onSuccess: (updatedPet) => {
    console.log('Pet updated:', updatedPet);

    // Update the cache directly
    queryClient.setQueryData(getGetPetByIdQueryKey({ petId: parseInt(props.id, 10) }), updatedPet);

    // Invalidate list queries
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey as string[];
        return key[0] === 'findPetsByStatus';
      },
    });

    // Navigate back to detail page
    router.push(`/pets/${props.id}`);
  },
  onError: (error) => {
    console.error('Failed to update pet:', error);
  },
});

function addPhotoUrl() {
  if (newPhotoUrl.value.trim()) {
    photoUrls.value.push(newPhotoUrl.value.trim());
    newPhotoUrl.value = '';
  }
}

function removePhotoUrl(index: number) {
  photoUrls.value.splice(index, 1);
}

function handleSubmit(event: Event) {
  event.preventDefault();

  updatePet.mutate({
    data: {
      id: parseInt(props.id, 10),
      name: name.value,
      category: category.value ? { name: category.value } : undefined,
      photoUrls: photoUrls.value.length > 0 ? photoUrls.value : [''],
      status: status.value,
    },
  });
}
</script>

<template>
  <div class="pet-edit">
    <div class="breadcrumb">
      <RouterLink to="/pets">Pets</RouterLink>
      <span>/</span>
      <RouterLink :to="`/pets/${id}`">{{ pet?.name ?? 'Loading...' }}</RouterLink>
      <span>/</span>
      <span>Edit</span>
    </div>

    <div v-if="isLoading" class="loading">
      Loading pet...
    </div>

    <div v-else-if="error" class="error-box">
      Error loading pet: {{ error.message }}
    </div>

    <template v-else-if="pet">
      <h1>Edit {{ pet.name }}</h1>

      <form class="form" @submit="handleSubmit">
        <div class="form-group">
          <label for="name">Name *</label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
            placeholder="Enter pet name"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="category">Category</label>
            <input
              id="category"
              v-model="category"
              type="text"
              placeholder="Dog, Cat, etc."
            />
          </div>

          <div class="form-group">
            <label for="status">Status *</label>
            <select id="status" v-model="status">
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Photo URLs</label>
          <div class="photo-input">
            <input
              v-model="newPhotoUrl"
              type="url"
              placeholder="https://example.com/photo.jpg"
            />
            <button type="button" class="btn btn-small" @click="addPhotoUrl">Add</button>
          </div>
          <ul v-if="photoUrls.length > 0" class="photo-list">
            <li v-for="(url, index) in photoUrls" :key="index">
              <span class="photo-url">{{ url }}</span>
              <button type="button" class="btn-remove" @click="removePhotoUrl(index)">Remove</button>
            </li>
          </ul>
        </div>

        <div v-if="updatePet.error.value" class="error">
          Error: {{ updatePet.error.value.message }}
        </div>

        <div class="form-actions">
          <RouterLink :to="`/pets/${id}`" class="btn btn-secondary">
            Cancel
          </RouterLink>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="updatePet.isPending.value || !name"
          >
            {{ updatePet.isPending.value ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<style scoped>
.pet-edit {
  max-width: 600px;
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

.loading {
  padding: 40px;
  text-align: center;
}

.error-box {
  padding: 20px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c00;
}

h1 {
  margin-bottom: 30px;
}

.form {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.photo-input {
  display: flex;
  gap: 10px;
}

.photo-input input {
  flex: 1;
}

.photo-list {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
}

.photo-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 5px;
}

.photo-url {
  font-size: 0.9rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400px;
}

.btn-remove {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 0.85rem;
}

.error {
  padding: 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  color: #c00;
  margin-bottom: 20px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 10px 24px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
}

.btn-small {
  padding: 8px 16px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd6;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
</style>
