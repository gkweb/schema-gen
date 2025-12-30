<script setup lang="ts">
/**
 * Main App component with navigation layout
 *
 * This app showcases Vue Query composables generated for the Swagger Petstore v2 API:
 * - Query composables (useFindPetsByStatus, useGetPetById, useGetInventory, etc.)
 * - Mutation composables (useAddPet, useUpdatePet, useDeletePet, usePlaceOrder, etc.)
 * - Query key usage for cache invalidation
 * - Vue Router integration for REST-like navigation
 * - Live integration with https://petstore.swagger.io/v2
 */
import { RouterView, RouterLink, useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();

const navItems = [
  { to: '/pets', label: 'Pets', icon: '🐾' },
  { to: '/store', label: 'Store', icon: '🛒' },
  { to: '/users', label: 'Users', icon: '👥' },
];

const isActive = (path: string) => computed(() => route.path.startsWith(path));
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <h1 class="logo">
          <RouterLink to="/">Petstore</RouterLink>
        </h1>
        <p class="subtitle">Vue Query Demo</p>
      </div>
      <nav class="nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="['nav-link', { active: isActive(item.to).value }]"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>
    </header>

    <main class="main">
      <RouterView />
    </main>

    <footer class="footer">
      <p>Integration test project for @schema-gen/plugin-vue-query-v4</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  margin: 0;
  font-size: 1.5rem;
}

.logo a {
  color: white;
  text-decoration: none;
}

.subtitle {
  margin: 5px 0 0;
  opacity: 0.8;
  font-size: 0.9rem;
}

.nav {
  max-width: 1200px;
  margin: 20px auto 0;
  display: flex;
  gap: 10px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: white;
  text-decoration: none;
  transition: background 0.2s;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
  text-decoration: none;
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.3);
}

.nav-icon {
  font-size: 1.1rem;
}

.main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 30px 20px;
}

.footer {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 0.85rem;
  border-top: 1px solid #eee;
}
</style>
