<script setup lang="ts">
/**
 * User List View
 *
 * Demonstrates:
 * - useListUsers query with role filter
 * - Simple list with links to detail pages
 */

import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useListUsers } from '../api/queries';
import { UserRole } from '../api/enums';

const role = ref<UserRole | undefined>(undefined);

const params = computed(() => ({
  role: role.value,
}));

const { data: users, isLoading, error, isFetching } = useListUsers(params);

function handleRoleChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  role.value = value ? (value as UserRole) : undefined;
}

function getRoleBadgeColor(userRole: UserRole): string {
  switch (userRole) {
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
</script>

<template>
  <div class="user-list">
    <div class="header">
      <h1>Users</h1>
    </div>

    <div class="filters">
      <label class="filter">
        Role:
        <select :value="role ?? ''" @change="handleRoleChange">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="customer">Customer</option>
        </select>
      </label>
      <span v-if="isFetching" class="refreshing">Refreshing...</span>
    </div>

    <div v-if="isLoading" class="loading">
      Loading users...
    </div>

    <div v-else-if="error" class="error">
      Error loading users: {{ error.message }}
    </div>

    <template v-else>
      <div class="stats">
        {{ users?.length ?? 0 }} users found
      </div>

      <ul class="list">
        <li v-for="user in users" :key="user.id" class="list-item">
          <RouterLink :to="`/users/${user.id}`" class="user-link">
            <div class="user-avatar">
              <img v-if="user.avatar" :src="user.avatar" :alt="user.name ?? user.email" />
              <span v-else class="avatar-placeholder">
                {{ (user.name ?? user.email).charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="user-info">
              <strong class="user-name">{{ user.name ?? 'No name' }}</strong>
              <span class="user-email">{{ user.email }}</span>
            </div>
            <span
              class="role-badge"
              :style="{ backgroundColor: getRoleBadgeColor(user.role) }"
            >
              {{ user.role }}
            </span>
          </RouterLink>
        </li>
      </ul>

      <div v-if="!users?.length" class="empty">
        No users found
      </div>
    </template>
  </div>
</template>

<style scoped>
.user-list {
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

.user-link {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  text-decoration: none;
  color: inherit;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
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
  font-size: 1.2rem;
  font-weight: 600;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 1.05rem;
  color: #333;
}

.user-email {
  color: #666;
  font-size: 0.9rem;
}

.role-badge {
  padding: 4px 10px;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 500;
}
</style>
