import React, { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Calendar, AlertCircle, Check, DollarSign } from "lucide-react";
import { Employee } from "@/types/employee";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BulkPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmployees: Employee[];
}

interface PayrollRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  payroll_date: string;
  net_salary: number;
  total_cost: number;
  status: string;
  selected: boolean;
}

export const BulkPaymentDialog = ({ open, onOpenChange, selectedEmployees }: BulkPaymentDialogProps) => {
  const { toast } = useToast();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState("banka_havalesi");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load pending payroll records when dialog opens
  useEffect(() => {
    if (open && selectedEmployees.length > 0) {
      loadPendingPayrolls();
    }
  }, [open, selectedEmployees]);

  const loadPendingPayrolls = async () => {
    setLoading(true);
    try {
      const employeeIds = selectedEmployees.map(emp => emp.id);

      const { data: records, error } = await supabase
        .from('payroll_records')
        .select(`
          id,
          employee_id,
          payroll_date,
          net_salary,
          total_cost,
          status,
          employees!inner (
            first_name,
            last_name
          )
        `)
        .in('employee_id', employeeIds)
        .eq('status', 'tahakkuk_edildi')
        .order('payroll_date', { ascending: false });

      if (error) throw error;

      const formattedRecords: PayrollRecord[] = records?.map(record => ({
        id: record.id,
        employee_id: record.employee_id,
        employee_name: `${record.employees.first_name} ${record.employees.last_name}`,
        payroll_date: record.payroll_date,
        net_salary: record.net_salary || 0,
        total_cost: record.total_cost || 0,
        status: record.status,
        selected: true
      })) || [];

      setPayrollRecords(formattedRecords);
    } catch (error) {
      logger.error('Error loading payroll records:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Tahakkuk kayıtları yüklenirken hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRecordSelection = (recordId: string) => {
    setPayrollRecords(prev => prev.map(record =>
      record.id === recordId
        ? { ...record, selected: !record.selected }
        : record
    ));
  };

  const toggleSelectAll = () => {
    const allSelected = payrollRecords.every(record => record.selected);
    setPayrollRecords(prev => prev.map(record => ({
      ...record,
      selected: !allSelected
    })));
  };

  const getSelectedRecords = () => payrollRecords.filter(record => record.selected);
  const getTotalPayment = () => getSelectedRecords().reduce((total, record) => total + record.net_salary, 0);

  const handleProcessPayments = async () => {
    const selectedRecords = getSelectedRecords();

    if (selectedRecords.length === 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen ödeme yapılacak kayıtları seçin",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Update payroll records to paid status
      const recordIds = selectedRecords.map(record => record.id);
      const { error: updateError } = await supabase
        .from('payroll_records')
        .update({
          status: 'odendi',
          payment_date: paymentDate,
          payment_method: paymentMethod,
          payment_notes: notes
        })
        .in('id', recordIds);

      if (updateError) throw updateError;

      // Create payment transactions
      const paymentTransactions = selectedRecords.map(record => ({
        employee_id: record.employee_id,
        payroll_record_id: record.id,
        amount: record.net_salary,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        description: `${record.payroll_date} maaş ödemesi`,
        status: 'tamamlandi',
        notes: notes
      }));

      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert(paymentTransactions);

      if (transactionError) throw transactionError;

      // Update company cash flow
      const totalAmount = getTotalPayment();
      const { error: cashflowError } = await supabase
        .from('company_cashflow')
        .insert({
          description: `${paymentDate} tarihli maaş ödemeleri`,
          amount: -totalAmount, // Negative because it's an expense
          category: 'maas_odeme',
          transaction_date: paymentDate,
          notes: notes
        });

      if (cashflowError) throw cashflowError;

      toast({
        title: "Başarılı",
        description: `${selectedRecords.length} çalışanın maaş ödemesi başarıyla tamamlandı.`,
      });

      onOpenChange(false);
      setPayrollRecords([]);
      setNotes("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Ödeme işlemi sırasında hata oluştu",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCount = getSelectedRecords().length;
  const totalPayment = getTotalPayment();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-6 w-6 text-emerald-600" />
            Toplu Maaş Ödemesi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ödeme Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Ödeme Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="paymentDate">Ödeme Tarihi</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Ödeme Yöntemi</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banka_havalesi">Banka Havalesi</SelectItem>
                      <SelectItem value="nakit">Nakit</SelectItem>
                      <SelectItem value="cek">Çek</SelectItem>
                      <SelectItem value="eft">EFT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Seçili Çalışan</Label>
                  <div className="text-lg font-semibold text-emerald-600 mt-2">
                    {selectedEmployees.length} çalışan
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Ödeme Açıklaması</Label>
                <Textarea
                  id="notes"
                  placeholder="Ödeme ile ilgili notlar..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tahakkuk Kayıtları */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ödeme Bekleyen Maaşlar</CardTitle>
                {payrollRecords.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {payrollRecords.every(record => record.selected) ? "Tümünü Kaldır" : "Tümünü Seç"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Tahakkuk kayıtları yükleniyor...</div>
                </div>
              ) : payrollRecords.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <div className="text-lg text-gray-600">Ödeme bekleyen tahakkuk kaydı bulunamadı</div>
                  <div className="text-sm text-gray-500 mt-2">
                    Önce maaş tahakkuku yapmalısınız
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {payrollRecords.map((record) => (
                    <div key={record.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        checked={record.selected}
                        onCheckedChange={() => toggleRecordSelection(record.id)}
                      />

                      <div className="flex-1">
                        <div className="font-medium">{record.employee_name}</div>
                        <div className="text-sm text-gray-500">
                          Tahakkuk Tarihi: {new Date(record.payroll_date).toLocaleDateString('tr-TR')}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-500">Net Maaş</div>
                        <div className="font-semibold text-emerald-600">
                          ₺{record.net_salary.toLocaleString('tr-TR')}
                        </div>
                      </div>

                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        Beklemede
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ödeme Özeti */}
          {selectedCount > 0 && (
            <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
              <CardHeader>
                <CardTitle className="text-emerald-700 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Ödeme Özeti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600">{selectedCount}</div>
                    <div className="text-sm text-gray-600">Ödenecek Maaş</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-700">₺{totalPayment.toLocaleString('tr-TR')}</div>
                    <div className="text-sm text-gray-600">Toplam Ödeme Tutarı</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleProcessPayments}
              disabled={selectedCount === 0 || isProcessing}
              className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? "İşleniyor..." : `${selectedCount} Maaş Ödemesi Yap`}
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