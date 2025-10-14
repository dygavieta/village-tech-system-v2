import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setTotalCount: (count: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  getRange: () => { from: number; to: number };
}

/**
 * Hook for managing pagination state with URL persistence
 * @param defaultPageSize - Default page size (default: 25)
 * @returns Pagination state and controls
 */
export function usePagination(defaultPageSize: number = 25): UsePaginationReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeFromUrl = parseInt(searchParams.get('pageSize') || String(defaultPageSize), 10);

  const [page, setPageState] = useState(pageFromUrl);
  const [pageSize, setPageSizeState] = useState(pageSizeFromUrl);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);

  const updateUrl = useCallback(
    (newPage: number, newPageSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      params.set('pageSize', String(newPageSize));

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const setPage = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
      setPageState(validPage);
      updateUrl(validPage, pageSize);
    },
    [totalPages, pageSize, updateUrl]
  );

  const setPageSize = useCallback(
    (newPageSize: number) => {
      setPageSizeState(newPageSize);
      setPageState(1);
      updateUrl(1, newPageSize);
    },
    [updateUrl]
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  }, [hasNextPage, page, setPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(page - 1);
    }
  }, [hasPreviousPage, page, setPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages, setPage]);

  const getRange = useCallback(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  }, [page, pageSize]);

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    setPage,
    setPageSize,
    setTotalCount,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    getRange,
  };
}
