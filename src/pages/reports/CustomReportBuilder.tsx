/**
 * CustomReportBuilder Page
 * Özel rapor oluşturucu - tablo seçimi, sütun seçimi, filtre ekleme
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, FileText, BarChart3, LineChart, PieChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReportsHeader from "@/components/reports/ReportsHeader";

interface TableColumn {
  name: string;
  type: string;
}

interface CustomReport {
  id: string;
  name: string;
  table: string;
  columns: string[];
  filters: Record<string, any>;
  chartType?: 'bar' | 'line' | 'pie' | 'table';
}

const AVAILABLE_TABLES = [
  { value: 'proposals', label: 'Teklifler' },
  { value: 'opportunities', label: 'Fırsatlar' },
  { value: 'customers', label: 'Müşteriler' },
  { value: 'products', label: 'Ürünler' },
  { value: 'service_requests', label: 'Servis Talepleri' },
  { value: 'employees', label: 'Çalışanlar' },
  { value: 'einvoices', label: 'E-Faturalar' },
  { value: 'orders', label: 'Siparişler' },
];

export default function CustomReportBuilder() {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [reportName, setReportName] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'table'>('table');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Fetch table columns
  const { data: tableColumns, isLoading: columnsLoading } = useQuery({
    queryKey: ['table-columns', selectedTable],
    queryFn: async () => {
      if (!selectedTable) return [];
      
      // Get sample data to infer columns
      const { data, error } = await supabase
        .from(selectedTable)
        .select('*')
        .limit(1);
      
      if (error || !data || data.length === 0) return [];
      
      return Object.keys(data[0]).map(key => ({
        name: key,
        type: typeof data[0][key as keyof typeof data[0]],
      }));
    },
    enabled: !!selectedTable,
  });

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnName)
        ? prev.filter(c => c !== columnName)
        : [...prev, columnName]
    );
  };

  const handleSaveReport = () => {
    if (!reportName.trim()) {
      toast.error('Lütfen rapor adı girin');
      return;
    }
    if (!selectedTable) {
      toast.error('Lütfen tablo seçin');
      return;
    }
    if (selectedColumns.length === 0) {
      toast.error('Lütfen en az bir sütun seçin');
      return;
    }

    const report: CustomReport = {
      id: Date.now().toString(),
      name: reportName,
      table: selectedTable,
      columns: selectedColumns,
      filters,
      chartType,
    };

    // Save to localStorage
    const savedReports = JSON.parse(localStorage.getItem('customReports') || '[]');
    savedReports.push(report);
    localStorage.setItem('customReports', JSON.stringify(savedReports));

    toast.success('Rapor kaydedildi');
    // Reset form
    setReportName('');
    setSelectedTable('');
    setSelectedColumns([]);
    setFilters({});
  };

  return (
    <div className="space-y-4">
      <ReportsHeader />

      <Card className="p-4">
        <h1 className="text-xl font-semibold mb-4">Özel Rapor Oluşturucu</h1>

        <Tabs defaultValue="config" className="space-y-4">
          <TabsList>
            <TabsTrigger value="config">Yapılandırma</TabsTrigger>
            <TabsTrigger value="filters">Filtreler</TabsTrigger>
            <TabsTrigger value="chart">Grafik</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="space-y-2">
              <Label>Rapor Adı</Label>
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Örn: Aylık Satış Raporu"
              />
            </div>

            <div className="space-y-2">
              <Label>Tablo Seçimi</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Tablo seçin" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_TABLES.map((table) => (
                    <SelectItem key={table.value} value={table.value}>
                      {table.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTable && (
              <div className="space-y-2">
                <Label>Sütun Seçimi</Label>
                <div className="border rounded-lg p-3 max-h-[300px] overflow-auto">
                  {columnsLoading ? (
                    <div className="text-sm text-muted-foreground">Yükleniyor...</div>
                  ) : (
                    <div className="space-y-2">
                      {tableColumns?.map((column) => (
                        <div key={column.name} className="flex items-center space-x-2">
                          <Checkbox
                            id={column.name}
                            checked={selectedColumns.includes(column.name)}
                            onCheckedChange={() => handleColumnToggle(column.name)}
                          />
                          <Label
                            htmlFor={column.name}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {column.name}
                            <span className="text-xs text-muted-foreground ml-2">
                              ({column.type})
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Filtre özellikleri yakında eklenecek
            </div>
          </TabsContent>

          <TabsContent value="chart" className="space-y-4">
            <div className="space-y-2">
              <Label>Grafik Tipi</Label>
              <Select
                value={chartType}
                onValueChange={(value) => setChartType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Tablo
                    </div>
                  </SelectItem>
                  <SelectItem value="bar">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Bar Grafik
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4" />
                      Çizgi Grafik
                    </div>
                  </SelectItem>
                  <SelectItem value="pie">
                    <div className="flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Pasta Grafik
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            onClick={handleSaveReport}
            disabled={!reportName || !selectedTable || selectedColumns.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Raporu Kaydet
          </Button>
        </div>
      </Card>
    </div>
  );
}
