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
  Users,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  address?: string;
  clientType: 'residential' | 'commercial' | 'industrial' | 'government' | 'gallery';
  preferences: string[];
  totalSpent: number;
  lastPurchase?: string;
  dateAdded: string;
  notes?: string;
  purchaseHistory: Array<{
    id: string;
    date: string;
    amount: number;
    items: string;
  }>;
}

export function ClientsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    preferences: []
  });

  useEffect(() => {
    // Mock data - in real implementation, fetch from Supabase
    setClients([
      {
        id: '1',
        name: 'Sarah Johnson',
        company: 'Modern Interiors Design',
        email: 'sarah@moderninteriors.com',
        phone: '+1 (555) 123-4567',
        address: '123 Design St, Art District, NY 10001',
        clientType: 'commercial',
        preferences: ['buying art', 'commissions'],
        totalSpent: 3450,
        lastPurchase: '2024-09-15',
        dateAdded: '2024-01-15',
        notes: 'Prefers contemporary pieces. Good repeat customer.',
        purchaseHistory: [
          { id: '1', date: '2024-09-15', amount: 850, items: 'Sunset Landscape painting' },
          { id: '2', date: '2024-07-22', amount: 1200, items: 'Custom portrait commission' },
          { id: '3', date: '2024-05-10', amount: 1400, items: 'Abstract series (3 pieces)' }
        ]
      },
      {
        id: '2',
        name: 'David Chen',
        email: 'david.chen@email.com',
        phone: '+1 (555) 987-6543',
        address: '456 Oak Avenue, Suburbia, CA 90210',
        clientType: 'residential',
        preferences: ['buying paints', 'art supplies'],
        totalSpent: 1280,
        lastPurchase: '2024-09-18',
        dateAdded: '2024-03-08',
        notes: 'Professional artist, bulk buyer of premium paints.',
        purchaseHistory: [
          { id: '1', date: '2024-09-18', amount: 320, items: 'Winsor & Newton oil paints set' },
          { id: '2', date: '2024-08-05', amount: 580, items: 'Canvas and brushes bulk order' },
          { id: '3', date: '2024-06-12', amount: 380, items: 'Acrylic paint supplies' }
        ]
      },
      {
        id: '3',
        name: 'Maria Rodriguez',
        company: 'Aurora Gallery',
        email: 'maria@auroragallery.com',
        phone: '+1 (555) 456-7890',
        address: '789 Gallery Row, Arts Quarter, FL 33101',
        clientType: 'gallery',
        preferences: ['buying art', 'consignment'],
        totalSpent: 5670,
        lastPurchase: '2024-09-10',
        dateAdded: '2023-11-20',
        notes: 'Gallery owner, interested in consignment arrangements.',
        purchaseHistory: [
          { id: '1', date: '2024-09-10', amount: 2200, items: 'Landscape series (4 paintings)' },
          { id: '2', date: '2024-06-15', amount: 1800, items: 'Portrait collection' },
          { id: '3', date: '2024-02-28', amount: 1670, items: 'Abstract works' }
        ]
      }
    ]);
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || client.clientType === selectedType;
    return matchesSearch && matchesType;
  });

  const handleAddClient = () => {
    if (newClient.name && newClient.email) {
      const client: Client = {
        id: Date.now().toString(),
        name: newClient.name,
        company: newClient.company,
        email: newClient.email,
        phone: newClient.phone || '',
        address: newClient.address,
        clientType: (newClient.clientType as any) || 'residential',
        preferences: newClient.preferences || [],
        totalSpent: 0,
        dateAdded: new Date().toISOString().split('T')[0],
        notes: newClient.notes,
        purchaseHistory: []
      };
      setClients([...clients, client]);
      setNewClient({ preferences: [] });
      setIsAddDialogOpen(false);
    }
  };

  const getClientTypeColor = (type: string) => {
    const colors = {
      residential: 'bg-blue-100 text-blue-800',
      commercial: 'bg-green-100 text-green-800',
      industrial: 'bg-purple-100 text-purple-800',
      government: 'bg-orange-100 text-orange-800',
      gallery: 'bg-pink-100 text-pink-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900">Client Management</h2>
          <p className="text-gray-600">Manage your customers and track their purchase history</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Enter the client's information to add them to your CRM.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientName" className="text-right">Name</Label>
                <Input
                  id="clientName"
                  value={newClient.name || ''}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company" className="text-right">Company</Label>
                <Input
                  id="company"
                  value={newClient.company || ''}
                  onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                  className="col-span-3"
                  placeholder="Optional"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientEmail" className="text-right">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={newClient.email || ''}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientPhone" className="text-right">Phone</Label>
                <Input
                  id="clientPhone"
                  value={newClient.phone || ''}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientType" className="text-right">Type</Label>
                <Select value={newClient.clientType} onValueChange={(value) => setNewClient({...newClient, clientType: value as any})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select client type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="gallery">Gallery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientNotes" className="text-right">Notes</Label>
                <Textarea
                  id="clientNotes"
                  value={newClient.notes || ''}
                  onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                  className="col-span-3"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleAddClient}>Add Client</Button>
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
              placeholder="Search clients by name, company, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 border-gray-200 focus:border-blue-500"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48 bg-white/80 border-gray-200">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="government">Government</SelectItem>
              <SelectItem value="gallery">Gallery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Client Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-start space-x-3">
                <Avatar>
                  <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{client.name}</CardTitle>
                  {client.company && (
                    <CardDescription className="flex items-center space-x-1">
                      <Building className="h-3 w-3" />
                      <span className="truncate">{client.company}</span>
                    </CardDescription>
                  )}
                  <div className="mt-2">
                    <Badge className={getClientTypeColor(client.clientType)}>
                      {client.clientType}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-3 w-3" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-3 w-3" />
                <span>{client.phone}</span>
              </div>
              {client.address && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{client.address}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">${client.totalSpent.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Total Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{client.purchaseHistory.length}</div>
                  <div className="text-xs text-gray-500">Orders</div>
                </div>
              </div>

              {client.lastPurchase && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>Last purchase: {new Date(client.lastPurchase).toLocaleDateString()}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {client.preferences.map((pref, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {pref}
                  </Badge>
                ))}
              </div>

              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedClient(client);
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

      {/* Client Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(selectedClient.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{selectedClient.name}</div>
                    {selectedClient.company && (
                      <div className="text-sm text-gray-500">{selectedClient.company}</div>
                    )}
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
                      <span>{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedClient.phone}</span>
                    </div>
                    {selectedClient.address && (
                      <div className="col-span-2 flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span>{selectedClient.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <h4 className="font-medium mb-3">Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-semibold text-green-600">${selectedClient.totalSpent.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Total Spent</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-semibold">{selectedClient.purchaseHistory.length}</div>
                      <div className="text-sm text-gray-500">Total Orders</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-semibold">
                        {selectedClient.purchaseHistory.length > 0 
                          ? `$${(selectedClient.totalSpent / selectedClient.purchaseHistory.length).toFixed(0)}`
                          : '$0'
                        }
                      </div>
                      <div className="text-sm text-gray-500">Avg Order</div>
                    </div>
                  </div>
                </div>

                {/* Purchase History */}
                <div>
                  <h4 className="font-medium mb-3">Recent Purchases</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedClient.purchaseHistory.map((purchase) => (
                      <div key={purchase.id} className="flex justify-between items-start p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{purchase.items}</div>
                          <div className="text-sm text-gray-500">{new Date(purchase.date).toLocaleDateString()}</div>
                        </div>
                        <div className="font-semibold text-green-600">${purchase.amount}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedClient.notes && (
                  <div>
                    <h4 className="font-medium mb-3">Notes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedClient.notes}</p>
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