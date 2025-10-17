'use client';

/**
 * Gates Tab Content Component
 *
 * Client component for gates tab with Add, Edit, Delete Gate functionality
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DoorOpen, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddGateDialog } from './AddGateDialog';
import { EditGateDialog } from './EditGateDialog';

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

export function GatesTabContent({ tenantId, gates: initialGates }: GatesTabContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [gates, setGates] = useState<Gate[]>(initialGates);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);

  const openEditDialog = (gate: Gate) => {
    setSelectedGate(gate);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (gate: Gate) => {
    setSelectedGate(gate);
    setIsDeleteDialogOpen(true);
  };

  const fetchGates = async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/gates`);
      const data = await response.json();

      if (response.ok) {
        setGates(data.gates);
        // Force a re-render by incrementing the refresh key
        setRefreshKey(prev => prev + 1);
      } else {
        console.error('API error:', data);
        toast({
          title: 'Error',
          description: 'Failed to fetch gates',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching gates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch gates',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGate = async () => {
    if (!selectedGate) return;

    try {
      const response = await fetch(`/api/gates/${selectedGate.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Gate deleted successfully',
        });
        setIsDeleteDialogOpen(false);
        setSelectedGate(null);
        await fetchGates();
        router.refresh();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete gate',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting gate:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete gate',
        variant: 'destructive',
      });
    }
  };

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

      <div key={refreshKey}>
        {gates.length > 0 ? (
        <div className="space-y-4">
          {gates.map((gate) => (
            <div
              key={gate.id}
              className="flex items-start justify-between rounded-lg border p-4"
            >
              <div className="space-y-1 flex-1">
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
              <div className="flex items-center gap-2">
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
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(gate)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(gate)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
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
      </div>

      <AddGateDialog
        tenantId={tenantId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchGates}
      />

      {/* Edit Dialog */}
      {selectedGate && (
        <EditGateDialog
          gateId={selectedGate.id}
          initialData={{
            name: selectedGate.name,
            gate_type: selectedGate.gate_type as any,
            operating_hours_start: selectedGate.operating_hours_start || '',
            operating_hours_end: selectedGate.operating_hours_end || '',
            rfid_reader_serial: selectedGate.rfid_reader_serial || '',
          }}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={fetchGates}
        />
      )}

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Gate</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedGate?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGate}>
              Delete Gate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
