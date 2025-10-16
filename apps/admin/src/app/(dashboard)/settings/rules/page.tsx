import {
  FileText,
  Plus,
  Edit,
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
import {
  getVillageRules,
  getVillageRuleStats,
  getCategoryStats,
  type VillageRuleCategory,
} from '@/lib/actions/village-rules';
import { formatDistanceToNow } from 'date-fns';

const CATEGORY_LABELS: Record<VillageRuleCategory, string> = {
  noise: 'Noise & Disturbance',
  parking: 'Parking & Vehicles',
  pets: 'Pets & Animals',
  construction: 'Construction & Renovation',
  visitors: 'Visitors & Guests',
  general: 'General Rules',
};

const CATEGORY_COLORS: Record<VillageRuleCategory, string> = {
  noise: 'bg-blue-100 text-blue-800',
  parking: 'bg-green-100 text-green-800',
  pets: 'bg-purple-100 text-purple-800',
  construction: 'bg-orange-100 text-orange-800',
  visitors: 'bg-pink-100 text-pink-800',
  general: 'bg-gray-100 text-gray-800',
};

export default async function VillageRulesPage() {
  const [stats, rules, categoryStats] = await Promise.all([
    getVillageRuleStats(),
    getVillageRules(),
    getCategoryStats(),
  ]);

  const getStatusBadge = (publishedAt: string | null) => {
    return publishedAt ? (
      <Badge variant="default" className="bg-green-600">
        <CheckCircle className="mr-1 h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">Draft</Badge>
    );
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
        <Link href="/settings/rules/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Rule
          </Button>
        </Link>
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
            <div className="text-2xl font-bold">
              {stats.lastUpdated ? formatDistanceToNow(new Date(stats.lastUpdated), { addSuffix: true }) : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">Latest change</p>
          </CardContent>
        </Card>
      </div>

      {/* Rule Categories */}
      {categoryStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rule Categories</CardTitle>
            <CardDescription>Community rules organized by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categoryStats.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{CATEGORY_LABELS[cat.category]}</span>
                  </div>
                  <Badge variant="outline">{cat.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>All Rules</CardTitle>
          <CardDescription>Complete list of community rules and policies</CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No rules created</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first community rule to get started
              </p>
              <Link href="/settings/rules/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Rule
                </Button>
              </Link>
            </div>
          ) : (
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
                          {getStatusBadge(rule.published_at)}
                          <Badge variant="outline" className="text-xs">
                            v{rule.version}
                          </Badge>
                        </div>
                        <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[rule.category]}`}>
                          {CATEGORY_LABELS[rule.category]}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {rule.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Effective: {new Date(rule.effective_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Edit className="h-3 w-3" />
                          Updated: {formatDistanceToNow(new Date(rule.updated_at), { addSuffix: true })}
                        </span>
                        {rule.published_at && rule.requires_acknowledgment && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Acknowledged: {rule.acknowledgment_count || 0}
                          </span>
                        )}
                        <span>By: {rule.admin_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/settings/rules/${rule.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/settings/rules/${rule.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Management Guidelines</CardTitle>
          <CardDescription>Best practices for creating and managing village rules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Clear and Specific</p>
                <p className="text-muted-foreground">
                  Write rules in clear, unambiguous language that residents can easily understand
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Version Control</p>
                <p className="text-muted-foreground">
                  Maintain version history for all rule changes and updates
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Resident Acknowledgment</p>
                <p className="text-muted-foreground">
                  Require residents to acknowledge critical rule changes
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Effective Dates</p>
                <p className="text-muted-foreground">
                  Set appropriate effective dates to give residents time to adapt to new rules
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
