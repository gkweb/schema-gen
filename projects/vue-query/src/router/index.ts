/**
 * Vue Router configuration with REST-like routes
 *
 * Demonstrates:
 * - List routes (/pets, /users)
 * - Detail routes (/pets/:id, /users/:id)
 * - Nested resources (/users/:id/pets)
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/pets',
  },
  // Pet routes
  {
    path: '/pets',
    name: 'pets',
    component: () => import('../views/PetListView.vue'),
    meta: { title: 'Pets' },
  },
  {
    path: '/pets/new',
    name: 'pet-create',
    component: () => import('../views/PetCreateView.vue'),
    meta: { title: 'Create Pet' },
  },
  {
    path: '/pets/:id',
    name: 'pet-detail',
    component: () => import('../views/PetDetailView.vue'),
    props: true,
    meta: { title: 'Pet Details' },
  },
  {
    path: '/pets/:id/edit',
    name: 'pet-edit',
    component: () => import('../views/PetEditView.vue'),
    props: true,
    meta: { title: 'Edit Pet' },
  },
  // User routes
  {
    path: '/users',
    name: 'users',
    component: () => import('../views/UserListView.vue'),
    meta: { title: 'Users' },
  },
  {
    path: '/users/:id',
    name: 'user-detail',
    component: () => import('../views/UserDetailView.vue'),
    props: true,
    meta: { title: 'User Details' },
  },
  {
    path: '/users/:id/pets',
    name: 'user-pets',
    component: () => import('../views/UserPetsView.vue'),
    props: true,
    meta: { title: "User's Pets" },
  },
  // Files routes
  {
    path: '/files',
    name: 'files',
    component: () => import('../views/FilesView.vue'),
    meta: { title: 'Files' },
  },
  // Health route
  {
    path: '/health',
    name: 'health',
    component: () => import('../views/HealthView.vue'),
    meta: { title: 'Health Status' },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Update document title based on route meta
router.afterEach((to) => {
  const title = to.meta.title as string | undefined;
  document.title = title ? `${title} - Petstore Vue Query` : 'Petstore Vue Query';
});
