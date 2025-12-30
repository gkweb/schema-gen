<script setup lang="ts">
/**
 * User List View
 *
 * The Petstore API doesn't have a list users endpoint, so this view
 * demonstrates:
 * - useLoginUser query for authentication
 * - useCreateUser mutation for registration
 * - Manual user lookup by username
 */

import { ref, computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useLoginUser, useCreateUser, useGetUserByName } from '../api/queries';

const router = useRouter();

// Login form
const loginUsername = ref('');
const loginPassword = ref('');

// Lookup form
const lookupUsername = ref('');
const lookupEnabled = ref(false);

// Create user form
const showCreateForm = ref(false);
const newUsername = ref('');
const newEmail = ref('');
const newPassword = ref('');
const newFirstName = ref('');
const newLastName = ref('');

// Login query (enabled when credentials are provided)
const loginParams = computed(() => ({
  username: loginUsername.value,
  password: loginPassword.value,
}));
const { data: loginResult, isLoading: loginLoading, error: loginError } = useLoginUser(
  loginParams,
  { enabled: computed(() => loginUsername.value.length > 0 && loginPassword.value.length > 0) }
);

// User lookup query
const lookupParams = computed(() => ({ username: lookupUsername.value }));
const { data: lookedUpUser, isLoading: lookupLoading, error: lookupError } = useGetUserByName(
  lookupParams,
  { enabled: lookupEnabled }
);

// Create user mutation
const createUser = useCreateUser({
  onSuccess: () => {
    alert('User created successfully!');
    showCreateForm.value = false;
    newUsername.value = '';
    newEmail.value = '';
    newPassword.value = '';
    newFirstName.value = '';
    newLastName.value = '';
  },
});

function handleLookup(event: Event) {
  event.preventDefault();
  if (lookupUsername.value) {
    lookupEnabled.value = true;
  }
}

function goToUser() {
  if (lookupUsername.value) {
    router.push(`/users/${lookupUsername.value}`);
  }
}

function handleCreateUser(event: Event) {
  event.preventDefault();
  createUser.mutate({
    data: {
      username: newUsername.value,
      email: newEmail.value,
      password: newPassword.value,
      firstName: newFirstName.value || undefined,
      lastName: newLastName.value || undefined,
    },
  });
}
</script>

<template>
  <div class="user-view">
    <h1>Users</h1>
    <p class="subtitle">
      User management and authentication
    </p>

    <div class="grid">
      <!-- User Lookup -->
      <div class="card">
        <h2>Find User</h2>
        <p class="description">Look up a user by username</p>

        <form @submit="handleLookup">
          <div class="form-group">
            <label for="lookupUsername">Username</label>
            <input
              id="lookupUsername"
              v-model="lookupUsername"
              type="text"
              placeholder="Enter username"
              @input="lookupEnabled = false"
            />
          </div>

          <div class="button-group">
            <button type="submit" class="btn btn-secondary" :disabled="!lookupUsername">
              Search
            </button>
            <button type="button" class="btn btn-primary" :disabled="!lookupUsername" @click="goToUser">
              Go to Profile
            </button>
          </div>
        </form>

        <div v-if="lookupLoading" class="loading">
          Searching...
        </div>

        <div v-else-if="lookupError && lookupEnabled" class="error">
          User not found
        </div>

        <div v-else-if="lookedUpUser && lookupEnabled" class="user-result">
          <div class="user-avatar">
            <span class="avatar-placeholder">
              {{ (lookedUpUser.username ?? '?').charAt(0).toUpperCase() }}
            </span>
          </div>
          <div class="user-info">
            <strong>{{ lookedUpUser.firstName }} {{ lookedUpUser.lastName }}</strong>
            <span class="username">@{{ lookedUpUser.username }}</span>
            <span v-if="lookedUpUser.email" class="email">{{ lookedUpUser.email }}</span>
          </div>
          <RouterLink :to="`/users/${lookedUpUser.username}`" class="btn btn-small">
            View
          </RouterLink>
        </div>
      </div>

      <!-- Login Demo -->
      <div class="card">
        <h2>Login Demo</h2>
        <p class="description">Test the login endpoint</p>

        <form>
          <div class="form-group">
            <label for="loginUsername">Username</label>
            <input
              id="loginUsername"
              v-model="loginUsername"
              type="text"
              placeholder="Enter username"
            />
          </div>

          <div class="form-group">
            <label for="loginPassword">Password</label>
            <input
              id="loginPassword"
              v-model="loginPassword"
              type="password"
              placeholder="Enter password"
            />
          </div>
        </form>

        <div v-if="loginLoading" class="loading">
          Logging in...
        </div>

        <div v-else-if="loginError" class="error">
          Login failed: {{ loginError.message }}
        </div>

        <div v-else-if="loginResult" class="success">
          Login successful! Token: {{ loginResult.slice(0, 50) }}...
        </div>
      </div>

      <!-- Create User -->
      <div class="card full-width">
        <div class="card-header">
          <h2>Create User</h2>
          <button class="btn btn-small" @click="showCreateForm = !showCreateForm">
            {{ showCreateForm ? 'Cancel' : 'New User' }}
          </button>
        </div>

        <form v-if="showCreateForm" @submit="handleCreateUser">
          <div class="form-row">
            <div class="form-group">
              <label for="newUsername">Username *</label>
              <input
                id="newUsername"
                v-model="newUsername"
                type="text"
                required
                placeholder="Username"
              />
            </div>

            <div class="form-group">
              <label for="newEmail">Email</label>
              <input
                id="newEmail"
                v-model="newEmail"
                type="email"
                placeholder="Email"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="newFirstName">First Name</label>
              <input
                id="newFirstName"
                v-model="newFirstName"
                type="text"
                placeholder="First name"
              />
            </div>

            <div class="form-group">
              <label for="newLastName">Last Name</label>
              <input
                id="newLastName"
                v-model="newLastName"
                type="text"
                placeholder="Last name"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="newPassword">Password</label>
            <input
              id="newPassword"
              v-model="newPassword"
              type="password"
              placeholder="Password"
            />
          </div>

          <div v-if="createUser.error.value" class="error">
            Error: {{ createUser.error.value.message }}
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            :disabled="createUser.isPending.value || !newUsername"
          >
            {{ createUser.isPending.value ? 'Creating...' : 'Create User' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-view {
  max-width: 900px;
}

h1 {
  margin-bottom: 5px;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
}

.card.full-width {
  grid-column: 1 / -1;
}

.card h2 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h2 {
  margin-bottom: 0;
}

.description {
  color: #666;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.button-group {
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
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.9rem;
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
  background: #f8f9fa;
  color: #333;
  border-color: #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background: #e9ecef;
}

.loading, .error, .success {
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
}

.loading {
  color: #666;
  background: #f8f9fa;
}

.error {
  color: #dc3545;
  background: #fee;
}

.success {
  color: #28a745;
  background: #d4edda;
  word-break: break-all;
}

.user-result {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.user-avatar {
  width: 48px;
  height: 48px;
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
  font-size: 1.2rem;
  font-weight: 600;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  color: #666;
  font-size: 0.9rem;
}

.email {
  color: #888;
  font-size: 0.85rem;
}
</style>
