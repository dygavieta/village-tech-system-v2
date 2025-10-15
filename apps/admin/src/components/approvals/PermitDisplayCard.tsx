'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Construction, MapPin, User, FileText, CheckCircle2, XCircle, Clock, Users, Calendar, DollarSign } from 'lucide-react';

interface PermitDisplayData {
  id: string;
  project_type: string;
  description: string;
  start_date: string;
  duration_days: number;
  contractor_name: string | null;
  contractor_license_url: string | null;
  num_workers: number;
  materials_description: string | null;
  road_fee_amount: number;
  payment_status: string;
  permit_status: string;
  rejection_reason: string | null;
  created_at: string;
  approved_at: string | null;
  household: {
    id: string;
    property: {
      id: string;
      address: string;
      phase: string | null;
      block: string | null;
      lot: string | null;
    };
    household_head: {
      id: string;
      first_name: string;
      last_name: string;
      phone_number: string | null;
    };
  };
}

interface PermitDisplayCardProps {
  permit: PermitDisplayData;
  status: 'active' | 'completed' | 'rejected';
}

export function PermitDisplayCard({ permit, status }: PermitDisplayCardProps) {
  // Determine color based on actual permit status
  const getStatusColor = () => {
    if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'completed') return 'bg-green-50 text-green-700 border-green-200';

    // For active status prop, differentiate by actual permit_status
    switch (permit.permit_status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'active':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'on_hold':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getStatusIcon = () => {
    if (status === 'rejected') return <XCircle className="h-5 w-5 text-red-600" />;
    if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-600" />;

    // For active status prop, differentiate by actual permit_status
    switch (permit.permit_status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'active':
        return <Construction className="h-5 w-5 text-blue-600" />;
      case 'on_hold':
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <Construction className="h-5 w-5 text-blue-600" />;
    }
  };

  const statusColor = getStatusColor();
  const statusIcon = getStatusIcon();

  // Map actual permit_status to display labels
  const getStatusLabel = () => {
    if (status === 'rejected') return 'Rejected';
    if (status === 'completed') return 'Completed';

    // For 'active' status prop, show the actual permit status
    switch (permit.permit_status) {
      case 'approved':
        return 'Approved';
      case 'active':
        return 'Active';
      case 'on_hold':
        return 'On Hold';
      default:
        return 'Active';
    }
  };

  const statusLabel = getStatusLabel();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Construction className="h-5 w-5" />
              {permit.project_type.charAt(0).toUpperCase() + permit.project_type.slice(1)} Project
            </CardTitle>
            <CardDescription>
              Requested on {new Date(permit.created_at).toLocaleDateString()}
              {permit.approved_at && ` • ${statusLabel} on ${new Date(permit.approved_at).toLocaleDateString()}`}
            </CardDescription>
          </div>
          <Badge className={statusColor}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Banner */}
        <div className={`flex items-center gap-3 p-3 rounded-md border ${statusColor}`}>
          {statusIcon}
          <div className="flex-1">
            {status === 'active' && (
              <>
                <p className="font-medium">
                  {permit.permit_status === 'approved' && 'Permit Approved'}
                  {permit.permit_status === 'active' && 'Construction Active'}
                  {permit.permit_status === 'on_hold' && 'Construction On Hold'}
                </p>
                <p className="text-sm">
                  {permit.permit_status === 'approved' && 'Permit has been approved and construction can begin'}
                  {permit.permit_status === 'active' && 'Construction work is currently ongoing'}
                  {permit.permit_status === 'on_hold' && 'This project has been temporarily put on hold'}
                </p>
              </>
            )}
            {status === 'completed' && (
              <>
                <p className="font-medium">Project Completed</p>
                <p className="text-sm">Construction work has been finished</p>
              </>
            )}
            {status === 'rejected' && (
              <>
                <p className="font-medium">Request Rejected</p>
                {permit.rejection_reason && (
                  <p className="text-sm mt-1">Reason: {permit.rejection_reason}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Project Information</h4>
          <p className="text-sm text-muted-foreground">{permit.description}</p>
          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                <span className="text-muted-foreground">Start:</span>{' '}
                <span className="font-medium">
                  {new Date(permit.start_date).toLocaleDateString()}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                <span className="text-muted-foreground">Duration:</span>{' '}
                <span className="font-medium">{permit.duration_days} days</span>
              </span>
            </div>
          </div>
        </div>

        {/* Contractor Details */}
        {permit.contractor_name && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Contractor Information</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{permit.contractor_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Workers:</span>
                <span className="font-medium">{permit.num_workers}</span>
              </div>
              {permit.materials_description && (
                <div className="mt-2">
                  <span className="text-muted-foreground">Materials:</span>
                  <p className="text-sm mt-1">{permit.materials_description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Household Details */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Household Information
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Head:</span>
              <span className="font-medium">
                {permit.household.household_head.first_name}{' '}
                {permit.household.household_head.last_name}
              </span>
            </div>
            {permit.household.household_head.phone_number && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">
                  {permit.household.household_head.phone_number}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{permit.household.property.address}</span>
            </div>
            {permit.household.property.phase && (
              <div className="text-muted-foreground text-xs">
                Phase {permit.household.property.phase}
                {permit.household.property.block && `, Block ${permit.household.property.block}`}
                {permit.household.property.lot && `, Lot ${permit.household.property.lot}`}
              </div>
            )}
          </div>
        </div>

        {/* Documents */}
        {permit.contractor_license_url && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </h4>
            <a
              href={permit.contractor_license_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              View Contractor License →
            </a>
          </div>
        )}

        {/* Road Fee */}
        {status !== 'rejected' && permit.road_fee_amount > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Road Fee</p>
              <p className="text-lg font-bold">${permit.road_fee_amount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                Payment Status: {permit.payment_status}
              </p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Created {new Date(permit.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {permit.approved_at && (
              <>
                <span>•</span>
                <span>
                  {statusLabel} {new Date(permit.approved_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
