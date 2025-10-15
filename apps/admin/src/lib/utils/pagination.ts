/**
 * Admin App - Pagination Utilities (T188)
 *
 * Provides client-side and server-side pagination utilities
 * with support for page size selection and navigation.
 *
 * This is identical to the Platform app pagination utilities
 * to ensure consistency across applications.
 */

import { useState, useCallback, useMemo } from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PaginationState {
  page: number;           // Current page (1-indexed)
  pageSize: number;       // Items per page
  total: number;          // Total number of items
}

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;      // 0-indexed start of current page
  endIndex: number;        // 0-indexed end of current page
}

export interface UsePaginationReturn<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  paginatedItems: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  meta: PaginationMeta;
}

// ============================================================================
// Client-Side Pagination
// ============================================================================

/**
 * Client-side pagination hook
 * Paginates an array of items in memory
 *
 * @param items - Array of items to paginate
 * @param initialPageSize - Initial items per page (default: 10)
 * @returns Pagination state and controls
 */
export function usePagination<T>(
  items: T[],
  initialPageSize: number = 10
): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Calculate slice indices
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Get current page items
  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  // Navigation functions
  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  const meta: PaginationMeta = {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    startIndex,
    endIndex: endIndex - 1, // Convert to 0-indexed
  };

  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    previousPage,
    setPageSize: handleSetPageSize,
    canGoNext: currentPage < totalPages,
    canGoPrevious: currentPage > 1,
    meta,
  };
}

// ============================================================================
// Server-Side Pagination Utilities
// ============================================================================

/**
 * Calculate pagination metadata for server-side pagination
 *
 * @param page - Current page (1-indexed)
 * @param pageSize - Items per page
 * @param totalItems - Total number of items
 * @returns Pagination metadata
 */
export function calculatePaginationMeta(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    startIndex,
    endIndex,
  };
}

/**
 * Generate Supabase pagination parameters
 *
 * @param page - Current page (1-indexed)
 * @param pageSize - Items per page
 * @returns Object with `from` and `to` indices for Supabase range query
 */
export function getSupabasePaginationParams(
  page: number,
  pageSize: number
): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return { from, to };
}

/**
 * Server-side pagination hook
 * For use with async data fetching (Supabase, APIs)
 *
 * @param fetchFunction - Async function that fetches paginated data
 * @param initialPageSize - Initial items per page
 * @returns Pagination state and controls
 */
export function useServerPagination<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  initialPageSize: number = 10
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const fetchData = useCallback(
    async (page: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, total } = await fetchFunction(page, pageSize);
        setTotalItems(total);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFunction, pageSize]
  );

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const meta: PaginationMeta = {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    startIndex: (currentPage - 1) * pageSize,
    endIndex: Math.min(currentPage * pageSize - 1, totalItems - 1),
  };

  return {
    currentPage,
    pageSize,
    totalPages,
    fetchData,
    goToPage,
    nextPage,
    previousPage,
    setPageSize: handleSetPageSize,
    canGoNext: currentPage < totalPages,
    canGoPrevious: currentPage > 1,
    meta,
    isLoading,
    error,
  };
}

// ============================================================================
// Page Number Generation
// ============================================================================

/**
 * Generate array of page numbers for pagination UI
 * Shows first page, last page, current page, and surrounding pages
 * with ellipsis for gaps
 *
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @param maxVisible - Maximum number of page buttons to show (default: 7)
 * @returns Array of page numbers or 'ellipsis' strings
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  const halfVisible = Math.floor((maxVisible - 3) / 2); // Reserve 3 for first, last, and ellipsis

  // Always show first page
  pages.push(1);

  // Calculate start and end of middle range
  let start = Math.max(2, currentPage - halfVisible);
  let end = Math.min(totalPages - 1, currentPage + halfVisible);

  // Adjust if near beginning
  if (currentPage <= halfVisible + 2) {
    end = Math.min(totalPages - 1, maxVisible - 2);
  }

  // Adjust if near end
  if (currentPage >= totalPages - halfVisible - 1) {
    start = Math.max(2, totalPages - maxVisible + 3);
  }

  // Add ellipsis after first page if needed
  if (start > 2) {
    pages.push('ellipsis');
  }

  // Add middle pages
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Add ellipsis before last page if needed
  if (end < totalPages - 1) {
    pages.push('ellipsis');
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

// ============================================================================
// Pagination Info Text
// ============================================================================

/**
 * Generate pagination info text (e.g., "Showing 1-10 of 100 items")
 *
 * @param meta - Pagination metadata
 * @param itemName - Name of items being paginated (default: "items")
 * @returns Formatted string
 */
export function getPaginationInfoText(
  meta: PaginationMeta,
  itemName: string = 'items'
): string {
  if (meta.totalItems === 0) {
    return `No ${itemName} found`;
  }

  const start = meta.startIndex + 1; // Convert to 1-indexed
  const end = meta.endIndex + 1;     // Convert to 1-indexed

  return `Showing ${start}-${end} of ${meta.totalItems} ${itemName}`;
}

// ============================================================================
// URL Query String Utilities
// ============================================================================

/**
 * Parse pagination parameters from URL search params
 *
 * @param searchParams - URLSearchParams object
 * @param defaultPageSize - Default page size if not in URL
 * @returns Pagination state
 */
export function parsePaginationFromURL(
  searchParams: URLSearchParams,
  defaultPageSize: number = 10
): { page: number; pageSize: number } {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || String(defaultPageSize), 10);

  return {
    page: Math.max(1, page),
    pageSize: Math.max(1, Math.min(pageSize, 100)), // Cap at 100
  };
}

/**
 * Convert pagination state to URL search params
 *
 * @param page - Current page
 * @param pageSize - Items per page
 * @returns URLSearchParams object
 */
export function paginationToURLParams(page: number, pageSize: number): URLSearchParams {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  return params;
}
