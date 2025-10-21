import {
  Users,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Shield,
  Crown,
  UserCheck,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAdminUserStats, getAdminUsers } from '@/lib/actions/users';
import { formatDistanceToNow } from 'date-fns';
import { AddAdminUserDialog } from '@/components/users/AddAdminUserDialog';

export default async function UserManagementPage() {
  const [stats, users] = await Promise.all([
    getAdminUserStats(),
    getAdminUsers(),
  ]);

  const getRoleBadge = (role: 'admin_head' | 'admin_officer') => {
    if (role === 'admin_head') {
      return <Badge variant="default" className="bg-purple-600">Admin Head</Badge>;
    }
    return <Badge variant="default">Officer</Badge>;
  };

  const getRoleDisplay = (role: 'admin_head' | 'admin_officer', position: string | null) => {
    if (role === 'admin_head') {
      return 'Admin Head';
    }
    return position || 'Officer';
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage admin officers, roles, and permissions
            </p>
          </div>
        </div>
        <AddAdminUserDialog />
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Admin accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Head</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adminHead}</div>
            <p className="text-xs text-muted-foreground">Full access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Officers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.officers}</div>
            <p className="text-xs text-muted-foreground">Limited access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>
            HOA officers with access to the admin portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No admin users found
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => {
                const fullName = `${user.first_name}${user.middle_name ? ' ' + user.middle_name : ''} ${user.last_name}`;
                const initials = `${user.first_name[0]}${user.last_name[0]}`;

                return (
                  <div
                    key={user.id}
                    className="flex items-start justify-between border rounded-lg p-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {initials}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-lg">{fullName}</p>
                            {getRoleBadge(user.role)}
                            {user.position && (
                              <Badge variant="outline">{user.position}</Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{user.phone_number}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined: {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      {user.role !== 'admin_head' && (
                        <Button variant="outline" size="sm" disabled>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles & Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Overview of admin roles and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-purple-600" />
                <p className="font-semibold">Admin Head</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Full access to all features and settings. Can manage households, configure community settings, process approvals, and manage system configurations.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <p className="font-semibold">Admin Officer</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Handles specific administrative tasks like household management, approvals, announcements, and reporting. Access level similar to Admin Head but can be assigned specific positions (Treasurer, Secretary, etc.).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
