import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';

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
    const { data, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) throw error;
    return c.json({ products: data || [] });
  } catch (error) {
    console.log('Error fetching products:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.post('/make-server-a4a212c7/products', async (c) => {
  try {
    const product = await c.req.json();
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    
    if (error) throw error;
    return c.json({ success: true, id: data.id });
  } catch (error) {
    console.log('Error creating product:', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

app.put('/make-server-a4a212c7/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const productData = await c.req.json();
    
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) return c.json({ error: 'Product not found' }, 404);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error updating product:', error);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

// Delete a product
app.delete('/make-server-a4a212c7/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) return c.json({ error: 'Product not found' }, 404);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting product:', error);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

// Clients endpoints
app.get('/make-server-a4a212c7/clients', async (c) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*');
    
    if (error) throw error;
    return c.json({ clients: data || [] });
  } catch (error) {
    console.log('Error fetching clients:', error);
    return c.json({ error: 'Failed to fetch clients' }, 500);
  }
});

app.post('/make-server-a4a212c7/clients', async (c) => {
  try {
    const client = await c.req.json();
    
    const clientData = {
      ...client,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_spent: 0,
      purchase_history: []
    };
    
    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();
    
    if (error) throw error;
    return c.json({ success: true, id: data.id });
  } catch (error) {
    console.log('Error creating client:', error);
    return c.json({ error: 'Failed to create client' }, 500);
  }
});

// Suppliers endpoints
app.get('/make-server-a4a212c7/suppliers', async (c) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*');
    
    if (error) throw error;
    return c.json({ suppliers: data || [] });
  } catch (error) {
    console.log('Error fetching suppliers:', error);
    return c.json({ error: 'Failed to fetch suppliers' }, 500);
  }
});

app.post('/make-server-a4a212c7/suppliers', async (c) => {
  try {
    const supplier = await c.req.json();
    
    const supplierData = {
      ...supplier,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_orders: 0,
      total_spent: 0,
      rating: 0,
      recent_transactions: []
    };
    
    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplierData])
      .select()
      .single();
    
    if (error) throw error;
    return c.json({ success: true, id: data.id });
  } catch (error) {
    console.log('Error creating supplier:', error);
    return c.json({ error: 'Failed to create supplier' }, 500);
  }
});

// Orders endpoints
app.get('/make-server-a4a212c7/orders', async (c) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*');
    
    if (error) throw error;
    return c.json({ orders: data || [] });
  } catch (error) {
    console.log('Error fetching orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

app.post('/make-server-a4a212c7/orders', async (c) => {
  try {
    const order = await c.req.json();
    const orderNumber = `${order.type?.toUpperCase().substr(0,3) || 'ORD'}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    const orderData = {
      ...order,
      order_number: orderNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: order.status || 'draft'
    };
    
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    
    if (error) throw error;
    return c.json({ success: true, id: data.id, orderNumber });
  } catch (error) {
    console.log('Error creating order:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// Update an order
app.put('/make-server-a4a212c7/orders/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) return c.json({ error: 'Order not found' }, 404);
    
    return c.json({ success: true, id: data.id });
  } catch (error) {
    console.log('Error updating order:', error);
    return c.json({ error: 'Failed to update order' }, 500);
  }
});

// Delete an order
app.delete('/make-server-a4a212c7/orders/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { data, error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) return c.json({ error: 'Order not found' }, 404);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting order:', error);
    return c.json({ error: 'Failed to delete order' }, 500);
  }
});

// Inventory transactions endpoints
app.get('/make-server-a4a212c7/inventory-transactions', async (c) => {
  try {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*');
    
    if (error) throw error;
    return c.json({ transactions: data || [] });
  } catch (error) {
    console.log('Error fetching inventory transactions:', error);
    return c.json({ error: 'Failed to fetch inventory transactions' }, 500);
  }
});

app.post('/make-server-a4a212c7/inventory-transactions', async (c) => {
  try {
    const transaction = await c.req.json();
    const transactionNumber = `TXN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    const transactionData = {
      ...transaction,
      transaction_number: transactionNumber,
      created_at: new Date().toISOString(),
      created_by: 'API'
    };
    
    const { data: transactionResult, error: transactionError } = await supabase
      .from('inventory_transactions')
      .insert([transactionData])
      .select()
      .single();
    
    if (transactionError) throw transactionError;
    
    // Update product stock levels if it's a stock change
    if (transaction.product_id && ['stock_in', 'stock_out', 'adjustment'].includes(transaction.type)) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_level')
        .eq('id', transaction.product_id)
        .single();
      
      if (!productError && product) {
        const quantityChange = ['stock_in', 'return'].includes(transaction.type) 
          ? Math.abs(transaction.quantity) 
          : -Math.abs(transaction.quantity);
        
        const newStockLevel = Math.max(0, (product.stock_level || 0) + quantityChange);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_level: newStockLevel })
          .eq('id', transaction.product_id);
        
        if (updateError) throw updateError;
      }
    }
    
    return c.json({ success: true, id: transactionResult.id, transactionNumber });
  } catch (error) {
    console.log('Error creating inventory transaction:', error);
    return c.json({ error: 'Failed to create inventory transaction' }, 500);
  }
});

// Analytics endpoints
app.get('/make-server-a4a212c7/analytics/summary', async (c) => {
  try {
    // Fetch products directly from the products table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) throw productsError;
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');
    
    if (clientsError) throw clientsError;
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) throw ordersError;
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('inventory_transactions')
      .select('*');
    
    if (transactionsError) throw transactionsError;
    
    const lowStockItems = products.filter(p => 
      p.stock_level !== undefined && p.min_stock_level !== undefined && 
      p.stock_level <= p.min_stock_level
    );
    
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    const recentActivity = transactions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        type: t.type === 'stock_out' && t.reference_type === 'sale' ? 'sale' : 
              t.type === 'stock_in' ? 'restock' : 
              t.type,
        message: `${t.type.replace('_', ' ')} - ${t.product_name} (${Math.abs(t.quantity)})`,
        timestamp: new Date(t.created_at).toISOString()
      }));
    
    return c.json({
      totalProducts: products.length,
      totalClients: clients.length,
      pendingOrders: orders.filter(o => ['draft', 'sent', 'accepted'].includes(o.status)).length,
      monthlyRevenue: totalRevenue,
      lowStockItems: lowStockItems.length,
      paintingsAvailable: products.filter(p => p.product_type === 'painting' && p.status === 'available').length,
      paintsInStock: products.filter(p => p.product_type === 'paint' && (p.stock_level || 0) > 0).length,
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
