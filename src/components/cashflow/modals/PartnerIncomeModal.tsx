import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PartnerIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountId: string;
  accountName: string;
  currency: string;
}

interface IncomeFormData {
  amount: number;
  description: string;
  category: string;
  reference: string;
  transaction_date: Date | null;
}

const PartnerIncomeModal = ({ isOpen, onClose, onSuccess, accountId, accountName, currency }: PartnerIncomeModalProps) => {
  const [formData, setFormData] = useState<IncomeFormData>({
    amount: 0,
    description: "",
    category: "",
    reference: "",
    transaction_date: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [subcategories, setSubcategories] = useState<Array<{id: string, name: string, category_id: string}>>([]);
  const [selectedCategoryOption, setSelectedCategoryOption] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchSubcategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from('cashflow_categories')
        .select('id, name')
        .eq('company_id', profile.company_id)
        .eq('type', 'income')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from('cashflow_subcategories')
        .select('id, name, category_id')
        .order('name');

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const handleCategoryOptionChange = (value: string) => {
    setSelectedCategoryOption(value);
    
    if (value.startsWith('cat:')) {
      const categoryId = value.substring(4);
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        handleInputChange('category', category.name);
      }
    } else if (value.startsWith('sub:')) {
      const subcategoryId = value.substring(4);
      const subcategory = subcategories.find(s => s.id === subcategoryId);
      if (subcategory) {
        handleInputChange('category', subcategory.name);
      }
    }
  };

  const handleInputChange = (field: keyof IncomeFormData, value: string | number | Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || formData.amount <= 0) {
      toast.error("Geçerli bir tutar giriniz");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Açıklama alanı zorunludur");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error("Şirket bilgisi bulunamadı");

      // Ortak hesabına gelir ekle
      const { error: transactionError } = await supabase
        .from('partner_transactions')
        .insert({
          partner_id: accountId,
          amount: formData.amount,
          type: 'income',
          description: formData.description,
          category: formData.category || 'Genel',
          reference: formData.reference,
          transaction_date: formData.transaction_date?.toISOString(),
          company_id: profile.company_id
        });

      if (transactionError) throw transactionError;

      // Ortak hesabı bakiyesini güncelle
      const { error: balanceError } = await supabase.rpc('update_partner_account_balance', {
        account_id: accountId,
        amount: formData.amount,
        transaction_type: 'income'
      });

      if (balanceError) throw balanceError;

      toast.success("Gelir işlemi eklendi");

      // Formu sıfırla
      setFormData({
        amount: 0,
        description: "",
        category: "",
        reference: "",
        transaction_date: new Date()
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding income:', error);
      toast.error("Gelir işlemi eklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ortak Hesabına Gelir Ekle</DialogTitle>
          <p className="text-sm text-gray-600">Hesap: {accountName}</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Tutar ({currency}) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ""}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={selectedCategoryOption} onValueChange={handleCategoryOptionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori veya alt kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectGroup key={category.id}>
                      <SelectItem value={`cat:${category.id}`} className="font-semibold">
                        {category.name}
                      </SelectItem>
                      {subcategories
                        .filter((sub) => sub.category_id === category.id)
                        .map((sub) => (
                          <SelectItem key={sub.id} value={`sub:${sub.id}`} className="pl-6">
                            {`${sub.name} (${category.name})`}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="İşlem açıklaması"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Referans</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                placeholder="Referans numarası"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_date">İşlem Tarihi</Label>
              <DatePicker
                date={formData.transaction_date}
                onSelect={(date) => handleInputChange('transaction_date', date)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Ekleniyor..." : "Gelir Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerIncomeModal;
