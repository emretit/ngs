import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Calendar, AlertCircle, Check } from "lucide-react";
import { Employee } from "@/types/employee";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BulkPayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmployees: Employee[];
}

interface PayrollItem {
  employee: Employee;
  grossSalary: number;
  netSalary: number;
  totalCost: number;
  status: 'pending' | 'calculated' | 'processed';
}

export const BulkPayrollDialog = ({ open, onOpenChange, selectedEmployees }: BulkPayrollDialogProps) => {
  const { toast } = useToast();
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [payrollDate, setPayrollDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize payroll items when dialog opens
  React.useEffect(() => {
    if (open && selectedEmployees.length > 0) {
      const items: PayrollItem[] = selectedEmployees.map(employee => ({
        employee,
        grossSalary: 0,
        netSalary: 0,
        totalCost: 0,
        status: 'pending'
      }));
      setPayrollItems(items);
      loadExistingSalaries();
    }
  }, [open, selectedEmployees]);

  const loadExistingSalaries = async () => {
    try {
      const employeeIds = selectedEmployees.map(emp => emp.id);
      const { data: salaries, error } = await supabase
        .from('employee_salaries')
        .select('*')
        .in('employee_id', employeeIds);

      if (error) throw error;

      setPayrollItems(prev => prev.map(item => {
        const salary = salaries?.find(s => s.employee_id === item.employee.id);
        if (salary) {
          return {
            ...item,
            grossSalary: salary.gross_salary || 0,
            netSalary: salary.net_salary || 0,
            totalCost: salary.total_employer_cost || 0,
            status: 'calculated'
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Error loading salaries:', error);
    }
  };

  const calculateTotalPayroll = () => {
    return payrollItems.reduce((total, item) => total + item.totalCost, 0);
  };

  const handleProcessPayroll = async () => {
    setIsProcessing(true);
    try {
      const payrollRecords = payrollItems
        .filter(item => item.status === 'calculated' && item.totalCost > 0)
        .map(item => ({
          employee_id: item.employee.id,
          payroll_date: payrollDate,
          gross_salary: item.grossSalary,
          net_salary: item.netSalary,
          total_cost: item.totalCost,
          status: 'tahakkuk_edildi',
          notes: notes,
          processed_at: new Date().toISOString()
        }));

      if (payrollRecords.length === 0) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Tahakkuk edilecek maaş bulunamadı. Lütfen çalışanların maaş bilgilerini kontrol edin.",
        });
        return;
      }

      const { error } = await supabase
        .from('payroll_records')
        .insert(payrollRecords);

      if (error) throw error;

      // Create company debt record
      const totalAmount = calculateTotalPayroll();
      const { error: debtError } = await supabase
        .from('company_debts')
        .insert({
          description: `${payrollDate} tarihli maaş tahakkuku`,
          amount: totalAmount,
          due_date: payrollDate,
          category: 'maas_tahakkuk',
          status: 'beklemede',
          created_at: new Date().toISOString()
        });

      if (debtError) throw debtError;

      toast({
        title: "Başarılı",
        description: `${payrollRecords.length} çalışanın maaşı başarıyla tahakkuk edildi ve şirket borçlandırıldı.`,
      });

      onOpenChange(false);
      setPayrollItems([]);
      setNotes("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Tahakkuk işlemi sırasında hata oluştu",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const validItems = payrollItems.filter(item => item.status === 'calculated' && item.totalCost > 0);
  const totalPayroll = calculateTotalPayroll();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calculator className="h-6 w-6 text-purple-600" />
            Toplu Maaş Tahakkuku
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tahakkuk Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Tahakkuk Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payrollDate">Tahakkuk Tarihi</Label>
                  <Input
                    id="payrollDate"
                    type="date"
                    value={payrollDate}
                    onChange={(e) => setPayrollDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Seçili Çalışan Sayısı</Label>
                  <div className="text-lg font-semibold text-purple-600 mt-2">
                    {selectedEmployees.length} çalışan
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Açıklama</Label>
                <Textarea
                  id="notes"
                  placeholder="Tahakkuk ile ilgili notlar..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Çalışan Listesi */}
          <Card>
            <CardHeader>
              <CardTitle>Tahakkuk Edilecek Çalışanlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payrollItems.map((item, index) => (
                  <div key={item.employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-semibold text-purple-700">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">
                          {item.employee.first_name} {item.employee.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.employee.position} - {item.employee.department_id}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {item.status === 'calculated' ? (
                        <>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Net Maaş</div>
                            <div className="font-semibold">₺{item.netSalary.toLocaleString('tr-TR')}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Toplam Maliyet</div>
                            <div className="font-semibold text-purple-600">₺{item.totalCost.toLocaleString('tr-TR')}</div>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <Check className="h-3 w-3 mr-1" />
                            Hazır
                          </Badge>
                        </>
                      ) : (
                        <>
                          <div className="text-right">
                            <div className="text-sm text-orange-600">Maaş bilgisi yok</div>
                          </div>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Eksik
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Toplam Özet */}
          {validItems.length > 0 && (
            <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-purple-700">Tahakkuk Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{validItems.length}</div>
                    <div className="text-sm text-gray-600">Tahakkuk Edilecek</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">{payrollItems.length - validItems.length}</div>
                    <div className="text-sm text-gray-600">Eksik Bilgi</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-700">₺{totalPayroll.toLocaleString('tr-TR')}</div>
                    <div className="text-sm text-gray-600">Toplam Maliyet</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleProcessPayroll}
              disabled={validItems.length === 0 || isProcessing}
              className="flex-1 h-12 bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? "İşleniyor..." : `${validItems.length} Çalışanın Maaşını Tahakkuk Et`}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 px-8"
            >
              İptal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};