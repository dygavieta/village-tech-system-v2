'use client';

/**
 * T151: RuleEditor Component
 * Create and edit village rules with version control
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Calendar, Tag, AlertCircle, Save } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Form schema matching database structure
const ruleEditorSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  category: z.enum(['noise', 'parking', 'pets', 'construction', 'visitors', 'curfew', 'general']),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  effective_date: z.string().min(1, 'Effective date is required'),
  requires_acknowledgment: z.boolean().default(false),
  publish_immediately: z.boolean().default(false),
});

type RuleEditorValues = z.infer<typeof ruleEditorSchema>;

interface RuleEditorProps {
  initialData?: Partial<RuleEditorValues & { version: number; id: string }>;
  onSubmit: (data: RuleEditorValues) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

const CATEGORY_LABELS = {
  noise: 'Noise & Disturbance',
  parking: 'Parking & Vehicles',
  pets: 'Pets & Animals',
  construction: 'Construction & Renovation',
  visitors: 'Visitors & Guests',
  curfew: 'Curfew & Hours',
  general: 'General Rules',
};

const CATEGORY_COLORS = {
  noise: 'bg-blue-100 text-blue-800',
  parking: 'bg-green-100 text-green-800',
  pets: 'bg-purple-100 text-purple-800',
  construction: 'bg-orange-100 text-orange-800',
  visitors: 'bg-pink-100 text-pink-800',
  curfew: 'bg-red-100 text-red-800',
  general: 'bg-gray-100 text-gray-800',
};

export function RuleEditor({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
}: RuleEditorProps) {
  const [descLength, setDescLength] = useState(initialData?.description?.length || 0);

  const form = useForm<RuleEditorValues>({
    resolver: zodResolver(ruleEditorSchema),
    defaultValues: {
      title: initialData?.title || '',
      category: initialData?.category || 'general',
      description: initialData?.description || '',
      effective_date: initialData?.effective_date || '',
      requires_acknowledgment: initialData?.requires_acknowledgment || false,
      publish_immediately: false,
    },
  });

  const handleSubmit = async (data: RuleEditorValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting rule:', error);
    }
  };

  const category = form.watch('category');
  const requiresAck = form.watch('requires_acknowledgment');
  const publishImmediate = form.watch('publish_immediately');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header Info */}
        {mode === 'edit' && initialData?.version && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-blue-900">
                <FileText className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Editing Rule - Version {initialData.version}</p>
                  <p className="text-sm text-blue-700">
                    Creating a new version will notify all residents who need to acknowledge
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rule Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter a clear, descriptive rule title"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Use a concise title that clearly describes the rule
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category and Effective Date Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Group related rules together
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="effective_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Effective Date</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      {...field}
                      className="pl-9"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  When this rule takes effect
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rule Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a detailed description of the rule, including any specific requirements, penalties, or exceptions..."
                  className="min-h-[200px]"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    setDescLength(e.target.value.length);
                  }}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                {descLength} characters (minimum 50 required) - Be clear and specific to avoid confusion
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Options */}
        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="font-semibold text-sm">Rule Options</h3>

          <FormField
            control={form.control}
            name="requires_acknowledgment"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-gray-300 mt-1"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Require Resident Acknowledgment
                  </FormLabel>
                  <FormDescription>
                    Residents must explicitly acknowledge they have read and understood this rule
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="publish_immediately"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-gray-300 mt-1"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Publish Immediately
                  </FormLabel>
                  <FormDescription>
                    Make this rule visible to residents now. Uncheck to save as draft.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Preview Card */}
        <Card className={CATEGORY_COLORS[category]}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-white">
                      {CATEGORY_LABELS[category]}
                    </Badge>
                    {requiresAck && (
                      <Badge variant="outline" className="bg-white">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Requires Acknowledgment
                      </Badge>
                    )}
                    {mode === 'edit' && initialData?.version && (
                      <Badge variant="outline" className="bg-white">
                        v{initialData.version + 1}
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold mb-1">Preview</h4>
                  <p className="font-medium mb-2">
                    {form.watch('title') || 'Your rule title will appear here'}
                  </p>
                  <p className="text-sm opacity-90 whitespace-pre-wrap">
                    {form.watch('description') || 'Your rule description will appear here...'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Publishing Notice */}
        {requiresAck && publishImmediate && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-900">
                  <p className="font-semibold mb-1">Acknowledgment Required</p>
                  <p>
                    Residents will be notified and required to acknowledge this rule.
                    They must read and confirm understanding before gaining access to certain features.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              'Saving...'
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {publishImmediate ? 'Publish Rule' : 'Save as Draft'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
