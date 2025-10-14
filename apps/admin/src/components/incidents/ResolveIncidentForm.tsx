'use client';

/**
 * Resolve Incident Form Component
 * Form for resolving security incidents
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useResolveIncidentMutation } from '@/lib/hooks/use-incident-mutations';
import { useToast } from '@/components/ui/use-toast';

const resolveFormSchema = z.object({
  resolution_notes: z.string().min(10, 'Resolution notes must be at least 10 characters'),
});

type ResolveFormValues = z.infer<typeof resolveFormSchema>;

interface ResolveIncidentFormProps {
  incidentId: string;
}

export function ResolveIncidentForm({ incidentId }: ResolveIncidentFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Use optimistic mutation hook
  const resolveMutation = useResolveIncidentMutation();

  const form = useForm<ResolveFormValues>({
    resolver: zodResolver(resolveFormSchema),
    defaultValues: {
      resolution_notes: '',
    },
  });

  const handleSubmit = async (data: ResolveFormValues) => {
    resolveMutation.mutate(
      {
        incident_id: incidentId,
        ...data,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast({
              title: 'Incident Resolved',
              description: 'The incident has been successfully resolved.',
            });
            form.reset();
            router.refresh();
          } else {
            toast({
              title: 'Error',
              description: result.error || 'Failed to resolve incident',
              variant: 'destructive',
            });
          }
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: 'An unexpected error occurred',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="resolution_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resolution Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe how the incident was resolved, actions taken, and any follow-up required..."
                  className="min-h-[120px]"
                  {...field}
                  disabled={resolveMutation.isPending}
                />
              </FormControl>
              <FormDescription>
                Provide detailed notes about the resolution for record keeping
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={resolveMutation.isPending} className="bg-green-600 hover:bg-green-700">
            {resolveMutation.isPending ? 'Resolving...' : 'Mark as Resolved'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
