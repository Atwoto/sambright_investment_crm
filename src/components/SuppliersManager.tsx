import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Truck,
  Star,
  Clock
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  website?: string;
  supplierType: 'paints' | 'canvas' | 'frames' | 'brushes' | 'general';
  paymentTerms: string;
  rating: number;
  totalOrders: number;
  totalSpent: number;
  lastOrder?: string;
  dateAdded: string;
  notes?: string;
  products: string[];
  recentTransactions: Array<{
    id: string;
    date: string;
    amount: number;
    description: string;
    status: 'completed' | 'pending' | 'cancelled';
  }>;
}

export function SuppliersManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    products: [],
    recentTransactions: []
  });

  useEffect(() => {
    // Mock data - in real implementation, fetch from Supabase
    setSuppliers([
      {
        id: '1',
        name: 'Art Supply Co.',
        contactPerson: 'John Martinez',
        email: 'orders@artsupplyco.com',
        phone: '+1 (555) 123-0001',
        address: '123 Supply Street, Industrial District, NY 10001',
        website: 'www.artsupplyco.com',
        supplierType: 'paints',
        paymentTerms: 'Net 30',
        rating: 4.5,
        totalOrders: 24,
        totalSpent: 12450,
        lastOrder: '2024-09-15',
        dateAdded: '2023-05-10',
        notes: 'Reliable supplier for premium paints. Good bulk discounts.',
        products: ['Winsor & Newton', 'Golden Acrylics', 'Liquitex'],
        recentTransactions: [
          { id: '1', date: '2024-09-15', amount: 850, description: 'Oil paint bulk order', status: 'completed' },
          { id: '2', date: '2024-08-22', amount: 1200, description: 'Acrylic paint restocking', status: 'completed' },
          { id: '3', date: '2024-08-05', amount: 650, description: 'Specialty pigments', status: 'completed' }
        ]
      },
      {
        id: '2',
        name: 'Professional Paints Ltd',
        contactPerson: 'Sarah Wilson',
        email: 'sarah@profpaints.com',
        phone: '+1 (555) 456-0002',
        address: '456 Paint Avenue, Commerce City, CA 90210',
        website: 'www.professionalpaintsltd.com',
        supplierType: 'paints',
        paymentTerms: 'Net 15',
        rating: 4.8,
        totalOrders: 18,
        totalSpent: 9800,
        lastOrder: '2024-09-12',
        dateAdded: '2023-08-15',
        notes: 'Excellent quality, fast shipping. Preferred supplier for watercolors.',
        products: ['Schmincke', 'Daniel Smith', 'M. Graham'],
        recentTransactions: [
          { id: '1', date: '2024-09-12', amount: 920, description: 'Watercolor paint set', status: 'completed' },
          { id: '2', date: '2024-07-28', amount: 760, description: 'Professional grade brushes', status: 'completed' },
          { id: '3', date: '2024-07-10', amount: 1100, description: 'Canvas and mediums', status: 'completed' }
        ]
      },
      {
        id: '3',
        name: 'Canvas & Frame Works',
        contactPerson: 'Michael Chen',
        email: 'mike@canvasframes.com',
        phone: '+1 (555) 789-0003',
        address: '789 Workshop Lane, Art District, FL 33101',
        supplierType: 'canvas',
        paymentTerms: 'Net 45',
        rating: 4.2,
        totalOrders: 15,
        totalSpent: 6750,
        lastOrder: '2024-09-08',
        dateAdded: '2023-12-01',
        notes: 'Good for bulk canvas orders. Custom stretching available.',
        products: ['Stretched Canvas', 'Canvas Boards', 'Custom Frames'],
        recentTransactions: [
          { id: '1', date: '2024-09-08', amount: 580, description: 'Large canvas order', status: 'completed' },
          { id: '2', date: '2024-08-15', amount: 320, description: 'Canvas boards various sizes', status: 'completed' },
          { id: '3', date: '2024-07-20', amount: 450, description: 'Custom frame order', status: 'pending' }
        ]
      }
    ]);
  }, []);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || supplier.supplierType === selectedType;
    return matchesSearch && matchesType;
  });

  const handleAddSupplier = () => {
    if (newSupplier.name && newSupplier.email) {
      const supplier: Supplier = {
        id: Date.now().toString(),
        name: newSupplier.name,
        contactPerson: newSupplier.contactPerson || '',
        email: newSupplier.email,
        phone: newSupplier.phone || '',
        address: newSupplier.address,
        website: newSupplier.website,
        supplierType: (newSupplier.supplierType as any) || 'general',
        paymentTerms: newSupplier.paymentTerms || 'Net 30',
        rating: 0,
        totalOrders: 0,
        totalSpent: 0,
        dateAdded: new Date().toISOString().split('T')[0],
        notes: newSupplier.notes,
        products: newSupplier.products || [],
        recentTransactions: []
      };
      setSuppliers([...suppliers, supplier]);
      setNewSupplier({ products: [], recentTransactions: [] });
      setIsAddDialogOpen(false);
    }
  };

  const getSupplierTypeColor = (type: string) => {
    const colors = {
      paints: 'bg-blue-100 text-blue-800',
      canvas: 'bg-green-100 text-green-800',
      frames: 'bg-purple-100 text-purple-800',
      brushes: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900">Supplier Management</h2>
          <p className="text-gray-600">Manage your vendors and track purchase history</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Enter the supplier's information to add them to your vendor list.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplierName" className="text-right">Name</Label>
                <Input
                  id="supplierName"
                  value={newSupplier.name || ''}
                  onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactPerson" className="text-right">Contact</Label>
                <Input
                  id="contactPerson"
                  value={newSupplier.contactPerson || ''}
                  onChange={(e) => setNewSupplier({...newSupplier, contactPerson: e.target.value})}
                  className="col-span-3"
                  placeholder="Contact person name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplierEmail" className="text-right">Email</Label>
                <Input
                  id="supplierEmail"
                  type="email"
                  value={newSupplier.email || ''}
                  onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplierPhone" className="text-right">Phone</Label>
                <Input
                  id="supplierPhone"
                  value={newSupplier.phone || ''}
                  onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplierType" className="text-right">Type</Label>
                <Select value={newSupplier.supplierType} onValueChange={(value) => setNewSupplier({...newSupplier, supplierType: value as any})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select supplier type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paints">Paints</SelectItem>
                    <SelectItem value="canvas">Canvas</SelectItem>
                    <SelectItem value="frames">Frames</SelectItem>
                    <SelectItem value="brushes">Brushes</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentTerms" className="text-right">Payment</Label>
                <Input
                  id="paymentTerms"
                  value={newSupplier.paymentTerms || ''}
                  onChange={(e) => setNewSupplier({...newSupplier, paymentTerms: e.target.value})}
                  className="col-span-3"
                  placeholder="e.g., Net 30"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplierNotes" className="text-right">Notes</Label>
                <Textarea
                  id="supplierNotes"
                  value={newSupplier.notes || ''}
                  onChange={(e) => setNewSupplier({...newSupplier, notes: e.target.value})}
                  className="col-span-3"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleAddSupplier}>Add Supplier</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search suppliers..."
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
            <SelectItem value="paints">Paints</SelectItem>
            <SelectItem value="canvas">Canvas</SelectItem>
            <SelectItem value="frames">Frames</SelectItem>
            <SelectItem value="brushes">Brushes</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Supplier Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start space-x-3">
                <Avatar>
                  <AvatarFallback>{getInitials(supplier.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{supplier.name}</CardTitle>
                  <CardDescription className="flex items-center space-x-1">
                    <span className="truncate">{supplier.contactPerson}</span>
                  </CardDescription>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getSupplierTypeColor(supplier.supplierType)}>
                      {supplier.supplierType}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {renderStars(supplier.rating)}
                      <span className="text-sm text-gray-500">({supplier.rating})</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-3 w-3" />
                <span className="truncate">{supplier.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-3 w-3" />
                <span>{supplier.phone}</span>
              </div>
              {supplier.address && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{supplier.address}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">${supplier.totalSpent.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Total Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{supplier.totalOrders}</div>
                  <div className="text-xs text-gray-500">Orders</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-3 w-3" />
                <span>Payment: {supplier.paymentTerms}</span>
              </div>

              {supplier.lastOrder && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>Last order: {new Date(supplier.lastOrder).toLocaleDateString()}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {supplier.products.slice(0, 3).map((product, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {product}
                  </Badge>
                ))}
                {supplier.products.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{supplier.products.length - 3} more
                  </Badge>
                )}
              </div>

              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedSupplier(supplier);
                    setIsViewDialogOpen(true);
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Supplier Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedSupplier && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(selectedSupplier.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{selectedSupplier.name}</div>
                    <div className="text-sm text-gray-500">{selectedSupplier.contactPerson}</div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Contact Info */}
                <div>
                  <h4 className="font-medium mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedSupplier.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedSupplier.phone}</span>
                    </div>
                    {selectedSupplier.address && (
                      <div className="col-span-2 flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span>{selectedSupplier.address}</span>
                      </div>
                    )}
                    {selectedSupplier.website && (
                      <div className="col-span-2 flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <a href={selectedSupplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {selectedSupplier.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <h4 className="font-medium mb-3">Business Statistics</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-semibold text-green-600">${selectedSupplier.totalSpent.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Total Spent</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-semibold">{selectedSupplier.totalOrders}</div>
                      <div className="text-sm text-gray-500">Total Orders</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-center space-x-1 mb-1">
                        {renderStars(selectedSupplier.rating)}
                      </div>
                      <div className="text-sm text-gray-500">Rating</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-semibold">{selectedSupplier.paymentTerms}</div>
                      <div className="text-sm text-gray-500">Payment Terms</div>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h4 className="font-medium mb-3">Products Supplied</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSupplier.products.map((product, index) => (
                      <Badge key={index} variant="outline">{product}</Badge>
                    ))}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div>
                  <h4 className="font-medium mb-3">Recent Transactions</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedSupplier.recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(transaction.status)}
                          <div className="font-semibold text-green-600">${transaction.amount}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedSupplier.notes && (
                  <div>
                    <h4 className="font-medium mb-3">Notes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedSupplier.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}