'use client';

/**
 * Tenant List Component (T068)
 *
 * Display tenants with search, filter by status, pagination
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Search, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePagination, getPaginationInfoText } from '@/lib/utils/pagination';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'inactive' | 'suspended' | 'setup';
  properties_count?: number;
  admin_head_name?: string;
  admin_head_email?: string;
  created_at: string;
}

interface TenantListProps {
  tenants: Tenant[];
}

const statusColors = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
  setup: 'bg-blue-100 text-blue-800 border-blue-200',
};

export function TenantList({ tenants }: TenantListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter and search tenants
  const filteredTenants = useMemo(() => {
    let filtered = tenants;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((tenant) => tenant.status === statusFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(query) ||
          tenant.subdomain.toLowerCase().includes(query) ||
          tenant.admin_head_name?.toLowerCase().includes(query) ||
          tenant.admin_head_email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tenants, statusFilter, searchQuery]);

  // Use pagination utility
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedTenants,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    meta,
  } = usePagination(filteredTenants, 10);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    goToPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    goToPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, subdomain, or admin..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="setup">Setup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {getPaginationInfoText(meta, 'tenants')}
      </div>

      {/* Table */}
      {paginatedTenants.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Community Name</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Admin Head</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{tenant.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-1 text-sm">{tenant.subdomain}</code>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {tenant.properties_count !== undefined ? tenant.properties_count : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {tenant.admin_head_name ? (
                      <div>
                        <div className="font-medium">{tenant.admin_head_name}</div>
                        <div className="text-sm text-muted-foreground">{tenant.admin_head_email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[tenant.status]}>
                      {tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/tenants/${tenant.id}`}>
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">View {tenant.name}</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tenants found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first tenant'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button asChild>
              <Link href="/tenants/create">Create Tenant</Link>
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={previousPage}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
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
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
