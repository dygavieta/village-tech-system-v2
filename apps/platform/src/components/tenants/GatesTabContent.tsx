'use client';

/**
 * Gates Tab Content Component
 *
 * Client component for gates tab with Add Gate functionality
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, Plus } from 'lucide-react';
import { AddGateDialog } from './AddGateDialog';

interface Gate {
  id: string;
  name: string;
  gate_type: string;
  status?: string;
  operating_hours_start?: string;
  operating_hours_end?: string;
  rfid_reader_serial?: string;
}

interface GatesTabContentProps {
  tenantId: string;
  gates: Gate[];
}

export function GatesTabContent({ tenantId, gates }: GatesTabContentProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Entry points and access control
        </p>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Gate
        </Button>
      </div>

      {gates.length > 0 ? (
        <div className="space-y-4">
          {gates.map((gate) => (
            <div
              key={gate.id}
              className="flex items-start justify-between rounded-lg border p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DoorOpen className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">{gate.name}</h4>
                  <Badge variant="secondary" className="capitalize">
                    {gate.gate_type}
                  </Badge>
                </div>
                {(gate.operating_hours_start || gate.operating_hours_end) && (
                  <p className="text-sm text-muted-foreground">
                    Operating Hours: {gate.operating_hours_start || '00:00'} - {gate.operating_hours_end || '23:59'}
                  </p>
                )}
                {gate.rfid_reader_serial && (
                  <p className="text-sm text-muted-foreground">
                    RFID Reader: <code className="bg-muted px-1 rounded">{gate.rfid_reader_serial}</code>
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className={
                  gate.status === 'active'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }
              >
                {gate.status || 'active'}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <DoorOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No gates configured yet</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Gate
          </Button>
        </div>
      )}

      <AddGateDialog
        tenantId={tenantId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </>
  );
}
