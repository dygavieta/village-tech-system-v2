'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Clock, Loader2, Calendar, Sun, Snowflake, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { createCurfew, updateCurfew, type Curfew } from '@/lib/actions/curfew';
import { useToast } from '@/components/ui/use-toast';

const daysOfWeek = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];

const curfewFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  days_of_week: z.array(z.string()).min(1, 'Select at least one day'),
  season: z.enum(['all_year', 'summer', 'winter', 'custom']),
  season_start_date: z.string().optional(),
  season_end_date: z.string().optional(),
  is_active: z.boolean(),
}).refine((data) => {
  if (data.season === 'custom') {
    return !!data.season_start_date && !!data.season_end_date;
  }
  return true;
}, {
  message: 'Season start and end dates are required for custom season',
  path: ['season_start_date'],
});

type CurfewFormValues = z.infer<typeof curfewFormSchema>;

interface CurfewFormProps {
  mode: 'create' | 'edit';
  initialData?: Curfew;
}

export default function CurfewForm({ mode, initialData }: CurfewFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CurfewFormValues>({
    resolver: zodResolver(curfewFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      start_time: initialData?.start_time || '22:00',
      end_time: initialData?.end_time || '06:00',
      days_of_week: initialData?.days_of_week || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      season: initialData?.season || 'all_year',
      season_start_date: initialData?.season_start_date || '',
      season_end_date: initialData?.season_end_date || '',
      is_active: initialData?.is_active ?? true,
    },
  });

  const watchSeason = form.watch('season');

  async function onSubmit(values: CurfewFormValues) {
    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const newCurfew = await createCurfew({
          name: values.name,
          description: values.description,
          start_time: values.start_time,
          end_time: values.end_time,
          days_of_week: values.days_of_week,
          season: values.season,
          season_start_date: values.season === 'custom' ? values.season_start_date : undefined,
          season_end_date: values.season === 'custom' ? values.season_end_date : undefined,
          is_active: values.is_active,
        });

        toast({
          title: 'Curfew created successfully',
          description: 'The curfew has been created and is now available.',
        });

        // Redirect to the new curfew detail page
        startTransition(() => {
          router.push(`/settings/curfew/${newCurfew.id}`);
          router.refresh();
        });
      } else if (initialData) {
        await updateCurfew(initialData.id, {
          name: values.name,
          description: values.description,
          start_time: values.start_time,
          end_time: values.end_time,
          days_of_week: values.days_of_week,
          season: values.season,
          season_start_date: values.season === 'custom' ? values.season_start_date : undefined,
          season_end_date: values.season === 'custom' ? values.season_end_date : undefined,
          is_active: values.is_active,
        });

        toast({
          title: 'Curfew updated successfully',
          description: 'The curfew has been updated.',
        });

        // Redirect to the curfew detail page
        startTransition(() => {
          router.push(`/settings/curfew/${initialData.id}`);
          router.refresh();
        });
      }
    } catch (error) {
      console.error('Error submitting curfew:', error);
      toast({
        title: mode === 'create' ? 'Failed to create curfew' : 'Failed to update curfew',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  }

  const handleCancel = () => {
    if (mode === 'edit' && initialData) {
      router.push(`/settings/curfew/${initialData.id}`);
    } else {
      router.push('/settings/curfew');
    }
  };

  const isLoading = isSubmitting || isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide a clear name and description for this curfew
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Curfew Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Standard Weeknight Curfew"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this curfew configuration
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description or notes about this curfew..."
                      className="min-h-[100px]"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional details about when and why this curfew is enforced
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Enable this curfew to start enforcement at gates
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Curfew Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Curfew Hours
            </CardTitle>
            <CardDescription>
              Set the time window when curfew is enforced
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      When curfew begins
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      When curfew ends
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Days of Week */}
        <Card>
          <CardHeader>
            <CardTitle>Days of Week</CardTitle>
            <CardDescription>
              Select which days this curfew applies to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="days_of_week"
              render={() => (
                <FormItem>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {daysOfWeek.map((day) => (
                      <FormField
                        key={day.id}
                        control={form.control}
                        name="days_of_week"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={day.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, day.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== day.id
                                          )
                                        );
                                  }}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {day.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Season Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Season Configuration
            </CardTitle>
            <CardDescription>
              Configure seasonal variations for this curfew
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="season"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Season *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select season" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all_year">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>All Year Round</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="summer">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          <span>Summer Only</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="winter">
                        <div className="flex items-center gap-2">
                          <Snowflake className="h-4 w-4" />
                          <span>Winter Only</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Custom Date Range</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose when this curfew should be active during the year
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchSeason === 'custom' && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="season_start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Season Start Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        First day of season
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="season_end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Season End Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Last day of season
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Curfew' : 'Update Curfew'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
