# Infinite Scrolling Implementation for Orders

## Backend Changes

The orders endpoint now supports cursor-based pagination ideal for infinite scrolling:

### API Endpoint
```
GET /api/orders/user/:userId?cursor=<timestamp>&limit=<number>
```

### Query Parameters
- `cursor` (optional): ISO timestamp string to fetch orders older than this timestamp
- `limit` (optional): Number of records to fetch (default: 20, max: 100)

### Response Format
```json
{
  "success": true,
  "orders": [...], // Array of order objects
  "pagination": {
    "hasNextPage": true,
    "nextCursor": "2025-06-29T10:30:00.000Z",
    "limit": 20,
    "count": 20
  }
}
```

## Frontend Implementation Examples

### 1. React with useState and useEffect

```javascript
import React, { useState, useEffect } from 'react';

const OrdersList = ({ userId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);

  const fetchOrders = async (cursor = null, isLoadMore = false) => {
    setLoading(true);
    try {
      const url = `/api/orders/user/${userId}${cursor ? `?cursor=${cursor}&limit=20` : '?limit=20'}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        if (isLoadMore) {
          setOrders(prev => [...prev, ...data.orders]);
        } else {
          setOrders(data.orders);
        }
        setHasNextPage(data.pagination.hasNextPage);
        setNextCursor(data.pagination.nextCursor);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const loadMore = () => {
    if (hasNextPage && !loading) {
      fetchOrders(nextCursor, true);
    }
  };

  return (
    <div>
      {orders.map(order => (
        <div key={order._id}>
          {/* Render order */}
          <p>{order.symbol} - {order.type} - {order.quantity}</p>
        </div>
      ))}
      
      {hasNextPage && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};
```

### 2. React with Intersection Observer (Auto-load on scroll)

```javascript
import React, { useState, useEffect, useRef, useCallback } from 'react';

const InfiniteOrdersList = ({ userId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const observer = useRef();

  const lastOrderElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchOrders(nextCursor, true);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasNextPage, nextCursor]);

  const fetchOrders = async (cursor = null, isLoadMore = false) => {
    setLoading(true);
    try {
      const url = `/api/orders/user/${userId}${cursor ? `?cursor=${cursor}&limit=20` : '?limit=20'}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        if (isLoadMore) {
          setOrders(prev => [...prev, ...data.orders]);
        } else {
          setOrders(data.orders);
        }
        setHasNextPage(data.pagination.hasNextPage);
        setNextCursor(data.pagination.nextCursor);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  return (
    <div>
      {orders.map((order, index) => {
        // Add ref to the last element for intersection observer
        if (orders.length === index + 1) {
          return (
            <div ref={lastOrderElementRef} key={order._id}>
              <p>{order.symbol} - {order.type} - {order.quantity}</p>
            </div>
          );
        } else {
          return (
            <div key={order._id}>
              <p>{order.symbol} - {order.type} - {order.quantity}</p>
            </div>
          );
        }
      })}
      
      {loading && <div>Loading more orders...</div>}
    </div>
  );
};
```

### 3. Vanilla JavaScript Example

```javascript
class InfiniteScrollOrders {
  constructor(userId, container) {
    this.userId = userId;
    this.container = container;
    this.orders = [];
    this.loading = false;
    this.hasNextPage = true;
    this.nextCursor = null;
    
    this.init();
  }

  async init() {
    await this.fetchOrders();
    this.setupScrollListener();
  }

  async fetchOrders(cursor = null, isLoadMore = false) {
    if (this.loading) return;
    
    this.loading = true;
    this.showLoading();

    try {
      const url = `/api/orders/user/${this.userId}${cursor ? `?cursor=${cursor}&limit=20` : '?limit=20'}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        if (isLoadMore) {
          this.orders = [...this.orders, ...data.orders];
        } else {
          this.orders = data.orders;
        }
        this.hasNextPage = data.pagination.hasNextPage;
        this.nextCursor = data.pagination.nextCursor;
        this.renderOrders();
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      this.loading = false;
      this.hideLoading();
    }
  }

  setupScrollListener() {
    window.addEventListener('scroll', () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
        if (this.hasNextPage && !this.loading) {
          this.fetchOrders(this.nextCursor, true);
        }
      }
    });
  }

  renderOrders() {
    const ordersHTML = this.orders.map(order => `
      <div class="order-item">
        <p>${order.symbol} - ${order.type} - ${order.quantity}</p>
        <span>${new Date(order.createdAt).toLocaleDateString()}</span>
      </div>
    `).join('');
    
    this.container.innerHTML = ordersHTML;
  }

  showLoading() {
    // Show loading indicator
  }

  hideLoading() {
    // Hide loading indicator
  }
}

// Usage
const ordersList = new InfiniteScrollOrders('USER_ID', document.getElementById('orders-container'));
```

## Performance Benefits

1. **Reduced Memory Usage**: Only loads data as needed
2. **Faster Initial Load**: Loads smaller chunks initially
3. **Better User Experience**: Smooth scrolling without waiting for all data
4. **Database Efficiency**: Uses indexed fields (`createdAt`) for fast queries
5. **Scalable**: Works efficiently even with millions of records

## Notes

- The cursor is based on `createdAt` timestamp for reliable ordering
- Maximum limit is capped at 100 to prevent abuse
- The `hasNextPage` flag helps frontend know when to stop requesting more data
- Each request fetches one extra record to determine if there are more pages available
