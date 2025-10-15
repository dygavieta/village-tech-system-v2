'use client';

import {
  ArrowLeft,
  Save,
  Send,
  AlertCircle,
  Users,
  Calendar,
  FileText,
  Upload,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useTransition } from 'react';
import { sendAnnouncement } from '@/lib/actions/send-announcement';
import { useToast } from '@/hooks/use-toast';

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    urgency: 'info' as 'critical' | 'important' | 'info',
    category: '' as 'event' | 'maintenance' | 'security' | 'policy' | 'general' | '',
    target_audience: 'all_residents' as 'all_residents' | 'all_security' | 'specific_households' | 'all',
    requires_acknowledgment: false,
    schedule_type: 'now' as 'now' | 'later',
    effective_start: '',
    effective_end: '',
    schedule_date: '',
    schedule_time: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const categories = [
    { value: 'general', label: 'General Announcement' },
    { value: 'event', label: 'Events & Activities' },
    { value: 'maintenance', label: 'Maintenance & Repairs' },
    { value: 'security', label: 'Security & Safety' },
    { value: 'policy', label: 'Rules & Regulations' },
  ];

  const audienceOptions = [
    { id: 'all', label: 'All Users (Residents + Security)' },
    { id: 'all_residents', label: 'All Residents' },
    { id: 'all_security', label: 'All Security Personnel' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported file type. Please use PDF or images.`,
          variant: 'destructive',
        });
        return false;
      }

      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 5MB limit.`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (): Promise<string[]> => {
    if (attachments.length === 0) return [];

    setUploadingFiles(true);
    const uploadedUrls: string[] = [];

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('You must be logged in to upload files');
      }

      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `announcements/${fileName}`;

        const { data, error } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error('Upload error:', error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Upload attachments error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload attachments',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    startTransition(async () => {
      try {
        // Upload attachments first if any
        const attachmentUrls = await uploadAttachments();

        // Build effective_start datetime
        let effectiveStart: string | undefined;
        if (formData.schedule_type === 'later' && formData.schedule_date && formData.schedule_time) {
          effectiveStart = new Date(`${formData.schedule_date}T${formData.schedule_time}`).toISOString();
        }

        // Build effective_end datetime if provided
        let effectiveEnd: string | undefined;
        if (formData.effective_end) {
          effectiveEnd = new Date(formData.effective_end).toISOString();
        }

        const announcementData = {
          title: formData.title,
          content: formData.content,
          urgency: formData.urgency,
          category: formData.category,
          target_audience: formData.target_audience,
          requires_acknowledgment: formData.requires_acknowledgment,
          effective_start: effectiveStart,
          effective_end: effectiveEnd,
          attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        };

        const result = await sendAnnouncement(announcementData);

        if (result.success) {
          toast({
            title: 'Success',
            description: formData.schedule_type === 'later'
              ? 'Announcement scheduled successfully'
              : 'Announcement sent successfully',
          });
          router.push('/announcements');
          router.refresh();
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to send announcement',
            variant: 'destructive',
          });
          if (result.error) {
            setErrors({ general: result.error });
          }
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/announcements">
            <Button type="button" variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Announcement</h1>
            <p className="text-muted-foreground">
              Compose and send announcements to residents and staff
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isPending || uploadingFiles || !formData.title || !formData.content || !formData.category}
          >
            {isPending || uploadingFiles ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadingFiles ? 'Uploading files...' : 'Sending...'}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {formData.schedule_type === 'later' ? 'Schedule' : 'Send Now'}
              </>
            )}
          </Button>
        </div>
      </div>

      {errors.general && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Announcement Details</CardTitle>
              <CardDescription>
                Enter the title and content of your announcement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter announcement title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                  minLength={5}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.title.length}/200 characters (minimum 5)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category <span className="text-destructive">*</span>
                </label>
                <select
                  className="w-full px-4 py-2 border rounded-lg"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Content <span className="text-destructive">*</span>
                </label>
                <textarea
                  placeholder="Write your announcement here..."
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg resize-none"
                  required
                  minLength={20}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.content.length}/5000 characters (minimum 20)
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requires_acknowledgment}
                    onChange={(e) => setFormData({ ...formData, requires_acknowledgment: e.target.checked })}
                  />
                  <span className="text-sm font-medium">Require acknowledgment from recipients</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  Recipients will need to acknowledge that they have read this announcement
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Attachments (Optional)</label>
                <div className="border-2 border-dashed rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop files here, or click to browse
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      disabled={uploadingFiles}
                    />
                    <label htmlFor="file-upload">
                      <Button type="button" variant="outline" size="sm" asChild disabled={uploadingFiles}>
                        <span>Choose Files</span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supported: PDF, Images (Max 5MB per file)
                    </p>
                  </div>

                  {/* File list */}
                  {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            disabled={uploadingFiles}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgency Level */}
          <Card>
            <CardHeader>
              <CardTitle>Urgency Level</CardTitle>
              <CardDescription>
                Set the priority level for this announcement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div
                  onClick={() => setFormData({ ...formData, urgency: 'critical' })}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.urgency === 'critical'
                      ? 'border-red-500 bg-red-50'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    {formData.urgency === 'critical' && (
                      <div className="h-2 w-2 rounded-full bg-red-600" />
                    )}
                  </div>
                  <p className="font-semibold text-sm">Critical</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Emergency alerts requiring immediate attention
                  </p>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, urgency: 'important' })}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.urgency === 'important'
                      ? 'border-orange-500 bg-orange-50'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    {formData.urgency === 'important' && (
                      <div className="h-2 w-2 rounded-full bg-orange-600" />
                    )}
                  </div>
                  <p className="font-semibold text-sm">Important</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    High priority notifications
                  </p>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, urgency: 'info' })}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.urgency === 'info'
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {formData.urgency === 'info' && (
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="font-semibold text-sm">Info</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    General updates and information
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Audience Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Audience
              </CardTitle>
              <CardDescription>
                Select who will receive this announcement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {audienceOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                    formData.target_audience === option.id ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="audience"
                      value={option.id}
                      checked={formData.target_audience === option.id}
                      onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as any })}
                    />
                    <div>
                      <p className="text-sm font-medium">{option.label}</p>
                    </div>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
              <CardDescription>
                Send now or schedule for later
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                formData.schedule_type === 'now' ? 'border-primary bg-primary/5' : ''
              }`}>
                <input
                  type="radio"
                  name="schedule"
                  value="now"
                  checked={formData.schedule_type === 'now'}
                  onChange={(e) => setFormData({ ...formData, schedule_type: 'now' })}
                />
                <div>
                  <p className="text-sm font-medium">Send Immediately</p>
                  <p className="text-xs text-muted-foreground">Send right away</p>
                </div>
              </label>

              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                formData.schedule_type === 'later' ? 'border-primary bg-primary/5' : ''
              }`}>
                <input
                  type="radio"
                  name="schedule"
                  value="later"
                  checked={formData.schedule_type === 'later'}
                  onChange={(e) => setFormData({ ...formData, schedule_type: 'later' })}
                />
                <div>
                  <p className="text-sm font-medium">Schedule for Later</p>
                  <p className="text-xs text-muted-foreground">Choose date and time</p>
                </div>
              </label>

              {formData.schedule_type === 'later' && (
                <div className="space-y-2 pl-8">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Start Date & Time</label>
                    <input
                      type="date"
                      value={formData.schedule_date}
                      onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg mb-2"
                      required={formData.schedule_type === 'later'}
                    />
                    <input
                      type="time"
                      value={formData.schedule_time}
                      onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      required={formData.schedule_type === 'later'}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">End Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={formData.effective_end}
                      onChange={(e) => setFormData({ ...formData, effective_end: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      When should this announcement expire?
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                • Critical announcements will trigger push notifications
              </p>
              <p>
                • Scheduled announcements can be viewed in the announcements list
              </p>
              <p>
                • All announcements are logged and can be viewed in the announcement history
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
