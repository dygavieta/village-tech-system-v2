/**
 * T157: Incident Detail Page
 * View incident details, evidence, and resolution status
 */

import { Suspense } from 'react';
import { notFound, redirect } from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Shield,
  Clock,
  Camera,
  CheckCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { ResolveIncidentForm } from '@/components/incidents/ResolveIncidentForm';

interface IncidentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function IncidentDetailPage({
  params,
}: IncidentDetailPageProps) {
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

  // Fetch incident details with related data
  const { data: incident, error } = await supabase
    .from('incidents')
    .select(
      `
      *,
      reported_by:user_profiles!reported_by_security_id(full_name, email),
      resolved_by:user_profiles!resolved_by_admin_id(full_name, email),
      location_gate:gates!location_gate_id(name),
      location_property:properties!location_property_id(block, lot_number)
    `
    )
    .eq('id', id)
    .single();

  if (error || !incident) {
    notFound();
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-orange-600 bg-orange-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported':
        return (
          <Badge variant="secondary">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Reported
          </Badge>
        );
      case 'responding':
        return (
          <Badge variant="default" className="bg-blue-600">
            <Clock className="mr-1 h-3 w-3" />
            Responding
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Resolved
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLocation = () => {
    if (incident.location_gate) {
      return incident.location_gate.name;
    } else if (incident.location_property) {
      return `Block ${incident.location_property.block} Lot ${incident.location_property.lot_number}`;
    }
    return 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link href="/monitoring/incidents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {incident.incident_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </h1>
          <p className="text-muted-foreground">
            Reported {format(new Date(incident.created_at), 'MMM d, yyyy \'at\' h:mm a')}
          </p>
        </div>
        {getStatusBadge(incident.status)}
      </div>

      {/* Incident Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Incident Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${getSeverityColor(incident.severity)}`} />
                Incident Details
              </CardTitle>
              <CardDescription>
                Complete information about this security incident
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {incident.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Incident Type</p>
                  <Badge variant="outline">
                    {incident.incident_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Severity</p>
                  <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                    {incident.severity}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {getLocation()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reported By</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {incident.reported_by?.full_name || 'Security Officer'}
                  </p>
                </div>
              </div>

              {incident.evidence_photo_urls && incident.evidence_photo_urls.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Evidence Photos ({incident.evidence_photo_urls.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {incident.evidence_photo_urls.map((url: string, index: number) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg border bg-muted flex items-center justify-center"
                      >
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolution */}
          {incident.status === 'resolved' && incident.resolution_notes && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <CheckCircle className="h-5 w-5" />
                  Resolution
                </CardTitle>
                <CardDescription className="text-green-700">
                  This incident has been resolved
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-green-900 mb-1">Resolution Notes</p>
                  <p className="text-sm text-green-800 whitespace-pre-wrap">
                    {incident.resolution_notes}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-green-200">
                  <div>
                    <p className="text-xs text-green-700 mb-1">Resolved By</p>
                    <p className="text-sm font-medium text-green-900">
                      {incident.resolved_by?.full_name || 'Admin'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 mb-1">Resolved At</p>
                    <p className="text-sm font-medium text-green-900">
                      {incident.resolved_at
                        ? format(new Date(incident.resolved_at), 'MMM d, yyyy \'at\' h:mm a')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resolve Form (if not resolved) */}
          {incident.status !== 'resolved' && (
            <Card>
              <CardHeader>
                <CardTitle>Resolve Incident</CardTitle>
                <CardDescription>
                  Add resolution notes and mark this incident as resolved
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading form...</div>}>
                  <ResolveIncidentForm incidentId={incident.id} />
                </Suspense>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <div className="w-px flex-1 bg-border" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium">Incident Reported</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(incident.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                </div>

                {incident.status === 'responding' || incident.status === 'resolved' ? (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                      {incident.status === 'resolved' && <div className="w-px flex-1 bg-border" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">Response Initiated</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(incident.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                      </p>
                    </div>
                  </div>
                ) : null}

                {incident.status === 'resolved' && incident.resolved_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Incident Resolved</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(incident.resolved_at), 'MMM d, yyyy \'at\' h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Camera className="mr-2 h-4 w-4" />
                Add Evidence
              </Button>
              {incident.status !== 'resolved' && (
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Escalate
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
