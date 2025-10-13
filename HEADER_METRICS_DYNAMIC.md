# Header Metrics Made Dynamic ✅

## Changes Made

I've updated the top navigation bar to display **real-time data** instead of mocked values for:

- **Low Stock Alerts** (red badge with alert icon)
- **Pending Orders** (blue badge with shopping cart icon)

## What Was Changed

### File: `src/App.tsx`

#### 1. Added Supabase Import

```typescript
import { supabase } from "./utils/supabase/client";
```

#### 2. Replaced Mock Data with Real Database Queries

**Before:**

```typescript
// Mock data for demo - in real implementation, this would come from the database
useEffect(() => {
  // Simulate loading dashboard metrics
  setLowStockAlerts(3);
  setPendingOrders(8);
}, []);
```

**After:**

```typescript
// Fetch dynamic data for low stock alerts and pending orders
useEffect(() => {
  const fetchHeaderMetrics = async () => {
    try {
      // Fetch low stock items (products with stock_level < min_stock_level)
      const { data: lowStockItems, error: lowStockError } = await supabase
        .from("products")
        .select("id")
        .lt("stock_level", "min_stock_level");

      if (lowStockError) {
        console.error("Error fetching low stock items:", lowStockError);
      } else {
        setLowStockAlerts(lowStockItems?.length || 0);
      }

      // Fetch pending orders (orders with payment_status = 'pending' or status in 'draft', 'sent')
      const { data: pendingOrdersData, error: pendingOrdersError } =
        await supabase
          .from("orders")
          .select("id")
          .or("payment_status.eq.pending,status.eq.draft,status.eq.sent");

      if (pendingOrdersError) {
        console.error("Error fetching pending orders:", pendingOrdersError);
      } else {
        setPendingOrders(pendingOrdersData?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching header metrics:", error);
    }
  };

  fetchHeaderMetrics();

  // Refresh metrics when tab changes (to reflect any updates made in other tabs)
  const interval = setInterval(fetchHeaderMetrics, 30000); // Refresh every 30 seconds

  return () => clearInterval(interval);
}, [activeTab]);
```

## How It Works

### Low Stock Alerts

- Queries the `products` table
- Counts products where `stock_level < min_stock_level`
- Updates the red badge with the count
- Shows alert icon when count > 0

### Pending Orders

- Queries the `orders` table
- Counts orders that match any of these conditions:
  - `payment_status = 'pending'`
  - `status = 'draft'`
  - `status = 'sent'`
- Updates the blue badge with the count
- Shows shopping cart icon when count > 0

## Auto-Refresh Feature

The metrics now automatically refresh:

- **On page load** - Initial fetch when the app loads
- **Every 30 seconds** - Automatic background refresh
- **When changing tabs** - Ensures data is current when navigating

## Benefits

✅ **Real-time accuracy** - No more hardcoded numbers
✅ **Automatic updates** - Reflects changes in inventory and orders
✅ **Better visibility** - Admins can see actual pending work at a glance
✅ **Consistent with dashboard** - Uses the same data source as DashboardOverview component

## Testing

To verify the changes work correctly:

1. **Low Stock Alerts:**

   - Go to Products tab
   - Find a product and set its `stock_level` below its `min_stock_level`
   - The red badge in the header should update within 30 seconds (or refresh the page)

2. **Pending Orders:**
   - Go to Orders tab
   - Create a new order with status "draft" or "sent"
   - Or set an order's payment_status to "pending"
   - The blue badge in the header should update within 30 seconds (or refresh the page)

## Database Schema Requirements

The feature relies on these database columns:

**products table:**

- `stock_level` (INTEGER)
- `min_stock_level` (INTEGER)

**orders table:**

- `status` (VARCHAR) - values: 'draft', 'sent', 'accepted', 'completed', 'cancelled'
- `payment_status` (VARCHAR) - values: 'pending', 'partial', 'paid', 'overdue'

Both columns should already exist based on your schema.
