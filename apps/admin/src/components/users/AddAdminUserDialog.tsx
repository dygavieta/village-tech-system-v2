"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { createAdminUser, type CreateAdminUserInput } from "@/lib/actions/users";
import { useRouter } from "next/navigation";

export function AddAdminUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateAdminUserInput>({
    email: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    phone_number: "",
    role: "admin_officer",
    position: "",
  });

  const handleInputChange = (field: keyof CreateAdminUserInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email || !formData.first_name || !formData.last_name || !formData.role) {
      setError("Email, first name, last name, and role are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createAdminUser({
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name?.trim() || undefined,
        last_name: formData.last_name.trim(),
        phone_number: formData.phone_number?.trim() || undefined,
        role: formData.role,
        position: formData.position?.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error || "Failed to create admin user");
        return;
      }

      // Success - close dialog and refresh
      setOpen(false);
      setFormData({
        email: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        phone_number: "",
        role: "admin_officer",
        position: "",
      });
      router.refresh();
    } catch (err) {
      console.error("Error creating admin user:", err);
      setError(err instanceof Error ? err.message : "Failed to create admin user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      phone_number: "",
      role: "admin_officer",
      position: "",
    });
    setError(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Admin User</DialogTitle>
          <DialogDescription>
            Create a new admin user account with access to the admin portal
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Login credentials will be sent to this email
            </p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="middle_name"
                value={formData.middle_name}
                onChange={(e) => handleInputChange("middle_name", e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange("phone_number", e.target.value)}
              disabled={isSubmitting}
              placeholder="+63 917 123 4567"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange("role", value as "admin_head" | "admin_officer")}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin_officer">Admin Officer</SelectItem>
                <SelectItem value="admin_head">Admin Head</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Admin Head has full access. Admin Officer has standard access.
            </p>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Position (Optional)</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleInputChange("position", e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., Treasurer, Secretary, Board Member"
            />
            <p className="text-xs text-muted-foreground">
              Display title for the user within the organization
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Admin User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
