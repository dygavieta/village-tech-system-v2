import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CurfewForm from '@/components/curfew/CurfewForm';
import { getCurfewById } from '@/lib/actions/curfew';

export default async function EditCurfewPage({
  params,
}: {
  params: { id: string };
}) {
  const curfew = await getCurfewById(params.id);

  if (!curfew) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link href={`/settings/curfew/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Curfew</h1>
          <p className="text-muted-foreground">
            Update curfew configuration
          </p>
        </div>
      </div>

      {/* Curfew Form */}
      <CurfewForm mode="edit" initialData={curfew} />
    </div>
  );
}
