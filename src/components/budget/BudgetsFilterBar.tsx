import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar, DollarSign } from "lucide-react";

interface BudgetsFilterBarProps {
  searchYear: string;
  setSearchYear: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedCurrency: string;
  setSelectedCurrency: (value: string) => void;
}

const BudgetsFilterBar = ({
  searchYear,
  setSearchYear,
  selectedStatus,
  setSelectedStatus,
  selectedCurrency,
  setSelectedCurrency
}: BudgetsFilterBarProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Yıl ara (örn: 2024)..."
          value={searchYear}
          onChange={(e) => setSearchYear(e.target.value)}
          className="pl-10 w-full"
          type="number"
          min="2000"
          max="2100"
        />
      </div>
      
      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger className="w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Durumlar</SelectItem>
          <SelectItem value="draft">📝 Taslak</SelectItem>
          <SelectItem value="approved">✅ Onaylı</SelectItem>
          <SelectItem value="locked">🔒 Kilitli</SelectItem>
          <SelectItem value="mixed">🔀 Karışık</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
        <SelectTrigger className="w-[180px]">
          <DollarSign className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Para Birimi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Para Birimleri</SelectItem>
          <SelectItem value="TRY">₺ TRY</SelectItem>
          <SelectItem value="USD">$ USD</SelectItem>
          <SelectItem value="EUR">€ EUR</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default BudgetsFilterBar;

