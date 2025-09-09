import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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
  sgk_employer_amount: number;
  unemployment_employer_amount: number;
  accident_insurance_amount: number;
  effective_date: string;
  allowances: any;
  notes?: string;
}

interface SalaryHistoryProps {
  employeeId: string;
}

export const SalaryHistory = ({ employeeId }: SalaryHistoryProps) => {
  const [salaryHistory, setSalaryHistory] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSalaryHistory();
  }, [employeeId]);

  const fetchSalaryHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_salaries')
        .select('*')
        .eq('employee_id', employeeId)
        .order('effective_date', { ascending: false });

      if (error) throw error;
      setSalaryHistory(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Maaş geçmişi yüklenirken hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSalaryChange = (current: number, previous: number) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const exportToCSV = () => {
    const headers = [
      'Geçerlilik Tarihi',
      'Brüt Maaş',
      'Net Maaş',
      'SGK İşveren Primi',
      'İşsizlik Sigortası',
      'İş Kazası Sigortası',
      'Toplam İşveren Maliyeti',
      'Notlar'
    ];

    const csvData = salaryHistory.map(record => [
      new Date(record.effective_date).toLocaleDateString('tr-TR'),
      record.gross_salary.toLocaleString('tr-TR'),
      record.net_salary.toLocaleString('tr-TR'),
      record.sgk_employer_amount.toLocaleString('tr-TR'),
      record.unemployment_employer_amount.toLocaleString('tr-TR'),
      record.accident_insurance_amount.toLocaleString('tr-TR'),
      record.total_employer_cost.toLocaleString('tr-TR'),
      record.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `maaş-geçmişi-${employeeId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Maaş geçmişi yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  if (salaryHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maaş Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Henüz maaş kaydı bulunmuyor.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Mevcut Brüt Maaş</div>
            <div className="text-2xl font-bold">
              ₺{salaryHistory[0]?.gross_salary.toLocaleString('tr-TR')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Toplam İşveren Maliyeti</div>
            <div className="text-2xl font-bold">
              ₺{salaryHistory[0]?.total_employer_cost.toLocaleString('tr-TR')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Toplam Kayıt</div>
            <div className="text-2xl font-bold">{salaryHistory.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Maaş Geçmişi Tablosu */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Maaş Geçmişi</CardTitle>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            CSV İndir
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Geçerlilik Tarihi</TableHead>
                <TableHead>Brüt Maaş</TableHead>
                <TableHead>Net Maaş</TableHead>
                <TableHead>SGK İşveren</TableHead>
                <TableHead>Toplam Maliyet</TableHead>
                <TableHead>Değişim</TableHead>
                <TableHead>Notlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryHistory.map((record, index) => {
                const previousRecord = salaryHistory[index + 1];
                const salaryChange = previousRecord 
                  ? calculateSalaryChange(record.gross_salary, previousRecord.gross_salary)
                  : null;

                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.effective_date).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell className="font-medium">
                      ₺{record.gross_salary.toLocaleString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      ₺{record.net_salary.toLocaleString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      ₺{record.sgk_employer_amount.toLocaleString('tr-TR')}
                    </TableCell>
                    <TableCell className="font-medium">
                      ₺{record.total_employer_cost.toLocaleString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      {salaryChange !== null && (
                        <Badge
                          variant={salaryChange >= 0 ? "default" : "destructive"}
                          className="flex items-center gap-1"
                        >
                          {salaryChange >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {salaryChange.toFixed(1)}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {record.notes}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};