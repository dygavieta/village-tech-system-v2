import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import GateForm from '@/components/gates/GateForm';
import { getGateById } from '@/lib/actions/gates';
import { notFound } from 'next/navigation';

interface EditGatePageProps {
  params: {
    id: string;
  };
}

export default async function EditGatePage({ params }: EditGatePageProps) {
  const gate = await getGateById(params.id);

  if (!gate) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link href="/settings/gates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Gate</h1>
          <p className="text-muted-foreground">
            Update {gate.name} configuration and settings
          </p>
        </div>
      </div>

      {/* Gate Form */}
      <GateForm
        gateId={gate.id}
        mode="edit"
        initialData={{
          name: gate.name,
          gate_type: gate.gate_type,
          status: gate.status,
          operating_hours_start: gate.operating_hours_start || '',
          operating_hours_end: gate.operating_hours_end || '',
          gps_lat: gate.gps_lat || undefined,
          gps_lng: gate.gps_lng || undefined,
          rfid_reader_serial: gate.rfid_reader_serial || '',
        }}
      />
    </div>
  );
}
