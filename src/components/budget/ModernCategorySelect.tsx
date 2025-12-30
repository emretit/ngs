import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useCashflowCategories } from "@/hooks/useCashflowCategories";
import { useCashflowSubcategories } from "@/hooks/useCashflowSubcategories";

interface ModernCategorySelectProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

export const ModernCategorySelect: React.FC<ModernCategorySelectProps> = ({
  value,
  onChange,
  placeholder = "Kategori seçiniz",
  className,
}) => {
  const { getCategoriesByType } = useCashflowCategories();
  const expenseCategories = getCategoriesByType('expense');

  // Tüm alt kategorileri çek
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

  // Seçili öğeyi bul ve görüntülenecek metni oluştur
  const displayValue = useMemo(() => {
    if (!value) return placeholder;

    // Önce alt kategorilerde ara
    const subcategory = allSubcategories.find((sub) => sub.id === value);
    if (subcategory) {
      const parentCategory = expenseCategories.find((cat) => cat.id === subcategory.category_id);
      return `${parentCategory?.name || ''} > ${subcategory.name}`;
    }

    // Sonra kategorilerde ara
    const category = expenseCategories.find((cat) => cat.id === value);
    if (category) {
      return category.name;
    }

    return placeholder;
  }, [value, expenseCategories, allSubcategories, placeholder]);

  return (
    <div className="relative">
      <Select
        value={value || undefined}
        onValueChange={(val) => onChange(val || null)}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder}>
            {displayValue}
          </SelectValue>
        </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {categoriesWithSubcategories.map((category) => (
          <SelectGroup key={category.id}>
            {/* Ana kategori başlığı */}
            <SelectLabel className="text-xs font-semibold text-gray-700 px-2 py-1.5">
              {category.name}
            </SelectLabel>

            {/* Ana kategori seçeneği */}
            <SelectItem
              value={category.id}
              className="font-medium"
            >
              {category.name}
            </SelectItem>

            {/* Alt kategoriler */}
            {category.subcategories.map((subcategory) => (
              <SelectItem
                key={subcategory.id}
                value={subcategory.id}
                className="pl-6 text-sm"
              >
                <span className="text-gray-600">→</span> {subcategory.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}

        {categoriesWithSubcategories.length === 0 && (
          <div className="py-6 text-center text-sm text-gray-500">
            Kategori bulunamadı
          </div>
        )}
      </SelectContent>
      </Select>

      {/* Clear button - sadece değer seçiliyse göster */}
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            onChange(null);
          }}
        >
          <X className="h-3 w-3 text-gray-500" />
        </Button>
      )}
    </div>
  );
};
