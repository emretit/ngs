import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarDays, Building, DollarSign, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportsFiltersProps {
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams) => void;
}

export default function ReportsFilters({ searchParams, setSearchParams }: ReportsFiltersProps) {
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const setDateRange = (range: string) => {
    const newParams = new URLSearchParams(searchParams);
    const today = new Date();
    let startDate = new Date();
    
    switch (range) {
      case 'today':
        startDate = new Date();
        break;
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
    }
    
    newParams.set('dateRange', range);
    newParams.set('startDate', startDate.toISOString().split('T')[0]);
    newParams.set('endDate', today.toISOString().split('T')[0]);
    setSearchParams(newParams);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 min-w-[200px]">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={searchParams.get('dateRange') || 'month'} 
              onValueChange={setDateRange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tarih Aralığı" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Bugün</SelectItem>
                <SelectItem value="week">Son 7 Gün</SelectItem>
                <SelectItem value="month">Son 30 Gün</SelectItem>
                <SelectItem value="quarter">Son 3 Ay</SelectItem>
                <SelectItem value="year">Son 1 Yıl</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 min-w-[150px]">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={searchParams.get('currency') || 'TRY'} 
              onValueChange={(value) => updateFilter('currency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Para Birimi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">TRY</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 min-w-[180px]">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Select
              value={searchParams.get('department') || 'all'}
              onValueChange={(value) => updateFilter('department', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Departman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="sales">Satış</SelectItem>
                <SelectItem value="purchasing">Satın Alma</SelectItem>
                <SelectItem value="service">Servis</SelectItem>
                <SelectItem value="hr">İnsan Kaynakları</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 min-w-[180px]">
            <User className="h-4 w-4 text-muted-foreground" />
            <Select
              value={searchParams.get('customerSupplier') || 'all'}
              onValueChange={(value) => updateFilter('customerSupplier', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Müşteri/Tedarikçi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="customers">Sadece Müşteriler</SelectItem>
                <SelectItem value="suppliers">Sadece Tedarikçiler</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="outline" 
            onClick={() => setSearchParams(new URLSearchParams())}
            className="ml-auto"
          >
            Filtreleri Temizle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}