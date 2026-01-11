import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Employee } from "@/types/employee";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { format, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale";

interface AddSalaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
}

export const AddSalaryDialog = ({ open, onOpenChange, employee }: AddSalaryDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [salaryPeriod, setSalaryPeriod] = useState<Date>(new Date());
  const [netSalary, setNetSalary] = useState("");
  const [accrualDate, setAccrualDate] = useState<Date>(endOfMonth(new Date()));
  const [notes, setNotes] = useState("");

  // Employee değiştiğinde net maaşı otomatik doldur
  useEffect(() => {
    if (employee.net_salary) {
      setNetSalary(employee.net_salary.toString());
    }
  }, [employee.net_salary]);

  // Dönem değiştiğinde tahakkuk tarihini dönem sonuna ayarla
  useEffect(() => {
    setAccrualDate(endOfMonth(salaryPeriod));
  }, [salaryPeriod]);

  const addSalaryMutation = useMutation({
    mutationFn: async () => {
      if (!netSalary || parseFloat(netSalary) <= 0) throw new Error("Geçerli bir maaş tutarı girin");

      // employees tablosunu güncelle
      const { error } = await supabase
        .from('employees')
        .update({
          net_salary: parseFloat(netSalary),
          effective_date: format(accrualDate, 'yyyy-MM-dd'),
          salary_notes: notes || null,
        })
        .eq('id', employee.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Maaş tahakkuku başarıyla eklendi",
      });
      queryClient.invalidateQueries({ queryKey: ['employee-transactions', employee.id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Maaş tahakkuku eklenirken hata oluştu",
      });
    },
  });

  const resetForm = () => {
    setSalaryPeriod(new Date());
    setNetSalary(employee.net_salary?.toString() || "");
    setAccrualDate(endOfMonth(new Date()));
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSalaryMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Maaş Tahakkuku Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-gray-600">Çalışan</div>
            <div className="text-sm font-semibold text-gray-900">
              {employee.first_name} {employee.last_name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {employee.position} - {employee.department}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Maaş Dönemi</Label>
            <DatePicker
              date={salaryPeriod}
              onSelect={(d) => d && setSalaryPeriod(d)}
            />
            <div className="text-xs text-muted-foreground">
              Dönem: {format(salaryPeriod, 'MMMM yyyy', { locale: tr })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Net Maaş</Label>
            <Input
              type="number"
              step="0.01"
              value={netSalary}
              onChange={(e) => setNetSalary(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tahakkuk Tarihi</Label>
            <DatePicker
              date={accrualDate}
              onSelect={(d) => d && setAccrualDate(d)}
            />
            <div className="text-xs text-muted-foreground">
              Varsayılan: Dönem sonu ({format(endOfMonth(salaryPeriod), 'dd.MM.yyyy')})
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notlar (Opsiyonel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Maaş tahakkuku hakkında notlar"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={addSalaryMutation.isPending}>
              {addSalaryMutation.isPending ? "Ekleniyor..." : "Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
