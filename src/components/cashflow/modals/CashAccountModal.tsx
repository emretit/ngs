import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CashAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CashAccountFormData {
  name: string;
  description: string;
  currency: string;
  initial_balance: number;
}

const CashAccountModal = ({ isOpen, onClose, onSuccess }: CashAccountModalProps) => {
  const [formData, setFormData] = useState<CashAccountFormData>({
    name: "",
    description: "",
    currency: "TRY",
    initial_balance: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof CashAccountFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Hesap adı zorunludur");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      // Company ID'yi al
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      const { error } = await supabase
        .from('cash_accounts')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          currency: formData.currency,
          current_balance: formData.initial_balance,
          company_id: profile.company_id
        });

      if (error) throw error;

      toast.success("Nakit kasa hesabı oluşturuldu");

      onSuccess();
      onClose();
      setFormData({
        name: "",
        description: "",
        currency: "TRY",
        initial_balance: 0
      });
    } catch (error) {
      console.error('Error creating cash account:', error);
      toast.error("Nakit kasa hesabı oluşturulurken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni Nakit Kasa Hesabı</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Hesap Adı *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Örn: Ana Kasa, Şube Kasa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Hesap hakkında açıklama"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Para Birimi</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial_balance">Başlangıç Bakiyesi</Label>
              <Input
                id="initial_balance"
                type="number"
                step="0.01"
                value={formData.initial_balance}
                onChange={(e) => handleInputChange('initial_balance', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CashAccountModal;
