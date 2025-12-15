import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCashflowCategories } from "@/hooks/useCashflowCategories";
import { useCashflowSubcategories } from "@/hooks/useCashflowSubcategories";
import { CashflowCategory } from "@/hooks/useCashflowCategories";

interface CategorySelectProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  placeholder = "Kategori seçiniz",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { getCategoriesByType } = useCashflowCategories();
  const expenseCategories = getCategoriesByType('expense');
  
  // Tüm alt kategorileri çek (categoryId olmadan)
  const { subcategories: allSubcategories } = useCashflowSubcategories();

  // Kategorilere göre alt kategorileri grupla
  const categoriesWithSubcategories = useMemo(() => {
    return expenseCategories.map((category) => {
      const subcats = allSubcategories.filter(
        (sub) => sub.category_id === category.id
      );
      return {
        ...category,
        subcategories: subcats,
      };
    });
  }, [expenseCategories, allSubcategories]);

  // Seçili kategori veya alt kategoriyi bul
  const selectedItem = useMemo(() => {
    if (!value) return null;
    
    // Önce kategorilerde ara
    const category = expenseCategories.find((cat) => cat.id === value);
    if (category) {
      // Bu kategoriye ait seçili alt kategori var mı kontrol et
      // (Şimdilik sadece kategori gösteriyoruz, alt kategori seçimi için ayrı bir alan gerekebilir)
      return {
        type: "category" as const,
        id: category.id,
        name: category.name,
      };
    }
    
    return null;
  }, [value, expenseCategories]);

  // Filtreleme
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categoriesWithSubcategories;
    
    const query = searchQuery.toLowerCase();
    return categoriesWithSubcategories.filter((cat) => {
      const categoryMatch = cat.name.toLowerCase().includes(query);
      const subcategoryMatch = cat.subcategories.some((sub) =>
        sub.name.toLowerCase().includes(query)
      );
      return categoryMatch || subcategoryMatch;
    });
  }, [categoriesWithSubcategories, searchQuery]);

  const handleSelect = (itemId: string, itemType: "category" | "subcategory") => {
    // Alt kategori seçildiğinde, o alt kategorinin bağlı olduğu kategoriyi kaydet
    if (itemType === "subcategory") {
      const subcategory = allSubcategories.find((sub) => sub.id === itemId);
      if (subcategory) {
        onChange(subcategory.category_id);
      }
    } else {
      onChange(itemId);
    }
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedItem ? selectedItem.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Kategori veya alt kategori ara..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>Kategori bulunamadı.</CommandEmpty>
            <CommandGroup>
              <Accordion type="multiple" className="w-full">
                {filteredCategories.map((category) => {
                  const hasSubcategories = category.subcategories.length > 0;
                  const isCategorySelected = value === category.id;
                  
                  return (
                    <AccordionItem
                      key={category.id}
                      value={category.id}
                      className="border-none"
                    >
                      <div className="flex items-center">
                        {hasSubcategories ? (
                          <AccordionTrigger className="flex-1 py-2 px-2 hover:no-underline">
                            <div className="flex items-center flex-1">
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  isCategorySelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="font-medium">{category.name}</span>
                            </div>
                          </AccordionTrigger>
                        ) : (
                          <CommandItem
                            value={category.id}
                            onSelect={() => handleSelect(category.id, "category")}
                            className="flex-1"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                isCategorySelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span>{category.name}</span>
                          </CommandItem>
                        )}
                      </div>
                      {hasSubcategories && (
                        <AccordionContent className="pb-0">
                          <div className="pl-6 space-y-1">
                            {category.subcategories.map((subcategory) => {
                              // Alt kategori seçildiğinde, o alt kategorinin category_id'si kaydedilir
                              const isSubcategorySelected = value === category.id;
                              return (
                                <CommandItem
                                  key={subcategory.id}
                                  value={subcategory.id}
                                  onSelect={() =>
                                    handleSelect(subcategory.id, "subcategory")
                                  }
                                  className="pl-4"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4 shrink-0",
                                      isSubcategorySelected
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    {subcategory.name}
                                  </span>
                                </CommandItem>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      )}
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

