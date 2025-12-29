
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProposalTermsProps {
  paymentTerms?: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  priceTerms?: string;
  otherTerms?: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  showOnlyPayment?: boolean; // Sadece ödeme şartları dropdown'unu göster
  showOnlyLabel?: boolean; // Sadece label göster, açıklamayı gösterme (SelectTrigger'da)
  selectedPaymentTerms?: string[];
  selectedDeliveryTerms?: string[];
  selectedWarrantyTerms?: string[];
  selectedPricingTerms?: string[];
  selectedOtherTerms?: string[];
  onSelectedTermsChange?: (category: string, termIds: string[]) => void;
}

interface Term {
  id: string;
  label: string;
  text: string;
  is_default?: boolean;
}

// Predefined terms based on the image
const INITIAL_TERMS = {
  payment: [
    { id: "pesin", label: "Peşin Ödeme", text: "%100 peşin ödeme yapılacaktır.", is_default: true },
    { id: "vade30", label: "30-70 Avans - Vadeli", text: "%30 avans, kalan %70 teslimde ödenecektir.", is_default: true },
    { id: "vade50", label: "50-50 Avans - Vadeli", text: "%50 avans, kalan %50 teslimde ödenecektir.", is_default: true },
    { id: "vade30gun", label: "30 Gün Vadeli", text: "Fatura tarihinden itibaren 30 gün vadeli ödenecektir.", is_default: true }
  ],
  delivery: [
    { id: "hemen", label: "Teslimat", text: "Sipariş tarihinden itibaren 7-10 iş günü içinde teslimat yapılacaktır.", is_default: true },
    { id: "standart", label: "Standart Teslimat", text: "Sipariş tarihinden itibaren 15-20 iş günü içinde teslimat yapılacaktır.", is_default: true },
    { id: "hizli", label: "Hızlı Teslimat", text: "Sipariş tarihinden itibaren 3-5 iş günü içinde teslimat yapılacaktır.", is_default: true }
  ],
  warranty: [
    { id: "garanti1", label: "Garanti", text: "Ürünlerimiz 1 yıl garantilidir.", is_default: true },
    { id: "garanti2", label: "2 Yıl Garanti", text: "Ürünlerimiz 2 yıl garantilidir.", is_default: true },
    { id: "garanti3", label: "Uzatılmış Garanti", text: "Ürünlerimiz 3 yıl garantilidir.", is_default: true }
  ],
  price: [
    { id: "fiyat", label: "Fiyat", text: "Belirtilen fiyatlar KDV hariçtir.", is_default: true },
    { id: "fiyatdahil", label: "KDV Dahil Fiyat", text: "Belirtilen fiyatlar KDV dahildir.", is_default: true },
    { id: "fiyatgecerli", label: "Fiyat Geçerliliği", text: "Fiyatlar 30 gün geçerlidir.", is_default: true }
  ]
};

