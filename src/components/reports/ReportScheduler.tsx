/**
 * ReportScheduler Component
 * Rapor zamanlama - günlük/haftalık/aylık zamanlama, e-posta alıcıları, format seçimi
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Mail, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthContext";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";

interface ScheduledReport {
  id: string;
  reportName: string;
  reportType: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'excel' | 'pdf';
  isActive: boolean;
}

export default function ReportScheduler() {
  const { user } = useAuth();
  const { companyId } = useCurrentCompany();
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('');
  const [schedule, setSchedule] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [recipients, setRecipients] = useState('');
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');

  // Fetch scheduled reports
  const { data: scheduledReports, isLoading } = useQuery({
    queryKey: ['scheduled-reports', user?.id, companyId],
    queryFn: async () => {
      if (!user?.id || !companyId) return [];
      
      // For now, use localStorage. In production, this would be a database table
      const saved = localStorage.getItem(`scheduledReports_${companyId}`);
      return saved ? JSON.parse(saved) : [];
    },
    enabled: !!user?.id && !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (report: Omit<ScheduledReport, 'id'>) => {
      if (!user?.id || !companyId) throw new Error('User or company not found');
      
      const newReport: ScheduledReport = {
        id: Date.now().toString(),
        ...report,
      };

      const existing = scheduledReports || [];
      const updated = [...existing, newReport];
      localStorage.setItem(`scheduledReports_${companyId}`, JSON.stringify(updated));
      
      // In production, this would call an edge function to schedule the report
      // await supabase.functions.invoke('schedule-report', { body: newReport });
      
      return newReport;
    },
    onSuccess: () => {
      toast.success('Rapor zamanlaması kaydedildi');
      setReportName('');
      setReportType('');
      setRecipients('');
    },
    onError: (error: any) => {
      toast.error('Zamanlama kaydedilemedi: ' + (error.message || 'Bilinmeyen hata'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!companyId) return;
      
      const existing = scheduledReports || [];
      const updated = existing.filter((r: ScheduledReport) => r.id !== id);
      localStorage.setItem(`scheduledReports_${companyId}`, JSON.stringify(updated));
    },
    onSuccess: () => {
      toast.success('Zamanlama silindi');
    },
  });

  const handleSave = () => {
    if (!reportName.trim()) {
      toast.error('Lütfen rapor adı girin');
      return;
    }
    if (!reportType) {
      toast.error('Lütfen rapor tipi seçin');
      return;
    }
    if (!recipients.trim()) {
      toast.error('Lütfen en az bir e-posta adresi girin');
      return;
    }

    const recipientList = recipients.split(',').map(r => r.trim()).filter(Boolean);

    saveMutation.mutate({
      reportName,
      reportType,
      schedule,
      recipients: recipientList,
      format,
      isActive: true,
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">Rapor Zamanlama</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Rapor Adı</Label>
          <Input
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            placeholder="Örn: Aylık Satış Raporu"
          />
        </div>

        <div className="space-y-2">
          <Label>Rapor Tipi</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Rapor tipi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Satış Raporları</SelectItem>
              <SelectItem value="financial">Finansal Raporlar</SelectItem>
              <SelectItem value="service">Servis Raporları</SelectItem>
              <SelectItem value="inventory">Envanter Raporları</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Zamanlama</Label>
          <Select value={schedule} onValueChange={(value) => setSchedule(value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Günlük</SelectItem>
              <SelectItem value="weekly">Haftalık</SelectItem>
              <SelectItem value="monthly">Aylık</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>E-posta Alıcıları (virgülle ayırın)</Label>
          <Input
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="email1@example.com, email2@example.com"
            type="email"
            multiple
          />
        </div>

        <div className="space-y-2">
          <Label>Format</Label>
          <Select value={format} onValueChange={(value) => setFormat(value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending || !reportName || !reportType || !recipients}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          Zamanlamayı Kaydet
        </Button>
      </div>

      {/* Scheduled Reports List */}
      {scheduledReports && scheduledReports.length > 0 && (
        <div className="mt-6 space-y-2">
          <Label className="text-sm font-semibold">Zamanlanmış Raporlar</Label>
          <div className="space-y-2">
            {scheduledReports.map((report: ScheduledReport) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{report.reportName}</div>
                  <div className="text-xs text-muted-foreground">
                    {report.schedule === 'daily' ? 'Günlük' : 
                     report.schedule === 'weekly' ? 'Haftalık' : 'Aylık'} • {report.format.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    {report.recipients.length} alıcı
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(report.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
