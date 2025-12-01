import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BudgetFiltersState } from "@/pages/BudgetManagement";

interface BudgetFiltersProps {
  filters: BudgetFiltersState;
  onFiltersChange: (filters: BudgetFiltersState) => void;
}

const BudgetFilters = ({ filters, onFiltersChange }: BudgetFiltersProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleFilterChange = (key: keyof BudgetFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Year Selector */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Yıl</label>
        <Select
          value={filters.year.toString()}
          onValueChange={(value) => handleFilterChange("year", parseInt(value))}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Period View Selector */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Görünüm</label>
        <Select
          value={filters.periodView}
          onValueChange={(value) => handleFilterChange("periodView", value as "yearly" | "quarterly" | "monthly")}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yearly">Yıllık</SelectItem>
            <SelectItem value="quarterly">Üç Aylık</SelectItem>
            <SelectItem value="monthly">Aylık</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Company Selector */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Şirket</label>
        <Select
          value={filters.company}
          onValueChange={(value) => handleFilterChange("company", value)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="company1">Şirket 1</SelectItem>
            <SelectItem value="company2">Şirket 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Department Selector */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Departman</label>
        <Select
          value={filters.department}
          onValueChange={(value) => handleFilterChange("department", value)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="sales">Satış</SelectItem>
            <SelectItem value="marketing">Pazarlama</SelectItem>
            <SelectItem value="operations">Operasyon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Selector */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Proje</label>
        <Select
          value={filters.project}
          onValueChange={(value) => handleFilterChange("project", value)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="project1">Proje 1</SelectItem>
            <SelectItem value="project2">Proje 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Currency Selector */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Para Birimi</label>
        <Select
          value={filters.currency}
          onValueChange={(value) => handleFilterChange("currency", value as "TRY" | "USD" | "EUR")}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TRY">TRY</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default BudgetFilters;

