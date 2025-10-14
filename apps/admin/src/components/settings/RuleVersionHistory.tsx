'use client';

/**
 * T151a: RuleVersionHistory Component
 * Display version history for village rules with diff viewer and rollback capability
 */

import { useState } from 'react';
import { format } from 'date-fns';
import {
  History,
  Eye,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  User,
  Tag,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RuleVersion {
  id: string;
  version: number;
  title: string;
  category: string;
  description: string;
  effective_date: string;
  published_at: string | null;
  requires_acknowledgment: boolean;
  created_by: {
    full_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  acknowledgment_count?: number;
  total_residents?: number;
}

interface RuleVersionHistoryProps {
  ruleId: string;
  currentVersion: number;
  versions: RuleVersion[];
  onRollback?: (versionId: string, version: number) => Promise<void>;
  isLoading?: boolean;
}

const CATEGORY_LABELS = {
  noise: 'Noise & Disturbance',
  parking: 'Parking & Vehicles',
  pets: 'Pets & Animals',
  construction: 'Construction & Renovation',
  visitors: 'Visitors & Guests',
  curfew: 'Curfew & Hours',
  general: 'General Rules',
};

export function RuleVersionHistory({
  ruleId,
  currentVersion,
  versions,
  onRollback,
  isLoading = false,
}: RuleVersionHistoryProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState<{ v1: RuleVersion | null; v2: RuleVersion | null }>({
    v1: null,
    v2: null,
  });

  const toggleExpand = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const handleRollback = async (version: RuleVersion) => {
    if (!onRollback) return;

    const confirmed = window.confirm(
      `Are you sure you want to rollback to version ${version.version}? This will create a new version (v${currentVersion + 1}) with the content from v${version.version}.`
    );

    if (confirmed) {
      await onRollback(version.id, version.version);
    }
  };

  const getVersionBadge = (version: RuleVersion) => {
    if (version.version === currentVersion) {
      return (
        <Badge variant="default" className="bg-green-600">
          Current Version
        </Badge>
      );
    }
    if (!version.published_at) {
      return <Badge variant="secondary">Draft</Badge>;
    }
    return <Badge variant="outline">v{version.version}</Badge>;
  };

  const getDiffHighlight = (oldText: string, newText: string): 'added' | 'removed' | 'changed' | 'same' => {
    if (oldText === newText) return 'same';
    if (!oldText) return 'added';
    if (!newText) return 'removed';
    return 'changed';
  };

  const renderDiffView = () => {
    if (!compareMode.v1 || !compareMode.v2) return null;

    const v1 = compareMode.v1;
    const v2 = compareMode.v2;

    return (
      <Dialog open={!!compareMode.v1} onOpenChange={() => setCompareMode({ v1: null, v2: null })}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
            <DialogDescription>
              Comparing v{v1.version} with v{v2.version}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Version 1 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Version {v1.version}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(v1.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-xs text-muted-foreground mb-1">Title</p>
                  <p className={v1.title !== v2.title ? 'bg-red-50 p-2 rounded' : ''}>{v1.title}</p>
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground mb-1">Category</p>
                  <Badge variant="outline">
                    {CATEGORY_LABELS[v1.category as keyof typeof CATEGORY_LABELS] || v1.category}
                  </Badge>
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground mb-1">Description</p>
                  <p
                    className={
                      v1.description !== v2.description
                        ? 'bg-red-50 p-2 rounded whitespace-pre-wrap'
                        : 'whitespace-pre-wrap'
                    }
                  >
                    {v1.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Version 2 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Version {v2.version}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(v2.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-xs text-muted-foreground mb-1">Title</p>
                  <p className={v1.title !== v2.title ? 'bg-green-50 p-2 rounded' : ''}>{v2.title}</p>
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground mb-1">Category</p>
                  <Badge variant="outline">
                    {CATEGORY_LABELS[v2.category as keyof typeof CATEGORY_LABELS] || v2.category}
                  </Badge>
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground mb-1">Description</p>
                  <p
                    className={
                      v1.description !== v2.description
                        ? 'bg-green-50 p-2 rounded whitespace-pre-wrap'
                        : 'whitespace-pre-wrap'
                    }
                  >
                    {v2.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setCompareMode({ v1: null, v2: null })}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Version History
        </CardTitle>
        <CardDescription>
          Track changes and rollback to previous versions if needed
        </CardDescription>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No version history available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version, index) => {
              const isExpanded = expandedVersions.has(version.id);
              const previousVersion = versions[index + 1];

              return (
                <Card key={version.id} className={version.version === currentVersion ? 'border-green-500' : ''}>
                  <CardContent className="pt-4">
                    {/* Version Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">Version {version.version}</h4>
                            {getVersionBadge(version)}
                            {version.requires_acknowledgment && (
                              <Badge variant="outline" className="text-xs">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Requires Ack
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{version.title}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(version.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Version Meta Info */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {version.created_by?.full_name || 'Admin'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {CATEGORY_LABELS[version.category as keyof typeof CATEGORY_LABELS] || version.category}
                      </span>
                    </div>

                    {/* Acknowledgment Stats */}
                    {version.requires_acknowledgment &&
                      version.acknowledgment_count !== undefined &&
                      version.total_residents !== undefined && (
                        <div className="mb-3 p-2 bg-muted rounded text-xs">
                          <span className="font-medium">Acknowledgments:</span>{' '}
                          {version.acknowledgment_count} / {version.total_residents} residents (
                          {Math.round((version.acknowledgment_count / version.total_residents) * 100)}%)
                        </div>
                      )}

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Description</p>
                          <p className="text-sm whitespace-pre-wrap">{version.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Effective Date</p>
                            <p className="text-sm">{format(new Date(version.effective_date), 'MMM d, yyyy')}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Published</p>
                            <p className="text-sm">
                              {version.published_at
                                ? format(new Date(version.published_at), 'MMM d, yyyy h:mm a')
                                : 'Not published'}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t">
                          {previousVersion && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCompareMode({ v1: previousVersion, v2: version })}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Compare with v{previousVersion.version}
                            </Button>
                          )}
                          {version.version !== currentVersion && onRollback && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRollback(version)}
                              disabled={isLoading}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Rollback to this version
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Diff Viewer Dialog */}
        {renderDiffView()}
      </CardContent>
    </Card>
  );
}
