import React, { useState } from "react";
import { logger } from '@/utils/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { WorkOrderPriority, WorkOrderStatus } from "@/types/production";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthContext";

interface NewWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const NewWorkOrderDialog = ({ open, onOpenChange, onSuccess }: NewWorkOrderDialogProps) => {
  const { user } = useAuth();
  const { userData } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normal" as WorkOrderPriority,
    status: "assigned" as WorkOrderStatus,
    quantity: 1,
    code: "",
  });

  const generateCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `WO-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Kullanıcı oturumu bulunamadı");
      return;
    }

    // Company ID'yi kontrol et ve gerekirse tekrar al
    let companyId = userData?.company_id;
    
    if (!companyId) {
      // Eğer userData'da company_id yoksa, direkt profiles tablosundan al
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      
      if (!profile?.company_id) {
        toast.error("Firma bilgisi bulunamadı. Lütfen firma seçimi yapın.");
        return;
      }
      
      companyId = profile.company_id;
    }

    if (!formData.title.trim()) {
      toast.error("Başlık zorunludur");
      return;
    }

    setLoading(true);

    try {
      const code = formData.code || generateCode();

      // MCP Supabase ile iş emri oluştur - company_id kesinlikle ekleniyor
      const { data, error } = await supabase
        .from("work_orders")
        .insert({
          company_id: companyId, // Kesinlikle company_id ekleniyor
          code: code,
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          priority: formData.priority,
          assigned_to: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating work order:", error);
        toast.error(error.message || "İş emri oluşturulurken hata oluştu");
        return;
      }

      toast.success("İş emri başarıyla oluşturuldu");
      
      // Formu sıfırla
      setFormData({
        title: "",
        description: "",
        priority: "medium" as WorkOrderPriority,
        status: "draft" as WorkOrderStatus,
        quantity: 1,
        code: "",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      logger.error("Error:", error);
      toast.error(error.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni İş Emri Oluştur</DialogTitle>
          <DialogDescription>
            Yeni bir üretim iş emri oluşturun. Gerekli bilgileri doldurun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">İş Emri Kodu (Opsiyonel)</Label>
            <Input
              id="code"
              placeholder="Otomatik oluşturulacak"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Boş bırakılırsa otomatik kod oluşturulur
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              placeholder="İş emri başlığı"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              placeholder="İş emri açıklaması"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as WorkOrderStatus })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned">Atanmış</SelectItem>
                  <SelectItem value="enroute">Yolda</SelectItem>
                  <SelectItem value="in_progress">Üretimde</SelectItem>
                  <SelectItem value="on_hold">Beklemede</SelectItem>
                  <SelectItem value="parts_pending">Parça Bekliyor</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Öncelik</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as WorkOrderPriority })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="urgent">Acil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewWorkOrderDialog;
