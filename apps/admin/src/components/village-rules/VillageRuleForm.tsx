'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { FileText, Loader2, Calendar, Tag } from 'lucide-react';
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
import {
  createVillageRule,
  updateVillageRule,
  publishVillageRule,
  type VillageRule,
  type VillageRuleCategory,
} from '@/lib/actions/village-rules';
import { useToast } from '@/components/ui/use-toast';

const CATEGORY_OPTIONS: { value: VillageRuleCategory; label: string }[] = [
  { value: 'noise', label: 'Noise & Disturbance' },
  { value: 'parking', label: 'Parking & Vehicles' },
  { value: 'pets', label: 'Pets & Animals' },
  { value: 'construction', label: 'Construction & Renovation' },
  { value: 'visitors', label: 'Visitors & Guests' },
  { value: 'general', label: 'General Rules' },
];

const villageRuleFormSchema = z.object({
  category: z.enum(['noise', 'parking', 'pets', 'construction', 'visitors', 'general']),
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  effective_date: z.string().min(1, 'Effective date is required'),
  requires_acknowledgment: z.boolean(),
  publish_now: z.boolean(),
});

type VillageRuleFormValues = z.infer<typeof villageRuleFormSchema>;

interface VillageRuleFormProps {
  mode: 'create' | 'edit';
  initialData?: VillageRule;
}

export default function VillageRuleForm({ mode, initialData }: VillageRuleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VillageRuleFormValues>({
    resolver: zodResolver(villageRuleFormSchema),
    defaultValues: {
      category: initialData?.category || 'general',
      title: initialData?.title || '',
      description: initialData?.description || '',
      effective_date: initialData?.effective_date || new Date().toISOString().split('T')[0],
      requires_acknowledgment: initialData?.requires_acknowledgment ?? true,
      publish_now: mode === 'create' ? true : !!initialData?.published_at,
    },
  });

  async function onSubmit(values: VillageRuleFormValues) {
    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const newRule = await createVillageRule({
          category: values.category,
          title: values.title,
          description: values.description,
          effective_date: values.effective_date,
          requires_acknowledgment: values.requires_acknowledgment,
          publish_now: values.publish_now,
        });

        toast({
          title: values.publish_now ? 'Rule created and published' : 'Rule created as draft',
          description: values.publish_now
            ? 'The rule has been published and is now visible to residents.'
            : 'The rule has been saved as a draft.',
        });

        startTransition(() => {
          router.push(`/settings/rules/${newRule.id}`);
          router.refresh();
        });
      } else if (initialData) {
        await updateVillageRule(initialData.id, {
          category: values.category,
          title: values.title,
          description: values.description,
          effective_date: values.effective_date,
          requires_acknowledgment: values.requires_acknowledgment,
        });

        // Publish if it was a draft and publish_now is checked
        if (!initialData.published_at && values.publish_now) {
          await publishVillageRule(initialData.id);
        }

        toast({
          title: 'Rule updated successfully',
          description: 'The rule has been updated.',
        });

        startTransition(() => {
          router.push(`/settings/rules/${initialData.id}`);
          router.refresh();
        });
      }
    } catch (error) {
      console.error('Error submitting village rule:', error);
      toast({
        title: mode === 'create' ? 'Failed to create rule' : 'Failed to update rule',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  }

  const handleCancel = () => {
    if (mode === 'edit' && initialData) {
      router.push(`/settings/rules/${initialData.id}`);
    } else {
      router.push('/settings/rules');
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
            <CardDescription>Provide details about this community rule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Choose the category that best fits this rule</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Quiet Hours Policy"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>A clear, descriptive title for this rule</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a detailed description of the rule, including what is required, prohibited, or recommended..."
                      className="min-h-[200px]"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Write the complete rule text. Be clear, specific, and unambiguous.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Settings
            </CardTitle>
            <CardDescription>Configure when and how this rule applies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="effective_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>
                    The date when this rule becomes effective
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requires_acknowledgment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Require Resident Acknowledgment</FormLabel>
                    <FormDescription>
                      Residents must acknowledge they have read and understood this rule
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                  </FormControl>
                </FormItem>
              )}
            />

            {mode === 'create' && (
              <FormField
                control={form.control}
                name="publish_now"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Publish Immediately</FormLabel>
                      <FormDescription>
                        Publish this rule now. If unchecked, it will be saved as a draft.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {mode === 'edit' && !initialData?.published_at && (
              <FormField
                control={form.control}
                name="publish_now"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-blue-50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Publish This Draft</FormLabel>
                      <FormDescription>
                        Check this to publish the rule and make it visible to residents
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Rule' : 'Update Rule'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
