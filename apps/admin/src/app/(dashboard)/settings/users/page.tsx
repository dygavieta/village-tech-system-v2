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

export default function UserManagementPage() {
  // TODO: Replace with actual data from Supabase
  const stats = {
    totalUsers: 5,
    adminHead: 1,
    officers: 4,
    activeUsers: 5,
  };

  const adminUsers = [
    {
      id: 1,
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@villagemgmt.com',
      phone: '+63 917 123 4567',
      role: 'Admin Head' as const,
      department: 'Management',
      permissions: ['Full Access'],
      status: 'active' as const,
      lastLogin: '2 hours ago',
      joinedDate: 'Jan 15, 2025',
      avatar: '/avatars/juan.jpg',
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria.santos@villagemgmt.com',
      phone: '+63 917 234 5678',
      role: 'Treasurer' as const,
      department: 'Finance',
      permissions: ['Fees Management', 'Reports', 'View Households'],
      status: 'active' as const,
      lastLogin: '1 day ago',
      joinedDate: 'Feb 1, 2025',
      avatar: '/avatars/maria.jpg',
    },
    {
      id: 3,
      name: 'Pedro Garcia',
      email: 'pedro.garcia@villagemgmt.com',
      phone: '+63 917 345 6789',
      role: 'Secretary' as const,
      department: 'Administration',
      permissions: ['Announcements', 'Rules Management', 'View Households'],
      status: 'active' as const,
      lastLogin: '3 hours ago',
      joinedDate: 'Feb 15, 2025',
      avatar: '/avatars/pedro.jpg',
    },
    {
      id: 4,
      name: 'Anna Reyes',
      email: 'anna.reyes@villagemgmt.com',
      phone: '+63 917 456 7890',
      role: 'Officer' as const,
      department: 'Security',
      permissions: ['Approvals', 'Gate Management', 'Incidents'],
      status: 'active' as const,
      lastLogin: '5 hours ago',
      joinedDate: 'Mar 1, 2025',
      avatar: '/avatars/anna.jpg',
    },
    {
      id: 5,
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@villagemgmt.com',
      phone: '+63 917 567 8901',
      role: 'Officer' as const,
      department: 'Operations',
      permissions: ['Household Management', 'View Reports'],
      status: 'active' as const,
      lastLogin: '1 week ago',
      joinedDate: 'Mar 10, 2025',
      avatar: '/avatars/carlos.jpg',
    },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin Head':
        return <Badge variant="default" className="bg-purple-600">{role}</Badge>;
      case 'Treasurer':
        return <Badge variant="default" className="bg-green-600">{role}</Badge>;
      case 'Secretary':
        return <Badge variant="default" className="bg-blue-600">{role}</Badge>;
      default:
        return <Badge variant="default">{role}</Badge>;
    }
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin User
        </Button>
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
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-green-600">All online</p>
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
          <div className="space-y-4">
            {adminUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-start justify-between border rounded-lg p-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-lg">{user.name}</p>
                        {getRoleBadge(user.role)}
                        <Badge variant="outline">{user.department}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{user.phone}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <p className="text-xs text-muted-foreground mr-2">Permissions:</p>
                      {user.permissions.map((permission, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        Last login: {user.lastLogin}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined: {user.joinedDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {user.role !== 'Admin Head' && (
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Roles & Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Overview of different admin roles and their access levels
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
                Full access to all features and settings. Can manage other admin users, configure system settings, and override any decisions.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-green-600" />
                <p className="font-semibold">Treasurer</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Manages association fees, generates invoices, tracks payments, and produces financial reports.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <p className="font-semibold">Secretary</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Creates announcements, manages village rules, and handles administrative documentation.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-5 w-5 text-gray-600" />
                <p className="font-semibold">Officer</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Handles specific tasks like household management, approvals, or security operations based on assigned permissions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
