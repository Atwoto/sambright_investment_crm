import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  ShoppingCart,
  FileText,
  CreditCard,
  Calendar,
  DollarSign,
  User,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Printer,
  Mail
} from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productType: 'paint' | 'painting';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  type: 'quote' | 'sale' | 'invoice';
  clientId: string;
  clientName: string;
  clientEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentMethod?: string;
  dateCreated: string;
  dueDate?: string;
  notes?: string;
}

export function OrdersManager() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0
  });

  useEffect(() => {
    // Mock data - in real implementation, fetch from Supabase
    setOrders([
      {
        id: '1',
        orderNumber: 'ORD-2024-001',
        type: 'sale',
        clientId: '1',
        clientName: 'Sarah Johnson',
        clientEmail: 'sarah@moderninteriors.com',
        items: [
          {
            id: '1',
            productId: 'p1',
            productName: 'Sunset Landscape',
            productType: 'painting',
            quantity: 1,
            unitPrice: 850,
            totalPrice: 850
          }
        ],
        subtotal: 850,
        tax: 68,
        total: 918,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'Credit Card',
        dateCreated: '2024-09-15',
        dueDate: '2024-09-15',
        notes: 'Client loved the piece, immediate purchase.'
      },
      {
        id: '2',
        orderNumber: 'QUO-2024-002',
        type: 'quote',
        clientId: '2',
        clientName: 'David Chen',
        clientEmail: 'david.chen@email.com',
        items: [
          {
            id: '1',
            productId: 'p2',
            productName: 'Winsor & Newton Oil Paint Set',
            productType: 'paint',
            quantity: 2,
            unitPrice: 120,
            totalPrice: 240
          },
          {
            id: '2',
            productId: 'p3',
            productName: 'Professional Brushes',
            productType: 'paint',
            quantity: 1,
            unitPrice: 85,
            totalPrice: 85
          }
        ],
        subtotal: 325,
        tax: 26,
        total: 351,
        status: 'sent',
        paymentStatus: 'pending',
        dateCreated: '2024-09-18',
        dueDate: '2024-10-18',
        notes: 'Bulk order discount applied. Client considering purchase.'
      },
      {
        id: '3',
        orderNumber: 'INV-2024-003',
        type: 'invoice',
        clientId: '3',
        clientName: 'Maria Rodriguez',
        clientEmail: 'maria@auroragallery.com',
        items: [
          {
            id: '1',
            productId: 'p4',
            productName: 'Abstract Art Collection',
            productType: 'painting',
            quantity: 4,
            unitPrice: 650,
            totalPrice: 2600
          }
        ],
        subtotal: 2600,
        tax: 208,
        total: 2808,
        status: 'accepted',
        paymentStatus: 'overdue',
        paymentMethod: 'Bank Transfer',
        dateCreated: '2024-08-15',
        dueDate: '2024-09-15',
        notes: 'Gallery consignment agreement. Payment overdue by 3 days.'
      }
    ]);
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesTab = activeTab === 'all' || order.type === activeTab;
    return matchesSearch && matchesStatus && matchesTab;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      sent: 'outline',
      accepted: 'default',
      completed: 'default',
      cancelled: 'destructive'
    } as const;
    const colors = {
      draft: 'text-gray-600',
      sent: 'text-blue-600',
      accepted: 'text-green-600',
      completed: 'text-green-700',
      cancelled: 'text-red-600'
    };
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'} className={colors[status as keyof typeof colors] || ''}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      partial: 'outline',
      paid: 'default',
      overdue: 'destructive'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'quote': return <FileText className="h-4 w-4" />;
      case 'invoice': return <CreditCard className="h-4 w-4" />;
      case 'sale': return <ShoppingCart className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'accepted': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'sent': return <Clock className="h-4 w-4 text-orange-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const isOverdue = (order: Order) => {
    if (!order.dueDate) return false;
    return new Date(order.dueDate) < new Date() && order.paymentStatus !== 'paid';
  };

  const handlePrintOrder = (order: Order) => {
    // Generate printable HTML
    const printContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${order.orderNumber} - Sambright Investment Ltd</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 5px; }
          .company-subtitle { color: #666; margin-bottom: 20px; }
          .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .client-info, .order-details { flex: 1; }
          .order-details { text-align: right; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background-color: #f8f9fa; font-weight: bold; }
          .totals { text-align: right; margin-top: 20px; }
          .total-row { font-weight: bold; font-size: 18px; color: #16a34a; }
          .notes { margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Sambright Investment Ltd</div>
          <div class="company-subtitle">Painting Business CRM</div>
        </div>
        
        <div class="order-info">
          <div class="client-info">
            <h3>Bill To:</h3>
            <strong>${order.clientName}</strong><br>
            ${order.clientEmail}
          </div>
          <div class="order-details">
            <h3>${order.type.charAt(0).toUpperCase() + order.type.slice(1)} Details:</h3>
            <strong>${order.orderNumber}</strong><br>
            Date: ${new Date(order.dateCreated).toLocaleDateString()}<br>
            ${order.dueDate ? `Due: ${new Date(order.dueDate).toLocaleDateString()}<br>` : ''}
            Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.productType}</td>
                <td>${item.quantity}</td>
                <td>${item.unitPrice.toFixed(2)}</td>
                <td>${item.totalPrice.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>Subtotal: ${order.subtotal.toFixed(2)}</div>
          <div>Tax: ${order.tax.toFixed(2)}</div>
          <div class="total-row">Total: ${order.total.toFixed(2)}</div>
        </div>

        ${order.notes ? `
          <div class="notes">
            <h4>Notes:</h4>
            <p>${order.notes}</p>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleDownloadOrder = (order: Order) => {
    // Create downloadable PDF-like content (HTML)
    const content = `Sambright Investment Ltd - ${order.orderNumber}\n` +
                   `Date: ${new Date(order.dateCreated).toLocaleDateString()}\n` +
                   `Client: ${order.clientName} (${order.clientEmail})\n` +
                   `Status: ${order.status}\n\n` +
                   `ITEMS:\n` +
                   order.items.map(item => 
                     `- ${item.productName} (${item.productType}) x${item.quantity} @ ${item.unitPrice} = ${item.totalPrice}`
                   ).join('\n') +
                   `\n\nSubtotal: ${order.subtotal.toFixed(2)}\n` +
                   `Tax: ${order.tax.toFixed(2)}\n` +
                   `TOTAL: ${order.total.toFixed(2)}\n` +
                   (order.notes ? `\nNotes: ${order.notes}` : '');

    // Create and download text file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${order.orderNumber}-${order.clientName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEmailOrder = (order: Order) => {
    const subject = `${order.orderNumber} from Sambright Investment Ltd`;
    const body = `Dear ${order.clientName},\n\n` +
                 `Please find attached your ${order.type} ${order.orderNumber}.\n\n` +
                 `Order Details:\n` +
                 `- Order Number: ${order.orderNumber}\n` +
                 `- Date: ${new Date(order.dateCreated).toLocaleDateString()}\n` +
                 `- Status: ${order.status}\n` +
                 `- Total: ${order.total.toFixed(2)}\n\n` +
                 `Thank you for your business!\n\n` +
                 `Best regards,\nSambright Investment Ltd\nPainting Business CRM`;

    window.location.href = `mailto:${order.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900">Orders & Invoices</h2>
          <p className="text-gray-600">Manage quotes, sales orders, and invoices</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>
                Create a new quote, sale order, or invoice.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="orderType" className="text-right">Type</Label>
                <Select value={newOrder.type} onValueChange={(value) => setNewOrder({...newOrder, type: value as any})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="sale">Sale Order</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientName" className="text-right">Client</Label>
                <Input
                  id="clientName"
                  value={newOrder.clientName || ''}
                  onChange={(e) => setNewOrder({...newOrder, clientName: e.target.value})}
                  className="col-span-3"
                  placeholder="Client name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientEmail" className="text-right">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={newOrder.clientEmail || ''}
                  onChange={(e) => setNewOrder({...newOrder, clientEmail: e.target.value})}
                  className="col-span-3"
                  placeholder="client@email.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="orderNotes" className="text-right">Notes</Label>
                <Textarea
                  id="orderNotes"
                  value={newOrder.notes || ''}
                  onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                  className="col-span-3"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => {
                // Handle creating order
                setNewOrder({ items: [], subtotal: 0, tax: 0, total: 0 });
                setIsAddDialogOpen(false);
              }}>
                Create Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 bg-white/50 backdrop-blur-sm border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders by number, client name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 border-gray-200 focus:border-blue-500"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48 bg-white/80 border-gray-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white/80 backdrop-blur-sm border shadow-sm">
          <TabsTrigger value="all" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <Package className="h-4 w-4" />
            <span>All Orders ({orders.length})</span>
          </TabsTrigger>
          <TabsTrigger value="quote" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <FileText className="h-4 w-4" />
            <span>Quotes ({orders.filter(o => o.type === 'quote').length})</span>
          </TabsTrigger>
          <TabsTrigger value="sale" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <ShoppingCart className="h-4 w-4" />
            <span>Sales ({orders.filter(o => o.type === 'sale').length})</span>
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <CreditCard className="h-4 w-4" />
            <span>Invoices ({orders.filter(o => o.type === 'invoice').length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <div className="grid gap-6">
            {filteredOrders.map((order) => (
              <Card key={order.id} className={`${isOverdue(order) ? 'border-red-200 bg-red-50' : 'bg-white/80 backdrop-blur-sm'} hover:shadow-lg transition-all duration-200 hover:-translate-y-1`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      {getOrderTypeIcon(order.type)}
                      <div>
                        <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <span>{order.clientName}</span>
                          <span>•</span>
                          <span>{order.clientEmail}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      {getStatusBadge(order.status)}
                      {isOverdue(order) && (
                        <Badge variant="destructive">Overdue</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Subtotal</div>
                      <div className="font-semibold">${order.subtotal.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Tax</div>
                      <div className="font-semibold">${order.tax.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="text-lg font-bold text-green-600">${order.total.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Payment</div>
                      <div>{getPaymentStatusBadge(order.paymentStatus)}</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-600 mb-2">Items ({order.items.length})</div>
                    <div className="space-y-1">
                      {order.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span>{item.productName} x{item.quantity}</span>
                          <span className="font-medium">${item.totalPrice}</span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-sm text-gray-500">+{order.items.length - 2} more items</div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>Created: {new Date(order.dateCreated).toLocaleDateString()}</span>
                    </div>
                    {order.dueDate && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3" />
                        <span>Due: {new Date(order.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {order.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{order.notes}</p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 min-w-[100px]"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePrintOrder(order)}
                      className="hidden sm:flex"
                    >
                      <Printer className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadOrder(order)}
                      className="hidden sm:flex"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    {order.type === 'quote' && order.status === 'sent' && (
                      <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">Accept</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  {getOrderTypeIcon(selectedOrder.type)}
                  <div>
                    <div>{selectedOrder.orderNumber}</div>
                    <div className="text-sm text-gray-500 font-normal">{selectedOrder.clientName}</div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Status and Payment Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Order Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedOrder.status)}
                        {getStatusBadge(selectedOrder.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Created: {new Date(selectedOrder.dateCreated).toLocaleDateString()}
                      </div>
                      {selectedOrder.dueDate && (
                        <div className="text-sm text-gray-600">
                          Due: {new Date(selectedOrder.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Payment Information</h4>
                    <div className="space-y-2">
                      <div>{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                      {selectedOrder.paymentMethod && (
                        <div className="text-sm text-gray-600">
                          Method: {selectedOrder.paymentMethod}
                        </div>
                      )}
                      {isOverdue(selectedOrder) && (
                        <Badge variant="destructive">Payment Overdue</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-medium mb-3">Order Items</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 grid grid-cols-12 gap-2 text-sm font-medium text-gray-600">
                      <div className="col-span-5">Product</div>
                      <div className="col-span-2 text-center">Type</div>
                      <div className="col-span-1 text-center">Qty</div>
                      <div className="col-span-2 text-right">Unit Price</div>
                      <div className="col-span-2 text-right">Total</div>
                    </div>
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="px-4 py-3 grid grid-cols-12 gap-2 border-t">
                        <div className="col-span-5 font-medium">{item.productName}</div>
                        <div className="col-span-2 text-center">
                          <Badge variant="outline" className="text-xs">
                            {item.productType}
                          </Badge>
                        </div>
                        <div className="col-span-1 text-center">{item.quantity}</div>
                        <div className="col-span-2 text-right">${item.unitPrice}</div>
                        <div className="col-span-2 text-right font-semibold">${item.totalPrice}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="max-w-sm ml-auto space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${selectedOrder.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-green-600">${selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-medium mb-3">Notes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => selectedOrder && handlePrintOrder(selectedOrder)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => selectedOrder && handleDownloadOrder(selectedOrder)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => selectedOrder && handleEmailOrder(selectedOrder)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  {selectedOrder.type === 'quote' && selectedOrder.status === 'sent' && (
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                      Convert to Sale
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}