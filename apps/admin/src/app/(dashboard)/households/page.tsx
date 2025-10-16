'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Filter, MapPin, User, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getHouseholds } from '@/lib/services/household-service';
import { useSearchFilterSort } from '@/lib/utils/search-filter';
import { usePagination, getPaginationInfoText } from '@/lib/utils/pagination';

interface Household {
  id: string;
  move_in_date: string | null;
  ownership_type: 'owner' | 'renter';
  sticker_allocation: number;
  created_at: string;
  property: {
    id: string;
    address: string;
    phase: string | null;
    block: string | null;
    lot: string | null;
    unit: string | null;
    property_type: string;
  };
  household_head: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string | null;
    position: string | null;
  };
}

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch households on mount
  useEffect(() => {
    async function loadHouseholds() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await getHouseholds();

        if (fetchError) {
          setError(fetchError.message || 'Failed to load households');
          return;
        }

        setHouseholds(data || []);
      } catch (err) {
        console.error('Error loading households:', err);
        setError('Unexpected error loading households');
      } finally {
        setLoading(false);
      }
    }

    loadHouseholds();
  }, []);

  // Use search/filter/sort utility
  const {
    filteredItems,
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    isSearching,
    resultCount,
  } = useSearchFilterSort({
    items: households,
    searchFields: ['property.address', 'household_head.first_name', 'household_head.last_name'],
    initialFilters: {},
  });

  // Use pagination utility
  const {
    paginatedItems: paginatedHouseholds,
    currentPage,
    totalPages,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    meta,
  } = usePagination(filteredItems, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading households...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error: {error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Households</h1>
          <p className="text-muted-foreground">
            Manage all households in your community
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/households/import">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
          </Link>
          <Link href="/households/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Household
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by address or household head name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={filters.ownership_type ?? 'all'}
          onValueChange={(value) => setFilter('ownership_type', value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by ownership" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="owner">Owners</SelectItem>
            <SelectItem value="renter">Renters</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results summary */}
      <div className="text-sm text-muted-foreground">
        {getPaginationInfoText(meta, 'households')}
        {isSearching && <span className="ml-2 italic">(searching...)</span>}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Total Households
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold">{households.length}</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Owners</p>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {households.filter((h) => h.ownership_type === 'owner').length}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Renters</p>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {households.filter((h) => h.ownership_type === 'renter').length}
          </p>
        </div>
      </div>

      {/* Households table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property Address</TableHead>
              <TableHead>Household Head</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Ownership</TableHead>
              <TableHead>Stickers</TableHead>
              <TableHead>Move-in Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedHouseholds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery || filters.ownership_type
                      ? 'No households match your filters'
                      : 'No households found'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedHouseholds.map((household) => (
                <TableRow key={household.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{household.property?.address}</p>
                      {household.property?.phase && (
                        <p className="text-xs text-muted-foreground">
                          Phase {household.property.phase}
                          {household.property.block &&
                            `, Block ${household.property.block}`}
                          {household.property.lot &&
                            `, Lot ${household.property.lot}`}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {household.household_head?.first_name}{' '}
                        {household.household_head?.last_name}
                      </p>
                      {household.household_head?.position && (
                        <p className="text-xs text-muted-foreground">
                          {household.household_head.position}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {household.household_head?.phone_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        household.ownership_type === 'owner'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {household.ownership_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {household.sticker_allocation} allocated
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {household.move_in_date
                      ? new Date(household.move_in_date).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/households/${household.id}`}>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={previousPage}
            disabled={!canGoPrevious}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={!canGoNext}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