const ProposalFormTerms: React.FC<ProposalTermsProps> = ({
  paymentTerms,
  deliveryTerms,
  warrantyTerms,
  priceTerms,
  otherTerms,
  onInputChange,
  showOnlyPayment = false,
  showOnlyLabel = false,
  selectedPaymentTerms = [],
  selectedDeliveryTerms = [],
  selectedWarrantyTerms = [],
  selectedPricingTerms = [],
  selectedOtherTerms = [],
  onSelectedTermsChange
}) => {
  const { t } = useTranslation();
  // State to hold all available terms (predefined + custom from DB)
  const [availableTerms, setAvailableTerms] = useState<{[key: string]: Term[]}>({
    payment: INITIAL_TERMS.payment,
    delivery: INITIAL_TERMS.delivery,
    warranty: INITIAL_TERMS.warranty,
    price: INITIAL_TERMS.price
  });
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState<{category: string, term: Term} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  
  // Dialog states for each category
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<'payment' | 'delivery' | 'warranty' | 'price' | null>(null);
  const [newTermText, setNewTermText] = useState("");
  
  // Inline editing states
  const [editingTerm, setEditingTerm] = useState<{category: string, term: Term} | null>(null);
  const [editingText, setEditingText] = useState("");

  // Load custom terms from database on component mount
  useEffect(() => {
    loadCustomTerms();
  }, []);

  const loadCustomTerms = async () => {
    try {
      const { data, error } = await supabase
        .from('proposal_terms')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (data) {
        // Group custom terms by category and add to existing terms
        const customTermsByCategory = data.reduce((acc, term) => {
          if (!acc[term.category]) {
            acc[term.category] = [];
          }
          acc[term.category].push({
            id: term.id,
            label: term.label,
            text: term.text,
            is_default: false
          });
          return acc;
        }, {} as {[key: string]: Term[]});

        // Merge with initial terms
        setAvailableTerms(prev => ({
          payment: [...INITIAL_TERMS.payment, ...(customTermsByCategory.payment || [])],
          delivery: [...INITIAL_TERMS.delivery, ...(customTermsByCategory.delivery || [])],
          warranty: [...INITIAL_TERMS.warranty, ...(customTermsByCategory.warranty || [])],
          price: [...INITIAL_TERMS.price, ...(customTermsByCategory.price || [])]
        }));
      }
    } catch (error) {
      console.error('Error loading custom terms:', error);
    }
  };

  const handleTermSelect = (category: 'payment' | 'delivery' | 'warranty' | 'price', termId: string) => {
    // Find the selected term text
    const selectedTerm = availableTerms[category].find(t => t.id === termId);
    if (!selectedTerm) return;

    // Get the current field value based on category
    let currentValue = '';
    let fieldName = '';
    
    if (category === 'payment') {
      currentValue = paymentTerms || '';
      fieldName = 'payment_terms';
    } else if (category === 'delivery') {
      currentValue = deliveryTerms || '';
      fieldName = 'delivery_terms';
    } else if (category === 'warranty') {
      currentValue = warrantyTerms || '';
      fieldName = 'warranty_terms';
    } else if (category === 'price') {
      currentValue = priceTerms || '';
      fieldName = 'price_terms';
    }

    // Yeni seçim önceki değeri değiştirsin, eklemesin
    let newValue = selectedTerm.text;

    // Ödeme şartları için ödeme şekli input'unun değerini koru
    if (category === 'payment' && currentValue.includes("Ödeme Şekli:")) {
      const paymentMethod = currentValue.split("Ödeme Şekli:")[1]?.trim() || "";
      if (paymentMethod) {
        newValue = `${selectedTerm.text} - Ödeme Şekli: ${paymentMethod}`;
      }
    }

    console.log('🔍 ProposalFormTerms - handleTermSelect:', {
      category,
      fieldName,
      currentValue,
      newValue,
      selectedTerm: selectedTerm.text
    });

    // Create a synthetic event to update the appropriate field
    const syntheticEvent = {
      target: {
        name: fieldName,
        value: newValue
      }
    } as React.ChangeEvent<HTMLTextAreaElement>;

    onInputChange(syntheticEvent);

    // Seçili şart ID'sini kaydet
    if (onSelectedTermsChange) {
      const categoryMap: Record<string, string> = {
        'payment': 'selected_payment_terms',
        'delivery': 'selected_delivery_terms',
        'warranty': 'selected_warranty_terms',
        'price': 'selected_pricing_terms'
      };
      const selectedCategory = categoryMap[category];
      if (selectedCategory) {
        // UUID formatında mı kontrol et (veritabanından gelen custom term ise)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(termId);
        if (isUuid) {
          // UUID ise direkt kaydet
          onSelectedTermsChange(selectedCategory, [termId]);
        } else {
          // Predefined term ise boş array gönder (sadece custom term'ler kaydedilecek)
          onSelectedTermsChange(selectedCategory, []);
        }
      }
    }
  };

  const handleAddCustomTerm = async () => {
    if (!currentCategory || !newTermText.trim()) {
      toast.error("Lütfen şart metnini giriniz.");
      return;
    }

    setIsLoading(true);

    try {
      // Save to database
      const { data, error } = await supabase
        .from('proposal_terms')
        .insert({
          category: currentCategory,
          label: newTermText.trim(),
          text: newTermText.trim(),
          is_default: false,
          is_active: true,
          sort_order: 999 // Put custom terms at the end
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new term to available terms
      const newTerm: Term = {
        id: data.id,
        label: newTermText.trim(),
        text: newTermText.trim(),
        is_default: false
      };

      setAvailableTerms(prev => ({
        ...prev,
        [currentCategory]: [...prev[currentCategory], newTerm]
      }));

      // Reset the form and close dialog
      setNewTermText("");
      setIsDialogOpen(false);
      setCurrentCategory(null);

      toast.success("Yeni şart başarıyla eklendi! Şimdi dropdown'dan seçebilirsiniz.");

    } catch (error) {
      console.error('Error saving custom term:', error);
      toast.error("Şart eklenirken bir hata oluştu: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTermClick = (category: 'payment' | 'delivery' | 'warranty' | 'price', term: Term) => {
    setEditingTerm({category, term});
    setEditingText(term.text);
  };

  const handleUpdateTerm = async () => {
    if (!editingTerm || !editingText.trim()) {
      toast.error("Lütfen şart metnini giriniz.");
      return;
    }

    // Predefined term ise güncelleme yapma
    if (editingTerm.term.is_default) {
      toast.error("Varsayılan şartlar düzenlenemez.");
      setEditingTerm(null);
      setEditingText("");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('proposal_terms')
        .update({
          label: editingText.trim(),
          text: editingText.trim()
        })
        .eq('id', editingTerm.term.id);

      if (error) throw error;

      // Update in available terms
      setAvailableTerms(prev => ({
        ...prev,
        [editingTerm.category]: prev[editingTerm.category].map(term => 
          term.id === editingTerm.term.id 
            ? { ...term, label: editingText.trim(), text: editingText.trim() }
            : term
        )
      }));

      toast.success("Şart başarıyla güncellendi!");
      setEditingTerm(null);
      setEditingText("");

    } catch (error) {
      console.error('Error updating term:', error);
      toast.error("Şart güncellenirken bir hata oluştu: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTerm(null);
    setEditingText("");
  };

  const handleDeleteCustomTermClick = (category: 'payment' | 'delivery' | 'warranty' | 'price', term: Term) => {
    setTermToDelete({category, term});
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCustomTermConfirm = async () => {
    if (!termToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('proposal_terms')
        .delete()
        .eq('id', termToDelete.term.id);

      if (error) throw error;

      // Remove from available terms
      setAvailableTerms(prev => ({
        ...prev,
        [termToDelete.category]: prev[termToDelete.category].filter(term => term.id !== termToDelete.term.id)
      }));

      toast.success("Şart başarıyla silindi!");

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

  const getCurrentValue = (category: 'payment' | 'delivery' | 'warranty' | 'price') => {
    let currentTerms = '';
    if (category === 'payment') currentTerms = paymentTerms || '';
    else if (category === 'delivery') currentTerms = deliveryTerms || '';
    else if (category === 'warranty') currentTerms = warrantyTerms || '';
    else if (category === 'price') currentTerms = priceTerms || '';

    // Tam eşleşme arıyoruz, içermek yerine
    const matchingTerm = availableTerms[category].find(term => 
      currentTerms.trim() === term.text.trim()
    );
    
    
    return matchingTerm?.id || '';
  };

  const renderDropdown = (category: 'payment' | 'delivery' | 'warranty' | 'price', title: string, placeholder: string) => {
    const currentValue = getCurrentValue(category);
    const selectedTerm = currentValue ? availableTerms[category].find(t => t.id === currentValue) : null;
    
    return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{title}</Label>
      
      {/* Dropdown for predefined terms */}
      <Select 
        value={currentValue}
        onValueChange={(value) => {
          if (value === 'add_custom') {
            setCurrentCategory(category);
            setIsDialogOpen(true);
          } else {
            handleTermSelect(category, value);
          }
        }}
      >
        <SelectTrigger className={`w-full ${showOnlyLabel ? '' : 'h-14'} bg-background border-border hover:border-primary transition-colors leading-tight [&_>span]:leading-tight`}>
          {showOnlyLabel && selectedTerm ? (
            <span>{selectedTerm.label}</span>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent className="bg-background border border-border shadow-xl z-[100] max-h-[300px] overflow-y-auto">
          {availableTerms[category].map((term) => {
            const isEditing = editingTerm?.term.id === term.id && editingTerm?.category === category;
            
            return (
              <div key={term.id} className="group relative">
                {isEditing ? (
                  <div className="p-3 space-y-2 border-b border-border">
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="min-h-[60px] text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleUpdateTerm();
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        type="button"
                      >
                        İptal
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUpdateTerm();
                        }}
                        type="button"
                        disabled={isLoading || !editingText.trim()}
                      >
                        Kaydet
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <SelectItem
                      value={term.id}
                      className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50 data-[highlighted]:bg-muted/50 pr-20 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5 w-full">
                        <span className="text-sm text-foreground leading-snug whitespace-normal break-words">{term.text}</span>
                      </div>
                    </SelectItem>
                    
                    {/* Edit and Delete buttons positioned outside SelectItem */}
                    <div className="absolute top-2 right-2 z-10 flex gap-1">
                      {!term.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-primary/20 hover:text-primary"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditTermClick(category, term);
                          }}
                        >
                          <Pencil size={12} />
                        </Button>
                      )}
                      {!term.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTermToDelete({category, term});
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
          
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
  );
  };

  return (
    <div className="space-y-6">
      <CardContent className="p-0 space-y-6">
        {/* Predefined Terms Selection */}
        {showOnlyPayment ? (
          <div className="space-y-4">
            {renderDropdown('payment', 'Ödeme Şartları', 'Ödeme koşulu seçin')}
          </div>
        ) : (
          <div className="space-y-4">
            {/* İlk satır */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderDropdown('payment', 'Ödeme Şartları', 'Ödeme koşulu seçin')}
              {renderDropdown('delivery', 'Teslimat', 'Teslimat koşulu seçin')}
            </div>
            
            {/* İkinci satır */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderDropdown('warranty', 'Garanti Şartları', 'Garanti koşulu seçin')}
              {renderDropdown('price', 'Fiyat', 'Fiyat koşulu seçin')}
            </div>
          </div>
        )}


        {/* Other Terms Input */}
        {!showOnlyPayment && (
          <div className="space-y-2">
            <Label htmlFor="other_terms" className="text-sm font-medium text-gray-700">Diğer Şartlar</Label>
            <Textarea
              id="other_terms"
              name="other_terms"
              value={otherTerms || ""}
              onChange={(e) => {
                console.log('🔍 ProposalFormTerms - Other Terms onChange:', {
                  name: e.target.name,
                  value: e.target.value
                });
                onInputChange(e);
              }}
              placeholder="Ekstra şartlar ve notlar buraya yazılabilir"
            />
          </div>
        )}
      </CardContent>

      {/* Add Term Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Şart Ekle</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="termText" className="text-sm font-medium text-gray-700">Şart Metni *</Label>
              <Textarea
                id="termText"
                placeholder="Şart metnini yazınız"
                value={newTermText}
                onChange={(e) => setNewTermText(e.target.value)}
                rows={4}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewTermText("");
                  setCurrentCategory(null);
                }}
                disabled={isLoading}
              >
                İptal
              </Button>
              <Button 
                onClick={handleAddCustomTerm}
                disabled={isLoading || !newTermText.trim()}
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
        title="Şartı Sil"
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

export default ProposalFormTerms;
