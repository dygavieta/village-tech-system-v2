'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface HouseholdImportRow {
  row: number;
  property_address: string;
  ownership_type: 'owner' | 'renter';
  move_in_date: string;
  sticker_allocation: number;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  phone_number: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export default function HouseholdImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<HouseholdImportRow[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importComplete, setImportComplete] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setParsedData([]);
      setValidationErrors([]);
      setImportComplete(false);
    }
  };

  const parseCSV = async () => {
    if (!file) return;

    setIsValidating(true);
    setValidationErrors([]);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        setValidationErrors(['CSV file is empty or has no data rows']);
        return;
      }

      // Parse header
      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const requiredColumns = [
        'property_address',
        'ownership_type',
        'email',
        'first_name',
        'last_name',
      ];

      const missingColumns = requiredColumns.filter((col) => !header.includes(col));
      if (missingColumns.length > 0) {
        setValidationErrors([
          `Missing required columns: ${missingColumns.join(', ')}`,
          'Required columns: property_address, ownership_type, email, first_name, last_name',
          'Optional columns: move_in_date, sticker_allocation, middle_name, phone_number',
        ]);
        return;
      }

      // Parse data rows
      const data: HouseholdImportRow[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split(',').map((v) => v.trim());
        const row: any = {};

        header.forEach((col, idx) => {
          row[col] = values[idx] || '';
        });

        // Validate row
        const rowErrors: string[] = [];

        if (!row.property_address) {
          rowErrors.push('Property address is required');
        }

        if (!row.ownership_type || !['owner', 'renter'].includes(row.ownership_type)) {
          rowErrors.push('Ownership type must be "owner" or "renter"');
        }

        if (!row.email) {
          rowErrors.push('Email is required');
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.email)) {
            rowErrors.push('Invalid email format');
          }
        }

        if (!row.first_name) {
          rowErrors.push('First name is required');
        }

        if (!row.last_name) {
          rowErrors.push('Last name is required');
        }

        // Parse optional fields
        const stickerAllocation = parseInt(row.sticker_allocation || '3');
        if (isNaN(stickerAllocation) || stickerAllocation < 1 || stickerAllocation > 10) {
          rowErrors.push('Sticker allocation must be between 1 and 10');
        }

        data.push({
          row: i + 1,
          property_address: row.property_address,
          ownership_type: row.ownership_type as 'owner' | 'renter',
          move_in_date: row.move_in_date || new Date().toISOString().split('T')[0],
          sticker_allocation: stickerAllocation,
          email: row.email,
          first_name: row.first_name,
          middle_name: row.middle_name || '',
          last_name: row.last_name,
          phone_number: row.phone_number || '',
          status: rowErrors.length > 0 ? 'error' : 'pending',
          error: rowErrors.length > 0 ? rowErrors.join('; ') : undefined,
        });

        if (rowErrors.length > 0) {
          errors.push(`Row ${i + 1}: ${rowErrors.join('; ')}`);
        }
      }

      setParsedData(data);

      if (errors.length > 0) {
        setValidationErrors(errors);
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setValidationErrors(['Failed to parse CSV file. Please check the file format.']);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!parsedData.length) return;

    setIsImporting(true);
    setImportProgress(0);

    const validRows = parsedData.filter((row) => row.status !== 'error');
    let completed = 0;

    for (const row of validRows) {
      try {
        // TODO: Call household creation API
        // For now, simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update row status
        row.status = 'success';
        completed++;
        setImportProgress((completed / validRows.length) * 100);
        setParsedData([...parsedData]);
      } catch (error) {
        row.status = 'error';
        row.error = error instanceof Error ? error.message : 'Failed to create household';
      }
    }

    setIsImporting(false);
    setImportComplete(true);
  };

  const successCount = parsedData.filter((r) => r.status === 'success').length;
  const errorCount = parsedData.filter((r) => r.status === 'error').length;
  const pendingCount = parsedData.filter((r) => r.status === 'pending').length;

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
        <h1 className="text-3xl font-bold tracking-tight">Bulk Import Households</h1>
        <p className="text-muted-foreground">Upload a CSV file to create multiple households at once</p>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>CSV File Format</CardTitle>
          <CardDescription>Your CSV file must include these columns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Required Columns:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• <code className="bg-muted px-1">property_address</code> - Full address of the property</li>
                <li>• <code className="bg-muted px-1">ownership_type</code> - Either "owner" or "renter"</li>
                <li>• <code className="bg-muted px-1">email</code> - Household head email address</li>
                <li>• <code className="bg-muted px-1">first_name</code> - Household head first name</li>
                <li>• <code className="bg-muted px-1">last_name</code> - Household head last name</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Optional Columns:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• <code className="bg-muted px-1">move_in_date</code> - Date in YYYY-MM-DD format (default: today)</li>
                <li>• <code className="bg-muted px-1">sticker_allocation</code> - Number 1-10 (default: 3)</li>
                <li>• <code className="bg-muted px-1">middle_name</code> - Household head middle name</li>
                <li>• <code className="bg-muted px-1">phone_number</code> - Contact phone number</li>
              </ul>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Example CSV:</p>
              <pre className="text-xs overflow-x-auto">
{`property_address,ownership_type,email,first_name,last_name,sticker_allocation
"Block 5 Lot 12",owner,john.doe@email.com,John,Doe,3
"Block 3 Lot 8",renter,jane.smith@email.com,Jane,Smith,2`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose CSV File
                </span>
              </Button>
            </label>

            {file && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{file.name}</span>
              </div>
            )}
          </div>

          {file && !parsedData.length && (
            <Button onClick={parseCSV} disabled={isValidating}>
              {isValidating ? 'Validating...' : 'Validate & Preview'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Errors ({validationErrors.length})</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {validationErrors.slice(0, 10).map((error, idx) => (
                <li key={idx} className="text-sm">• {error}</li>
              ))}
              {validationErrors.length > 10 && (
                <li className="text-sm">... and {validationErrors.length - 10} more errors</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{parsedData.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valid Rows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {successCount + pendingCount}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Import Actions */}
          {!importComplete && (
            <div className="flex items-center gap-4">
              <Button
                onClick={handleImport}
                disabled={isImporting || errorCount === parsedData.length}
              >
                {isImporting ? 'Importing...' : `Import ${successCount + pendingCount} Households`}
              </Button>

              {isImporting && (
                <div className="flex-1">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {Math.round(importProgress)}% complete
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {importComplete && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Import Complete!</AlertTitle>
              <AlertDescription className="text-green-700">
                Successfully imported {successCount} households.
                {errorCount > 0 && ` ${errorCount} rows failed.`}
              </AlertDescription>
              <div className="mt-4 flex gap-2">
                <Link href="/households">
                  <Button size="sm">View Households</Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setParsedData([]);
                    setImportComplete(false);
                    setValidationErrors([]);
                  }}
                >
                  Import Another File
                </Button>
              </div>
            </Alert>
          )}

          {/* Preview Table */}
          <Card>
            <CardHeader>
              <CardTitle>Import Preview</CardTitle>
              <CardDescription>Review the data before importing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{row.row}</TableCell>
                        <TableCell className="font-medium">{row.property_address}</TableCell>
                        <TableCell>
                          {row.first_name} {row.last_name}
                        </TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={row.ownership_type === 'owner' ? 'default' : 'secondary'}
                          >
                            {row.ownership_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row.status === 'success' && (
                            <Badge className="bg-green-600">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Success
                            </Badge>
                          )}
                          {row.status === 'error' && (
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" />
                              Error
                            </Badge>
                          )}
                          {row.status === 'pending' && (
                            <Badge variant="outline">Pending</Badge>
                          )}
                          {row.error && (
                            <p className="text-xs text-red-600 mt-1">{row.error}</p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
