'use client';

/**
 * Tenant Creation Wizard Page (T060)
 *
 * Multi-step wizard for creating new tenants:
 * - Step 1: Basic tenant information
 * - Step 2: Property bulk import (CSV)
 * - Step 3: Gate configuration
 * - Step 4: Admin user setup
 * - Review & Submit
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { createTenant, type CreateTenantInput, type Property, type Gate } from '@/lib/actions/create-tenant';
import { useToast } from '@/components/ui/use-toast';
import { TenantCreationForm } from '@/components/tenants/TenantCreationForm';
import { PropertyImportForm } from '@/components/tenants/PropertyImportForm';
import { GateConfigForm } from '@/components/tenants/GateConfigForm';
import { AdminUserForm } from '@/components/tenants/AdminUserForm';

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

const steps: WizardStep[] = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Tenant name, subdomain, and community type',
  },
  {
    id: 2,
    title: 'Properties',
    description: 'Import properties via CSV or add manually',
  },
  {
    id: 3,
    title: 'Gates',
    description: 'Configure entry/exit gates',
  },
  {
    id: 4,
    title: 'Admin User',
    description: 'Set up the admin head account',
  },
  {
    id: 5,
    title: 'Review & Submit',
    description: 'Review all details before creating',
  },
];

export default function CreateTenantPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [canProceed, setCanProceed] = useState(false);

  // Form data state
  const [tenantData, setTenantData] = useState<Partial<CreateTenantInput>>({
    community_type: 'HOA',
    max_residences: 100,
    max_admin_users: 10,
    max_security_users: 20,
    storage_quota_gb: 10,
    timezone: 'UTC',
    language: 'en',
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBasicInfoSubmit = (data: Partial<CreateTenantInput>) => {
    setTenantData({ ...tenantData, ...data });
    handleNext(); // Auto-advance
  };

  const handlePropertiesSubmit = (importedProperties: Property[]) => {
    setProperties(importedProperties);
    handleNext(); // Auto-advance
  };

  const handleGatesSubmit = (configuredGates: Gate[]) => {
    setGates(configuredGates);
    handleNext(); // Auto-advance
  };

  const handleAdminUserSubmit = (adminData: Partial<CreateTenantInput>) => {
    setTenantData({ ...tenantData, ...adminData });
    handleNext(); // Auto-advance
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const input: CreateTenantInput = {
        name: tenantData.name!,
        legal_name: tenantData.legal_name,
        subdomain: tenantData.subdomain!,
        community_type: tenantData.community_type!,
        year_established: tenantData.year_established,
        timezone: tenantData.timezone,
        language: tenantData.language,
        max_residences: tenantData.max_residences!,
        max_admin_users: tenantData.max_admin_users,
        max_security_users: tenantData.max_security_users,
        storage_quota_gb: tenantData.storage_quota_gb,
        properties: properties.length > 0 ? properties : undefined,
        gates: gates.length > 0 ? gates : undefined,
        admin_email: tenantData.admin_email!,
        admin_first_name: tenantData.admin_first_name!,
        admin_last_name: tenantData.admin_last_name!,
        admin_phone: tenantData.admin_phone,
        admin_position: tenantData.admin_position,
      };

      const result = await createTenant(input);

      if (!result.success) {
        setSubmitError(result.error || 'Failed to create tenant');
        return;
      }

      toast({
        title: 'Tenant created successfully!',
        description: `${tenantData.name} has been created with subdomain: ${result.subdomain}`,
      });

      // Redirect to tenant detail page
      router.push(`/dashboard/tenants/${result.tenant_id}`);
    } catch (error) {
      console.error('Tenant creation error:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create New Tenant</h2>
        <p className="text-muted-foreground">Set up a new residential community on the platform</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Navigation */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                currentStep > step.id
                  ? 'border-green-500 bg-green-500 text-white'
                  : currentStep === step.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted bg-muted text-muted-foreground'
              }`}
            >
              {currentStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : step.id}
            </div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 w-12 ${currentStep > step.id ? 'bg-green-500' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {submitError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Basic Information Form */}
          {currentStep === 1 && (
            <TenantCreationForm
              initialData={tenantData}
              onSubmit={handleBasicInfoSubmit}
            />
          )}

          {/* Step 2: Property Import Form */}
          {currentStep === 2 && (
            <PropertyImportForm
              onSubmit={handlePropertiesSubmit}
            />
          )}

          {/* Step 3: Gate Configuration Form */}
          {currentStep === 3 && (
            <GateConfigForm
              onSubmit={handleGatesSubmit}
            />
          )}

          {/* Step 4: Admin User Form */}
          {currentStep === 4 && (
            <AdminUserForm
              initialData={tenantData}
              onSubmit={handleAdminUserSubmit}
            />
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="rounded-lg border p-6 space-y-4">
                <h3 className="font-semibold text-lg">Review Your Details</h3>

                <div className="grid gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Tenant Information</h4>
                    <p className="text-sm">
                      <strong>Name:</strong> {tenantData.name || 'Not set'}
                    </p>
                    <p className="text-sm">
                      <strong>Subdomain:</strong> {tenantData.subdomain || 'Not set'}
                    </p>
                    <p className="text-sm">
                      <strong>Type:</strong> {tenantData.community_type}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Properties</h4>
                    <p className="text-sm">{properties.length} properties imported</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Gates</h4>
                    <p className="text-sm">{gates.length} gates configured</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Admin User</h4>
                    <p className="text-sm">
                      <strong>Email:</strong> {tenantData.admin_email || 'Not set'}
                    </p>
                    <p className="text-sm">
                      <strong>Name:</strong> {tenantData.admin_first_name} {tenantData.admin_last_name}
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleFinalSubmit} disabled={isSubmitting} size="lg" className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating tenant...
                  </>
                ) : (
                  'Create Tenant'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wizard Navigation - Only show Previous button, forms handle their own Continue */}
      {currentStep > 1 && currentStep < 5 && (
        <div className="flex items-center justify-start">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isSubmitting}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
        </div>
      )}

      {currentStep === 5 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={isSubmitting}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="ghost" onClick={() => router.push('/dashboard/tenants')} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
