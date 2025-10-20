'use client';

/**
 * Superadmins Page Client Component
 *
 * Client-side wrapper for managing superadmins with dialog state
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { AddSuperadminDialog } from '@/components/superadmins/AddSuperadminDialog';

interface SuperadminsPageClientProps {
  children: React.ReactNode;
}

export function SuperadminsPageClient({ children }: SuperadminsPageClientProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Superadmins</h2>
          <p className="text-muted-foreground">Manage platform superadministrators</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Superadmin
        </Button>
      </div>

      {children}

      <AddSuperadminDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
