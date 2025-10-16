'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createGate, updateGate, type CreateGateInput } from '@/lib/actions/gates';
import { Loader2 } from 'lucide-react';

interface GateFormProps {
  gateId?: string;
  initialData?: Partial<CreateGateInput>;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function GateForm({ gateId, initialData, mode = 'create', onSuccess, onCancel }: GateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateGateInput>({
    name: initialData?.name || '',
    gate_type: initialData?.gate_type || 'primary',
    status: initialData?.status || 'active',
    operating_hours_start: initialData?.operating_hours_start || '',
    operating_hours_end: initialData?.operating_hours_end || '',
    gps_lat: initialData?.gps_lat || undefined,
    gps_lng: initialData?.gps_lng || undefined,
    rfid_reader_serial: initialData?.rfid_reader_serial || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Clean up empty optional fields
      const cleanData: Partial<CreateGateInput> = {
        name: formData.name,
        gate_type: formData.gate_type,
        status: formData.status,
      };

      if (formData.operating_hours_start) {
        cleanData.operating_hours_start = formData.operating_hours_start;
      }
      if (formData.operating_hours_end) {
        cleanData.operating_hours_end = formData.operating_hours_end;
      }
      if (formData.gps_lat) {
        cleanData.gps_lat = formData.gps_lat;
      }
      if (formData.gps_lng) {
        cleanData.gps_lng = formData.gps_lng;
      }
      if (formData.rfid_reader_serial) {
        cleanData.rfid_reader_serial = formData.rfid_reader_serial;
      }

      if (mode === 'edit' && gateId) {
        await updateGate(gateId, cleanData);
      } else {
        await createGate(cleanData as CreateGateInput);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/settings/gates');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} gate`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Configure the gate's basic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Gate Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Main Gate, North Entrance"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gate_type">Gate Type *</Label>
              <Select
                value={formData.gate_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, gate_type: value as CreateGateInput['gate_type'] })
                }
              >
                <SelectTrigger id="gate_type">
                  <SelectValue placeholder="Select gate type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary Gate</SelectItem>
                  <SelectItem value="secondary">Secondary Gate</SelectItem>
                  <SelectItem value="service">Service Gate</SelectItem>
                  <SelectItem value="emergency">Emergency Gate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as CreateGateInput['status'] })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operating Hours</CardTitle>
          <CardDescription>Set the gate's operating schedule (leave empty for 24/7)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operating_hours_start">Start Time</Label>
              <Input
                id="operating_hours_start"
                type="time"
                value={formData.operating_hours_start}
                onChange={(e) =>
                  setFormData({ ...formData, operating_hours_start: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operating_hours_end">End Time</Label>
              <Input
                id="operating_hours_end"
                type="time"
                value={formData.operating_hours_end}
                onChange={(e) =>
                  setFormData({ ...formData, operating_hours_end: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location & Equipment</CardTitle>
          <CardDescription>Configure GPS coordinates and RFID reader</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gps_lat">GPS Latitude</Label>
              <Input
                id="gps_lat"
                type="number"
                step="any"
                placeholder="14.5995"
                value={formData.gps_lat || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gps_lat: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gps_lng">GPS Longitude</Label>
              <Input
                id="gps_lng"
                type="number"
                step="any"
                placeholder="120.9842"
                value={formData.gps_lng || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gps_lng: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rfid_reader_serial">RFID Reader Serial Number</Label>
            <Input
              id="rfid_reader_serial"
              placeholder="e.g., RFID-001-MG"
              value={formData.rfid_reader_serial}
              onChange={(e) =>
                setFormData({ ...formData, rfid_reader_serial: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading
            ? (mode === 'edit' ? 'Updating...' : 'Creating...')
            : (mode === 'edit' ? 'Update Gate' : 'Create Gate')
          }
        </Button>
      </div>
    </form>
  );
}
