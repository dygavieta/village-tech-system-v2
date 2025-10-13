'use client';

/**
 * Admins Tab Content Component
 *
 * Client component for admins tab with Add Admin User functionality
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Phone, Plus } from 'lucide-react';
import { AddAdminUserDialog } from './AddAdminUserDialog';

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role: string;
  department?: string;
  status?: string;
}

interface AdminsTabContentProps {
  tenantId: string;
  adminUsers: AdminUser[];
}

export function AdminsTabContent({ tenantId, adminUsers }: AdminsTabContentProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Users with management access
        </p>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin User
        </Button>
      </div>

      {adminUsers.length > 0 ? (
        <div className="space-y-4">
          {adminUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-start justify-between rounded-lg border p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">
                    {user.first_name} {user.last_name}
                  </h4>
                  <Badge variant="secondary" className="capitalize">
                    {user.role === 'admin_head' ? 'Admin Head' : 'Admin Officer'}
                  </Badge>
                </div>
                {user.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {user.phone}
                  </div>
                )}
                {user.department && (
                  <p className="text-sm text-muted-foreground">
                    Department: {user.department}
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className={
                  user.status === 'active'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }
              >
                {user.status || 'active'}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No admin users configured yet</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Admin User
          </Button>
        </div>
      )}

      <AddAdminUserDialog
        tenantId={tenantId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </>
  );
}
