import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Plus, 
  Search,
  TrendingUp,
  TrendingDown,
  Package,
  ArrowUp,
  ArrowDown,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  RotateCcw
} from 'lucide-react';

interface InventoryTransaction {
  id: string;
  transactionNumber: string;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'return' | 'damaged' | 'lost';
  productId: string;
  productName: string;
  productType: 'paint' | 'painting';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason: string;
  referenceType?: 'purchase' | 'sale' | 'return' | 'adjustment';
  referenceId?: string;
  dateCreated: string;
  createdBy: string;
  notes?: string;
  supplierId?: string;
  supplierName?: string;
  clientId?: string;
  clientName?: string;
}

export function InventoryTransactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<InventoryTransaction>>({});

  useEffect(() => {
    // Mock data - in real implementation, fetch from Supabase
    setTransactions([
      {
        id: '1',
        transactionNumber: 'TXN-2024-001',
        type: 'stock_in',
        productId: 'p1',
        productName: 'Titanium White 500ml',
        productType: 'paint',
        quantity: 12,
        unitCost: 24.99,
        totalCost: 299.88,
        reason: 'Restock from supplier',
        referenceType: 'purchase',
        referenceId: 'PO-2024-015',
        dateCreated: '2024-09-18',
        createdBy: 'System',
        supplierId: '1',
        supplierName: 'Art Supply Co.',
        notes: 'Bulk order delivery'
      },
      {
        id: '2',
        transactionNumber: 'TXN-2024-002',
        type: 'stock_out',
        productId: 'p2',
        productName: 'Sunset Landscape',
        productType: 'painting',
        quantity: 1,
        reason: 'Sale to customer',
        referenceType: 'sale',
        referenceId: 'ORD-2024-001',
        dateCreated: '2024-09-15',
        createdBy: 'System',
        clientId: '1',
        clientName: 'Sarah Johnson',
        notes: 'Painting sold to Modern Interiors Design'
      },
      {
        id: '3',
        transactionNumber: 'TXN-2024-003',
        type: 'stock_out',
        productId: 'p3',
        productName: 'Ultramarine Blue 200ml',
        productType: 'paint',
        quantity: 2,
        reason: 'Used in painting creation',
        dateCreated: '2024-09-14',
        createdBy: 'Manual Entry',
        notes: 'Used for commissioned landscape painting'
      },
      {
        id: '4',
        transactionNumber: 'TXN-2024-004',
        type: 'damaged',
        productId: 'p4',
        productName: 'Canvas 24x36',
        productType: 'paint',
        quantity: 1,
        reason: 'Damaged during transport',
        dateCreated: '2024-09-12',
        createdBy: 'Manual Entry',
        notes: 'Canvas arrived with tears, supplier notified'
      },
      {
        id: '5',
        transactionNumber: 'TXN-2024-005',
        type: 'adjustment',
        productId: 'p5',
        productName: 'Cadmium Red 100ml',
        productType: 'paint',
        quantity: -1,
        reason: 'Inventory count correction',
        dateCreated: '2024-09-10',
        createdBy: 'Manual Entry',
        notes: 'Monthly inventory audit adjustment'
      },
      {
        id: '6',
        transactionNumber: 'TXN-2024-006',
        type: 'return',
        productId: 'p6',
        productName: 'Abstract Study #3',
        productType: 'painting',
        quantity: 1,
        reason: 'Customer return',
        referenceType: 'return',
        referenceId: 'RET-2024-001',
        dateCreated: '2024-09-08',
        createdBy: 'System',
        clientId: '2',
        clientName: 'Gallery Aurora',
        notes: 'Client changed mind on color scheme'
      }
    ]);
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    
    let matchesDate = true;
    if (selectedDateRange !== 'all') {
      const transactionDate = new Date(transaction.dateCreated);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (selectedDateRange) {
        case '7':
          matchesDate = daysDiff <= 7;
          break;
        case '30':
          matchesDate = daysDiff <= 30;
          break;
        case '90':
          matchesDate = daysDiff <= 90;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  const handleAddTransaction = () => {
    if (newTransaction.productName && newTransaction.quantity && newTransaction.type) {
      const transaction: InventoryTransaction = {
        id: Date.now().toString(),
        transactionNumber: `TXN-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(3, '0')}`,
        type: newTransaction.type as any,
        productId: Date.now().toString(),
        productName: newTransaction.productName,
        productType: (newTransaction.productType as any) || 'paint',
        quantity: newTransaction.quantity,
        unitCost: newTransaction.unitCost,
        totalCost: newTransaction.unitCost && newTransaction.quantity ? newTransaction.unitCost * Math.abs(newTransaction.quantity) : undefined,
        reason: newTransaction.reason || '',
        dateCreated: new Date().toISOString().split('T')[0],
        createdBy: 'Manual Entry',
        notes: newTransaction.notes
      };
      setTransactions([transaction, ...transactions]);
      setNewTransaction({});
      setIsAddDialogOpen(false);
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'stock_in': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'stock_out': return <ArrowDown className="h-4 w-4 text-blue-600" />;
      case 'adjustment': return <RotateCcw className="h-4 w-4 text-purple-600" />;
      case 'return': return <RotateCcw className="h-4 w-4 text-orange-600" />;
      case 'damaged': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'lost': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    const configs = {
      stock_in: { variant: 'default' as const, className: 'bg-green-100 text-green-800', label: 'Stock In' },
      stock_out: { variant: 'default' as const, className: 'bg-blue-100 text-blue-800', label: 'Stock Out' },
      adjustment: { variant: 'default' as const, className: 'bg-purple-100 text-purple-800', label: 'Adjustment' },
      return: { variant: 'default' as const, className: 'bg-orange-100 text-orange-800', label: 'Return' },
      damaged: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800', label: 'Damaged' },
      lost: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800', label: 'Lost' }
    };
    
    const config = configs[type as keyof typeof configs] || { variant: 'outline' as const, className: '', label: type };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getQuantityDisplay = (transaction: InventoryTransaction) => {
    const isPositive = ['stock_in', 'return'].includes(transaction.type);
    const quantity = Math.abs(transaction.quantity);
    const sign = isPositive ? '+' : '-';
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={`font-semibold ${colorClass}`}>
        {sign}{quantity}
      </span>
    );
  };

  // Calculate summary stats
  const totalStockIn = filteredTransactions
    .filter(t => ['stock_in', 'return'].includes(t.type))
    .reduce((sum, t) => sum + Math.abs(t.quantity), 0);
    
  const totalStockOut = filteredTransactions
    .filter(t => ['stock_out', 'damaged', 'lost'].includes(t.type))
    .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

  const totalValue = filteredTransactions
    .filter(t => t.totalCost)
    .reduce((sum, t) => sum + (t.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Inventory Transactions</h2>
          <p className="text-gray-600">Track all inventory movements and adjustments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Inventory Transaction</DialogTitle>
              <DialogDescription>
                Record a new inventory movement or adjustment.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="transactionType" className="text-right">Type</Label>
                <Select value={newTransaction.type} onValueChange={(value) => setNewTransaction({...newTransaction, type: value as any})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock_in">Stock In</SelectItem>
                    <SelectItem value="stock_out">Stock Out</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="productName" className="text-right">Product</Label>
                <Input
                  id="productName"
                  value={newTransaction.productName || ''}
                  onChange={(e) => setNewTransaction({...newTransaction, productName: e.target.value})}
                  className="col-span-3"
                  placeholder="Product name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="productType" className="text-right">Type</Label>
                <Select value={newTransaction.productType} onValueChange={(value) => setNewTransaction({...newTransaction, productType: value as any})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Product type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paint">Paint/Supply</SelectItem>
                    <SelectItem value="painting">Painting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newTransaction.quantity || ''}
                  onChange={(e) => setNewTransaction({...newTransaction, quantity: parseInt(e.target.value)})}
                  className="col-span-3"
                  placeholder="Quantity (positive number)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unitCost" className="text-right">Unit Cost</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  value={newTransaction.unitCost || ''}
                  onChange={(e) => setNewTransaction({...newTransaction, unitCost: parseFloat(e.target.value)})}
                  className="col-span-3"
                  placeholder="Optional"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">Reason</Label>
                <Input
                  id="reason"
                  value={newTransaction.reason || ''}
                  onChange={(e) => setNewTransaction({...newTransaction, reason: e.target.value})}
                  className="col-span-3"
                  placeholder="Reason for transaction"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="transactionNotes" className="text-right">Notes</Label>
                <Textarea
                  id="transactionNotes"
                  value={newTransaction.notes || ''}
                  onChange={(e) => setNewTransaction({...newTransaction, notes: e.target.value})}
                  className="col-span-3"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleAddTransaction}>Add Transaction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock In</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{totalStockIn}</div>
            <p className="text-xs text-muted-foreground">Units received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Out</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{totalStockOut}</div>
            <p className="text-xs text-muted-foreground">Units removed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Change</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalStockIn - totalStockOut >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalStockIn - totalStockOut >= 0 ? '+' : ''}{totalStockIn - totalStockOut}
            </div>
            <p className="text-xs text-muted-foreground">Total change</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Transaction value</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="stock_in">Stock In</SelectItem>
            <SelectItem value="stock_out">Stock Out</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="return">Return</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <Card key={transaction.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="mt-1">
                    {getTransactionTypeIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{transaction.transactionNumber}</h3>
                      {getTransactionTypeBadge(transaction.type)}
                      <Badge variant="outline" className="text-xs">
                        {transaction.productType}
                      </Badge>
                    </div>
                    
                    <div className="text-gray-900 font-medium mb-1">{transaction.productName}</div>
                    <div className="text-sm text-gray-600 mb-2">{transaction.reason}</div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(transaction.dateCreated).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{transaction.createdBy}</span>
                      </div>
                      {transaction.supplierName && (
                        <div>From: {transaction.supplierName}</div>
                      )}
                      {transaction.clientName && (
                        <div>To: {transaction.clientName}</div>
                      )}
                    </div>

                    {transaction.notes && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">{transaction.notes}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xl font-bold mb-1">
                    {getQuantityDisplay(transaction)}
                  </div>
                  {transaction.totalCost && (
                    <div className="text-sm text-gray-600">
                      ${transaction.totalCost.toLocaleString()}
                    </div>
                  )}
                  {transaction.unitCost && (
                    <div className="text-xs text-gray-500">
                      ${transaction.unitCost}/unit
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredTransactions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}