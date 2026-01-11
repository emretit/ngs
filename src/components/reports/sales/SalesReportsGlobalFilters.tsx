/**
 * Sales Reports Global Filters
 * Satış raporlarına özel global filtreler - Teklifler sayfası filter bar stili
 */

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { 
  Filter, 
  Users, 
  Building2, 
  Banknote, 
  Calendar,
  X
} from "lucide-react";
import { 
  format, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear, 
  subMonths 
} from "date-fns";
import { tr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import type { GlobalFilters } from "@/types/salesReports";

interface SalesReportsGlobalFiltersProps {
  filters: GlobalFilters;
  onFiltersChange: (filters: GlobalFilters) => void;
}

const salesStages = [
  { value: "open", label: "Açık" },
  { value: "qualified", label: "Nitelikli" },
  { value: "proposal", label: "Teklif" },
  { value: "negotiation", label: "Müzakere" },
  { value: "won", label: "Kazanıldı" },
  { value: "lost", label: "Kaybedildi" },
];

const currencies = [
  { value: "TRY", label: "₺ TRY" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
];

export default function SalesReportsGlobalFilters({
  filters,
  onFiltersChange,
}: SalesReportsGlobalFiltersProps) {
  const { companyId } = useCurrentCompany();
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined
  );

  // Fetch sales representatives (employees)
  const { data: salesReps } = useQuery({
    queryKey: ['sales-reps', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        
        .eq('status', 'aktif')
        .order('first_name');
      return data || [];
    }
  });

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ['customers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('customers')
        .select('id, name')
        
        .order('name');
      return data || [];
    }
  });

  // Fetch project types from opportunities
  const { data: projectTypes } = useQuery({
    queryKey: ['project-types', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('opportunities')
        .select('project_type')
        
        .not('project_type', 'is', null);
      
      if (!data) return [];
      
      const uniqueTypes = Array.from(new Set(data.map((item: any) => item.project_type).filter(Boolean)));
      return uniqueTypes.map((type: string) => ({ value: type, label: type }));
    }
  });

  const updateFilter = (key: keyof GlobalFilters, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };
    onFiltersChange(newFilters);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    updateFilter('startDate', date ? format(date, 'yyyy-MM-dd') : undefined);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    updateFilter('endDate', date ? format(date, 'yyyy-MM-dd') : undefined);
  };

  // Calculate active filter count
  const activeFilterCount = (() => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.salesRepId) count++;
    if (filters.customerId) count++;
    if (filters.projectId) count++;
    if (filters.salesStage) count++;
    if (filters.currency && filters.currency !== 'TRY') count++;
    return count;
  })();

  // Reset all filters
  const handleResetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onFiltersChange({
      startDate: undefined,
      endDate: undefined,
      salesRepId: undefined,
      customerId: undefined,
      projectId: undefined,
      salesStage: undefined,
      currency: 'TRY',
    });
  };

  // Quick date presets
  const handleDatePreset = (preset: string) => {
    let start: Date | undefined;
    let end: Date | undefined;

    switch (preset) {
      case 'today':
        start = new Date();
        end = new Date();
        break;
      case 'yesterday':
        start = subDays(new Date(), 1);
        end = subDays(new Date(), 1);
        break;
      case 'last7days':
        start = subDays(new Date(), 7);
        end = new Date();
        break;
      case 'last30days':
        start = subDays(new Date(), 30);
        end = new Date();
        break;
      case 'thisMonth':
        start = startOfMonth(new Date());
        end = endOfMonth(new Date());
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(new Date(), 1));
        end = endOfMonth(subMonths(new Date(), 1));
        break;
      case 'thisQuarter':
        start = startOfQuarter(new Date());
        end = endOfQuarter(new Date());
        break;
      case 'thisYear':
        start = startOfYear(new Date());
        end = endOfYear(new Date());
        break;
      default:
        return;
    }

    setStartDate(start);
    setEndDate(end);
    updateFilter('startDate', format(start, 'yyyy-MM-dd'));
    updateFilter('endDate', format(end, 'yyyy-MM-dd'));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      {/* Tarih Filtreleri */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <DatePicker
          date={startDate}
          onSelect={handleStartDateChange}
          placeholder="Başlangıç"
        />
        <span className="text-muted-foreground text-sm">-</span>
        <DatePicker
          date={endDate}
          onSelect={handleEndDateChange}
          placeholder="Bitiş"
        />
        <Select value="" onValueChange={handleDatePreset}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Hızlı Seçim" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Bugün</SelectItem>
            <SelectItem value="yesterday">Dün</SelectItem>
            <SelectItem value="last7days">Son 7 Gün</SelectItem>
            <SelectItem value="last30days">Son 30 Gün</SelectItem>
            <SelectItem value="thisMonth">Bu Ay</SelectItem>
            <SelectItem value="lastMonth">Geçen Ay</SelectItem>
            <SelectItem value="thisQuarter">Bu Çeyrek</SelectItem>
            <SelectItem value="thisYear">Bu Yıl</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Satış Temsilcisi */}
      {salesReps && salesReps.length > 0 && (
        <Select 
          value={filters.salesRepId || 'all'} 
          onValueChange={(val) => updateFilter('salesRepId', val === 'all' ? undefined : val)}
        >
          <SelectTrigger className="w-[200px]">
            <Users className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Satış Temsilcisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Temsilciler</SelectItem>
            {salesReps.map((rep) => (
              <SelectItem key={rep.id} value={rep.id}>
                {rep.first_name} {rep.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Müşteri */}
      {customers && customers.length > 0 && (
        <Select 
          value={filters.customerId || 'all'} 
          onValueChange={(val) => updateFilter('customerId', val === 'all' ? undefined : val)}
        >
          <SelectTrigger className="w-[200px]">
            <Building2 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Müşteri" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Müşteriler</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Satış Aşaması */}
      <Select 
        value={filters.salesStage || 'all'} 
        onValueChange={(val) => updateFilter('salesStage', val === 'all' ? undefined : val)}
      >
        <SelectTrigger className="w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Satış Aşaması" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Aşamalar</SelectItem>
          {salesStages.map((stage) => (
            <SelectItem key={stage.value} value={stage.value}>
              {stage.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Para Birimi */}
      <Select 
        value={filters.currency || 'TRY'} 
        onValueChange={(val) => updateFilter('currency', val)}
      >
        <SelectTrigger className="w-[110px]">
          <Banknote className="mr-2 h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtreleri Sıfırla Butonu */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetFilters}
          className="ml-auto"
        >
          <X className="h-4 w-4 mr-1" />
          Temizle
        </Button>
      )}
    </div>
  );
}
