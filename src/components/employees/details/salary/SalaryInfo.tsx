import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Edit, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SalaryRecord {
  id: string;
  gross_salary: number;
  net_salary: number;
  total_employer_cost: number;
  manual_employer_sgk_cost: number;
  effective_date: string;
  meal_allowance: number;
  transport_allowance: number;
  notes?: string;
}

interface SalaryInfoProps {
  employeeId: string;
  onEdit?: (salaryData: SalaryRecord) => void;
  refreshTrigger?: number;
}

export const SalaryInfo = ({ employeeId, onEdit, refreshTrigger }: SalaryInfoProps) => {
  const [currentSalary, setCurrentSalary] = useState<SalaryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentSalary();
  }, [employeeId, refreshTrigger]);

  const fetchCurrentSalary = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employee_salaries')
        .select('*')
        .eq('employee_id', employeeId)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentSalary(data || null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Maaş bilgileri yüklenirken hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!currentSalary) return;

    const headers = [
      'Kayıt Tarihi',
      'Net Maaş',
      'SGK İşveren Maliyeti',
      'Yemek Yardımı',
      'Yol Yardımı',
      'Toplam İşveren Maliyeti',
      'Notlar'
    ];

    const csvData = [[
      new Date(currentSalary.effective_date).toLocaleDateString('tr-TR'),
      currentSalary.net_salary.toLocaleString('tr-TR'),
      (currentSalary.manual_employer_sgk_cost || 0).toLocaleString('tr-TR'),
      currentSalary.meal_allowance.toLocaleString('tr-TR'),
      currentSalary.transport_allowance.toLocaleString('tr-TR'),
      currentSalary.total_employer_cost.toLocaleString('tr-TR'),
      currentSalary.notes || ''
    ]];

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `maaş-bilgileri-${employeeId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Maaş bilgileri yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  if (!currentSalary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maaş Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Henüz maaş kaydı bulunmuyor.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-sky-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏦</div>
              <div>
                <div className="text-sm font-medium text-blue-700">Net Maaş</div>
                <div className="text-2xl font-bold text-blue-800">
                  ₺{currentSalary.net_salary.toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏢</div>
              <div>
                <div className="text-sm font-medium text-green-700">SGK İşveren Maliyeti</div>
                <div className="text-2xl font-bold text-green-800">
                  ₺{(currentSalary.manual_employer_sgk_cost || 0).toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🍽️</div>
              <div>
                <div className="text-sm font-medium text-orange-700">Yemek + Yol</div>
                <div className="text-2xl font-bold text-orange-800">
                  ₺{(currentSalary.meal_allowance + currentSalary.transport_allowance).toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📊</div>
              <div>
                <div className="text-sm font-medium text-purple-700">Toplam İşveren Maliyeti</div>
                <div className="text-2xl font-bold text-purple-800">
                  ₺{currentSalary.total_employer_cost.toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maaş Bilgileri Tablosu */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-gray-50 to-slate-100">
          <CardTitle className="text-xl flex items-center gap-2">
            📋 Güncel Maaş Bilgileri
          </CardTitle>
          <div className="flex gap-3">
            <Button 
              onClick={fetchCurrentSalary} 
              variant="outline" 
              size="sm"
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
            {onEdit && (
              <Button 
                onClick={() => onEdit(currentSalary)} 
                variant="outline" 
                size="sm"
                className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
            )}
            <Button 
              onClick={exportToCSV} 
              variant="outline" 
              size="sm"
              className="border-2 border-green-300 text-green-700 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV İndir
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">📅 Kayıt Tarihi</TableHead>
                  <TableHead className="font-semibold text-gray-700">🏦 Net Maaş</TableHead>
                  <TableHead className="font-semibold text-gray-700">🏢 SGK İşveren</TableHead>
                  <TableHead className="font-semibold text-gray-700">🍽️ Yemek</TableHead>
                  <TableHead className="font-semibold text-gray-700">🚗 Yol</TableHead>
                  <TableHead className="font-semibold text-gray-700">📊 Toplam Maliyet</TableHead>
                  <TableHead className="font-semibold text-gray-700">📝 Notlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {new Date(currentSalary.effective_date).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="font-bold text-blue-700">
                    ₺{currentSalary.net_salary.toLocaleString('tr-TR')}
                  </TableCell>
                  <TableCell className="font-bold text-green-700">
                    ₺{(currentSalary.manual_employer_sgk_cost || 0).toLocaleString('tr-TR')}
                  </TableCell>
                  <TableCell className="font-medium text-orange-700">
                    ₺{currentSalary.meal_allowance.toLocaleString('tr-TR')}
                  </TableCell>
                  <TableCell className="font-medium text-purple-700">
                    ₺{currentSalary.transport_allowance.toLocaleString('tr-TR')}
                  </TableCell>
                  <TableCell className="font-bold text-xl text-purple-800 bg-purple-50">
                    ₺{currentSalary.total_employer_cost.toLocaleString('tr-TR')}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-gray-600">
                    {currentSalary.notes || "-"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};