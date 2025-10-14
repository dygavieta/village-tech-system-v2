'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with Sentry or other error tracking service
      console.error('Application Error:', error);
    } else {
      console.error('Application Error:', error);
    }
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Something went wrong!</CardTitle>
          </div>
          <CardDescription>
            An unexpected error occurred while loading this page.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription>
              {error.message || 'An unknown error occurred'}
            </AlertDescription>
          </Alert>

          {isDevelopment && error.stack && (
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 text-sm font-semibold text-muted-foreground">
                Stack Trace (Development Only):
              </p>
              <pre className="overflow-auto text-xs text-muted-foreground">
                {error.stack}
              </pre>
            </div>
          )}

          {error.digest && (
            <p className="text-sm text-muted-foreground">
              Error ID: <code className="rounded bg-muted px-1 py-0.5">{error.digest}</code>
            </p>
          )}

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 font-semibold">What you can do:</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Try refreshing the page</li>
              <li>Clear your browser cache and cookies</li>
              <li>Check your internet connection</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={reset}
            className="w-full sm:w-auto"
            variant="default"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Go to Home
          </Button>
          <Button
            onClick={() => window.location.href = 'mailto:support@villagetech.com'}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Contact Support
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
