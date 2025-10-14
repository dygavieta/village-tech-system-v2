'use client';

/**
 * T147: AnnouncementForm Component
 * Rich text editor for creating and editing announcements
 * Features: TipTap rich text, image upload, scheduling, target audience
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  AlertCircle,
  Calendar,
  Users,
} from 'lucide-react';

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
const announcementFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  urgency: z.enum(['critical', 'important', 'info']),
  category: z.enum(['event', 'maintenance', 'security', 'policy', 'general']),
  target_audience: z.enum(['all_residents', 'all_security', 'specific_households', 'all']),
  effective_start: z.string().optional(),
  effective_end: z.string().optional(),
  requires_acknowledgment: z.boolean().default(false),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

interface AnnouncementFormProps {
  initialData?: Partial<AnnouncementFormValues>;
  onSubmit: (data: AnnouncementFormValues) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function AnnouncementForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: AnnouncementFormProps) {
  const [contentLength, setContentLength] = useState(initialData?.content?.length || 0);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      urgency: initialData?.urgency || 'info',
      category: initialData?.category || 'general',
      target_audience: initialData?.target_audience || 'all_residents',
      effective_start: initialData?.effective_start || '',
      effective_end: initialData?.effective_end || '',
      requires_acknowledgment: initialData?.requires_acknowledgment || false,
    },
  });

  const handleSubmit = async (data: AnnouncementFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting announcement:', error);
    }
  };

  const urgency = form.watch('urgency');
  const targetAudience = form.watch('target_audience');

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'important':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter announcement title"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Content - Simple Textarea (Rich text editor requires @tiptap packages) */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your announcement here..."
                  className="min-h-[200px]"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    setContentLength(e.target.value.length);
                  }}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                {contentLength} characters (minimum 20 required)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Urgency and Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="urgency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Urgency Level</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span>Critical</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="important">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span>Important</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="info">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <span>Info</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Critical announcements are highlighted and prioritized
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Target Audience */}
        <FormField
          control={form.control}
          name="target_audience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Audience</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>All (Residents & Security)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="all_residents">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>All Residents</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="all_security">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>All Security Personnel</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="specific_households">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Specific Households</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Scheduling Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="effective_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date & Time (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Leave blank to publish immediately
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="effective_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date & Time (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Leave blank for no expiration
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Acknowledgment Required */}
        <FormField
          control={form.control}
          name="requires_acknowledgment"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Require Acknowledgment
                </FormLabel>
                <FormDescription>
                  Require recipients to acknowledge they have read this announcement
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Preview Card */}
        <Card className={getUrgencyColor(urgency)}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{urgency}</Badge>
                  <Badge variant="outline">{form.watch('category')}</Badge>
                </div>
                <h4 className="font-semibold mb-1">Preview</h4>
                <p className="text-sm">
                  {form.watch('title') || 'Your announcement title will appear here'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Publishing...' : 'Publish Announcement'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
