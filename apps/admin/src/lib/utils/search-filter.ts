/**
 * Admin App - Search and Filtering Utilities (T186)
 *
 * Provides debounced search, multi-select filters, and advanced filtering
 * capabilities for list views throughout the Admin application.
 */

import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

// ============================================================================
// Type Definitions
// ============================================================================

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multi-select' | 'date-range' | 'boolean';
  options?: FilterOption[];
}

export interface SearchFilterState {
  searchQuery: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// ============================================================================
// Search Utilities
// ============================================================================

/**
 * Debounced search hook
 * Delays search execution until user stops typing
 *
 * @param initialValue - Initial search query
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 * @returns Tuple of [debouncedValue, setValue, isDebouncing]
 */
export function useDebouncedSearch(
  initialValue: string = '',
  delay: number = 500
): [string, (value: string) => void, boolean] {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (value !== debouncedValue) {
      setIsDebouncing(true);
    } else {
      setIsDebouncing(false);
    }
  }, [value, debouncedValue]);

  return [debouncedValue, setValue, isDebouncing];
}

/**
 * Fuzzy search utility
 * Searches multiple fields with case-insensitive matching
 *
 * @param items - Array of items to search
 * @param query - Search query string
 * @param fields - Array of field names to search in
 * @returns Filtered array of items
 */
export function fuzzySearch<T extends Record<string, any>>(
  items: T[],
  query: string,
  fields: (keyof T)[]
): T[] {
  if (!query.trim()) return items;

  const lowerQuery = query.toLowerCase();

  return items.filter((item) => {
    return fields.some((field) => {
      const value = item[field];
      if (value == null) return false;
      return String(value).toLowerCase().includes(lowerQuery);
    });
  });
}

/**
 * Highlight search matches in text
 *
 * @param text - Text to highlight
 * @param query - Search query
 * @returns Text with <mark> tags around matches
 */
export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}

// ============================================================================
// Filter Utilities
// ============================================================================

/**
 * Apply multiple filters to an array of items
 *
 * @param items - Array of items to filter
 * @param filters - Object with filter key-value pairs
 * @returns Filtered array of items
 */
export function applyFilters<T extends Record<string, any>>(
  items: T[],
  filters: Record<string, any>
): T[] {
  return items.filter((item) => {
    return Object.entries(filters).every(([key, filterValue]) => {
      const itemValue = item[key];

      // Skip if filter is not set
      if (filterValue == null || filterValue === '' || (Array.isArray(filterValue) && filterValue.length === 0)) {
        return true;
      }

      // Array filters (multi-select)
      if (Array.isArray(filterValue)) {
        return filterValue.includes(itemValue);
      }

      // Boolean filters
      if (typeof filterValue === 'boolean') {
        return itemValue === filterValue;
      }

      // Date range filters
      if (typeof filterValue === 'object' && 'start' in filterValue && 'end' in filterValue) {
        const itemDate = new Date(itemValue);
        const startDate = filterValue.start ? new Date(filterValue.start) : null;
        const endDate = filterValue.end ? new Date(filterValue.end) : null;

        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      }

      // Exact match
      return itemValue === filterValue;
    });
  });
}

/**
 * Extract unique values from items for filter options
 *
 * @param items - Array of items
 * @param field - Field name to extract values from
 * @returns Array of unique values
 */
export function getUniqueFilterOptions<T extends Record<string, any>>(
  items: T[],
  field: keyof T
): FilterOption[] {
  const valueCountMap = new Map<string, number>();

  items.forEach((item) => {
    const value = String(item[field] || '');
    if (value) {
      valueCountMap.set(value, (valueCountMap.get(value) || 0) + 1);
    }
  });

  return Array.from(valueCountMap.entries()).map(([value, count]) => ({
    label: value,
    value,
    count,
  }));
}

// ============================================================================
// Sort Utilities
// ============================================================================

/**
 * Sort items by a field
 *
 * @param items - Array of items to sort
 * @param sortBy - Field name to sort by
 * @param sortOrder - Sort order ('asc' or 'desc')
 * @returns Sorted array of items
 */
