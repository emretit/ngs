import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CashflowFilterBarProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth?: number;
  setSelectedMonth?: (month: number) => void;
  categoryFilter?: string;
  setCategoryFilter?: (category: string) => void;
}

const getMonths = (t: (key: string) => string) => [
  { value: 0, label: t('common.allMonths') },
  { value: 1, label: t('common.january') },
  { value: 2, label: t('common.february') },
  { value: 3, label: t('common.march') },
  { value: 4, label: t('common.april') },
  { value: 5, label: t('common.may') },
  { value: 6, label: t('common.june') },
  { value: 7, label: t('common.july') },
  { value: 8, label: t('common.august') },
  { value: 9, label: t('common.september') },
  { value: 10, label: t('common.october') },
  { value: 11, label: t('common.november') },
  { value: 12, label: t('common.december') }
];

const getCategories = (t: (key: string) => string) => [
  { value: 'all', label: t('common.allCategories') },
  { value: 'inflows', label: t('cashflow.inflows') },
  { value: 'outflows', label: t('cashflow.outflows') },
  { value: 'operating', label: t('cashflow.operating') },
  { value: 'investing', label: t('cashflow.investing') },
  { value: 'financing', label: t('cashflow.financing') }
];

const CashflowFilterBar = ({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  categoryFilter,
  setCategoryFilter
}: CashflowFilterBarProps) => {
  const { t } = useTranslation();
  const MONTHS = getMonths(t);
  const CATEGORIES = getCategories(t);
  
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
          <SelectValue placeholder={t("common.selectYear")} />
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
            <SelectValue placeholder={t("common.selectMonth")} />
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
            <SelectValue placeholder={t("common.selectCategory")} />
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
          {selectedYear} {t('common.year')} {selectedMonth && selectedMonth > 0 ? `- ${MONTHS[selectedMonth].label}` : ''}
        </span>
      </div>
    </div>
  );
};

export default CashflowFilterBar;
