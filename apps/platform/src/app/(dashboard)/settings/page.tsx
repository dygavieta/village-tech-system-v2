/**
 * System Settings Page
 *
 * Superadmin system configuration and preferences
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings,
  Database,
  Mail,
  Shield,
  Bell,
  Palette,
  Globe,
  Server
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">Manage platform configuration and preferences</p>
      </div>

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          System settings management is currently under development. Core configuration options will be available soon.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input id="platform-name" defaultValue="VillageTech Platform" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform-url">Platform URL</Label>
              <Input id="platform-url" defaultValue="https://platform.villagetech.app" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input id="support-email" type="email" placeholder="support@villagetech.app" disabled />
            </div>
            <Button disabled>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Database Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Database Configuration</CardTitle>
            </div>
            <CardDescription>Database connection and maintenance settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Connection Status</p>
                <p className="text-sm text-muted-foreground">Database connection health</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Automatic Backups</p>
                <p className="text-sm text-muted-foreground">Daily automated backups</p>
              </div>
              <Button size="sm" variant="outline" disabled>Configure</Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Configuration</CardTitle>
            </div>
            <CardDescription>Email service settings and templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input id="smtp-host" placeholder="smtp.example.com" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input id="smtp-port" placeholder="587" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-email">From Email</Label>
              <Input id="from-email" type="email" placeholder="noreply@villagetech.app" disabled />
            </div>
            <Button disabled>Save Email Settings</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>Authentication and access control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Require 2FA for superadmins</p>
              </div>
              <Button size="sm" variant="outline" disabled>Enable</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Session Timeout</p>
                <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
              </div>
              <Button size="sm" variant="outline" disabled>Configure</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Password Policy</p>
                <p className="text-sm text-muted-foreground">Minimum requirements for passwords</p>
              </div>
              <Button size="sm" variant="outline" disabled>Configure</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>System alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Tenant Creation Alerts</p>
                <p className="text-sm text-muted-foreground">Notify on new tenant creation</p>
              </div>
              <Button size="sm" variant="outline" disabled>Enable</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Error Notifications</p>
                <p className="text-sm text-muted-foreground">Alert on system errors</p>
              </div>
              <Button size="sm" variant="outline" disabled>Configure</Button>
            </div>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <CardTitle>System Maintenance</CardTitle>
            </div>
            <CardDescription>Maintenance and monitoring tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">System Health Check</p>
                <p className="text-sm text-muted-foreground">Run diagnostic tests</p>
              </div>
              <Button size="sm" variant="outline" disabled>Run Check</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Clear Cache</p>
                <p className="text-sm text-muted-foreground">Clear application cache</p>
              </div>
              <Button size="sm" variant="outline" disabled>Clear</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">View System Logs</p>
                <p className="text-sm text-muted-foreground">Access application logs</p>
              </div>
              <Button size="sm" variant="outline" disabled>View Logs</Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Platform theme and branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled>Light</Button>
                <Button size="sm" variant="outline" disabled>Dark</Button>
                <Button size="sm" variant="default" disabled>System</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <Input id="primary-color" type="color" defaultValue="#000000" disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
