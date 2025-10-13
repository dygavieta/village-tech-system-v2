'use client';

/**
 * Gate Configuration Form Component (T063)
 *
 * Step 3: Add gates with name, type, operating hours, RFID reader serial
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { Gate } from '@/lib/actions/create-tenant';

interface GateConfigFormProps {
  onSubmit: (gates: Gate[]) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function GateConfigForm({ onSubmit, onValidationChange }: GateConfigFormProps) {
  const [gates, setGates] = useState<Gate[]>([]);

  // This step is always valid (gates are optional)
  useEffect(() => {
    onValidationChange?.(true);
  }, [onValidationChange]);

  // Notify parent whenever gates change
  useEffect(() => {
    onSubmit(gates);
  }, [gates, onSubmit]);
  const { register, handleSubmit, reset, setValue, watch } = useForm<Gate>({
    defaultValues: {
      name: '',
      gate_type: 'primary',
      operating_hours_start: '',
      operating_hours_end: '',
      rfid_reader_serial: '',
    },
  });

  const addGate = (data: Gate) => {
    setGates([...gates, data]);
    reset();
  };

  const removeGate = (index: number) => {
    setGates(gates.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    onSubmit(gates);
  };

  return (
    <div className="space-y-6">
      {/* Add Gate Form */}
      <form onSubmit={handleSubmit(addGate)} className="space-y-4 rounded-lg border p-4">
        <h3 className="font-semibold">Add Gate</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Gate Name *</Label>
            <Input id="name" placeholder="e.g., Main Gate" {...register('name', { required: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gate_type">Gate Type *</Label>
            <Select defaultValue="primary" onValueChange={(v) => setValue('gate_type', v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="operating_hours_start">Operating Hours Start</Label>
            <Input id="operating_hours_start" type="time" {...register('operating_hours_start')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operating_hours_end">Operating Hours End</Label>
            <Input id="operating_hours_end" type="time" {...register('operating_hours_end')} />
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="rfid_reader_serial">RFID Reader Serial (Optional)</Label>
            <Input id="rfid_reader_serial" placeholder="e.g., RFID-001" {...register('rfid_reader_serial')} />
          </div>
        </div>

        <Button type="submit" variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Gate
        </Button>
      </form>

      {/* Gates List */}
      {gates.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Configured Gates ({gates.length})</h3>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Operating Hours</TableHead>
                  <TableHead>RFID Serial</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gates.map((gate, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{gate.name}</TableCell>
                    <TableCell>{gate.gate_type}</TableCell>
                    <TableCell>
                      {gate.operating_hours_start && gate.operating_hours_end
                        ? `${gate.operating_hours_start} - ${gate.operating_hours_end}`
                        : '24/7'}
                    </TableCell>
                    <TableCell>{gate.rfid_reader_serial || '-'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeGate(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

    </div>
  );
}
