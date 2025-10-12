'use client';

/**
 * Admin User Setup Form Component (T064)
 *
 * Step 4: Admin head email, name, phone, position
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { CreateTenantInput } from '@/lib/actions/create-tenant';

const adminUserSchema = z.object({
  admin_email: z.string().email('Valid email is required'),
  admin_first_name: z.string().min(2, 'First name must be at least 2 characters'),
  admin_last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  admin_phone: z.string().optional(),
  admin_position: z.string().optional(),
});

type AdminUserFormData = z.infer<typeof adminUserSchema>;

interface AdminUserFormProps {
  initialData?: Partial<CreateTenantInput>;
  onSubmit: (data: Partial<CreateTenantInput>) => void;
  onBack?: () => void;
}

export function AdminUserForm({ initialData, onSubmit, onBack }: AdminUserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminUserFormData>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      admin_email: initialData?.admin_email || '',
      admin_first_name: initialData?.admin_first_name || '',
      admin_last_name: initialData?.admin_last_name || '',
      admin_phone: initialData?.admin_phone || '',
      admin_position: initialData?.admin_position || 'Admin Head',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This person will be the primary administrator for the community. They will receive login credentials via email.
        </AlertDescription>
      </Alert>

      {/* Admin Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin_email">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="admin_email"
            type="email"
            placeholder="admin@example.com"
            {...register('admin_email')}
          />
          {errors.admin_email && (
            <p className="text-sm text-red-500">{errors.admin_email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="admin_first_name">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="admin_first_name"
              placeholder="John"
              {...register('admin_first_name')}
            />
            {errors.admin_first_name && (
              <p className="text-sm text-red-500">{errors.admin_first_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_last_name">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="admin_last_name"
              placeholder="Doe"
              {...register('admin_last_name')}
            />
            {errors.admin_last_name && (
              <p className="text-sm text-red-500">{errors.admin_last_name.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_phone">Phone Number (Optional)</Label>
          <Input
            id="admin_phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            {...register('admin_phone')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_position">Position (Optional)</Label>
          <Input
            id="admin_position"
            placeholder="e.g., HOA President, Property Manager"
            {...register('admin_position')}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <div className="flex-1" />
        <Button type="submit" disabled={isSubmitting}>
          Continue to Review
        </Button>
      </div>
    </form>
  );
}
