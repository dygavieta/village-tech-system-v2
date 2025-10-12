/**
 * CSV Parser Utility (T066)
 *
 * Parses and validates CSV files for property bulk import:
 * - Parses CSV to JSON
 * - Validates required fields
 * - Detects duplicates
 * - Formats error messages
 */

import { Property } from '@/lib/actions/create-tenant';

export interface PropertyRow {
  address: string;
  phase?: string;
  block?: string;
  lot?: string;
  unit?: string;
  property_type: string;
  property_size_sqm?: string;
  lot_size_sqm?: string;
  bedrooms?: string;
  bathrooms?: string;
  parking_slots?: string;
}

export interface ParsedProperty extends Property {
  row: number;
}

export interface CSVParseResult {
  success: boolean;
  properties: ParsedProperty[];
  errors: CSVError[];
  warnings: string[];
}

export interface CSVError {
  row: number;
  field?: string;
  message: string;
}

/**
 * Parse CSV text to array of property rows
 */
function parseCSV(csvText: string): PropertyRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  // Parse rows
  const rows: PropertyRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: any = {};

    headers.forEach((header, index) => {
      if (values[index]) {
        row[header] = values[index];
      }
    });

    if (Object.keys(row).length > 0) {
      rows.push(row as PropertyRow);
    }
  }

  return rows;
}

/**
 * Validate property type
 */
function validatePropertyType(type: string): type is 'single_family' | 'townhouse' | 'condo' | 'lot_only' {
  const validTypes = ['single_family', 'townhouse', 'condo', 'lot_only'];
  return validTypes.includes(type.toLowerCase());
}

/**
 * Parse and validate a single property row
 */
function validatePropertyRow(row: PropertyRow, rowNumber: number): { property?: ParsedProperty; errors: CSVError[] } {
  const errors: CSVError[] = [];

  // Validate required fields
  if (!row.address || row.address.trim().length === 0) {
    errors.push({
      row: rowNumber,
      field: 'address',
      message: 'Address is required',
    });
  }

  if (!row.property_type || !validatePropertyType(row.property_type)) {
    errors.push({
      row: rowNumber,
      field: 'property_type',
      message: `Property type must be one of: single_family, townhouse, condo, lot_only`,
    });
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return { errors };
  }

  // Parse numeric fields
  const property: ParsedProperty = {
    address: row.address.trim(),
    phase: row.phase?.trim(),
    block: row.block?.trim(),
    lot: row.lot?.trim(),
    unit: row.unit?.trim(),
    property_type: row.property_type.toLowerCase() as any,
    property_size_sqm: row.property_size_sqm ? parseFloat(row.property_size_sqm) : undefined,
    lot_size_sqm: row.lot_size_sqm ? parseFloat(row.lot_size_sqm) : undefined,
    bedrooms: row.bedrooms ? parseInt(row.bedrooms, 10) : undefined,
    bathrooms: row.bathrooms ? parseInt(row.bathrooms, 10) : undefined,
    parking_slots: row.parking_slots ? parseInt(row.parking_slots, 10) : undefined,
    row: rowNumber,
  };

  // Validate numeric conversions
  if (row.property_size_sqm && isNaN(property.property_size_sqm!)) {
    errors.push({
      row: rowNumber,
      field: 'property_size_sqm',
      message: 'Property size must be a valid number',
    });
  }

  if (row.bedrooms && isNaN(property.bedrooms!)) {
    errors.push({
      row: rowNumber,
      field: 'bedrooms',
      message: 'Bedrooms must be a valid number',
    });
  }

  return errors.length > 0 ? { errors } : { property };
}

/**
 * Detect duplicate addresses
 */
function detectDuplicates(properties: ParsedProperty[]): CSVError[] {
  const errors: CSVError[] = [];
  const addressMap = new Map<string, number[]>();

  properties.forEach((prop) => {
    const normalizedAddress = prop.address.toLowerCase().trim();
    if (!addressMap.has(normalizedAddress)) {
      addressMap.set(normalizedAddress, []);
    }
    addressMap.get(normalizedAddress)!.push(prop.row);
  });

  addressMap.forEach((rows, address) => {
    if (rows.length > 1) {
      rows.forEach((row) => {
        errors.push({
          row,
          field: 'address',
          message: `Duplicate address found at rows: ${rows.join(', ')}`,
        });
      });
    }
  });

  return errors;
}

/**
 * Parse and validate CSV file for property import
 */
export async function parsePropertyCSV(file: File): Promise<CSVParseResult> {
  const errors: CSVError[] = [];
  const warnings: string[] = [];

  try {
    // Read file
    const text = await file.text();

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        properties: [],
        errors: [{ row: 0, message: 'CSV file is empty' }],
        warnings: [],
      };
    }

    // Parse CSV
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return {
        success: false,
        properties: [],
        errors: [{ row: 0, message: 'No valid data rows found in CSV' }],
        warnings: [],
      };
    }

    // Validate each row
    const properties: ParsedProperty[] = [];
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because: 0-indexed + 1 for header row + 1 for 1-based counting
      const result = validatePropertyRow(row, rowNumber);

      if (result.errors && result.errors.length > 0) {
        errors.push(...result.errors);
      } else if (result.property) {
        properties.push(result.property);
      }
    });

    // Check for duplicates
    if (properties.length > 0) {
      const duplicateErrors = detectDuplicates(properties);
      errors.push(...duplicateErrors);
    }

    // Generate warnings
    if (properties.length > 500) {
      warnings.push(`Large import: ${properties.length} properties. Consider splitting into smaller batches.`);
    }

    const missingPhaseCount = properties.filter((p) => !p.phase).length;
    if (missingPhaseCount > 0) {
      warnings.push(`${missingPhaseCount} properties missing phase information.`);
    }

    return {
      success: errors.length === 0,
      properties,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      properties: [],
      errors: [
        {
          row: 0,
          message: error instanceof Error ? error.message : 'Failed to parse CSV file',
        },
      ],
      warnings: [],
    };
  }
}

/**
 * Generate CSV template for property import
 */
export function generatePropertyCSVTemplate(): string {
  const headers = [
    'address',
    'phase',
    'block',
    'lot',
    'unit',
    'property_type',
    'property_size_sqm',
    'lot_size_sqm',
    'bedrooms',
    'bathrooms',
    'parking_slots',
  ];

  const exampleRows = [
    [
      'Block 1 Lot 1',
      'Phase 1',
      '1',
      '1',
      '',
      'single_family',
      '120',
      '150',
      '3',
      '2',
      '2',
    ],
    [
      'Block 1 Lot 2',
      'Phase 1',
      '1',
      '2',
      '',
      'townhouse',
      '100',
      '120',
      '2',
      '2',
      '1',
    ],
    [
      'Tower A Unit 101',
      'Phase 2',
      'Tower A',
      '',
      '101',
      'condo',
      '80',
      '',
      '2',
      '1',
      '1',
    ],
  ];

  const csv = [headers.join(','), ...exampleRows.map((row) => row.join(','))].join('\n');

  return csv;
}

/**
 * Download CSV template
 */
export function downloadPropertyTemplate() {
  const csv = generatePropertyCSVTemplate();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'property-import-template.csv';
  link.click();
  window.URL.revokeObjectURL(url);
}
