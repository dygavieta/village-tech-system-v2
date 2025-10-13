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
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function CreateAnnouncementPage() {
  const [urgencyLevel, setUrgencyLevel] = useState<'critical' | 'important' | 'info'>('info');

  const audienceOptions = [
    { id: 'all_residents', label: 'All Residents', count: 150 },
    { id: 'all_security', label: 'All Security Personnel', count: 12 },
    { id: 'specific_households', label: 'Specific Households', count: 0 },
    { id: 'by_zone', label: 'By Zone/Block', count: 0 },
  ];

  const deliveryChannels = [
    { id: 'push', label: 'Push Notification', icon: '📱', enabled: true },
    { id: 'email', label: 'Email', icon: '✉️', enabled: true },
    { id: 'sms', label: 'SMS (Critical only)', icon: '💬', enabled: false },
  ];

  const categories = [
    'General Announcement',
    'Maintenance & Repairs',
    'Security & Safety',
    'Events & Activities',
    'Fees & Payments',
    'Rules & Regulations',
    'Emergency Alert',
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/announcements">
            <Button variant="ghost" size="sm">
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
          <Button variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Send Now
          </Button>
        </div>
      </div>

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
                <label className="text-sm font-medium mb-2 block">Title *</label>
                <input
                  type="text"
                  placeholder="Enter announcement title..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category *</label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Content *</label>
                <textarea
                  placeholder="Write your announcement here..."
                  rows={8}
                  className="w-full px-4 py-2 border rounded-lg resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports rich text formatting. Keep it clear and concise.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Attachments (Optional)</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop files here, or click to browse
                  </p>
                  <Button variant="outline" size="sm">
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported: PDF, Images (Max 5MB per file)
                  </p>
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
                  onClick={() => setUrgencyLevel('critical')}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    urgencyLevel === 'critical'
                      ? 'border-red-500 bg-red-50'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    {urgencyLevel === 'critical' && (
                      <div className="h-2 w-2 rounded-full bg-red-600" />
                    )}
                  </div>
                  <p className="font-semibold text-sm">Critical</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Emergency alerts, SMS enabled
                  </p>
                </div>

                <div
                  onClick={() => setUrgencyLevel('important')}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    urgencyLevel === 'important'
                      ? 'border-orange-500 bg-orange-50'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    {urgencyLevel === 'important' && (
                      <div className="h-2 w-2 rounded-full bg-orange-600" />
                    )}
                  </div>
                  <p className="font-semibold text-sm">Important</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    High priority, push & email
                  </p>
                </div>

                <div
                  onClick={() => setUrgencyLevel('info')}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    urgencyLevel === 'info'
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {urgencyLevel === 'info' && (
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="font-semibold text-sm">Info</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    General updates
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
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <input type="radio" name="audience" value={option.id} />
                    <div>
                      <p className="text-sm font-medium">{option.label}</p>
                      {option.count > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {option.count} recipient{option.count > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Delivery Channels */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Channels</CardTitle>
              <CardDescription>
                Choose how to send this announcement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {deliveryChannels.map((channel) => (
                <label
                  key={channel.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked={channel.enabled}
                      disabled={channel.id === 'sms' && urgencyLevel !== 'critical'}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {channel.icon} {channel.label}
                      </p>
                    </div>
                  </div>
                  {channel.enabled && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
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
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                <input type="radio" name="schedule" value="now" defaultChecked />
                <div>
                  <p className="text-sm font-medium">Send Immediately</p>
                  <p className="text-xs text-muted-foreground">Send right away</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                <input type="radio" name="schedule" value="later" />
                <div>
                  <p className="text-sm font-medium">Schedule for Later</p>
                  <p className="text-xs text-muted-foreground">Choose date and time</p>
                </div>
              </label>

              <div className="space-y-2 pl-8">
                <div>
                  <label className="text-xs font-medium mb-1 block">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Notice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                • Critical announcements will be sent via SMS in addition to push and email
              </p>
              <p>
                • Scheduled announcements can be edited or canceled before sending
              </p>
              <p>
                • All announcements are logged and can be viewed in the announcement history
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
