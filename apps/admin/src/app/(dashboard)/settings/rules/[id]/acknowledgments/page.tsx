/**
 * T151b: Rule Acknowledgment Tracking Page
 * Display residents who acknowledged a rule and send reminders to non-responders
 */

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Send,
  Users,
  FileText,
  Calendar,
  Mail,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/server';

interface RuleAcknowledgmentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RuleAcknowledgmentPage({
  params,
}: RuleAcknowledgmentPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get user's tenant
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id, user_role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin_head', 'admin_officer'].includes(profile.user_role)) {
    redirect('/');
  }

  // Fetch rule details
  const { data: rule, error: ruleError } = await supabase
    .from('village_rules')
    .select(
      `
      *,
      created_by:user_profiles!created_by_admin_id(full_name, email)
    `
    )
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (ruleError || !rule) {
    notFound();
  }

  // Fetch all households in the tenant
  const { data: households, error: householdsError } = await supabase
    .from('households')
    .select(
      `
      id,
      household_head:user_profiles!household_head_id(id, full_name, email, phone),
      property:properties!property_id(block, lot_number, phase)
    `
    )
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'active');

  if (householdsError) {
    console.error('Error fetching households:', householdsError);
  }

  // Fetch acknowledgments for this rule
  const { data: acknowledgments } = await supabase
    .from('rule_acknowledgments')
    .select(
      `
      *,
      user:user_profiles!user_id(id, full_name, email, phone)
    `
    )
    .eq('rule_id', id);

  const acknowledgedUserIds = new Set(acknowledgments?.map((ack) => ack.user_id) || []);

  // Separate acknowledged and pending
  const acknowledgedHouseholds = households?.filter((h) =>
    acknowledgedUserIds.has(h.household_head?.id)
  ) || [];

  const pendingHouseholds = households?.filter(
    (h) => !acknowledgedUserIds.has(h.household_head?.id)
  ) || [];

  const totalHouseholds = households?.length || 0;
  const acknowledgedCount = acknowledgedHouseholds.length;
  const pendingCount = pendingHouseholds.length;
  const percentage = totalHouseholds > 0 ? Math.round((acknowledgedCount / totalHouseholds) * 100) : 0;

  // Get acknowledgment timestamp for each household
  const getAcknowledgmentTime = (userId: string) => {
    const ack = acknowledgments?.find((a) => a.user_id === userId);
    return ack ? format(new Date(ack.acknowledged_at), 'MMM d, yyyy h:mm a') : null;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      noise: 'Noise & Disturbance',
      parking: 'Parking & Vehicles',
      pets: 'Pets & Animals',
      construction: 'Construction & Renovation',
      visitors: 'Visitors & Guests',
      curfew: 'Curfew & Hours',
      general: 'General Rules',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Link href={`/settings/rules`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rules
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Rule Acknowledgments</h1>
          <p className="text-muted-foreground">Track resident acknowledgment status</p>
        </div>
      </div>

      {/* Rule Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {rule.title}
              </CardTitle>
              <CardDescription className="mt-2">
                Version {rule.version} • {getCategoryLabel(rule.category)}
              </CardDescription>
            </div>
            <Badge variant={rule.requires_acknowledgment ? 'default' : 'secondary'}>
              {rule.requires_acknowledgment ? 'Requires Acknowledgment' : 'Optional'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              <span className="font-medium">Effective Date:</span>{' '}
              {format(new Date(rule.effective_date), 'MMMM d, yyyy')}
            </p>
            {rule.published_at && (
              <p>
                <span className="font-medium">Published:</span>{' '}
                {format(new Date(rule.published_at), 'MMMM d, yyyy h:mm a')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Households</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHouseholds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{acknowledgedCount}</div>
            <p className="text-xs text-muted-foreground">{percentage}% complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalHouseholds > 0 ? Math.round((pendingCount / totalHouseholds) * 100) : 0}% remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{percentage}%</div>
            <Progress value={percentage} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Pending Residents */}
      {pendingCount > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Pending Acknowledgments ({pendingCount})
                </CardTitle>
                <CardDescription>Residents who have not yet acknowledged this rule</CardDescription>
              </div>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Send Reminders
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Household Head</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingHouseholds.map((household) => (
                    <TableRow key={household.id}>
                      <TableCell className="font-medium">
                        {household.household_head?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {household.property?.phase && `Phase ${household.property.phase} • `}
                        Block {household.property?.block} Lot {household.property?.lot_number}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {household.household_head?.email || 'No email'}
                          </p>
                          {household.household_head?.phone && (
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              {household.household_head.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Send className="h-4 w-4 mr-2" />
                          Send Reminder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acknowledged Residents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Acknowledged ({acknowledgedCount})
          </CardTitle>
          <CardDescription>Residents who have acknowledged this rule</CardDescription>
        </CardHeader>
        <CardContent>
          {acknowledgedCount === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No acknowledgments yet</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Household Head</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Acknowledged At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acknowledgedHouseholds.map((household) => (
                    <TableRow key={household.id}>
                      <TableCell className="font-medium">
                        {household.household_head?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {household.property?.phase && `Phase ${household.property.phase} • `}
                        Block {household.property?.block} Lot {household.property?.lot_number}
                      </TableCell>
                      <TableCell>
                        {getAcknowledgmentTime(household.household_head?.id || '')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Acknowledged
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder Settings</CardTitle>
          <CardDescription>Configure automatic reminders for non-responders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Send email reminders every 3 days to non-responders
                </p>
              </div>
            </div>
            <Badge variant="outline">Enabled</Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">SMS Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Send SMS for critical rules after 7 days
                </p>
              </div>
            </div>
            <Badge variant="outline">Enabled</Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">In-App Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Show persistent banner in resident app until acknowledged
                </p>
              </div>
            </div>
            <Badge variant="outline">Enabled</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
