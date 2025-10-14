'use client';

/**
 * Create Announcement Form - Client Component Wrapper
 * Handles form submission and navigation
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnnouncementForm } from './AnnouncementForm';
import { sendAnnouncement } from '@/lib/actions/send-announcement';
import { useToast } from '@/components/ui/use-toast';

export function CreateAnnouncementForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await sendAnnouncement(data);

      if (result.success) {
        toast({
          title: 'Announcement Published',
          description: 'Your announcement has been sent successfully.',
        });
        router.push('/announcements');
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to publish announcement',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/announcements');
  };

  return (
    <AnnouncementForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}
