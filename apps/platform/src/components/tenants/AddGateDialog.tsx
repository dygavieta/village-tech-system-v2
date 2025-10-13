'use client';

/**
 * Add Gate Dialog Component
 *
 * Modal dialog for adding a new gate to an existing tenant
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const gateSchema = z.object({
  name: z.string().min(2, 'Gate name must be at least 2 characters'),
  gate_type: z.enum(['primary', 'secondary', 'service', 'emergency']),
  operating_hours_start: z.string().optional(),
  operating_hours_end: z.string().optional(),
  rfid_reader_serial: z.string().optional(),
});

type GateFormData = z.infer<typeof gateSchema>;

interface AddGateDialogProps {
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGateDialog({ tenantId, open, onOpenChange }: AddGateDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<GateFormData>({
    resolver: zodResolver(gateSchema),
    defaultValues: {
      name: '',
      gate_type: 'primary',
      operating_hours_start: '',
      operating_hours_end: '',
      rfid_reader_serial: '',
    },
  });

  const onSubmit = async (data: GateFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/gates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add gate');
      }

      toast({
        title: 'Gate added successfully',
        description: `${data.name} has been added to the tenant.`,
      });

      reset();
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error('Error adding gate:', err);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Gate</DialogTitle>
          <DialogDescription>
            Configure a new gate entry point for this community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              Gate Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Main Gate"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gate_type">
              Gate Type <span className="text-red-500">*</span>
            </Label>
            <Select
              defaultValue="primary"
              onValueChange={(value) => setValue('gate_type', value as any)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operating_hours_start">Start Time</Label>
              <Input
                id="operating_hours_start"
                type="time"
                {...register('operating_hours_start')}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operating_hours_end">End Time</Label>
              <Input
                id="operating_hours_end"
                type="time"
                {...register('operating_hours_end')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rfid_reader_serial">RFID Reader Serial (Optional)</Label>
            <Input
              id="rfid_reader_serial"
              placeholder="e.g., RFID-001"
              {...register('rfid_reader_serial')}
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
                  Adding...
                </>
              ) : (
                'Add Gate'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
