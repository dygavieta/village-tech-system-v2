'use client';

/**
 * Property Import Form Component (T062)
 *
 * Step 2: CSV upload, validation, preview, error display
 * - Upload CSV file
 * - Parse and validate properties
 * - Display preview table with errors/warnings
 * - Option to download template
 * - Manual property entry as alternative
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileText, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { parsePropertyCSV, downloadPropertyTemplate, type Property } from '@/lib/utils/csv-parser';

interface PropertyImportFormProps {
  onSubmit: (properties: Property[]) => void;
  onBack?: () => void;
}

export function PropertyImportForm({ onSubmit, onBack }: PropertyImportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [errors, setErrors] = useState<Array<{ row: number; field?: string; message: string }>>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsParsing(true);
    setErrors([]);
    setWarnings([]);
    setShowPreview(false);

    try {
      const result = await parsePropertyCSV(uploadedFile);

      if (result.success) {
        setProperties(result.properties);
        setWarnings(result.warnings);
        setShowPreview(true);
      } else {
        setErrors(result.errors);
      }
    } catch (error) {
      setErrors([{ row: 0, message: 'Failed to parse CSV file' }]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setProperties([]);
    setErrors([]);
    setWarnings([]);
    setShowPreview(false);
  };

  const handleSubmit = () => {
    if (properties.length > 0) {
      onSubmit(properties);
    } else {
      onSubmit([]);
    }
  };

  const handleSkip = () => {
    onSubmit([]);
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Upload a CSV file with your property data, or skip this step to add properties later.
        </AlertDescription>
      </Alert>

      {/* Template Download */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <h4 className="font-medium">Don't have a CSV file?</h4>
          <p className="text-sm text-muted-foreground">Download our template to get started</p>
        </div>
        <Button variant="outline" onClick={downloadPropertyTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      {/* File Upload */}
      <div className="space-y-4">
        <Label htmlFor="csv-upload">Upload Property CSV</Label>

        {!file ? (
          <div className="relative">
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="csv-upload"
              className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
            >
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Click to upload CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
            </label>
          </div>
        ) : (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClearFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isParsing && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing CSV file...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Found {errors.length} errors in CSV file:</p>
            <ul className="list-disc list-inside space-y-1">
              {errors.slice(0, 5).map((error, index) => (
                <li key={index} className="text-sm">
                  {error.row > 0 && `Row ${error.row}: `}
                  {error.field && `${error.field} - `}
                  {error.message}
                </li>
              ))}
              {errors.length > 5 && (
                <li className="text-sm">...and {errors.length - 5} more errors</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Warnings:</p>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="text-sm">{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Table */}
      {showPreview && properties.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Preview ({properties.length} properties)
            </h3>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Valid
            </Badge>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size (sqm)</TableHead>
                    <TableHead>Bed/Bath</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.slice(0, 10).map((property, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{property.address}</TableCell>
                      <TableCell>{property.phase || '-'}</TableCell>
                      <TableCell>{property.block || '-'}</TableCell>
                      <TableCell>{property.lot || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{property.property_type}</Badge>
                      </TableCell>
                      <TableCell>{property.property_size_sqm || '-'}</TableCell>
                      <TableCell>
                        {property.bedrooms && property.bathrooms
                          ? `${property.bedrooms}/${property.bathrooms}`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {properties.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        ...and {properties.length - 10} more properties
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={errors.length > 0 || (showPreview && properties.length === 0)}
          >
            Continue to Gates
            {properties.length > 0 && ` (${properties.length} properties)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
