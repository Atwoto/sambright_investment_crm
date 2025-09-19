import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS and logging middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}));
app.use('*', logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Health check endpoint
app.get('/make-server-a4a212c7/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Products endpoints
app.get('/make-server-a4a212c7/products', async (c) => {
  try {
    const products = await kv.getByPrefix('product:');
    return c.json({ products });
  } catch (error) {
    console.log('Error fetching products:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.post('/make-server-a4a212c7/products', async (c) => {
  try {
    const product = await c.req.json();
    const productId = `product:${Date.now()}`;
    await kv.set(productId, {
      ...product,
      id: productId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return c.json({ success: true, id: productId });
  } catch (error) {
    console.log('Error creating product:', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

app.put('/make-server-a4a212c7/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const productData = await c.req.json();
    const existingProduct = await kv.get(`product:${id}`);
    
    if (!existingProduct) {
      return c.json({ error: 'Product not found' }, 404);
    }

    await kv.set(`product:${id}`, {
      ...existingProduct,
      ...productData,
      updatedAt: new Date().toISOString()
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error updating product:', error);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

// Clients endpoints
app.get('/make-server-a4a212c7/clients', async (c) => {
  try {
    const clients = await kv.getByPrefix('client:');
    return c.json({ clients });
  } catch (error) {
    console.log('Error fetching clients:', error);
    return c.json({ error: 'Failed to fetch clients' }, 500);
  }
});

app.post('/make-server-a4a212c7/clients', async (c) => {
  try {
    const client = await c.req.json();
    const clientId = `client:${Date.now()}`;
    await kv.set(clientId, {
      ...client,
      id: clientId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalSpent: 0,
      purchaseHistory: []
    });
    return c.json({ success: true, id: clientId });
  } catch (error) {
    console.log('Error creating client:', error);
    return c.json({ error: 'Failed to create client' }, 500);
  }
});

// Suppliers endpoints
app.get('/make-server-a4a212c7/suppliers', async (c) => {
  try {
    const suppliers = await kv.getByPrefix('supplier:');
    return c.json({ suppliers });
  } catch (error) {
    console.log('Error fetching suppliers:', error);
    return c.json({ error: 'Failed to fetch suppliers' }, 500);
  }
});

app.post('/make-server-a4a212c7/suppliers', async (c) => {
  try {
    const supplier = await c.req.json();
    const supplierId = `supplier:${Date.now()}`;
    await kv.set(supplierId, {
      ...supplier,
      id: supplierId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalOrders: 0,
      totalSpent: 0,
      rating: 0,
      recentTransactions: []
    });
    return c.json({ success: true, id: supplierId });
  } catch (error) {
    console.log('Error creating supplier:', error);
    return c.json({ error: 'Failed to create supplier' }, 500);
  }
});

// Orders endpoints
app.get('/make-server-a4a212c7/orders', async (c) => {
  try {
    const orders = await kv.getByPrefix('order:');
    return c.json({ orders });
  } catch (error) {
    console.log('Error fetching orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

app.post('/make-server-a4a212c7/orders', async (c) => {
  try {
    const order = await c.req.json();
    const orderId = `order:${Date.now()}`;
    const orderNumber = `${order.type?.toUpperCase().substr(0,3) || 'ORD'}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    await kv.set(orderId, {
      ...order,
      id: orderId,
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: order.status || 'draft'
    });
    return c.json({ success: true, id: orderId, orderNumber });
  } catch (error) {
    console.log('Error creating order:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// Inventory transactions endpoints
app.get('/make-server-a4a212c7/inventory-transactions', async (c) => {
  try {
    const transactions = await kv.getByPrefix('transaction:');
    return c.json({ transactions });
  } catch (error) {
    console.log('Error fetching inventory transactions:', error);
    return c.json({ error: 'Failed to fetch inventory transactions' }, 500);
  }
});

app.post('/make-server-a4a212c7/inventory-transactions', async (c) => {
  try {
    const transaction = await c.req.json();
    const transactionId = `transaction:${Date.now()}`;
    const transactionNumber = `TXN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    await kv.set(transactionId, {
      ...transaction,
      id: transactionId,
      transactionNumber,
      createdAt: new Date().toISOString(),
      createdBy: 'API'
    });
    
    // Update product stock levels if it's a stock change
    if (transaction.productId && ['stock_in', 'stock_out', 'adjustment'].includes(transaction.type)) {
      const product = await kv.get(`product:${transaction.productId}`);
      if (product) {
        const quantityChange = ['stock_in', 'return'].includes(transaction.type) 
          ? Math.abs(transaction.quantity) 
          : -Math.abs(transaction.quantity);
        
        await kv.set(`product:${transaction.productId}`, {
          ...product,
          stockLevel: Math.max(0, (product.stockLevel || 0) + quantityChange),
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    return c.json({ success: true, id: transactionId, transactionNumber });
  } catch (error) {
    console.log('Error creating inventory transaction:', error);
    return c.json({ error: 'Failed to create inventory transaction' }, 500);
  }
});

// Analytics endpoints
app.get('/make-server-a4a212c7/analytics/summary', async (c) => {
  try {
    const products = await kv.getByPrefix('product:');
    const clients = await kv.getByPrefix('client:');
    const orders = await kv.getByPrefix('order:');
    const transactions = await kv.getByPrefix('transaction:');
    
    const lowStockItems = products.filter(p => 
      p.stockLevel !== undefined && p.minStockLevel !== undefined && 
      p.stockLevel <= p.minStockLevel
    );
    
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    const recentActivity = transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        type: t.type === 'stock_out' && t.referenceType === 'sale' ? 'sale' : 
              t.type === 'stock_in' ? 'restock' : 
              t.type,
        message: `${t.type.replace('_', ' ')} - ${t.productName} (${Math.abs(t.quantity)})`,
        timestamp: new Date(t.createdAt).toISOString()
      }));
    
    return c.json({
      totalProducts: products.length,
      totalClients: clients.length,
      pendingOrders: orders.filter(o => ['draft', 'sent', 'accepted'].includes(o.status)).length,
      monthlyRevenue: totalRevenue,
      lowStockItems: lowStockItems.length,
      paintingsAvailable: products.filter(p => p.productType === 'painting' && p.status === 'available').length,
      paintsInStock: products.filter(p => p.productType === 'paint' && (p.stockLevel || 0) > 0).length,
      recentActivity
    });
  } catch (error) {
    console.log('Error fetching analytics summary:', error);
    return c.json({ error: 'Failed to fetch analytics summary' }, 500);
  }
});

// Catch-all error handler
app.onError((err, c) => {
  console.log('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

Deno.serve(app.fetch);