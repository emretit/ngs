
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { CustomerFormData } from "@/types/customer";
import CompanyBasicInfo from "./form/CompanyBasicInfo";
import ContactInformation from "./form/ContactInformation";
import CompanyInformation from "./form/CompanyInformation";
import { User, Building2, Receipt, FileText, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomerFormFieldsProps {
  formData: CustomerFormData;
  setFormData: (value: CustomerFormData) => void;
}

interface Term {
  id: string;
  label: string;
  text: string;
  is_default?: boolean;
}

// Predefined payment terms
const INITIAL_PAYMENT_TERMS = [
  { id: "pesin", label: "Peşin Ödeme", text: "%100 peşin ödeme yapılacaktır.", is_default: true },
  { id: "vade30", label: "30-70 Avans - Vadeli", text: "%30 avans, kalan %70 teslimde ödenecektir.", is_default: true },
  { id: "vade50", label: "50-50 Avans - Vadeli", text: "%50 avans, kalan %50 teslimde ödenecektir.", is_default: true },
  { id: "vade30gun", label: "30 Gün Vadeli", text: "Fatura tarihinden itibaren 30 gün vadeli ödenecektir.", is_default: true },
  { id: "vade60gun", label: "60 Gün Vadeli", text: "Fatura tarihinden itibaren 60 gün vadeli ödenecektir.", is_default: true },
  { id: "vade90gun", label: "90 Gün Vadeli", text: "Fatura tarihinden itibaren 90 gün vadeli ödenecektir.", is_default: true },
  { id: "cek", label: "Çekle Ödeme", text: "Ödeme çekle yapılacaktır.", is_default: true },
  { id: "senet", label: "Senetle Ödeme", text: "Ödeme senetle yapılacaktır.", is_default: true },
  { id: "kredi_karti", label: "Kredi Kartı", text: "Ödeme kredi kartı ile yapılacaktır.", is_default: true },
  { id: "havale", label: "Havale", text: "Ödeme havale ile yapılacaktır.", is_default: true }
];

const CustomerFormFields = ({ formData, setFormData }: CustomerFormFieldsProps) => {
  const { t } = useTranslation();
  // Payment terms state
  const [availablePaymentTerms, setAvailablePaymentTerms] = useState<Term[]>(INITIAL_PAYMENT_TERMS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTermLabel, setNewTermLabel] = useState("");
  const [newTermText, setNewTermText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState<{term: Term} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load custom payment terms from database
  useEffect(() => {
    const loadCustomTerms = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_terms')
          .select('*')
          .eq('category', 'payment')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const customTerms = data?.map(term => ({
          id: term.id,
          label: term.label,
          text: term.text,
          is_default: false
        })) || [];

        setAvailablePaymentTerms([...INITIAL_PAYMENT_TERMS, ...customTerms]);
      } catch (error) {
        console.error('Error loading custom terms:', error);
      }
    };

    loadCustomTerms();
  }, []);

  // Get current selected term ID
  const getCurrentPaymentTermId = () => {
    const currentTerms = formData.payment_terms || '';
    if (!currentTerms) return '';
    
    const matchingTerm = availablePaymentTerms.find(term => 
      currentTerms.trim() === term.text.trim()
    );
    return matchingTerm?.id || '';
  };

  // Handle term selection
  const handlePaymentTermSelect = (termId: string) => {
    if (termId === 'add_custom') {
      setIsDialogOpen(true);
    } else {
      const selectedTerm = availablePaymentTerms.find(t => t.id === termId);
      if (selectedTerm) {
        setFormData({ ...formData, payment_terms: selectedTerm.text });
      }
    }
  };

  // Add custom term
  const handleAddCustomTerm = async () => {
    if (!newTermLabel.trim() || !newTermText.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_terms')
        .insert([{
          category: 'payment',
          label: newTermLabel.trim(),
          text: newTermText.trim()
        }])
        .select()
        .single();

      if (error) throw error;

      const newTerm = {
        id: data.id,
        label: data.label,
        text: data.text,
        is_default: false
      };

      setAvailablePaymentTerms(prev => [newTerm, ...prev]);
      setFormData({ ...formData, payment_terms: newTerm.text });
      setIsDialogOpen(false);
      setNewTermLabel("");
      setNewTermText("");
      toast.success("Ödeme şartı başarıyla eklendi!");
    } catch (error) {
      console.error('Error adding custom term:', error);
      toast.error("Şart eklenirken bir hata oluştu: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete custom term
  const handleDeleteCustomTermConfirm = async () => {
    if (!termToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('custom_terms')
        .delete()
        .eq('id', termToDelete.term.id);

      if (error) throw error;

      setAvailablePaymentTerms(prev => 
        prev.filter(term => term.id !== termToDelete.term.id)
      );

      // If the deleted term was selected, clear the selection
      if (formData.payment_terms === termToDelete.term.text) {
        setFormData({ ...formData, payment_terms: "" });
      }

      toast.success("Ödeme şartı başarıyla silindi!");
    } catch (error) {
      console.error('Error deleting custom term:', error);
      toast.error("Şart silinirken bir hata oluştu: " + (error as Error).message);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setTermToDelete(null);
    }
  };

  const handleDeleteCustomTermCancel = () => {
    setIsDeleteDialogOpen(false);
    setTermToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Row - Customer & Contact Information Combined */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Müşteri Bilgileri */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              Müşteri Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
            <CompanyBasicInfo formData={formData} setFormData={setFormData} />
          </CardContent>
        </Card>

        {/* İletişim Bilgileri */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
                <User className="h-4 w-4 text-green-600" />
              </div>
              İletişim Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
            <ContactInformation formData={formData} setFormData={setFormData} />
          </CardContent>
        </Card>
      </div>

      {/* Şirket Bilgileri - Alt Kısım (Sadece Kurumsal) */}
      <CompanyInformation formData={formData} setFormData={setFormData} />

      {/* E-Fatura ve Diğer Bilgiler - Alt Kısım (Yan Yana) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* E-Fatura ve Banka Bilgileri */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
                <Receipt className="h-4 w-4 text-purple-600" />
              </div>
              Finans Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
            <div className="grid grid-cols-1 gap-3">
              {/* E-Fatura Alias */}
              <div className="space-y-1.5">
                <Label htmlFor="einvoice_alias_name" className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>E-Fatura Alias</span>
                </Label>
                <Input
                  id="einvoice_alias_name"
                  value={formData.einvoice_alias_name}
                  onChange={(e) => setFormData({ ...formData, einvoice_alias_name: e.target.value })}
                  placeholder="urn:mail:defaultpk-cgbilgi-4-6-2-c-2@mersel.io"
                  className="font-mono h-7 text-xs"
                />
                <p className="text-xs text-purple-600/70">
                  VKN ile müşteri bilgileri çekildiğinde otomatik doldurulur
                </p>
              </div>

              {/* E-Belge Tipi */}
              <div className="space-y-1.5">
                <Label htmlFor="einvoice_document_type" className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>E-Belge Tipi</span>
                </Label>
                <Select
                  value={formData.einvoice_document_type || ""}
                  onValueChange={(value) => setFormData({ ...formData, einvoice_document_type: value })}
                >
                  <SelectTrigger className="w-full h-7 text-xs bg-background border-border hover:border-primary transition-colors">
                    <SelectValue placeholder="E-Belge tipi seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-xl z-[100]">
                    <SelectItem value="Invoice">E-Fatura</SelectItem>
                    <SelectItem value="ArchiveInvoice">E-Arşiv Fatura</SelectItem>
                    <SelectItem value="Waybill">E-İrsaliye</SelectItem>
                    <SelectItem value="EINVOICE">E-Fatura (EINVOICE)</SelectItem>
                    <SelectItem value="EARCHIVE">E-Arşiv (EARCHIVE)</SelectItem>
                    <SelectItem value="EARCHIVETYPE2">E-Arşiv Type 2</SelectItem>
                    <SelectItem value="DESPATCHADVICE">E-İrsaliye (DESPATCHADVICE)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-purple-600/70">
                  Mükellef bilgisi çekildiğinde otomatik doldurulur
                </p>
              </div>

              {/* Ödeme Şartları */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Ödeme Şartları</Label>
                <Select 
                  value={getCurrentPaymentTermId()}
                  onValueChange={handlePaymentTermSelect}
                >
                  <SelectTrigger className="w-full h-7 text-xs bg-background border-border hover:border-primary transition-colors">
                    <SelectValue placeholder="Ödeme koşulu seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-xl z-[100] max-h-[300px] overflow-y-auto">
                    {availablePaymentTerms.map((term) => (
                      <div key={term.id} className="group relative">
                        <SelectItem 
                          value={term.id} 
                          className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50 data-[highlighted]:bg-muted/50 pr-10 transition-colors"
                        >
                          <div className="flex flex-col gap-1 w-full">
                            <span className="font-medium text-sm text-foreground">{term.label}</span>
                            <span className="text-xs text-muted-foreground leading-relaxed whitespace-normal break-words">{term.text}</span>
                          </div>
                        </SelectItem>
                        
                        {/* Delete button for custom terms */}
                        {!term.is_default && (
                          <div className="absolute top-2 right-2 z-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setTermToDelete({term});
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Add custom option */}
                    <SelectItem value="add_custom" className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 data-[highlighted]:bg-primary/10 p-3 border-t border-border mt-1">
                      <div className="flex items-center gap-2">
                        <Plus size={16} className="text-primary" />
                        <span className="text-sm font-medium text-primary">Yeni şart ekle</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Banka Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div className="space-y-1.5">
                  <Label htmlFor="bank_name" className="text-xs font-medium text-gray-700">
                    Banka Adı
                  </Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="Türkiye İş Bankası"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="iban" className="text-xs font-medium text-gray-700">
                    IBAN
                  </Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="account_number" className="text-xs font-medium text-gray-700">
                    Hesap No
                  </Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="1234567890"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diğer Bilgiler */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-200/50">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
              Diğer Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
            <div className="grid grid-cols-1 gap-3">

              {/* Ticaret Sicil Bilgileri */}
              <div className="pt-2 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="trade_registry_number" className="text-xs font-medium text-gray-700">
                      Ticaret Sicil No
                    </Label>
                    <Input
                      id="trade_registry_number"
                      value={formData.trade_registry_number}
                      onChange={(e) => setFormData({ ...formData, trade_registry_number: e.target.value })}
                      placeholder="123456"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mersis_number" className="text-xs font-medium text-gray-700">
                      MERSİS No
                    </Label>
                    <Input
                      id="mersis_number"
                      value={formData.mersis_number}
                      onChange={(e) => setFormData({ ...formData, mersis_number: e.target.value })}
                      placeholder="0123456789012345"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Müşteri Detay Bilgileri */}
              <div className="pt-2 border-t border-gray-100">
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="establishment_date" className="text-xs font-medium text-gray-700">
                        Kuruluş Tarihi
                      </Label>
                      <DatePicker
                        date={formData.establishment_date ? new Date(formData.establishment_date + 'T00:00:00') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            setFormData({ 
                              ...formData, 
                              establishment_date: `${year}-${month}-${day}` 
                            });
                          } else {
                            setFormData({ 
                              ...formData, 
                              establishment_date: "" 
                            });
                          }
                        }}
                        placeholder="Kuruluş tarihi seçiniz"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sector" className="text-xs font-medium text-gray-700">
                        Sektör/Faaliyet Alanı
                      </Label>
                      <Input
                        id="sector"
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        placeholder="Teknoloji, İnşaat, Ticaret..."
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="customer_segment" className="text-xs font-medium text-gray-700">
                        Müşteri Segmenti
                      </Label>
                      <Input
                        id="customer_segment"
                        value={formData.customer_segment}
                        onChange={(e) => setFormData({ ...formData, customer_segment: e.target.value })}
                        placeholder="Kurumsal, KOBİ, Bireysel..."
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="customer_source" className="text-xs font-medium text-gray-700">
                        Müşteri Kaynağı
                      </Label>
                      <Input
                        id="customer_source"
                        value={formData.customer_source}
                        onChange={(e) => setFormData({ ...formData, customer_source: e.target.value })}
                        placeholder="Web sitesi, Referans, Reklam..."
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs font-medium text-gray-700">
                      Notlar
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Müşteri hakkında özel notlar..."
                      className="h-7 text-xs resize-none min-h-[60px]"
                    />
                  </div>
                </div>
              </div>



            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Custom Term Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Ödeme Şartı Ekle</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="termLabel" className="text-xs font-medium text-gray-700">Şart Başlığı *</Label>
              <Input
                id="termLabel"
                placeholder="Şart başlığı giriniz"
                value={newTermLabel}
                onChange={(e) => setNewTermLabel(e.target.value)}
                className="h-7 text-xs"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="termText" className="text-xs font-medium text-gray-700">Şart Açıklaması *</Label>
              <Textarea
                id="termText"
                placeholder="Şart açıklamasını yazınız"
                value={newTermText}
                onChange={(e) => setNewTermText(e.target.value)}
                className="h-7 text-xs"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewTermLabel("");
                  setNewTermText("");
                }}
                disabled={isLoading}
              >
                İptal
              </Button>
              <Button 
                onClick={handleAddCustomTerm}
                disabled={isLoading || !newTermLabel.trim() || !newTermText.trim()}
              >
                {isLoading ? "Ekleniyor..." : "Ekle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Ödeme Şartını Sil"
        description={`"${termToDelete?.term.label || 'Bu şart'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDeleteCustomTermConfirm}
        onCancel={handleDeleteCustomTermCancel}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CustomerFormFields;
