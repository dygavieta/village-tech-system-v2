import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import VillageRuleForm from '@/components/village-rules/VillageRuleForm';

export default function CreateVillageRulePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings/rules">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Village Rules
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Village Rule</h1>
          <p className="text-muted-foreground">
            Add a new community policy or regulation
          </p>
        </div>
      </div>

      <VillageRuleForm mode="create" />
    </div>
  );
}
