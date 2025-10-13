'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VehicleSticker {
  id: string;
  vehicle_plate: string;
  vehicle_make: string | null;
  vehicle_color: string | null;
  sticker_type: string;
  status: string;
  rfid_serial: string | null;
  issue_date: string | null;
  expiry_date: string | null;
}

interface HouseholdStickerListProps {
  stickers: VehicleSticker[];
  stickerAllocation: number;
}

export function HouseholdStickerList({ stickers, stickerAllocation }: HouseholdStickerListProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'issued':
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'expired':
      case 'deactivated':
      case 'lost':
        return 'destructive';
      case 'ready_for_pickup':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusDisplay = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const activeStickers = stickers.filter(
    (s) => s.status === 'issued' || s.status === 'approved' || s.status === 'ready_for_pickup'
  );
  const pendingStickers = stickers.filter((s) => s.status === 'pending');
  const inactiveStickers = stickers.filter(
    (s) => s.status === 'expired' || s.status === 'deactivated' || s.status === 'lost'
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Stickers
            </CardTitle>
            <CardDescription>
              {stickers.length} of {stickerAllocation} stickers used
            </CardDescription>
          </div>
          <Badge variant={stickers.length < stickerAllocation ? 'outline' : 'secondary'}>
            {stickerAllocation - stickers.length} remaining
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warnings */}
        {stickers.some((s) => isExpiringSoon(s.expiry_date)) && (
          <Alert variant="default" className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              {stickers.filter((s) => isExpiringSoon(s.expiry_date)).length} sticker
              {stickers.filter((s) => isExpiringSoon(s.expiry_date)).length !== 1 ? 's' : ''}{' '}
              expiring within 30 days
            </AlertDescription>
          </Alert>
        )}

        {stickers.length === 0 ? (
          <div className="text-center py-8">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No vehicle stickers registered</p>
            <p className="text-sm text-muted-foreground mt-1">
              Household can request up to {stickerAllocation} stickers
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate Number</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>RFID Serial</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stickers.map((sticker) => {
                const expiring = isExpiringSoon(sticker.expiry_date);
                const expired = isExpired(sticker.expiry_date);

                return (
                  <TableRow key={sticker.id} className={expired ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">{sticker.vehicle_plate}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{sticker.vehicle_make || 'N/A'}</div>
                        {sticker.vehicle_color && (
                          <div className="text-xs text-muted-foreground">
                            {sticker.vehicle_color}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {sticker.rfid_serial ? (
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {sticker.rfid_serial}
                        </code>
                      ) : (
                        <span className="text-muted-foreground text-sm">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {sticker.sticker_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(sticker.status)}>
                        {getStatusDisplay(sticker.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sticker.issue_date
                        ? new Date(sticker.issue_date).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {sticker.expiry_date ? (
                        <div className="space-y-1">
                          <div
                            className={
                              expired
                                ? 'text-red-600 font-medium'
                                : expiring
                                ? 'text-orange-600 font-medium'
                                : ''
                            }
                          >
                            {new Date(sticker.expiry_date).toLocaleDateString()}
                          </div>
                          {expiring && !expired && (
                            <div className="text-xs text-orange-600">Expiring soon</div>
                          )}
                          {expired && <div className="text-xs text-red-600">Expired</div>}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Summary Statistics */}
        {stickers.length > 0 && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{activeStickers.length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{pendingStickers.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{inactiveStickers.length}</p>
              <p className="text-sm text-muted-foreground">Inactive</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
