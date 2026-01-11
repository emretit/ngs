/**
 * Bulk Payroll Generator Component
 * 
 * Toplu bordro oluşturma modal dialog'u.
 * Tüm aktif çalışanlar için otomatik bordro hesaplama ve kaydetme.
 */

import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { Loader2, AlertCircle, CheckCircle2, Calendar, Users } from "lucide-react";
import { 
  generateBulkPayroll, 
  checkPayrollRunExists,
  type BulkPayrollResult 
} from "@/services/automaticPayrollService";

interface BulkPayrollGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: BulkPayrollResult) => void;
  initialYear?: number;
  initialMonth?: number;
}

export const BulkPayrollGenerator = ({
  open,
  onOpenChange,
  onSuccess,
  initialYear,
  initialMonth,
}: BulkPayrollGeneratorProps) => {
  const { toast } = useToast();
  const { companyId } = useCurrentCompany();
  const queryClient = useQueryClient();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(initialYear || currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || currentDate.getMonth() + 1);
  const [requireApproved, setRequireApproved] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [createAccruals, setCreateAccruals] = useState(true); // Hakediş oluştur
  const [defaultWorkingDays, setDefaultWorkingDays] = useState(30); // Default puantaj günü
  
  const [checkResult, setCheckResult] = useState<{ exists: boolean; itemCount?: number } | null>(null);
  const [checking, setChecking] = useState(false);

  // Yıl seçenekleri (önceki yıl, bu yıl, gelecek yıl)
  const years = [selectedYear - 1, selectedYear, selectedYear + 1];

  // Ay seçenekleri
  const months = [
    { value: 1, label: "Ocak" },
    { value: 2, label: "Şubat" },
    { value: 3, label: "Mart" },
    { value: 4, label: "Nisan" },
    { value: 5, label: "Mayıs" },
    { value: 6, label: "Haziran" },
    { value: 7, label: "Temmuz" },
    { value: 8, label: "Ağustos" },
    { value: 9, label: "Eylül" },
    { value: 10, label: "Ekim" },
    { value: 11, label: "Kasım" },
    { value: 12, label: "Aralık" },
  ];

  // Dönem kontrolü
  const handleCheckPeriod = async () => {
    if (!companyId) return;
    
    setChecking(true);
    try {
      const result = await checkPayrollRunExists(companyId, selectedYear, selectedMonth);
      setCheckResult(result);
    } catch (error) {
      console.error('Dönem kontrolü hatası:', error);
    } finally {
      setChecking(false);
    }
  };

  // Dönem değiştiğinde kontrol et
  useState(() => {
    if (open && companyId) {
      handleCheckPeriod();
    }
  });

  // Toplu bordro oluşturma mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Şirket ID bulunamadı");

      const result = await generateBulkPayroll({
        companyId,
        year: selectedYear,
        month: selectedMonth,
        requireApprovedTimesheets: requireApproved,
        autoSync,
        createAccruals,
        defaultWorkingDays,
      });

      return result;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Başarılı!",
          description: `${result.successCount} çalışan için bordro oluşturuldu.`,
        });
        
        // Cache'i invalidate et
        queryClient.invalidateQueries({ queryKey: ["payroll_runs"] });
        queryClient.invalidateQueries({ queryKey: ["payroll_items"] });
        
        onSuccess?.(result);
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "Kısmi Başarı",
          description: `${result.successCount} başarılı, ${result.failedCount} başarısız`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Bordro oluşturulurken hata oluştu",
      });
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const isGenerating = generateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Toplu Bordro Oluştur
          </DialogTitle>
          <DialogDescription>
            Tüm aktif çalışanlar için otomatik bordro hesapla ve kaydet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Dönem Seçimi */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Yıl</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => {
                  setSelectedYear(parseInt(value));
                  setCheckResult(null);
                }}
              >
                <SelectTrigger id="year">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Ay</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => {
                  setSelectedMonth(parseInt(value));
                  setCheckResult(null);
                }}
              >
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dönem Durumu */}
          {checking ? (
            <Alert>
              <Loader2 className="w-4 h-4 animate-spin" />
              <AlertDescription>Dönem kontrol ediliyor...</AlertDescription>
            </Alert>
          ) : checkResult && checkResult.exists ? (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Bu dönem için zaten bordro var ({checkResult.itemCount} çalışan).
                Yeniden oluşturulursa mevcut kayıtlar silinecek.
              </AlertDescription>
            </Alert>
          ) : checkResult && !checkResult.exists ? (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Bu dönem için bordro yok. Yeni bordro oluşturulabilir.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Seçenekler */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireApproved"
                checked={requireApproved}
                onCheckedChange={(checked) => setRequireApproved(!!checked)}
              />
              <Label
                htmlFor="requireApproved"
                className="text-sm font-normal cursor-pointer"
              >
                Sadece onaylanmış puantajları kullan
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="createAccruals"
                checked={createAccruals}
                onCheckedChange={(checked) => setCreateAccruals(!!checked)}
              />
              <Label
                htmlFor="createAccruals"
                className="text-sm font-normal cursor-pointer"
              >
                <span className="font-semibold text-primary">Çalışanlara hakediş olarak ekle</span>
                {" "}(payroll_records)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoSync"
                checked={autoSync}
                onCheckedChange={(checked) => setAutoSync(!!checked)}
              />
              <Label
                htmlFor="autoSync"
                className="text-sm font-normal cursor-pointer"
              >
                Finance modülüne otomatik aktar
              </Label>
            </div>

            {/* Default Puantaj Günü */}
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="workingDays" className="text-sm font-medium">
                Otomatik Puantaj Gün Sayısı (puantaj yoksa)
              </Label>
              <Select
                value={defaultWorkingDays.toString()}
                onValueChange={(value) => setDefaultWorkingDays(parseInt(value))}
              >
                <SelectTrigger id="workingDays" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 gün</SelectItem>
                  <SelectItem value="22">22 gün</SelectItem>
                  <SelectItem value="25">25 gün</SelectItem>
                  <SelectItem value="26">26 gün (4 hafta)</SelectItem>
                  <SelectItem value="30">30 gün (standart)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Puantaj girişi olmayan çalışanlar için varsayılan gün sayısı
              </p>
            </div>
          </div>

          {/* Açıklama */}
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-sm">
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Tüm aktif çalışanlar için bordro hesaplanacak</li>
                <li><strong>Puantaj yoksa {defaultWorkingDays} gün varsayılacak</strong></li>
                <li>Hesaplanan bordrolar <strong>{createAccruals ? 'hakediş olarak eklenecek' : 'sadece bordro kaydı'}</strong></li>
                <li>Hakediş: payroll_records tablosuna status='tahakkuk_edildi'</li>
                <li>Onaydan sonra Finance'e aktarılabilir</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            İptal
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || checking}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Bordro Oluştur
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