export function sortItems<T extends Record<string, any>>(
  items: T[],
  sortBy: keyof T,
  sortOrder: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    // Handle null/undefined
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortOrder === 'asc' ? 1 : -1;
    if (bValue == null) return sortOrder === 'asc' ? -1 : 1;

    // Handle dates
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortOrder === 'asc'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    // Handle numbers
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Handle strings
    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();

    if (aString < bString) return sortOrder === 'asc' ? -1 : 1;
    if (aString > bString) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

// ============================================================================
// Combined Search, Filter, and Sort Hook
// ============================================================================

export interface UseSearchFilterSortOptions<T> {
  items: T[];
  searchFields: (keyof T)[];
  initialSearchQuery?: string;
  initialFilters?: Record<string, any>;
  initialSortBy?: keyof T;
  initialSortOrder?: 'asc' | 'desc';
  debounceDelay?: number;
}

export interface UseSearchFilterSortReturn<T> {
  filteredItems: T[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  sortBy: keyof T | undefined;
  sortOrder: 'asc' | 'desc';
  setSorting: (field: keyof T, order?: 'asc' | 'desc') => void;
  toggleSortOrder: () => void;
  isSearching: boolean;
  resultCount: number;
}

/**
 * Comprehensive hook for search, filter, and sort operations
 *
 * @param options - Configuration options
 * @returns Object with filtered items and control functions
 */
export function useSearchFilterSort<T extends Record<string, any>>(
  options: UseSearchFilterSortOptions<T>
): UseSearchFilterSortReturn<T> {
  const {
    items,
    searchFields,
    initialSearchQuery = '',
    initialFilters = {},
    initialSortBy,
    initialSortOrder = 'asc',
    debounceDelay = 500,
  } = options;

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [sortBy, setSortBy] = useState<keyof T | undefined>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);

  const debouncedSearchQuery = useDebounce(searchQuery, debounceDelay);
  const isSearching = searchQuery !== debouncedSearchQuery;

  // Apply search, filter, and sort
  const filteredItems = useCallback(() => {
    let result = items;

    // Apply search
    if (debouncedSearchQuery) {
      result = fuzzySearch(result, debouncedSearchQuery, searchFields);
    }

    // Apply filters
    result = applyFilters(result, filters);

    // Apply sorting
    if (sortBy) {
      result = sortItems(result, sortBy, sortOrder);
    }

    return result;
  }, [items, debouncedSearchQuery, searchFields, filters, sortBy, sortOrder]);

  const setFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const setSorting = useCallback((field: keyof T, order: 'asc' | 'desc' = 'asc') => {
    setSortBy(field);
    setSortOrder(order);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const resultItems = filteredItems();

  return {
    filteredItems: resultItems,
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    clearFilters,
    sortBy,
    sortOrder,
    setSorting,
    toggleSortOrder,
    isSearching,
    resultCount: resultItems.length,
  };
}

// ============================================================================
// URL Query String Utilities
// ============================================================================

/**
 * Parse URL search params into filters
 *
 * @param searchParams - URLSearchParams object
 * @returns Filters object
 */
export function parseFiltersFromURL(searchParams: URLSearchParams): Record<string, any> {
  const filters: Record<string, any> = {};

  searchParams.forEach((value, key) => {
    // Handle array values (e.g., status[]=pending&status[]=approved)
    if (key.endsWith('[]')) {
      const actualKey = key.slice(0, -2);
      if (!filters[actualKey]) {
        filters[actualKey] = [];
      }
      filters[actualKey].push(value);
    } else {
      // Try to parse as JSON for complex values
      try {
        filters[key] = JSON.parse(value);
      } catch {
        filters[key] = value;
      }
    }
  });

  return filters;
}

/**
 * Convert filters to URL search params
 *
 * @param filters - Filters object
 * @returns URLSearchParams object
 */
export function filtersToURLParams(filters: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value == null || value === '') return;

    // Handle arrays
    if (Array.isArray(value)) {
      value.forEach((item) => {
        params.append(`${key}[]`, String(item));
      });
    }
    // Handle objects (e.g., date ranges)
    else if (typeof value === 'object') {
      params.set(key, JSON.stringify(value));
    }
    // Handle primitives
    else {
      params.set(key, String(value));
    }
  });

  return params;
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Export filtered data to CSV
 *
 * @param items - Array of items to export
 * @param columns - Array of column definitions
 * @param filename - Output filename
 */
export function exportToCSV<T extends Record<string, any>>(
  items: T[],
  columns: Array<{ key: keyof T; label: string }>,
  filename: string = 'export.csv'
): void {
  // Create CSV header
  const header = columns.map((col) => col.label).join(',');

  // Create CSV rows
  const rows = items.map((item) => {
    return columns
      .map((col) => {
        const value = item[col.key];
        // Escape commas and quotes
        if (value == null) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [header, ...rows].join('\n');

  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
