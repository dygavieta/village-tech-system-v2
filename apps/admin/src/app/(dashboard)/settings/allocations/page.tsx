"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, AlertCircle, Loader2 } from "lucide-react";
import { getStickerAllocation, updateStickerAllocation } from "@/lib/actions/settings";

export default function StickerAllocationPage() {
  const [defaultAllocation, setDefaultAllocation] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAllocation();
  }, []);

  const loadAllocation = async () => {
    try {
      const allocation = await getStickerAllocation();
      setDefaultAllocation(allocation);
    } catch (error) {
      console.error("Failed to load allocation settings:", error);
      setErrorMessage("Failed to load current settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    setErrorMessage(null);

    try {
      await updateStickerAllocation(defaultAllocation);
      setSaveStatus("success");
    } catch (error) {
      console.error("Failed to save allocation settings:", error);
      setSaveStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to save allocation settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              disabled={isSaving}
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
                {errorMessage || "Failed to save allocation settings. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
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
