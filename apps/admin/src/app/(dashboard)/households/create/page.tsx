'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HouseholdForm } from '@/components/households/HouseholdForm';
import { createHousehold } from '@/lib/services/household-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

export default function CreateHouseholdPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await createHousehold(formData);

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to create household');
        return;
      }

      // Show success message
      setSuccessMessage(
        `Household created successfully! ${
          result.temporary_password
            ? `Temporary password: ${result.temporary_password}`
            : ''
        }`
      );

      // Redirect to households list after 3 seconds
      setTimeout(() => {
        router.push('/households');
      }, 3000);
    } catch (error) {
      console.error('Error creating household:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Unexpected error creating household'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/households');
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link href="/households">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Households
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create New Household</h1>
        <p className="text-muted-foreground">
          Register a new household and assign them to a property
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Success!</AlertTitle>
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          <AlertDescription className="text-green-700 mt-2">
            Redirecting to households list...
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Household Details</CardTitle>
          <CardDescription>
            Fill in the information below to create a new household. A household head account will
            be created automatically and login credentials will be sent via email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HouseholdForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>What happens next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>A household head user account will be created with the provided email</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>
                Temporary login credentials will be sent to the household head's email address
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>The property status will be updated to "occupied"</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>
                The household head can log in to the Residence mobile app to manage their household,
                request vehicle stickers, and register guests
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
