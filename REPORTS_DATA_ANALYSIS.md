# Reports Data Analysis & Issues

## Current Issues Found:

### 1. ✅ Currency Fixed

- Changed from $ to KSh using formatCurrency()
- Replaced DollarSign icons with TrendingUp icons

### 2. ❌ Data Calculation Problems:

#### A. Average Order Value Calculation is Wrong

**Current Logic:**

```javascript
const averageOrderValue = totalRevenue / (totalPaintingsSold + paints_sold);
```

**Problem:** This divides revenue by number of items sold, not number of orders
**Should be:** `totalRevenue / numberOfOrders`

#### B. Client Segments are Hardcoded Percentages

**Current Logic:**

```javascript
const segments = [
  {
    name: "Galleries",
    value: Math.round(totalClients * 0.35),
    color: "#8884d8",
  },
  {
    name: "Individual Collectors",
    value: Math.round(totalClients * 0.25),
    color: "#82ca9d",
  },
  // ... more hardcoded percentages
];
```

**Problem:** These are fake percentages, not based on actual client data
**Should be:** Based on actual client_type field in database

#### C. Revenue Calculation Depends on Order Items Structure

**Current Logic:** Assumes `order.items` array with `totalPrice` and `productType`
**Problem:** Your orders table has `items` as JSONB - need to verify the structure

#### D. Product Performance May Be Inaccurate

**Problem:** Depends on order items having correct `productName` and `quantity` fields

### 3. ❌ Missing Data Validation

- No checks if orders.items is properly structured
- No fallbacks for missing data
- No error handling for malformed JSONB

## Recommendations:

### Immediate Fixes:

1. Fix average order value calculation
2. Use real client segmentation based on client_type
3. Add data validation and fallbacks

### Data Structure Verification Needed:

1. Check what your orders.items JSONB actually contains
2. Verify client_type field usage
3. Test with real order data
