import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import VillageRuleForm from '@/components/village-rules/VillageRuleForm';
import { getVillageRuleById } from '@/lib/actions/village-rules';

export default async function EditVillageRulePage({
  params,
}: {
  params: { id: string };
}) {
  const rule = await getVillageRuleById(params.id);

  if (!rule) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/settings/rules/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Village Rule</h1>
          <p className="text-muted-foreground">Update rule details and settings</p>
        </div>
      </div>

      <VillageRuleForm mode="edit" initialData={rule} />
    </div>
  );
}
