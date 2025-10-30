import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Search, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

interface CategorySelectorProps {
  value: string; // "cat:<id>" | "sub:<id>" ya da ""
  onChange: (value: string) => void;
  categories: Category[];
  subcategories?: Subcategory[];
  error?: string;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  loadingText?: string;
  noResultsText?: string;
  showLabel?: boolean;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  categories,
  subcategories = [],
  error,
  label = "Kategori",
  placeholder = "Kategori seçin",
  searchPlaceholder = "Ara...",
  noResultsText = "Kayıt bulunamadı",
  showLabel = true,
  className = "",
  triggerClassName = "",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const flatItems = useMemo(() => {
    const catItems = categories.map((c) => ({
      key: `cat:${c.id}`,
      label: c.name,
      group: c.name,
      isCategory: true,
    }));
    const subItems = subcategories.map((s) => {
      const cat = categories.find((c) => c.id === s.category_id);
      return {
        key: `sub:${s.id}`,
        label: `${s.name} (${cat?.name || ""})`,
        group: cat?.name || "",
        isCategory: false,
      };
    });
    return [...catItems, ...subItems];
  }, [categories, subcategories]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return flatItems;
    return flatItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [flatItems, searchQuery]);

  const selectedItem = flatItems.find((i) => i.key === value);

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <Label className={cn("text-sm font-medium text-gray-700", error ? "text-red-500" : "")}>{label}</Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full h-9 text-sm justify-between",
              triggerClassName,
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            <span className="truncate text-left flex-1">
              {selectedItem ? selectedItem.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">{noResultsText}</div>
            ) : (
              <div className="p-1">
                {filtered.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer rounded-sm"
                    onClick={() => {
                      onChange(item.key);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default CategorySelector;


