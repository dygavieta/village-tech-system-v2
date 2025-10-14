"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, AlertCircle } from "lucide-react";

export default function StickerAllocationPage() {
  const [defaultAllocation, setDefaultAllocation] = useState(3);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      // TODO: Integrate with Supabase to save tenant-level allocation setting
      // await updateTenantSettings({ default_sticker_allocation: defaultAllocation });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSaveStatus("success");
    } catch (error) {
      console.error("Failed to save allocation settings:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sticker Allocation Settings</h1>
        <p className="text-muted-foreground">
          Configure default vehicle sticker allocation limits for households
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Default Allocation</CardTitle>
          <CardDescription>
            Set the default number of vehicle stickers per household. This applies to all new households unless overridden.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-allocation">Default Sticker Allocation</Label>
            <Input
              id="default-allocation"
              type="number"
              min={1}
              max={20}
              value={defaultAllocation}
              onChange={(e) => setDefaultAllocation(Number(e.target.value))}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Valid range: 1-20 stickers per household
            </p>
          </div>

          {saveStatus === "success" && (
            <Alert>
              <AlertDescription>
                Allocation settings saved successfully. New households will receive {defaultAllocation} stickers by default.
              </AlertDescription>
            </Alert>
          )}

          {saveStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to save allocation settings. Please try again.
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Individual Household Overrides</CardTitle>
          <CardDescription>
            To override allocation for a specific household, go to the household detail page and use the allocation override tool.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="/households">View Households</a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allocation Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Default Allocation:</strong> Standard households typically need 2-3 stickers for family vehicles.
          </p>
          <p>
            <strong>Override Reasons:</strong> Large families, multiple vehicles, beneficial users (helpers/drivers).
          </p>
          <p>
            <strong>Validation:</strong> System automatically rejects sticker requests exceeding household allocation limits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
