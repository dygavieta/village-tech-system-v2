'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, MapPin, User, FileText, CheckCircle2, XCircle, Hash, Calendar } from 'lucide-react';

interface StickerDisplayData {
  id: string;
  vehicle_plate: string;
  vehicle_make: string | null;
  vehicle_color: string | null;
  sticker_type: string;
  status: string;
  rfid_serial: string | null;
  or_cr_document_url: string | null;
  created_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
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

interface StickerDisplayCardProps {
  sticker: StickerDisplayData;
  status: 'approved' | 'rejected';
}

export function StickerDisplayCard({ sticker, status }: StickerDisplayCardProps) {
  const statusColors = {
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  const statusIcons = {
    approved: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    rejected: <XCircle className="h-5 w-5 text-red-600" />,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              {sticker.vehicle_plate}
            </CardTitle>
            <CardDescription>
              Requested on {new Date(sticker.created_at).toLocaleDateString()}
              {sticker.approved_at && ` • ${status.charAt(0).toUpperCase() + status.slice(1)} on ${new Date(sticker.approved_at).toLocaleDateString()}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{sticker.sticker_type.replace('_', ' ')}</Badge>
            <Badge className={statusColors[status]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Banner */}
        <div className={`flex items-center gap-3 p-3 rounded-md border ${statusColors[status]}`}>
          {statusIcons[status]}
          <div className="flex-1">
            {status === 'approved' && (
              <>
                <p className="font-medium">Sticker Approved</p>
                <p className="text-sm">This vehicle has been granted access with RFID serial</p>
              </>
            )}
            {status === 'rejected' && (
              <>
                <p className="font-medium">Request Rejected</p>
                {sticker.rejection_reason && (
                  <p className="text-sm mt-1">Reason: {sticker.rejection_reason}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* RFID Serial (for approved) */}
        {status === 'approved' && sticker.rfid_serial && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md border border-blue-200">
            <Hash className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">RFID Serial</p>
              <p className="text-lg font-mono font-bold text-blue-700">{sticker.rfid_serial}</p>
            </div>
          </div>
        )}

        {/* Vehicle Details */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Vehicle Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Make:</span>{' '}
              <span className="font-medium">{sticker.vehicle_make || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Color:</span>{' '}
              <span className="font-medium">{sticker.vehicle_color || 'N/A'}</span>
            </div>
          </div>
        </div>

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
                {sticker.household.household_head.first_name}{' '}
                {sticker.household.household_head.last_name}
              </span>
            </div>
            {sticker.household.household_head.phone_number && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">
                  {sticker.household.household_head.phone_number}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{sticker.household.property.address}</span>
            </div>
            {sticker.household.property.phase && (
              <div className="text-muted-foreground text-xs">
                Phase {sticker.household.property.phase}
                {sticker.household.property.block && `, Block ${sticker.household.property.block}`}
                {sticker.household.property.lot && `, Lot ${sticker.household.property.lot}`}
              </div>
            )}
          </div>
        </div>

        {/* Documents */}
        {sticker.or_cr_document_url && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </h4>
            <a
              href={sticker.or_cr_document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              View OR/CR Document →
            </a>
          </div>
        )}

        {/* Timeline */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Created {new Date(sticker.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {sticker.approved_at && (
              <>
                <span>•</span>
                <span>
                  {status.charAt(0).toUpperCase() + status.slice(1)} {new Date(sticker.approved_at).toLocaleDateString('en-US', {
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
