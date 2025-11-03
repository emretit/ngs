import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter, TrendingUp } from "lucide-react";

interface CashflowFilterBarProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth?: number;
  setSelectedMonth?: (month: number) => void;
  categoryFilter?: string;
  setCategoryFilter?: (category: string) => void;
}

const MONTHS = [
  { value: 0, label: 'Tüm Aylar' },
  { value: 1, label: 'Ocak' },
  { value: 2, label: 'Şubat' },
  { value: 3, label: 'Mart' },
  { value: 4, label: 'Nisan' },
  { value: 5, label: 'Mayıs' },
  { value: 6, label: 'Haziran' },
  { value: 7, label: 'Temmuz' },
  { value: 8, label: 'Ağustos' },
  { value: 9, label: 'Eylül' },
  { value: 10, label: 'Ekim' },
  { value: 11, label: 'Kasım' },
  { value: 12, label: 'Aralık' }
];

const CATEGORIES = [
  { value: 'all', label: 'Tüm Kategoriler' },
  { value: 'inflows', label: 'Nakit Girişleri' },
  { value: 'outflows', label: 'Nakit Çıkışları' },
  { value: 'operating', label: 'Operasyonel' },
  { value: 'investing', label: 'Yatırım' },
  { value: 'financing', label: 'Finansman' }
];

const CashflowFilterBar = ({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  categoryFilter,
  setCategoryFilter
}: CashflowFilterBarProps) => {
  // Generate years from 5 years ago to 2 years in the future
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      {/* Yıl Seçici */}
      <Select
        value={selectedYear.toString()}
        onValueChange={(value) => setSelectedYear(parseInt(value))}
      >
        <SelectTrigger className="w-[150px]">
          <Calendar className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Yıl Seçin" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Ay Seçici (Optional) */}
      {setSelectedMonth && selectedMonth !== undefined && (
        <Select
          value={selectedMonth.toString()}
          onValueChange={(value) => setSelectedMonth(parseInt(value))}
        >
          <SelectTrigger className="w-[150px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Ay Seçin" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month) => (
              <SelectItem key={month.value} value={month.value.toString()}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Kategori Filtresi (Optional) */}
      {setCategoryFilter && categoryFilter !== undefined && (
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Info Badge */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-md border border-blue-200 ml-auto">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        <span className="text-xs font-medium text-blue-800">
          {selectedYear} Yılı {selectedMonth && selectedMonth > 0 ? `- ${MONTHS[selectedMonth].label}` : ''}
        </span>
      </div>
    </div>
  );
};

export default CashflowFilterBar;
