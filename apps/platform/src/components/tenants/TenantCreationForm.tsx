'use client';

/**
 * Tenant Creation Form Component (T061)
 *
 * Step 1: Basic tenant information
 * - Tenant name and legal name
 * - Subdomain (with real-time validation)
 * - Community type
 * - Max residences and subscription limits
 * - Year established, timezone, language
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateSubdomain } from '@/lib/actions/create-tenant';
import { CreateTenantInput } from '@/lib/actions/create-tenant';

const tenantInfoSchema = z.object({
  name: z.string().min(3, 'Tenant name must be at least 3 characters'),
  legal_name: z.string().optional(),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must be 63 characters or less')
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Subdomain must start and end with alphanumeric characters and can only contain lowercase letters, numbers, and hyphens'),
  community_type: z.enum(['HOA', 'Condo', 'Gated Village', 'Subdivision']),
  year_established: z.number().min(1900).max(new Date().getFullYear()).optional().or(z.literal('')),
  max_residences: z.number().min(1, 'Must have at least 1 residence'),
  max_admin_users: z.number().min(1).optional(),
  max_security_users: z.number().min(1).optional(),
  storage_quota_gb: z.number().min(1).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

type TenantInfoFormData = z.infer<typeof tenantInfoSchema>;

interface TenantCreationFormProps {
  initialData?: Partial<CreateTenantInput>;
  onSubmit: (data: Partial<CreateTenantInput>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function TenantCreationForm({ initialData, onSubmit, onValidationChange }: TenantCreationFormProps) {
  const [isValidatingSubdomain, setIsValidatingSubdomain] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'available' | 'taken'>('idle');
  const [subdomainError, setSubdomainError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<TenantInfoFormData>({
    resolver: zodResolver(tenantInfoSchema),
    mode: 'onChange',
    defaultValues: {
      name: initialData?.name || '',
      legal_name: initialData?.legal_name || '',
      subdomain: initialData?.subdomain || '',
      community_type: initialData?.community_type || 'HOA',
      year_established: initialData?.year_established || undefined,
      max_residences: initialData?.max_residences || 100,
      max_admin_users: initialData?.max_admin_users || 10,
      max_security_users: initialData?.max_security_users || 20,
      storage_quota_gb: initialData?.storage_quota_gb || 10,
      timezone: initialData?.timezone || 'UTC',
      language: initialData?.language || 'en',
    },
  });

  const subdomain = watch('subdomain');
  const name = watch('name');

  // Notify parent about validation state changes
  useEffect(() => {
    const isFormValid = isValid && subdomainStatus === 'available' && !isValidatingSubdomain;
    onValidationChange?.(isFormValid);
  }, [isValid, subdomainStatus, isValidatingSubdomain, onValidationChange]);

  // Auto-generate subdomain from name
  useEffect(() => {
    if (name && !subdomain) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('subdomain', generated);
    }
  }, [name, subdomain, setValue]);

  // Validate subdomain availability
  useEffect(() => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus('idle');
      setSubdomainError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsValidatingSubdomain(true);
      setSubdomainError(null);

      try {
        const result = await validateSubdomain(subdomain);
        if (result.available) {
          setSubdomainStatus('available');
        } else {
          setSubdomainStatus('taken');
          setSubdomainError(result.error || 'Subdomain is already taken');
        }
      } catch (error) {
        setSubdomainError('Failed to validate subdomain');
        setSubdomainStatus('idle');
      } finally {
        setIsValidatingSubdomain(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [subdomain]);

  const handleFormSubmit = (data: TenantInfoFormData) => {
    if (subdomainStatus === 'taken') {
      return;
    }

    onSubmit({
      ...data,
      year_established: data.year_established || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Tenant Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g., Greenfield Village HOA"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="legal_name">Legal Name (optional)</Label>
          <Input
            id="legal_name"
            placeholder="e.g., Greenfield Village Homeowners Association Inc."
            {...register('legal_name')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subdomain">
            Subdomain <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="subdomain"
              placeholder="e.g., greenfield"
              {...register('subdomain')}
              className={
                subdomainStatus === 'available'
                  ? 'border-green-500'
                  : subdomainStatus === 'taken'
                  ? 'border-red-500'
                  : ''
              }
            />
            {isValidatingSubdomain && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {!isValidatingSubdomain && subdomainStatus === 'available' && (
              <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
            )}
            {!isValidatingSubdomain && subdomainStatus === 'taken' && (
              <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
            )}
          </div>
          {subdomainError && (
            <p className="text-sm text-red-500">{subdomainError}</p>
          )}
          {errors.subdomain && (
            <p className="text-sm text-red-500">{errors.subdomain.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Admin portal will be accessible at: <strong>{subdomain || 'your-subdomain'}.admin.villagetech.app</strong>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="community_type">
            Community Type <span className="text-red-500">*</span>
          </Label>
          <Select
            defaultValue="HOA"
            onValueChange={(value) => setValue('community_type', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select community type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HOA">HOA (Homeowners Association)</SelectItem>
              <SelectItem value="Condo">Condominium</SelectItem>
              <SelectItem value="Gated Village">Gated Village</SelectItem>
              <SelectItem value="Subdivision">Subdivision</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Additional Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Additional Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="year_established">Year Established</Label>
            <Input
              id="year_established"
              type="number"
              placeholder="e.g., 2020"
              {...register('year_established', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_residences">
              Maximum Residences <span className="text-red-500">*</span>
            </Label>
            <Input
              id="max_residences"
              type="number"
              {...register('max_residences', { valueAsNumber: true })}
            />
            {errors.max_residences && (
              <p className="text-sm text-red-500">{errors.max_residences.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max_admin_users">Max Admin Users</Label>
            <Input
              id="max_admin_users"
              type="number"
              {...register('max_admin_users', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_security_users">Max Security Users</Label>
            <Input
              id="max_security_users"
              type="number"
              {...register('max_security_users', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage_quota_gb">Storage Quota (GB)</Label>
            <Input
              id="storage_quota_gb"
              type="number"
              {...register('storage_quota_gb', { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

    </form>
  );
}
