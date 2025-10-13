import {
  FileText,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle,
  Calendar,
  Tag,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function VillageRulesPage() {
  // TODO: Replace with actual data from Supabase
  const stats = {
    totalRules: 12,
    activeRules: 10,
    draftRules: 2,
    lastUpdated: '2 weeks ago',
  };

  const ruleCategories = [
    { name: 'Noise & Disturbance', count: 3, color: 'bg-blue-100 text-blue-800' },
    { name: 'Parking & Vehicles', count: 2, color: 'bg-green-100 text-green-800' },
    { name: 'Construction & Renovation', count: 2, color: 'bg-orange-100 text-orange-800' },
    { name: 'Pets & Animals', count: 2, color: 'bg-purple-100 text-purple-800' },
    { name: 'Visitors & Guests', count: 2, color: 'bg-pink-100 text-pink-800' },
    { name: 'Community Facilities', count: 1, color: 'bg-yellow-100 text-yellow-800' },
  ];

  const rules = [
    {
      id: 1,
      title: 'Quiet Hours Policy',
      category: 'Noise & Disturbance',
      description: 'All residents must observe quiet hours between 10:00 PM and 6:00 AM. Loud music, construction work, and other noise-generating activities are prohibited during these hours.',
      status: 'active' as const,
      effectiveDate: 'Jan 1, 2025',
      lastUpdated: '2 weeks ago',
      version: 'v2.0',
      acknowledged: 145,
      totalHouseholds: 150,
    },
    {
      id: 2,
      title: 'Vehicle Parking Guidelines',
      category: 'Parking & Vehicles',
      description: 'All vehicles must be parked in designated areas only. Street parking is allowed only in marked zones. Abandoned or unregistered vehicles will be towed.',
      status: 'active' as const,
      effectiveDate: 'Mar 15, 2025',
      lastUpdated: '1 month ago',
      version: 'v1.0',
      acknowledged: 142,
      totalHouseholds: 150,
    },
    {
      id: 3,
      title: 'Construction Work Schedule',
      category: 'Construction & Renovation',
      description: 'Construction and renovation work is permitted Monday to Saturday, 8:00 AM to 5:00 PM only. All construction projects require prior approval and valid permits.',
      status: 'active' as const,
      effectiveDate: 'Feb 1, 2025',
      lastUpdated: '3 weeks ago',
      version: 'v1.5',
      acknowledged: 138,
      totalHouseholds: 150,
    },
    {
      id: 4,
      title: 'Pet Registration and Leash Policy',
      category: 'Pets & Animals',
      description: 'All pets must be registered with the HOA. Dogs must be on a leash at all times when outside the residence. Pet owners are responsible for cleaning up after their pets.',
      status: 'active' as const,
      effectiveDate: 'Jan 1, 2025',
      lastUpdated: '2 months ago',
      version: 'v1.0',
      acknowledged: 89,
      totalHouseholds: 150,
    },
    {
      id: 5,
      title: 'Guest Registration Requirements (Draft)',
      category: 'Visitors & Guests',
      description: 'All overnight guests must be registered at least 24 hours in advance. Day visitors can be pre-registered or approved at the gate. Extended stays (more than 7 days) require HOA approval.',
      status: 'draft' as const,
      effectiveDate: 'Dec 1, 2025',
      lastUpdated: '5 days ago',
      version: 'v1.0-draft',
      acknowledged: 0,
      totalHouseholds: 150,
    },
  ];

  const getStatusBadge = (status: 'active' | 'draft') => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-600">
        <CheckCircle className="mr-1 h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">
        Draft
      </Badge>
    );
  };

  const getAcknowledgmentProgress = (acknowledged: number, total: number) => {
    const percentage = Math.round((acknowledged / total) * 100);
    return `${acknowledged}/${total} (${percentage}%)`;
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
            <h1 className="text-3xl font-bold tracking-tight">Village Rules</h1>
            <p className="text-muted-foreground">
              Manage community policies, regulations, and guidelines
            </p>
          </div>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New Rule
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRules}</div>
            <p className="text-xs text-muted-foreground">Community policies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRules}</div>
            <p className="text-xs text-muted-foreground">Currently enforced</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Rules</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftRules}</div>
            <p className="text-xs text-muted-foreground">Under review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lastUpdated}</div>
            <p className="text-xs text-muted-foreground">Latest change</p>
          </CardContent>
        </Card>
      </div>

      {/* Rule Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Categories</CardTitle>
          <CardDescription>
            Community rules organized by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ruleCategories.map((category, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{category.name}</span>
                </div>
                <Badge variant="outline">{category.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>All Rules</CardTitle>
          <CardDescription>
            Complete list of community rules and policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-start justify-between border rounded-lg p-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{rule.title}</p>
                        {getStatusBadge(rule.status)}
                        <Badge variant="outline" className="text-xs">
                          {rule.version}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs mb-2">
                        {rule.category}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{rule.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Effective: {rule.effectiveDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Edit className="h-3 w-3" />
                        Updated: {rule.lastUpdated}
                      </span>
                      {rule.status === 'active' && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Acknowledged: {getAcknowledgmentProgress(rule.acknowledged, rule.totalHouseholds)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Management Guidelines</CardTitle>
          <CardDescription>
            Best practices for creating and managing village rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Clear and Specific</p>
                <p className="text-muted-foreground">Write rules in clear, unambiguous language that residents can easily understand</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Version Control</p>
                <p className="text-muted-foreground">Maintain version history for all rule changes and updates</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Resident Acknowledgment</p>
                <p className="text-muted-foreground">Require residents to acknowledge critical rule changes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Effective Dates</p>
                <p className="text-muted-foreground">Set appropriate effective dates to give residents time to adapt to new rules</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
