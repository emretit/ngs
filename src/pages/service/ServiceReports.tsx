import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useServiceAnalytics } from '@/hooks/service/useServiceAnalytics';
import { useTechnicianPerformance } from '@/hooks/service/useTechnicianPerformance';
import { useServiceCostAnalysis } from '@/hooks/service/useServiceCostAnalysis';
import { useCustomerSatisfaction } from '@/hooks/service/useCustomerSatisfaction';
import { ServiceAnalyticsDashboard } from '@/components/service/ServiceAnalyticsDashboard';
import { TechnicianPerformanceDashboard } from '@/components/service/TechnicianPerformanceDashboard';
import { ServiceCostAnalysis } from '@/components/service/ServiceCostAnalysis';
import { CustomerSatisfactionDashboard } from '@/components/service/CustomerSatisfactionDashboard';

export default function ServiceReports() {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [reportType, setReportType] = useState<'summary' | 'performance' | 'cost' | 'satisfaction'>('summary');

  const handleExport = (format: 'pdf' | 'excel') => {
    // Export functionality - can be implemented later
    console.log(`Exporting ${reportType} report as ${format}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Servis Raporları</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detaylı servis analizleri ve raporlar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Özet Rapor</SelectItem>
              <SelectItem value="performance">Performans Raporu</SelectItem>
              <SelectItem value="cost">Maliyet Raporu</SelectItem>
              <SelectItem value="satisfaction">Memnuniyet Raporu</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF İndir
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel İndir
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 block">Başlangıç Tarihi</label>
              <DatePicker
                date={startDate}
                onSelect={setStartDate}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 block">Bitiş Tarihi</label>
              <DatePicker
                date={endDate}
                onSelect={setEndDate}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                setEndDate(new Date());
              }}
            >
              Bu Ay
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Tabs value={reportType} onValueChange={(value: any) => setReportType(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">
            <FileText className="h-4 w-4 mr-2" />
            Özet
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performans
          </TabsTrigger>
          <TabsTrigger value="cost">
            <DollarSign className="h-4 w-4 mr-2" />
            Maliyet
          </TabsTrigger>
          <TabsTrigger value="satisfaction">
            <Users className="h-4 w-4 mr-2" />
            Memnuniyet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <ServiceAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="performance">
          <TechnicianPerformanceDashboard />
        </TabsContent>

        <TabsContent value="cost">
          <ServiceCostAnalysis />
        </TabsContent>

        <TabsContent value="satisfaction">
          <CustomerSatisfactionDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}




