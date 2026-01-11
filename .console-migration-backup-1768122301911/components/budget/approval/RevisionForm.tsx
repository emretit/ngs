import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BudgetFiltersState } from "@/pages/BudgetManagement";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface RevisionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: BudgetFiltersState;
}

const RevisionForm = ({ open, onOpenChange, filters }: RevisionFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    subcategory: "",
    month: "",
    old_budget_amount: 0,
    new_requested_amount: 0,
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) throw new Error("Şirket bilgisi bulunamadı");

      const { error } = await supabase
        .from("budget_revisions")
        .insert({
          company_id: companyId,
          year: filters.year,
          month: formData.month ? parseInt(formData.month) : null,
          category: formData.category,
          subcategory: formData.subcategory || null,
          old_budget_amount: formData.old_budget_amount,
          new_requested_amount: formData.new_requested_amount,
          reason: formData.reason,
          requester_id: user.id,
          status: "pending",
          approval_level: 1,
          max_approval_level: 3,
        });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Revizyon talebi oluşturuldu.",
      });

      onOpenChange(false);
      setFormData({
        category: "",
        subcategory: "",
        month: "",
        old_budget_amount: 0,
        new_requested_amount: 0,
        reason: "",
      });
    } catch (error: any) {
      console.error("Error creating revision:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Revizyon talebi oluşturulamadı",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Yeni Revizyon Talebi</DialogTitle>
          <DialogDescription>
            Bütçe revizyon talebi oluşturun. Talep onay sürecinden geçecektir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategory">Alt Kategori (Opsiyonel)</Label>
              <Input
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Ay (Opsiyonel - Tüm yıl için boş bırakın)</Label>
              <Select
                value={formData.month}
                onValueChange={(value) => setFormData({ ...formData, month: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tüm yıl" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tüm yıl</SelectItem>
                  {["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"].map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="old_budget_amount">Mevcut Bütçe</Label>
              <Input
                id="old_budget_amount"
                type="number"
                step="0.01"
                value={formData.old_budget_amount}
                onChange={(e) => setFormData({ ...formData, old_budget_amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_requested_amount">İstenen Yeni Tutar</Label>
              <Input
                id="new_requested_amount"
                type="number"
                step="0.01"
                value={formData.new_requested_amount}
                onChange={(e) => setFormData({ ...formData, new_requested_amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Gerekçe</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              rows={4}
              placeholder="Revizyon talebinin gerekçesini açıklayın..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Gönderiliyor..." : "Talep Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RevisionForm;

