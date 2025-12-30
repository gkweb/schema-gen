<script setup lang="ts">
/**
 * Order Detail View
 *
 * Demonstrates:
 * - useGetOrderById query with path parameter
 * - useDeleteOrder mutation
 */

import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useGetOrderById, useDeleteOrder } from '../api/queries';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();

// Get order details
const params = computed(() => ({ orderId: parseInt(props.id, 10) }));
const { data: order, isLoading, error } = useGetOrderById(params);

// Delete order mutation
const deleteOrder = useDeleteOrder({
  onSuccess: () => {
    router.push('/store');
  },
});

function handleDelete() {
  if (confirm('Are you sure you want to delete this order?')) {
    deleteOrder.mutate({ orderId: parseInt(props.id, 10) });
  }
}

function getStatusColor(status: string | undefined): string {
  switch (status) {
    case 'placed':
      return '#ff9800';
    case 'approved':
      return '#2196f3';
    case 'delivered':
      return '#4caf50';
    default:
      return '#9e9e9e';
  }
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
}
</script>

<template>
  <div class="order-detail">
    <div class="breadcrumb">
      <RouterLink to="/store">Store</RouterLink>
      <span>/</span>
      <span>Order #{{ id }}</span>
    </div>

    <div v-if="isLoading" class="loading">
      Loading order...
    </div>

    <div v-else-if="error" class="error">
      Error: {{ error.message }}
    </div>

    <template v-else-if="order">
      <div class="header">
        <h1>Order #{{ order.id }}</h1>
        <button
          class="btn btn-danger"
          :disabled="deleteOrder.isPending.value"
          @click="handleDelete"
        >
          {{ deleteOrder.isPending.value ? 'Deleting...' : 'Delete Order' }}
        </button>
      </div>

      <div class="card">
        <dl class="details-grid">
          <dt>Order ID</dt>
          <dd>{{ order.id }}</dd>

          <dt>Pet ID</dt>
          <dd>
            <RouterLink :to="`/pets/${order.petId}`">{{ order.petId }}</RouterLink>
          </dd>

          <dt>Quantity</dt>
          <dd>{{ order.quantity }}</dd>

          <dt>Status</dt>
          <dd>
            <span class="status-badge" :style="{ backgroundColor: getStatusColor(order.status) }">
              {{ order.status }}
            </span>
          </dd>

          <dt>Ship Date</dt>
          <dd>{{ formatDate(order.shipDate) }}</dd>

          <dt>Complete</dt>
          <dd>{{ order.complete ? 'Yes' : 'No' }}</dd>
        </dl>
      </div>
    </template>
  </div>
</template>

<style scoped>
.order-detail {
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

.loading, .error {
  padding: 40px;
  text-align: center;
}

.error {
  color: #dc3545;
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

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
}

.details-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 15px;
  margin: 0;
}

.details-grid dt {
  color: #666;
  font-weight: 500;
}

.details-grid dd {
  margin: 0;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  color: white;
  font-size: 0.85rem;
  text-transform: uppercase;
}
</style>
