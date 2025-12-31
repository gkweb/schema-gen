<script setup lang="ts">
/**
 * Store View
 *
 * Demonstrates:
 * - useGetInventory query for store inventory
 * - usePlaceOrder mutation
 * - useGetOrderById query for order details
 */

import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useGetInventory, usePlaceOrder, useGetOrderById } from '../api/queries';
import { Order_Status } from '../api/enums';

// Get store inventory
const { data: inventory, isLoading: inventoryLoading, error: inventoryError } = useGetInventory();

// Order form
const petId = ref<number | ''>('');
const quantity = ref(1);
const orderIdToLookup = ref<number | ''>('');

// Place order mutation
const placeOrder = usePlaceOrder({
  onSuccess: (order) => {
    console.log('Order placed:', order);
    petId.value = '';
    quantity.value = 1;
    // Set the order ID to look up
    if (order.id) {
      orderIdToLookup.value = order.id;
    }
  },
});

// Get order by ID
const orderParams = computed(() =>
  orderIdToLookup.value !== '' ? { orderId: orderIdToLookup.value as number } : null
);
const { data: order, isLoading: orderLoading, error: orderError } = useGetOrderById(
  computed(() => orderParams.value ?? { orderId: 1 }),
  { enabled: computed(() => orderParams.value !== null) }
);

function handlePlaceOrder(event: Event) {
  event.preventDefault();
  if (petId.value === '') return;

  placeOrder.mutate({
    data: {
      petId: petId.value,
      quantity: quantity.value,
      status: Order_Status.PLACED,
      complete: false,
    },
  });
}

function handleLookupOrder(event: Event) {
  event.preventDefault();
  // The order will be fetched automatically when orderIdToLookup changes
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
</script>

<template>
  <div class="store-view">
    <h1>Store</h1>
    <p class="subtitle">
      Demonstrates store inventory and order management
    </p>

    <div class="grid">
      <!-- Inventory Section -->
      <div class="card">
        <h2>Inventory</h2>

        <div v-if="inventoryLoading" class="loading">
          Loading inventory...
        </div>

        <div v-else-if="inventoryError" class="error">
          Error: {{ inventoryError.message }}
        </div>

        <template v-else-if="inventory">
          <p class="description">Current stock by status:</p>
          <dl class="inventory-list">
            <template v-for="(count, status) in inventory" :key="status">
              <dt>{{ status }}</dt>
              <dd>{{ count }}</dd>
            </template>
          </dl>
        </template>
      </div>

      <!-- Place Order Section -->
      <div class="card">
        <h2>Place Order</h2>
        <p class="description">Order a pet from the store</p>

        <form @submit="handlePlaceOrder">
          <div class="form-group">
            <label for="petId">Pet ID</label>
            <input
              id="petId"
              v-model.number="petId"
              type="number"
              min="1"
              required
              placeholder="Enter pet ID"
            />
          </div>

          <div class="form-group">
            <label for="quantity">Quantity</label>
            <input
              id="quantity"
              v-model.number="quantity"
              type="number"
              min="1"
              max="10"
              required
            />
          </div>

          <div v-if="placeOrder.error.value" class="error">
            Error: {{ placeOrder.error.value.message }}
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            :disabled="placeOrder.isPending.value || petId === ''"
          >
            {{ placeOrder.isPending.value ? 'Placing...' : 'Place Order' }}
          </button>
        </form>
      </div>

      <!-- Order Lookup Section -->
      <div class="card">
        <h2>Order Lookup</h2>
        <p class="description">Look up an order by ID (1-10)</p>

        <form @submit="handleLookupOrder">
          <div class="form-group">
            <label for="orderId">Order ID</label>
            <input
              id="orderId"
              v-model.number="orderIdToLookup"
              type="number"
              min="1"
              max="10"
              placeholder="Enter order ID"
            />
          </div>
        </form>

        <div v-if="orderLoading" class="loading">
          Loading order...
        </div>

        <div v-else-if="orderError" class="error">
          Order not found or error: {{ orderError.message }}
        </div>

        <template v-else-if="order && orderIdToLookup !== ''">
          <div class="order-details">
            <h3>Order #{{ order.id }}</h3>
            <dl class="details-list">
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
              <dd>{{ order.shipDate ? new Date(order.shipDate).toLocaleString() : 'N/A' }}</dd>
              <dt>Complete</dt>
              <dd>{{ order.complete ? 'Yes' : 'No' }}</dd>
            </dl>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.store-view {
  max-width: 1000px;
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
}

.card h2 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.2rem;
}

.description {
  color: #666;
  margin-bottom: 20px;
}

.loading, .error {
  padding: 20px;
  text-align: center;
}

.error {
  color: #dc3545;
  background: #fee;
  border-radius: 6px;
}

.inventory-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0;
}

.inventory-list dt {
  font-weight: 500;
  text-transform: capitalize;
}

.inventory-list dd {
  margin: 0;
  text-align: right;
  font-weight: bold;
  color: #667eea;
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

.btn {
  padding: 10px 24px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: #667eea;
  color: white;
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd6;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.order-details {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.order-details h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.details-list {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 10px;
  margin: 0;
}

.details-list dt {
  color: #666;
}

.details-list dd {
  margin: 0;
}

.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  color: white;
  font-size: 0.8rem;
  text-transform: uppercase;
}
</style>
