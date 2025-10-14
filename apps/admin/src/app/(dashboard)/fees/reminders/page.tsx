/**
 * T154d: Payment Reminders Configuration Page
 * Configure automated payment reminders
 */

import { ArrowLeft, Bell, Calendar, Mail, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export const metadata = {
  title: 'Payment Reminders | Village Tech Admin',
  description: 'Configure automated payment reminder settings',
};

export default function PaymentRemindersPage() {
  // TODO: Fetch settings from Supabase
  const reminderSettings = {
    enabled: true,
    daysBefore: [7, 3, 1],
    daysAfter: [1, 3, 7, 14],
    channels: {
      email: true,
      push: true,
      sms: false,
    },
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link href="/fees">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Reminders</h1>
          <p className="text-muted-foreground">
            Configure automated reminders for association fees
          </p>
        </div>
      </div>

      {/* Reminder Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Reminder System
              </CardTitle>
              <CardDescription>
                Automated reminders are currently active
              </CardDescription>
            </div>
            <Badge variant="default" className="bg-green-600">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="reminder-enabled">Enable Automated Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Send automatic reminders before and after due dates
              </p>
            </div>
            <Switch id="reminder-enabled" defaultChecked={reminderSettings.enabled} />
          </div>
        </CardContent>
      </Card>

      {/* Pre-Due Date Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Before Due Date
          </CardTitle>
          <CardDescription>
            Send reminders before the payment due date
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reminderSettings.daysBefore.map((days, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{days} Days Before</p>
                <p className="text-sm text-muted-foreground">
                  Remind households {days} days before due date
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Active</Badge>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full">
            Add Reminder
          </Button>
        </CardContent>
      </Card>

      {/* Post-Due Date Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            After Due Date (Overdue)
          </CardTitle>
          <CardDescription>
            Send reminders for overdue payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reminderSettings.daysAfter.map((days, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
              <div>
                <p className="font-medium text-orange-900">{days} Days After</p>
                <p className="text-sm text-orange-700">
                  Overdue reminder {days} days after due date
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-100 text-orange-900 border-orange-300">
                  Active
                </Badge>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full">
            Add Overdue Reminder
          </Button>
        </CardContent>
      </Card>

      {/* Delivery Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Channels</CardTitle>
          <CardDescription>
            Choose how to send payment reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send reminders via email
                </p>
              </div>
            </div>
            <Switch defaultChecked={reminderSettings.channels.email} />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send in-app push notifications
                </p>
              </div>
            </div>
            <Switch defaultChecked={reminderSettings.channels.push} />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>SMS Alerts (Premium)</Label>
                <p className="text-sm text-muted-foreground">
                  Send SMS for overdue payments
                </p>
              </div>
            </div>
            <Switch defaultChecked={reminderSettings.channels.sms} />
          </div>
        </CardContent>
      </Card>

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder Message Templates</CardTitle>
          <CardDescription>
            Customize the reminder messages sent to residents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="before-template">Before Due Date Template</Label>
            <Input
              id="before-template"
              placeholder="Your association fee of ₱{amount} is due on {due_date}..."
              defaultValue="Your association fee of ₱{amount} is due on {due_date}. Please ensure timely payment."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="overdue-template">Overdue Template</Label>
            <Input
              id="overdue-template"
              placeholder="Your payment of ₱{amount} is now overdue..."
              defaultValue="Your payment of ₱{amount} is now {days_overdue} days overdue. Please settle immediately."
            />
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Available Variables:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• {'{amount}'} - Payment amount</li>
              <li>• {'{due_date}'} - Payment due date</li>
              <li>• {'{days_overdue}'} - Days past due date</li>
              <li>• {'{household}'} - Household address</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset to Default</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
