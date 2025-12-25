import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";

// İzin türü seçenekleri
const LEAVE_TYPES = [
  { value: "annual", label: "Yıllık İzin" },
  { value: "sick", label: "Mazeret İzni" },
  { value: "medical", label: "Raporlu İzin" },
  { value: "unpaid", label: "Ücretsiz İzin" },
  { value: "official", label: "Resmî İzin" },
  { value: "other", label: "Diğer" },
] as const;

interface FormErrors {
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  days?: string;
}

const LeaveCreate = () => {
  const navigate = useNavigate();
  const { userData } = useCurrentUser();

  // Form state
  const [leaveType, setLeaveType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [days, setDays] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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
        // Gün sayısı hatasını temizle
        if (errors.days) {
          setErrors((prev) => ({ ...prev, days: undefined }));
        }
      } else {
        setDays(0);
      }
    } else {
      setDays(0);
    }
  }, [startDate, endDate, errors.days]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!leaveType) {
      newErrors.leave_type = "İzin türü seçilmelidir";
    }

    if (!startDate) {
      newErrors.start_date = "Başlangıç tarihi seçilmelidir";
    }

    if (!endDate) {
      newErrors.end_date = "Bitiş tarihi seçilmelidir";
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      if (end < start) {
        newErrors.end_date = "Bitiş tarihi başlangıç tarihinden önce olamaz";
      }
    }

    if (days < 1) {
      newErrors.days = "Geçerli bir tarih aralığı seçilmelidir";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Lütfen form hatalarını düzeltin");
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
        employee_id: userData.employee_id || userData.id, // employee_id yoksa user_id kullan
        leave_type: leaveType,
        start_date: startDate!.toISOString().split("T")[0],
        end_date: endDate!.toISOString().split("T")[0],
        days: days,
        status: "pending",
        reason: description || null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("leave_requests").insert([leaveData]);

      if (error) {
        console.error("Error creating leave request:", error);
        toast.error("İzin talebi oluşturulamadı: " + error.message);
        return;
      }

      toast.success("İzin talebi oluşturuldu");
      navigate("/employees/leaves");
    } catch (err: any) {
      console.error("Error in submit:", err);
      toast.error("İzin talebi oluşturulamadı: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bitiş tarihi için minimum tarih (başlangıç tarihinden sonra)
  const getMinEndDate = (): Date | undefined => {
    if (!startDate) return undefined;
    const minDate = new Date(startDate);
    return minDate;
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/employees/leaves")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yeni İzin Talebi</h1>
          <p className="text-muted-foreground mt-1">
            İzin bilgilerini girerek yeni bir talep oluşturun.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>İzin Bilgileri</CardTitle>
          <CardDescription>
            Tüm zorunlu alanları doldurun ve izin talebinizi gönderin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* İzin Türü */}
            <div className="space-y-2">
              <Label htmlFor="leave_type">
                İzin Türü <span className="text-red-500">*</span>
              </Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger id="leave_type" className={errors.leave_type ? "border-red-500" : ""}>
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
              {errors.leave_type && (
                <p className="text-sm text-red-500">{errors.leave_type}</p>
              )}
            </div>

            {/* Tarih Aralığı */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Başlangıç Tarihi */}
              <div className="space-y-2">
                <Label>
                  Başlangıç Tarihi <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  date={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    // Başlangıç tarihi değiştiğinde bitiş tarihi hatasını temizle
                    if (errors.end_date) {
                      setErrors((prev) => ({ ...prev, end_date: undefined }));
                    }
                  }}
                  placeholder="Başlangıç tarihi seçin"
                />
                {errors.start_date && (
                  <p className="text-sm text-red-500">{errors.start_date}</p>
                )}
              </div>

              {/* Bitiş Tarihi */}
              <div className="space-y-2">
                <Label>
                  Bitiş Tarihi <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  date={endDate}
                  onSelect={setEndDate}
                  placeholder="Bitiş tarihi seçin"
                  disabled={(date) => {
                    // Başlangıç tarihinden önceki tarihleri devre dışı bırak
                    if (startDate) {
                      const minDate = new Date(startDate);
                      minDate.setHours(0, 0, 0, 0);
                      return date < minDate;
                    }
                    return false;
                  }}
                />
                {errors.end_date && (
                  <p className="text-sm text-red-500">{errors.end_date}</p>
                )}
              </div>
            </div>

            {/* Gün Sayısı */}
            <div className="space-y-2">
              <Label htmlFor="days">Gün Sayısı</Label>
              <Input
                id="days"
                type="text"
                value={days > 0 ? `${days} gün` : "Tarih seçin"}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              {errors.days && (
                <p className="text-sm text-red-500">{errors.days}</p>
              )}
            </div>

            {/* Açıklama */}
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
              <Textarea
                id="description"
                placeholder="İzin talebi ile ilgili ek bilgiler..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Belge / Rapor (UI only) */}
            <div className="space-y-2">
              <Label htmlFor="file">Belge / Rapor (Opsiyonel)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      setFile(selectedFile);
                      toast.info("Dosya yükleme özelliği yakında eklenecek");
                    }
                  }}
                  className="cursor-pointer"
                />
                {file && (
                  <span className="text-sm text-muted-foreground">
                    {file.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Dosya yükleme özelliği yakında eklenecek
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/employees/leaves")}
                disabled={isSubmitting}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  "İzin Talebi Oluştur"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveCreate;

