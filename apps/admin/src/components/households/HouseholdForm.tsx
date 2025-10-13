'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Property {
  id: string;
  address: string;
  phase: string | null;
  block: string | null;
  lot: string | null;
  status: string;
}

interface HouseholdFormData {
  property_id: string;
  ownership_type: 'owner' | 'renter';
  move_in_date: string;
  sticker_allocation: number;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  phone_number: string;
}

interface HouseholdFormProps {
  onSubmit: (data: HouseholdFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function HouseholdForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: HouseholdFormProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<HouseholdFormData>({
    property_id: '',
    ownership_type: 'owner',
    move_in_date: new Date().toISOString().split('T')[0],
    sticker_allocation: 3,
    email: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    phone_number: '',
  });

  // Load available properties (vacant only)
  useEffect(() => {
    async function loadProperties() {
      try {
        setLoadingProperties(true);
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from('properties')
          .select('id, address, phase, block, lot, status')
          .eq('status', 'vacant')
          .order('address', { ascending: true });

        if (fetchError) {
          setError(`Failed to load properties: ${fetchError.message}`);
          return;
        }

        setProperties(data || []);
      } catch (err) {
        console.error('Error loading properties:', err);
        setError('Unexpected error loading properties');
      } finally {
        setLoadingProperties(false);
      }
    }

    loadProperties();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!formData.property_id) {
      setError('Please select a property');
      return;
    }

    if (!formData.email || !formData.first_name || !formData.last_name) {
      setError('Please fill in all required household head fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create household');
    }
  };

  const handleInputChange = (field: keyof HouseholdFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loadingProperties) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2 text-muted-foreground">Loading properties...</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="py-12 text-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No vacant properties available. All properties are currently occupied or under
            construction.
          </AlertDescription>
        </Alert>
        <Button onClick={onCancel} className="mt-4" variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Property Selection */}
      <div className="space-y-2">
        <Label htmlFor="property_id" className="required">
          Property *
        </Label>
        <Select
          value={formData.property_id}
          onValueChange={(value) => handleInputChange('property_id', value)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="property_id">
            <SelectValue placeholder="Select a property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.address}
                {property.phase && ` - Phase ${property.phase}`}
                {property.block && `, Block ${property.block}`}
                {property.lot && `, Lot ${property.lot}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {properties.length} vacant {properties.length === 1 ? 'property' : 'properties'}{' '}
          available
        </p>
      </div>

      {/* Ownership Type */}
      <div className="space-y-2">
        <Label htmlFor="ownership_type">Ownership Type *</Label>
        <Select
          value={formData.ownership_type}
          onValueChange={(value) =>
            handleInputChange('ownership_type', value as 'owner' | 'renter')
          }
          disabled={isSubmitting}
        >
          <SelectTrigger id="ownership_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="renter">Renter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Move-in Date */}
      <div className="space-y-2">
        <Label htmlFor="move_in_date">Move-in Date</Label>
        <Input
          id="move_in_date"
          type="date"
          value={formData.move_in_date}
          onChange={(e) => handleInputChange('move_in_date', e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {/* Sticker Allocation */}
      <div className="space-y-2">
        <Label htmlFor="sticker_allocation">Vehicle Sticker Allocation *</Label>
        <Input
          id="sticker_allocation"
          type="number"
          min="1"
          max="10"
          value={formData.sticker_allocation}
          onChange={(e) => handleInputChange('sticker_allocation', parseInt(e.target.value))}
          disabled={isSubmitting}
        />
        <p className="text-sm text-muted-foreground">
          Maximum number of vehicle stickers this household can request (typically 3-5)
        </p>
      </div>

      <hr className="my-6" />

      {/* Household Head Information */}
      <div>
        <h3 className="text-lg font-medium mb-4">Household Head Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="middle_name"
                value={formData.middle_name}
                onChange={(e) => handleInputChange('middle_name', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isSubmitting}
              required
            />
            <p className="text-sm text-muted-foreground">
              This will be used for login credentials and notifications
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              disabled={isSubmitting}
              placeholder="+63 XXX XXX XXXX"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Creating Household...' : 'Create Household'}
        </Button>
      </div>
    </form>
  );
}
