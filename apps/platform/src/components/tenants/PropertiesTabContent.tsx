/**
 * Properties Tab Content Component
 *
 * Displays, adds, edits, and deletes properties for a tenant
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  MapPin,
  Home,
  Bed,
  Bath,
  Car,
  Square,
  Filter,
  Upload,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PropertyImportForm } from './PropertyImportForm';
import { downloadPropertyTemplate } from '@/lib/utils/csv-parser';

interface Property {
  id: string;
  address: string;
  phase?: string;
  block?: string;
  lot?: string;
  unit?: string;
  property_type: 'single_family' | 'townhouse' | 'condo' | 'lot_only';
  property_size_sqm?: number;
  lot_size_sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_slots?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PropertiesTabContentProps {
  tenantId: string;
  tenantTotalResidences: number;
}

const propertyTypes = {
  single_family: 'Single Family',
  townhouse: 'Townhouse',
  condo: 'Condominium',
  lot_only: 'Lot Only',
};

const statusColors = {
  vacant: 'bg-green-100 text-green-800 border-green-200',
  occupied: 'bg-blue-100 text-blue-800 border-blue-200',
  reserved: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
};

export function PropertiesTabContent({ tenantId, tenantTotalResidences }: PropertiesTabContentProps) {
  console.log('Component rendered for tenant:', tenantId);
  const router = useRouter();
  const { toast } = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProperties, setTotalProperties] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [csvProperties, setCsvProperties] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    address: '',
    phase: '',
    block: '',
    lot: '',
    unit: '',
    property_type: 'single_family' as const,
    property_size_sqm: '',
    lot_size_sqm: '',
    bedrooms: '',
    bathrooms: '',
    parking_slots: '',
    status: 'vacant',
  });

  const fetchProperties = async (resetToFirstPage = false) => {
    try {
      setLoading(true);
      const page = resetToFirstPage ? 1 : currentPage;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (search) params.append('search', search);
      if (propertyTypeFilter && propertyTypeFilter !== 'all') params.append('propertyType', propertyTypeFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      console.log('Fetching properties with params:', params.toString());
      const response = await fetch(`/api/tenants/${tenantId}/properties?${params}`);
      const data = await response.json();

      console.log('Full API response:', data);

      if (response.ok) {
        console.log('About to set properties:', data.properties);
        // Use setTimeout to avoid React batching issues
        setTimeout(() => {
          setProperties(data.properties);
          setTotalPages(data.pagination.totalPages);
          setTotalProperties(data.pagination.total);
          if (resetToFirstPage && currentPage !== 1) {
            setCurrentPage(1);
          }
          // Force a re-render by incrementing the refresh key
          setRefreshKey(prev => prev + 1);
          console.log('Fetched properties:', data.properties.length, 'total:', data.pagination.total);
          console.log('Properties array updated. New length:', data.properties.length);
        }, 0);
      } else {
        console.error('API error:', data);
        toast({
          title: 'Error',
          description: 'Failed to fetch properties',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch properties',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [currentPage, search, propertyTypeFilter, statusFilter, tenantId]);

  const handleAddProperty = async () => {
    console.log('handleAddProperty called');
    try {
      const payload = {
        ...formData,
        property_size_sqm: formData.property_size_sqm ? Number(formData.property_size_sqm) : undefined,
        lot_size_sqm: formData.lot_size_sqm ? Number(formData.lot_size_sqm) : undefined,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        parking_slots: formData.parking_slots ? Number(formData.parking_slots) : undefined,
      };

      console.log('Sending payload:', payload);
      const response = await fetch(`/api/tenants/${tenantId}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Property added successfully',
        });
        setIsAddDialogOpen(false);
        resetForm();
        console.log('About to fetchProperties(true)');
        await fetchProperties(true);
        router.refresh();
      } else {
        console.error('API error:', responseData);
        toast({
          title: 'Error',
          description: responseData.error || 'Failed to add property',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding property:', error);
      toast({
        title: 'Error',
        description: 'Failed to add property',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateProperty = async () => {
    if (!selectedProperty) return;

    try {
      const payload = {
        ...formData,
        property_size_sqm: formData.property_size_sqm ? Number(formData.property_size_sqm) : undefined,
        lot_size_sqm: formData.lot_size_sqm ? Number(formData.lot_size_sqm) : undefined,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        parking_slots: formData.parking_slots ? Number(formData.parking_slots) : undefined,
      };

      const response = await fetch(`/api/tenants/${tenantId}/properties/${selectedProperty.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Property updated successfully',
        });
        setIsEditDialogOpen(false);
        setSelectedProperty(null);
        resetForm();
        fetchProperties(true);
        router.refresh();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update property',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating property:', error);
      toast({
        title: 'Error',
        description: 'Failed to update property',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProperty = async () => {
    if (!selectedProperty) return;

    console.log('handleDeleteProperty called for property:', selectedProperty.id);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/properties/${selectedProperty.id}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);
      const responseData = await response.json();
      console.log('Delete response data:', responseData);

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Property deleted successfully',
        });
        setIsDeleteDialogOpen(false);
        setSelectedProperty(null);
        console.log('About to fetchProperties(true) after delete');
        await fetchProperties(true);
        router.refresh();
      } else {
        console.error('Delete API error:', responseData);
        toast({
          title: 'Error',
          description: responseData.error || 'Failed to delete property',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete property',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      address: '',
      phase: '',
      block: '',
      lot: '',
      unit: '',
      property_type: 'single_family',
      property_size_sqm: '',
      lot_size_sqm: '',
      bedrooms: '',
      bathrooms: '',
      parking_slots: '',
      status: 'vacant',
    });
  };

  const openEditDialog = (property: Property) => {
    setSelectedProperty(property);
    setFormData({
      address: property.address,
      phase: property.phase || '',
      block: property.block || '',
      lot: property.lot || '',
      unit: property.unit || '',
      property_type: property.property_type,
      property_size_sqm: property.property_size_sqm?.toString() || '',
      lot_size_sqm: property.lot_size_sqm?.toString() || '',
      bedrooms: property.bedrooms?.toString() || '',
      bathrooms: property.bathrooms?.toString() || '',
      parking_slots: property.parking_slots?.toString() || '',
      status: property.status,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (property: Property) => {
    setSelectedProperty(property);
    setIsDeleteDialogOpen(true);
  };

  const handleCSVImport = async (properties: any[]) => {
    if (properties.length === 0) {
      setIsImportDialogOpen(false);
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/properties/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: `Successfully imported ${result.insertedCount} properties`,
        });
        setIsImportDialogOpen(false);
        setCsvProperties([]);
        fetchProperties(true);
        router.refresh();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to import properties',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error importing properties:', error);
      toast({
        title: 'Error',
        description: 'Failed to import properties',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Properties</h3>
            <p className="text-sm text-muted-foreground">
              Manage residential properties for this community
            </p>
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Properties</h3>
          <p className="text-sm text-muted-foreground">
            {totalProperties} of {tenantTotalResidences} total residences
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Properties from CSV</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to bulk import properties. You can download a template to get started.
                </DialogDescription>
              </DialogHeader>
              <PropertyImportForm
                onSubmit={handleCSVImport}
                isImporting={isImporting}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Property</DialogTitle>
                <DialogDescription>
                  Add a new residential property to this community
                </DialogDescription>
              </DialogHeader>
              <PropertyForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddProperty}
                onCancel={() => setIsAddDialogOpen(false)}
                isEdit={false}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(propertyTypes).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="vacant">Vacant</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Properties Table */}
      <Card key={refreshKey}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Building2 className="h-8 w-8" />
                      <p>No properties found</p>
                      <p className="text-sm">Add your first property to get started</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{property.address}</div>
                        {property.phase && (
                          <div className="text-sm text-muted-foreground">
                            Phase: {property.phase}
                          </div>
                        )}
                        {property.block && property.lot && (
                          <div className="text-sm text-muted-foreground">
                            Block: {property.block}, Lot: {property.lot}
                          </div>
                        )}
                        {property.unit && (
                          <div className="text-sm text-muted-foreground">
                            Unit: {property.unit}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {propertyTypes[property.property_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {property.bedrooms && (
                          <span className="flex items-center gap-1">
                            <Bed className="h-3 w-3" />
                            {property.bedrooms} beds
                          </span>
                        )}
                        {property.bathrooms && (
                          <span className="flex items-center gap-1">
                            <Bath className="h-3 w-3" />
                            {property.bathrooms} baths
                          </span>
                        )}
                        {property.parking_slots && (
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {property.parking_slots} parking
                          </span>
                        )}
                        {property.property_size_sqm && (
                          <span className="flex items-center gap-1">
                            <Square className="h-3 w-3" />
                            {property.property_size_sqm}m²
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[property.status as keyof typeof statusColors]}
                      >
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(property)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(property)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {properties.length} of {totalProperties} properties
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update property details for {selectedProperty?.address}
            </DialogDescription>
          </DialogHeader>
          <PropertyForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateProperty}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setSelectedProperty(null);
              resetForm();
            }}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProperty?.address}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProperty}>
              Delete Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PropertyFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}

