import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

interface ModuleSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: string[];
  onFiltersChange: (filters: string[]) => void;
  onReset: () => void;
}

const filterOptions = [
  { value: 'active', label: 'Aktif', color: 'bg-green-500/20 text-green-700' },
  { value: 'development', label: 'Geliştirme', color: 'bg-yellow-500/20 text-yellow-700' },
  { value: 'planned', label: 'Planlanıyor', color: 'bg-gray-500/20 text-gray-700' },
  { value: 'hasRoute', label: 'Tıklanabilir', color: 'bg-blue-500/20 text-blue-700' },
  { value: 'mainModule', label: 'Ana Modül', color: 'bg-purple-500/20 text-purple-700' },
];

export const ModuleSearch: React.FC<ModuleSearchProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onReset
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterToggle = (filterValue: string) => {
    if (filters.includes(filterValue)) {
      onFiltersChange(filters.filter(f => f !== filterValue));
    } else {
      onFiltersChange([...filters, filterValue]);
    }
  };

  const hasActiveFilters = searchTerm || filters.length > 0;

  return (
    <div className="absolute top-4 left-4 z-10 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-4 space-y-3 min-w-80 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Modül ara..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        
        <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4" />
              {filters.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-primary">
                  {filters.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filtreler</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {filterOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={filters.includes(option.value)}
                onCheckedChange={() => handleFilterToggle(option.value)}
              >
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${option.color}`} />
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filters.map((filter) => {
            const option = filterOptions.find(opt => opt.value === filter);
            if (!option) return null;
            
            return (
              <Badge
                key={filter}
                className={`text-xs cursor-pointer hover:opacity-80 ${option.color}`}
                onClick={() => handleFilterToggle(filter)}
              >
                {option.label}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            );
          })}
        </div>
      )}

      {searchTerm && (
        <div className="text-xs text-muted-foreground">
          Aranan: "{searchTerm}"
        </div>
      )}
    </div>
  );
};