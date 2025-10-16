import {
  FileText,
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertCircle,
  User,
  Edit,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getVillageRuleById, type VillageRuleCategory } from '@/lib/actions/village-rules';
import { formatDistanceToNow } from 'date-fns';
import DeleteVillageRuleButton from '@/components/village-rules/DeleteVillageRuleButton';

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

export default async function VillageRuleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const rule = await getVillageRuleById(params.id);

  if (!rule) {
    notFound();
  }

  const isPublished = !!rule.published_at;
  const isEffective = new Date(rule.effective_date) <= new Date();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings/rules">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Village Rules
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/settings/rules/${rule.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <DeleteVillageRuleButton ruleId={rule.id} ruleTitle={rule.title} />
        </div>
      </div>

      {/* Rule Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl">{rule.title}</CardTitle>
                  <Badge variant={isPublished ? 'default' : 'secondary'} className={isPublished ? 'bg-green-600' : ''}>
                    {isPublished ? (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </>
                    ) : (
                      'Draft'
                    )}
                  </Badge>
                  <Badge variant="outline">v{rule.version}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[rule.category]}`}>
                    <Tag className="h-3 w-3 mr-1" />
                    {CATEGORY_LABELS[rule.category]}
                  </Badge>
                </div>
                <CardDescription className="mt-2">
                  Created {formatDistanceToNow(new Date(rule.created_at), { addSuffix: true })}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Indicator */}
      {!isPublished && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Draft Status</p>
                <p className="text-sm text-orange-700 mt-1">
                  This rule is currently a draft and is not visible to residents. Edit and publish to make it active.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isPublished && !isEffective && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Scheduled</p>
                <p className="text-sm text-blue-700 mt-1">
                  This rule will become effective on {new Date(rule.effective_date).toLocaleDateString()}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rule Content */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{rule.description}</p>
        </CardContent>
      </Card>

      {/* Rule Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates & Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Effective Date</p>
              <p className="text-sm font-semibold">
                {new Date(rule.effective_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {isPublished && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Published</p>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(rule.published_at!), { addSuffix: true })}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
              <p className="text-sm">
                {formatDistanceToNow(new Date(rule.updated_at), { addSuffix: true })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Settings & Acknowledgment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Created By</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <p className="text-sm">{rule.admin_name}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Requires Acknowledgment</p>
              <div className="flex items-center gap-2">
                {rule.requires_acknowledgment ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm">Yes - Residents must acknowledge</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">No acknowledgment required</p>
                  </>
                )}
              </div>
            </div>
            {isPublished && rule.requires_acknowledgment && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Acknowledgments</p>
                <p className="text-sm font-semibold">{rule.acknowledgment_count || 0} residents</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Info */}
      {isPublished && isEffective && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Active Rule</p>
                <p className="text-sm text-green-700 mt-1">
                  This rule is currently active and visible to all residents. Residents
                  {rule.requires_acknowledgment ? ' must acknowledge they have read this rule.' : ' can view this rule in their app.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