function PropertyForm({ formData, setFormData, onSubmit, onCancel, isEdit = false }: PropertyFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Textarea
            id="address"
            placeholder="Enter property address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="property_type">Property Type *</Label>
          <Select
            value={formData.property_type}
            onValueChange={(value) => setFormData({ ...formData, property_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(propertyTypes).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phase">Phase</Label>
          <Input
            id="phase"
            placeholder="e.g., Phase 1"
            value={formData.phase}
            onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="block">Block</Label>
          <Input
            id="block"
            placeholder="e.g., A"
            value={formData.block}
            onChange={(e) => setFormData({ ...formData, block: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lot">Lot</Label>
          <Input
            id="lot"
            placeholder="e.g., 12"
            value={formData.lot}
            onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            placeholder="e.g., 101"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input
            id="bedrooms"
            type="number"
            placeholder="Number of bedrooms"
            value={formData.bedrooms}
            onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            type="number"
            placeholder="Number of bathrooms"
            value={formData.bathrooms}
            onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parking_slots">Parking Slots</Label>
          <Input
            id="parking_slots"
            type="number"
            placeholder="Number of parking slots"
            value={formData.parking_slots}
            onChange={(e) => setFormData({ ...formData, parking_slots: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="property_size_sqm">Property Size (m²)</Label>
          <Input
            id="property_size_sqm"
            type="number"
            placeholder="Living area size"
            value={formData.property_size_sqm}
            onChange={(e) => setFormData({ ...formData, property_size_sqm: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lot_size_sqm">Lot Size (m²)</Label>
          <Input
            id="lot_size_sqm"
            type="number"
            placeholder="Total lot size"
            value={formData.lot_size_sqm}
            onChange={(e) => setFormData({ ...formData, lot_size_sqm: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vacant">Vacant</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? 'Update Property' : 'Add Property'}
        </Button>
      </DialogFooter>
    </div>
  );
}