/**
 * Superadmins Management Page
 *
 * Manage superadmin users for the platform
 */

import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, Mail, Calendar, Activity } from 'lucide-react';
import { SuperadminsPageClient } from './page.client';

async function getSuperadmins() {
  const supabase = await createClient();

  const { data: superadmins } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('role', 'superadmin')
    .order('created_at', { ascending: false });

  return superadmins || [];
}

function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return 'SA';
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function SuperadminsPage() {
  const superadmins = await getSuperadmins();

  return (
    <SuperadminsPageClient>
      <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Superadmins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{superadmins.length}</div>
            <p className="text-xs text-muted-foreground">Platform administrators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Additions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {superadmins.filter(admin => {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return new Date(admin.created_at) >= thirtyDaysAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Superadmins Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Superadmins</CardTitle>
          <CardDescription>
            List of all platform superadministrators with full access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {superadmins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {superadmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(admin.first_name, admin.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {admin.first_name} {admin.last_name}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge
                              variant="outline"
                              className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
                            >
                              <Shield className="mr-1 h-3 w-3" />
                              Superadmin
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Contact via platform
                          </span>
                        </div>
                        {admin.phone_number && (
                          <p className="text-sm text-muted-foreground">
                            {admin.phone_number}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {admin.position || 'Platform Administrator'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(admin.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(admin.updated_at)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Superadmins Found</h3>
              <p className="text-sm text-muted-foreground">
                There are no superadmin users in the system. Click &quot;Add Superadmin&quot; above to create one.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-amber-900">
            <p className="font-medium">Superadmin Access Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Superadmins have full access to all platform features and tenants</li>
              <li>Only grant superadmin access to trusted personnel</li>
              <li>All superadmin actions are logged for audit purposes</li>
              <li>Enable two-factor authentication for all superadmin accounts</li>
              <li>Regularly review and audit superadmin account activity</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Superadmin Permissions</CardTitle>
          <CardDescription>
            Overview of superadmin capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Platform Management</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create and manage tenants</li>
                <li>• View all tenant data</li>
                <li>• Configure tenant settings</li>
                <li>• Manage tenant branding</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">User Management</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create admin users for tenants</li>
                <li>• Manage superadmin accounts</li>
                <li>• View all user profiles</li>
                <li>• Reset user passwords</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">System Administration</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Access system settings</li>
                <li>• View analytics and reports</li>
                <li>• Monitor system health</li>
                <li>• Manage integrations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Security & Compliance</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• View audit logs</li>
                <li>• Configure security policies</li>
                <li>• Manage access controls</li>
                <li>• Handle data requests</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </SuperadminsPageClient>
  );
}
