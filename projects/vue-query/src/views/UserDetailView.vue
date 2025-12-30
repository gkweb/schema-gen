<script setup lang="ts">
/**
 * User Detail View
 *
 * Demonstrates:
 * - useGetUser query with path parameter
 * - Link to nested resource (/users/:id/pets)
 * - useDeleteUser mutation
 */

import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import { useGetUser, useDeleteUser } from '../api/queries';
import { UserRole } from '../api/enums';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const queryClient = useQueryClient();

const params = computed(() => ({ userId: parseInt(props.id, 10) }));
const { data: user, isLoading, error } = useGetUser(params);

const deleteUser = useDeleteUser({
  onSuccess: () => {
    console.log('User deleted');

    // Invalidate user queries
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey as string[];
        return key[0] === 'listUsers' || key[0] === 'getUser';
      },
    });

    router.push('/users');
  },
});

function handleDelete() {
  if (confirm('Are you sure you want to delete this user?')) {
    deleteUser.mutate({ userId: parseInt(props.id, 10) });
  }
}

function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '#dc3545';
    case 'staff':
      return '#17a2b8';
    case 'customer':
      return '#28a745';
    default:
      return '#6c757d';
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
  <div class="user-detail">
    <div class="breadcrumb">
      <RouterLink to="/users">Users</RouterLink>
      <span>/</span>
      <span>{{ user?.name ?? user?.email ?? 'Loading...' }}</span>
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
            <img v-if="user.avatar" :src="user.avatar" :alt="user.name ?? user.email" />
            <span v-else class="avatar-placeholder">
              {{ (user.name ?? user.email).charAt(0).toUpperCase() }}
            </span>
          </div>
          <div class="user-title">
            <h1>{{ user.name ?? 'No name' }}</h1>
            <span
              class="role-badge"
              :style="{ backgroundColor: getRoleBadgeColor(user.role) }"
            >
              {{ user.role }}
            </span>
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
            <label>Email</label>
            <a :href="`mailto:${user.email}`">{{ user.email }}</a>
          </div>

          <div class="info-item">
            <label>Role</label>
            <span>{{ user.role }}</span>
          </div>

          <div class="info-item">
            <label>User ID</label>
            <span>{{ user.id }}</span>
          </div>

          <div v-if="user.createdAt" class="info-item">
            <label>Member Since</label>
            <span>{{ formatDate(user.createdAt) }}</span>
          </div>
        </div>
      </div>

      <div class="related-section">
        <h2>Related Resources</h2>
        <div class="related-links">
          <RouterLink :to="`/users/${id}/pets`" class="related-link">
            <span class="link-icon">🐾</span>
            <span class="link-text">
              <strong>View Pets</strong>
              <span>See all pets owned by this user</span>
            </span>
            <span class="arrow">→</span>
          </RouterLink>
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

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  gap: 8px;
}

.user-title h1 {
  margin: 0;
}

.role-badge {
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 500;
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

.related-section h2 {
  font-size: 1.2rem;
  margin-bottom: 15px;
}

.related-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.related-link {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s;
}

.related-link:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-decoration: none;
}

.link-icon {
  font-size: 1.5rem;
}

.link-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.link-text strong {
  color: #333;
}

.link-text span {
  font-size: 0.9rem;
  color: #666;
}

.arrow {
  color: #999;
  font-size: 1.2rem;
}
</style>
