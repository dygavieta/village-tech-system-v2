'use client';

/**
 * Tenant Branding Form Component
 *
 * Form for managing tenant branding (logo, colors, theme)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Palette } from 'lucide-react';
import Image from 'next/image';

interface Tenant {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  branding_config: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
  } | null;
}

interface TenantBrandingFormProps {
  tenant: Tenant;
}

export function TenantBrandingForm({ tenant }: TenantBrandingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    tenant.branding_config?.logo_url || tenant.logo_url || null
  );

  const [formData, setFormData] = useState({
    primary_color: tenant.branding_config?.primary_color || tenant.primary_color || '#000000',
    secondary_color: tenant.branding_config?.secondary_color || '#666666',
    accent_color: tenant.branding_config?.accent_color || '#0066cc',
  });

  const handleColorChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, SVG)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return logoPreview;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      formData.append('tenant_id', tenant.id);

      const response = await fetch('/api/tenants/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload logo');
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload logo',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload logo if a new file was selected
      let logoUrl = logoPreview;
      if (logoFile) {
        logoUrl = await uploadLogo();
        if (!logoUrl) {
          setIsSubmitting(false);
          return;
        }
      }

      // Update branding configuration
      const response = await fetch(`/api/tenants/${tenant.id}/branding`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logo_url: logoUrl,
          primary_color: formData.primary_color,
          branding_config: {
            logo_url: logoUrl,
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
            accent_color: formData.accent_color,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update branding');
      }

      toast({
        title: 'Success',
        description: 'Branding configuration updated successfully',
      });

      router.push(`/tenants/${tenant.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating branding:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update branding',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo Upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Community Logo</h3>

        <div className="space-y-4">
          {logoPreview ? (
            <div className="relative w-48 h-48 border-2 border-dashed rounded-lg p-4 flex items-center justify-center">
              <Image
                src={logoPreview}
                alt="Logo preview"
                width={160}
                height={160}
                className="object-contain"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveLogo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload community logo (PNG, JPG, SVG - max 2MB)
              </p>
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <Button type="button" variant="outline" asChild>
                  <span>Choose File</span>
                </Button>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Color Scheme */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Color Scheme
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                type="color"
                value={formData.primary_color}
                onChange={(e) => handleColorChange('primary_color', e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.primary_color}
                onChange={(e) => handleColorChange('primary_color', e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
            <div
              className="h-12 w-full rounded border"
              style={{ backgroundColor: formData.primary_color }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondary_color"
                type="color"
                value={formData.secondary_color}
                onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.secondary_color}
                onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                placeholder="#666666"
                className="flex-1"
              />
            </div>
            <div
              className="h-12 w-full rounded border"
              style={{ backgroundColor: formData.secondary_color }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accent_color">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="accent_color"
                type="color"
                value={formData.accent_color}
                onChange={(e) => handleColorChange('accent_color', e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.accent_color}
                onChange={(e) => handleColorChange('accent_color', e.target.value)}
                placeholder="#0066cc"
                className="flex-1"
              />
            </div>
            <div
              className="h-12 w-full rounded border"
              style={{ backgroundColor: formData.accent_color }}
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="border rounded-lg p-6" style={{ backgroundColor: formData.primary_color }}>
          {logoPreview && (
            <div className="bg-white rounded p-4 inline-block mb-4">
              <Image
                src={logoPreview}
                alt="Logo preview"
                width={120}
                height={120}
                className="object-contain"
              />
            </div>
          )}
          <div className="space-y-2">
            <div
              className="h-10 rounded"
              style={{ backgroundColor: formData.secondary_color }}
            />
            <div
              className="h-10 rounded w-2/3"
              style={{ backgroundColor: formData.accent_color }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button type="submit" disabled={isSubmitting || isUploading}>
          {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUploading ? 'Uploading...' : 'Save Branding'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting || isUploading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
