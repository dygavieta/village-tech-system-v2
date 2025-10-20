'use client';

/**
 * Add Superadmin Dialog Component
 *
 * Modal dialog for adding a new superadmin user
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Info, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createSuperadmin } from '@/lib/actions/create-superadmin';

const superadminSchema = z.object({
  email: z.string().email('Valid email is required'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  middle_name: z.string().optional(),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  phone_number: z.string().optional(),
  position: z.string().optional(),
});

type SuperadminFormData = z.infer<typeof superadminSchema>;

interface AddSuperadminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSuperadminDialog({ open, onOpenChange }: AddSuperadminDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SuperadminFormData>({
    resolver: zodResolver(superadminSchema),
    defaultValues: {
      email: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      phone_number: '',
      position: 'Platform Administrator',
    },
  });

  const onSubmit = async (data: SuperadminFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createSuperadmin(data);

      if (!result.success) {
        setError(result.error || 'Failed to create superadmin');
        return;
      }

      toast({
        title: 'Superadmin created successfully',
        description: `${data.first_name} ${data.last_name} will receive login credentials via email.`,
      });

      reset();
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error('Error creating superadmin:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Add Superadmin
          </DialogTitle>
          <DialogDescription>
            Create a new superadmin user with full platform access
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Alert className="bg-purple-50 border-purple-200">
            <Info className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-900">
              A secure password will be generated and sent to the user&apos;s email. Superadmins have full
              access to all platform features and tenants.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="superadmin@example.com"
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            <p className="text-xs text-muted-foreground">
              Login credentials will be sent to this email address
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                placeholder="John"
                {...register('first_name')}
                disabled={isSubmitting}
              />
              {errors.first_name && (
                <p className="text-sm text-red-500">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="middle_name"
                placeholder="M."
                {...register('middle_name')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="last_name"
              placeholder="Doe"
              {...register('last_name')}
              disabled={isSubmitting}
            />
            {errors.last_name && <p className="text-sm text-red-500">{errors.last_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              type="tel"
              placeholder="+1 (555) 123-4567"
              {...register('phone_number')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              placeholder="Platform Administrator"
              {...register('position')}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Create Superadmin
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
