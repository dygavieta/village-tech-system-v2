"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, AlertCircle } from "lucide-react";

interface AllocationOverrideProps {
  householdId: string;
  currentAllocation: number;
  usedStickers: number;
  onUpdate?: (newAllocation: number) => void;
}

export function AllocationOverride({
  householdId,
  currentAllocation,
  usedStickers,
  onUpdate,
}: AllocationOverrideProps) {
  const [open, setOpen] = useState(false);
  const [newAllocation, setNewAllocation] = useState(currentAllocation);
  const [justification, setJustification] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    // Validation: New allocation must be at least as many as currently used stickers
    if (newAllocation < usedStickers) {
      setError(
        `Cannot set allocation below ${usedStickers} (household already has ${usedStickers} active stickers)`
      );
      return;
    }

    // Validation: Justification required for changes
    if (!justification.trim()) {
      setError("Justification is required for allocation changes");
      return;
    }

    // Validation: Must be within valid range
    if (newAllocation < 1 || newAllocation > 20) {
      setError("Allocation must be between 1 and 20 stickers");
      return;
    }

    setIsSaving(true);

    try {
      // TODO: Integrate with Supabase to update household allocation
      // await updateHouseholdAllocation(householdId, newAllocation, justification);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onUpdate?.(newAllocation);
      setOpen(false);
      setJustification("");
    } catch (err) {
      console.error("Failed to update allocation:", err);
      setError("Failed to save allocation. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNewAllocation(currentAllocation);
    setJustification("");
    setError(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Override Allocation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override Sticker Allocation</DialogTitle>
          <DialogDescription>
            Adjust the sticker allocation limit for this household. Changes require justification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Current allocation: <strong>{currentAllocation} stickers</strong>
              <br />
              Currently used: <strong>{usedStickers} stickers</strong>
              <br />
              Available: <strong>{currentAllocation - usedStickers} stickers</strong>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-allocation">New Allocation Limit</Label>
            <Input
              id="new-allocation"
              type="number"
              min={usedStickers}
              max={20}
              value={newAllocation}
              onChange={(e) => setNewAllocation(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Must be between {usedStickers} (currently used) and 20
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Justification *</Label>
            <Textarea
              id="justification"
              placeholder="e.g., Large family with multiple vehicles, beneficial user needs, special circumstances..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Explain why this household needs a different allocation limit
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
