'use client';

/**
 * Tenant Edit Form Component
 *
 * Form for editing tenant basic information and settings
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  legal_name: string | null;
  subdomain: string;
  community_type: string;
  total_residences: number;
  year_established: number | null;
  timezone: string;
  language: string;
  max_residences: number;
  max_admin_users: number;
  max_security_users: number;
  storage_quota_gb: number;
  status: string;
}

interface TenantEditFormProps {
  tenant: Tenant;
}

export function TenantEditForm({ tenant }: TenantEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: tenant.name,
    legal_name: tenant.legal_name || '',
    community_type: tenant.community_type,
    year_established: tenant.year_established?.toString() || '',
    timezone: tenant.timezone,
    language: tenant.language,
    max_residences: tenant.max_residences.toString(),
    max_admin_users: tenant.max_admin_users.toString(),
    max_security_users: tenant.max_security_users.toString(),
    storage_quota_gb: tenant.storage_quota_gb.toString(),
    status: tenant.status,
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          legal_name: formData.legal_name || null,
          community_type: formData.community_type,
          year_established: formData.year_established ? parseInt(formData.year_established) : null,
          timezone: formData.timezone,
          language: formData.language,
          max_residences: parseInt(formData.max_residences),
          max_admin_users: parseInt(formData.max_admin_users),
          max_security_users: parseInt(formData.max_security_users),
          storage_quota_gb: parseInt(formData.storage_quota_gb),
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update tenant');
      }

      toast({
        title: 'Success',
        description: 'Tenant settings updated successfully',
      });

      router.push(`/tenants/${tenant.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update tenant settings',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Community Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="legal_name">Legal Name</Label>
            <Input
              id="legal_name"
              value={formData.legal_name}
              onChange={(e) => handleChange('legal_name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <Input
              id="subdomain"
              value={tenant.subdomain}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Subdomain cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="community_type">Community Type *</Label>
            <Select value={formData.community_type} onValueChange={(value) => handleChange('community_type', value)}>
              <SelectTrigger id="community_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOA">HOA</SelectItem>
                <SelectItem value="Condo">Condo</SelectItem>
                <SelectItem value="Gated Village">Gated Village</SelectItem>
                <SelectItem value="Subdivision">Subdivision</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year_established">Year Established</Label>
            <Input
              id="year_established"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.year_established}
              onChange={(e) => handleChange('year_established', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="setup">Setup</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Localization */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Localization</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={formData.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              placeholder="UTC"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={formData.language} onValueChange={(value) => handleChange('language', value)}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="tl">Tagalog</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* System Capacity */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">System Capacity</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="max_residences">Max Residences *</Label>
            <Input
              id="max_residences"
              type="number"
              min="1"
              value={formData.max_residences}
              onChange={(e) => handleChange('max_residences', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Current: {tenant.total_residences}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_admin_users">Max Admin Users *</Label>
            <Input
              id="max_admin_users"
              type="number"
              min="1"
              value={formData.max_admin_users}
              onChange={(e) => handleChange('max_admin_users', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_security_users">Max Security Users *</Label>
            <Input
              id="max_security_users"
              type="number"
              min="1"
              value={formData.max_security_users}
              onChange={(e) => handleChange('max_security_users', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage_quota_gb">Storage Quota (GB) *</Label>
            <Input
              id="storage_quota_gb"
              type="number"
              min="1"
              value={formData.storage_quota_gb}
              onChange={(e) => handleChange('storage_quota_gb', e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
