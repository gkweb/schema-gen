/**
 * Vue Router configuration with REST-like routes
 *
 * Demonstrates:
 * - List routes (/pets, /users, /store)
 * - Detail routes (/pets/:id, /users/:username, /store/orders/:id)
 * - Query parameters for filtering
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
    meta: { title: 'Add Pet' },
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
  // Store routes
  {
    path: '/store',
    name: 'store',
    component: () => import('../views/StoreView.vue'),
    meta: { title: 'Store' },
  },
  {
    path: '/store/orders/:id',
    name: 'order-detail',
    component: () => import('../views/OrderDetailView.vue'),
    props: true,
    meta: { title: 'Order Details' },
  },
  // User routes
  {
    path: '/users',
    name: 'users',
    component: () => import('../views/UserListView.vue'),
    meta: { title: 'Users' },
  },
  {
    path: '/users/:username',
    name: 'user-detail',
    component: () => import('../views/UserDetailView.vue'),
    props: true,
    meta: { title: 'User Details' },
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
