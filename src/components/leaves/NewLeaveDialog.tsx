import React, { useState, useEffect } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { User, Calendar as CalendarIcon } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { DatePicker } from "@/components/ui/date-picker";

interface NewLeaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// İzin türü seçenekleri
const LEAVE_TYPES = [
  { value: "annual", label: "Yıllık İzin" },
  { value: "sick", label: "Mazeret İzni" },
  { value: "medical", label: "Raporlu İzin" },
  { value: "unpaid", label: "Ücretsiz İzin" },
  { value: "official", label: "Resmî İzin" },
  { value: "other", label: "Diğer" },
] as const;

const NewLeaveDialog: React.FC<NewLeaveDialogProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [employeeId, setEmployeeId] = useState<string>("");
  const [leaveType, setLeaveType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [days, setDays] = useState<number>(0);
  const [status, setStatus] = useState<string>("approved"); // Admin kaydı direkt onaylı
  const [description, setDescription] = useState<string>("");

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, full_name')
        .eq('tenant_id', userData.company_id)
        .eq('status', 'aktif')
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id && isOpen
  });

  // Gün sayısını otomatik hesapla
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDays(diffDays);
      } else {
        setDays(0);
      }
    } else {
      setDays(0);
    }
  }, [startDate, endDate]);

  // Form resetleme
  const resetForm = () => {
    setEmployeeId("");
    setLeaveType("");
    setStartDate(undefined);
    setEndDate(undefined);
    setDays(0);
    setStatus("approved");
    setDescription("");
  };

  // Dialog kapanma handler
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!employeeId) {
      toast.error("Lütfen bir çalışan seçin");
      return;
    }

    if (!leaveType) {
      toast.error("Lütfen izin türü seçin");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Lütfen başlangıç ve bitiş tarihlerini seçin");
      return;
    }

    if (days < 1) {
      toast.error("Geçerli bir tarih aralığı seçin");
      return;
    }

    if (!userData?.company_id) {
      toast.error("Şirket bilgisi bulunamadı");
      return;
    }

    setIsSubmitting(true);

    try {
      const leaveData = {
        tenant_id: userData.company_id,
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        days: days,
        status: status,
        reason: description || null,
        created_at: new Date().toISOString(),
        approved_by: userData.id,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      };

      const { error } = await supabase.from("leave_requests").insert([leaveData]);

      if (error) {
        console.error("Error creating leave:", error);
        toast.error("İzin kaydı oluşturulamadı: " + error.message);
        return;
      }

      toast.success("İzin kaydı başarıyla oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      handleClose();
    } catch (err: any) {
      console.error("Error in submit:", err);
      toast.error("İzin kaydı oluşturulamadı: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Yeni İzin Kaydı"
      maxWidth="lg"
      headerColor="orange"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full -m-3 p-2">
        <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
          <div className="space-y-3">
            {/* Çalışan Seçimi */}
            <div className="space-y-1.5">
              <Label htmlFor="employee_id" className="text-sm font-medium text-gray-700">
                Çalışan <span className="text-red-500">*</span>
              </Label>
              <Select value={employeeId} onValueChange={setEmployeeId} disabled={employeesLoading}>
                <SelectTrigger id="employee_id" className="h-10">
                  <SelectValue placeholder={employeesLoading ? "Çalışanlar yükleniyor..." : "Çalışan seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{emp.full_name || `${emp.first_name} ${emp.last_name}`}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* İzin Türü ve Durum */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="leave_type" className="text-sm font-medium text-gray-700">
                  İzin Türü <span className="text-red-500">*</span>
                </Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger id="leave_type" className="h-10">
                    <SelectValue placeholder="İzin türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Durum <span className="text-red-500">*</span>
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">✅ Onaylandı</SelectItem>
                    <SelectItem value="pending">⏳ Beklemede</SelectItem>
                    <SelectItem value="rejected">❌ Reddedildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tarih Aralığı ve Gün Sayısı */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Başlangıç Tarihi <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  date={startDate}
                  onSelect={(date) => setStartDate(date)}
                  placeholder="Başlangıç"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Bitiş Tarihi <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  date={endDate}
                  onSelect={setEndDate}
                  placeholder="Bitiş"
                  disabled={(date) => {
                    if (startDate) {
                      const minDate = new Date(startDate);
                      minDate.setHours(0, 0, 0, 0);
                      return date < minDate;
                    }
                    return false;
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="days" className="text-sm font-medium text-gray-700">Toplam Gün</Label>
                <div className="relative">
                  <Input
                    id="days"
                    type="text"
                    value={days > 0 ? days : ""}
                    readOnly
                    placeholder="Auto"
                    className="h-10 bg-muted cursor-not-allowed pr-12"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    {days > 0 && "gün"}
                  </div>
                </div>
              </div>
            </div>

            {/* Açıklama */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Açıklama
              </Label>
              <Textarea
                id="description"
                placeholder="İzin kaydı ile ilgili ek bilgiler, açıklamalar..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none min-h-[3rem]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={handleClose} disabled={isSubmitting}>
            İptal
          </UnifiedDialogCancelButton>
          <UnifiedDialogActionButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Oluşturuluyor..." : "İzin Kaydı Oluştur"}
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
};

export default NewLeaveDialog;

