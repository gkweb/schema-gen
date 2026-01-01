/**
 * Store Component
 *
 * Demonstrates:
 * - useGetInventory query for store inventory
 * - usePlaceOrder mutation
 * - useGetOrderById query for order details
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetInventory, usePlaceOrder, useGetOrderById } from '../api/hooks';
import { Order_Status } from '../api/enums';

export function Store() {
  // Get store inventory
  const {
    data: inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useGetInventory();

  // Order form
  const [petId, setPetId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [orderIdToLookup, setOrderIdToLookup] = useState<number | ''>('');
  const [lookupOrderId, setLookupOrderId] = useState<number | null>(null);

  // Place order mutation
  const placeOrder = usePlaceOrder({
    onSuccess: (order) => {
      console.log('Order placed:', order);
      setPetId('');
      setQuantity(1);
      if (order.id) {
        setLookupOrderId(order.id);
        setOrderIdToLookup(order.id);
      }
    },
  });

  // Order lookup query
  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
  } = useGetOrderById(
    { orderId: lookupOrderId ?? 0 },
    { enabled: lookupOrderId !== null }
  );

  function handlePlaceOrder(event: React.FormEvent) {
    event.preventDefault();
    if (petId === '') return;

    placeOrder.mutate({
      data: {
        petId: petId,
        quantity: quantity,
        status: Order_Status.PLACED,
        complete: false,
      },
    });
  }

  function handleLookupOrder(event: React.FormEvent) {
    event.preventDefault();
    if (orderIdToLookup !== '') {
      setLookupOrderId(orderIdToLookup);
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

  return (
    <div className="store">
      <h1>Store</h1>

      {/* Inventory Section */}
      <section className="section">
        <h2>Inventory</h2>
        {inventoryLoading ? (
          <div className="loading">Loading inventory...</div>
        ) : inventoryError ? (
          <div className="error">Error: {inventoryError.message}</div>
        ) : inventory ? (
          <div className="inventory-grid">
            {Object.entries(inventory).map(([status, count]) => (
              <div key={status} className="inventory-item">
                <span className="status">{status}</span>
                <span className="count">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">No inventory data</div>
        )}
      </section>

      {/* Place Order Section */}
      <section className="section">
        <h2>Place Order</h2>
        <form className="form" onSubmit={handlePlaceOrder}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="petId">Pet ID</label>
              <input
                id="petId"
                type="number"
                value={petId}
                onChange={(e) =>
                  setPetId(e.target.value ? parseInt(e.target.value, 10) : '')
                }
                required
                placeholder="Enter pet ID"
              />
            </div>
            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                min="1"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={placeOrder.isPending || petId === ''}
            >
              {placeOrder.isPending ? 'Placing...' : 'Place Order'}
            </button>
          </div>
          {placeOrder.error && (
            <div className="error">Error: {placeOrder.error.message}</div>
          )}
        </form>
      </section>

      {/* Order Lookup Section */}
      <section className="section">
        <h2>Order Lookup</h2>
        <form className="form" onSubmit={handleLookupOrder}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="orderId">Order ID</label>
              <input
                id="orderId"
                type="number"
                value={orderIdToLookup}
                onChange={(e) =>
                  setOrderIdToLookup(
                    e.target.value ? parseInt(e.target.value, 10) : ''
                  )
                }
                placeholder="Enter order ID"
              />
            </div>
            <button type="submit" className="btn btn-secondary">
              Lookup
            </button>
          </div>
        </form>

        {lookupOrderId !== null && (
          <div className="order-result">
            {orderLoading ? (
              <div className="loading">Loading order...</div>
            ) : orderError ? (
              <div className="error">Error: {orderError.message}</div>
            ) : order ? (
              <div className="order-card">
                <div className="order-header">
                  <span>Order #{order.id}</span>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="order-details">
                  <div>
                    <label>Pet ID:</label> {order.petId}
                  </div>
                  <div>
                    <label>Quantity:</label> {order.quantity}
                  </div>
                  <div>
                    <label>Complete:</label> {order.complete ? 'Yes' : 'No'}
                  </div>
                  {order.shipDate && (
                    <div>
                      <label>Ship Date:</label>{' '}
                      {new Date(order.shipDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <Link
                  to={`/store/orders/${order.id}`}
                  className="btn btn-secondary"
                >
                  View Details
                </Link>
              </div>
            ) : (
              <div className="empty">Order not found</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
