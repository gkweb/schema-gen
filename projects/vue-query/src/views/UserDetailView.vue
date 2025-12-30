<script setup lang="ts">
/**
 * User Detail View
 *
 * Demonstrates:
 * - useGetUserByName query with username path parameter
 * - useUpdateUser mutation
 * - useDeleteUser mutation
 */

import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import { useGetUserByName, useDeleteUser } from '../api/queries';

const props = defineProps<{
  username: string;
}>();

const router = useRouter();
const queryClient = useQueryClient();

const params = computed(() => ({ username: props.username }));
const { data: user, isLoading, error } = useGetUserByName(params);

const deleteUser = useDeleteUser({
  onSuccess: () => {
    console.log('User deleted');

    // Invalidate user queries
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey as string[];
        return key[0] === 'getUserByName';
      },
    });

    router.push('/users');
  },
});

function handleDelete() {
  if (confirm('Are you sure you want to delete this user?')) {
    deleteUser.mutate({ username: props.username });
  }
}
</script>

<template>
  <div class="user-detail">
    <div class="breadcrumb">
      <RouterLink to="/users">Users</RouterLink>
      <span>/</span>
      <span>{{ user?.username ?? 'Loading...' }}</span>
    </div>

    <div v-if="isLoading" class="loading">
      Loading user details...
    </div>

    <div v-else-if="error" class="error">
      Error: {{ error.message }}
    </div>

    <div v-else-if="!user" class="not-found">
      User not found
    </div>

    <template v-else>
      <div class="header">
        <div class="user-header">
          <div class="avatar">
            <span class="avatar-placeholder">
              {{ (user.username ?? '?').charAt(0).toUpperCase() }}
            </span>
          </div>
          <div class="user-title">
            <h1>{{ user.firstName }} {{ user.lastName }}</h1>
            <span class="username">@{{ user.username }}</span>
          </div>
        </div>
        <div class="actions">
          <button
            class="btn btn-danger"
            :disabled="deleteUser.isPending.value"
            @click="handleDelete"
          >
            {{ deleteUser.isPending.value ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>

      <div class="card">
        <div class="info-grid">
          <div class="info-item">
            <label>Username</label>
            <span>{{ user.username }}</span>
          </div>

          <div v-if="user.email" class="info-item">
            <label>Email</label>
            <a :href="`mailto:${user.email}`">{{ user.email }}</a>
          </div>

          <div v-if="user.firstName" class="info-item">
            <label>First Name</label>
            <span>{{ user.firstName }}</span>
          </div>

          <div v-if="user.lastName" class="info-item">
            <label>Last Name</label>
            <span>{{ user.lastName }}</span>
          </div>

          <div v-if="user.phone" class="info-item">
            <label>Phone</label>
            <span>{{ user.phone }}</span>
          </div>

          <div class="info-item">
            <label>User ID</label>
            <span>{{ user.id }}</span>
          </div>

          <div class="info-item">
            <label>Status</label>
            <span :class="{ active: user.userStatus === 1 }">
              {{ user.userStatus === 1 ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.user-detail {
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
  margin-bottom: 25px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 2rem;
  font-weight: 600;
}

.user-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-title h1 {
  margin: 0;
}

.username {
  color: #666;
  font-size: 1rem;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 500;
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
  margin-bottom: 25px;
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

.info-item .active {
  color: #28a745;
  font-weight: 500;
}
</style>
