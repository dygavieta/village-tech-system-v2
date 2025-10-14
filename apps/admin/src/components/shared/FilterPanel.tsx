'use client';

import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

interface FilterPanelProps {
  filters: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  onClearAll: () => void;
  className?: string;
}

export function FilterPanel({
  filters,
  selectedFilters,
  onFilterChange,
  onClearAll,
  className = ''
}: FilterPanelProps) {
  const totalSelectedCount = Object.values(selectedFilters).reduce(
    (acc, values) => acc + values.length,
    0
  );

  const handleToggleFilter = (filterId: string, value: string) => {
    const current = selectedFilters[filterId] || [];
    const newValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange(filterId, newValues);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <DropdownMenu key={filter.id}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="mr-2 h-4 w-4" />
                {filter.label}
                {selectedFilters[filter.id]?.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 justify-center">
                    {selectedFilters[filter.id].length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{filter.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filter.options.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={selectedFilters[filter.id]?.includes(option.value)}
                  onCheckedChange={() => handleToggleFilter(filter.id, option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>

      {totalSelectedCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-9"
        >
          Clear filters
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}

      {totalSelectedCount > 0 && (
        <span className="text-sm text-muted-foreground">
          {totalSelectedCount} filter{totalSelectedCount !== 1 ? 's' : ''} active
        </span>
      )}
    </div>
  );
}
