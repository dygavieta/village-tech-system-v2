import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import CurfewForm from '@/components/curfew/CurfewForm';

export default function CreateCurfewPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link href="/settings/curfew">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Curfew Settings
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Curfew</h1>
          <p className="text-muted-foreground">
            Configure a new curfew for your community
          </p>
        </div>
      </div>

      {/* Curfew Form */}
      <CurfewForm mode="create" />
    </div>
  );
}
