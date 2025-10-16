import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import GateForm from '@/components/gates/GateForm';

export default function CreateGatePage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Add New Gate</h1>
          <p className="text-muted-foreground">
            Configure a new gate for your community access control
          </p>
        </div>
      </div>

      {/* Gate Form */}
      <GateForm />
    </div>
  );
}
