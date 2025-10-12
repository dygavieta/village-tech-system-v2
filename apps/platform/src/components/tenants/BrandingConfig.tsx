'use client';

/**
 * Branding Configuration Component (T070)
 *
 * Logo upload to Supabase Storage, color scheme picker
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createBrowserClient } from '@/lib/supabase/client';
import { Upload, Loader2, CheckCircle2, AlertCircle, Palette, Image as ImageIcon } from 'lucide-react';

const brandingSchema = z.object({
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #1a73e8)'),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

interface BrandingConfigProps {
  tenantId: string;
  currentBranding?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  onUpdate?: () => void;
}

export function BrandingConfig({ tenantId, currentBranding, onUpdate }: BrandingConfigProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentBranding?.logo_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const supabase = createBrowserClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primary_color: currentBranding?.primary_color || '#1a73e8',
      secondary_color: currentBranding?.secondary_color || '#34a853',
    },
  });

  const primaryColor = watch('primary_color');
  const secondaryColor = watch('secondary_color');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (PNG, JPG, SVG)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Logo must be less than 2MB');
      return;
    }

    setLogoFile(file);
    setUploadError(null);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return logoPreview;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Generate unique filename
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${tenantId}/logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('tenant-assets')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('tenant-assets')
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload logo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: BrandingFormData) => {
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // Upload logo if changed
      let logoUrl = logoPreview;
      if (logoFile) {
        logoUrl = await uploadLogo();
        if (!logoUrl) return; // Upload failed
      }

      // Update branding config in database
      const brandingConfig = {
        logo_url: logoUrl,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color || null,
      };

      const { error } = await supabase
        .from('tenants')
        .update({ branding_config: brandingConfig })
        .eq('id', tenantId);

      if (error) throw error;

      setUploadSuccess(true);
      setLogoFile(null);

      if (onUpdate) {
        onUpdate();
      }

      // Reset success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error: any) {
      setUploadError(error.message || 'Failed to update branding');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Community Logo
          </CardTitle>
          <CardDescription>
            Upload a logo for this community. Recommended size: 200x200px. Max 2MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview */}
          {logoPreview && (
            <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="max-h-32 w-auto rounded"
              />
            </div>
          )}

          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="logo">Upload Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: PNG, JPG, SVG (max 2MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Scheme
          </CardTitle>
          <CardDescription>
            Customize the color scheme for this community's admin portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Color */}
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-lg border-2 border-muted shadow-sm"
                style={{ backgroundColor: primaryColor }}
              />
              <div className="flex-1 space-y-1">
                <Input
                  id="primary_color"
                  type="text"
                  placeholder="#1a73e8"
                  {...register('primary_color')}
                />
                {errors.primary_color && (
                  <p className="text-sm text-red-500">{errors.primary_color.message}</p>
                )}
              </div>
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => {
                  const input = document.getElementById('primary_color') as HTMLInputElement;
                  if (input) input.value = e.target.value;
                  input?.dispatchEvent(new Event('input', { bubbles: true }));
                }}
                className="w-16 h-12 cursor-pointer"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Main color for buttons, headers, and key UI elements
            </p>
          </div>

          {/* Secondary Color */}
          <div className="space-y-2">
            <Label htmlFor="secondary_color">Secondary Color (Optional)</Label>
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-lg border-2 border-muted shadow-sm"
                style={{ backgroundColor: secondaryColor || '#e8eaed' }}
              />
              <div className="flex-1 space-y-1">
                <Input
                  id="secondary_color"
                  type="text"
                  placeholder="#34a853"
                  {...register('secondary_color')}
                />
                {errors.secondary_color && (
                  <p className="text-sm text-red-500">{errors.secondary_color.message}</p>
                )}
              </div>
              <Input
                type="color"
                value={secondaryColor || '#e8eaed'}
                onChange={(e) => {
                  const input = document.getElementById('secondary_color') as HTMLInputElement;
                  if (input) input.value = e.target.value;
                  input?.dispatchEvent(new Event('input', { bubbles: true }));
                }}
                className="w-16 h-12 cursor-pointer"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Accent color for secondary actions and highlights
            </p>
          </div>

          {/* Color Preview */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">Preview</p>
            <div className="flex gap-2">
              <Button
                type="button"
                style={{ backgroundColor: primaryColor, color: 'white' }}
                className="hover:opacity-90"
              >
                Primary Button
              </Button>
              {secondaryColor && (
                <Button
                  type="button"
                  variant="outline"
                  style={{
                    borderColor: secondaryColor,
                    color: secondaryColor,
                  }}
                >
                  Secondary Button
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {uploadSuccess && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Branding updated successfully!</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t">
        <Button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="min-w-[120px]"
        >
          {isSubmitting || isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Save Branding
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
