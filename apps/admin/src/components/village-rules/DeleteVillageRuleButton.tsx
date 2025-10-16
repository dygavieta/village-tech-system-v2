'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteVillageRule } from '@/lib/actions/village-rules';
import { useToast } from '@/components/ui/use-toast';

interface DeleteVillageRuleButtonProps {
  ruleId: string;
  ruleTitle: string;
}

export default function DeleteVillageRuleButton({ ruleId, ruleTitle }: DeleteVillageRuleButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteVillageRule(ruleId);

      toast({
        title: 'Rule deleted successfully',
        description: 'The village rule has been permanently removed.',
      });

      setOpen(false);

      startTransition(() => {
        router.push('/settings/rules');
        router.refresh();
      });
    } catch (error) {
      console.error('Error deleting village rule:', error);
      toast({
        title: 'Failed to delete rule',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  const isLoading = isDeleting || isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" disabled={isLoading}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Village Rule
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the rule and all related acknowledgment records.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm font-medium text-destructive">You are about to delete:</p>
            <p className="text-sm font-semibold mt-1">{ruleTitle}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
