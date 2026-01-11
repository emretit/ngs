
import React, { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
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
}

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
  // State to hold all available terms from database (company-specific)
  const [availableTerms, setAvailableTerms] = useState<{[key: string]: Term[]}>({
    payment: [],
    delivery: [],
    warranty: [],
    price: []
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
  const [editingTermId, setEditingTermId] = useState<string | null>(null); // Track if we're editing an existing term

  // Dropdown open states for each category
  const [openDropdowns, setOpenDropdowns] = useState<{[key: string]: boolean}>({
    payment: false,
    delivery: false,
    warranty: false,
    price: false
  });

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
        // Group all terms by category (all terms are company-specific now)
        const termsByCategory = data.reduce((acc, term) => {
          if (!acc[term.category]) {
            acc[term.category] = [];
          }
          acc[term.category].push({
            id: term.id,
            label: term.label,
            text: term.text
          });
          return acc;
        }, {} as {[key: string]: Term[]});

        setAvailableTerms({
          payment: termsByCategory.payment || [],
          delivery: termsByCategory.delivery || [],
          warranty: termsByCategory.warranty || [],
          price: termsByCategory.price || []
        });
      }
    } catch (error) {
      logger.error('Error loading terms:', error);
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

    logger.debug('🔍 ProposalFormTerms - handleTermSelect:', {
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

  const handleSaveTerm = async () => {
    if (!currentCategory || !newTermText.trim()) {
      toast.error("Lütfen şart metnini giriniz.");
      return;
    }

    setIsLoading(true);

    try {
      if (editingTermId) {
        // Update existing term in database
        const { error } = await supabase
          .from('proposal_terms')
          .update({
            label: newTermText.trim(),
            text: newTermText.trim()
          })
          .eq('id', editingTermId);

        if (error) throw error;

        // Update in available terms
        setAvailableTerms(prev => ({
          ...prev,
          [currentCategory]: prev[currentCategory].map(term =>
            term.id === editingTermId
              ? { ...term, label: newTermText.trim(), text: newTermText.trim() }
              : term
          )
        }));

        toast.success("Şart başarıyla güncellendi!");
      } else {
        // Save new term to database
        const { data, error } = await supabase
          .from('proposal_terms')
          .insert({
            category: currentCategory,
            label: newTermText.trim(),
            text: newTermText.trim(),
            is_active: true,
            sort_order: 999 // Put new terms at the end
          })
          .select()
          .single();

        if (error) throw error;

        // Add the new term to available terms
        const newTerm: Term = {
          id: data.id,
          label: newTermText.trim(),
          text: newTermText.trim()
        };

        setAvailableTerms(prev => ({
          ...prev,
          [currentCategory]: [...prev[currentCategory], newTerm]
        }));

        toast.success("Yeni şart başarıyla eklendi! Şimdi dropdown'dan seçebilirsiniz.");
      }

      // Reset the form and close dialog
      setNewTermText("");
      setIsDialogOpen(false);
      setCurrentCategory(null);
      setEditingTermId(null);

    } catch (error) {
      logger.error('Error saving term:', error);
      toast.error("Şart kaydedilirken bir hata oluştu: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTermClick = (category: 'payment' | 'delivery' | 'warranty' | 'price', term: Term) => {
    // Dropdown'ı kapat
    setOpenDropdowns(prev => ({ ...prev, [category]: false }));

    setCurrentCategory(category);
    setEditingTermId(term.id);
    setNewTermText(term.text);
    setIsDialogOpen(true);
  };

  const handleDeleteCustomTermClick = (category: 'payment' | 'delivery' | 'warranty' | 'price', term: Term) => {
    // Dropdown'ı kapat
    setOpenDropdowns(prev => ({ ...prev, [category]: false }));

    setTermToDelete({category, term});
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCustomTermConfirm = async () => {
    if (!termToDelete) return;

    setIsDeleting(true);
    try {
      // Delete term from database
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
      logger.error('Error deleting term:', error);
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
        open={openDropdowns[category]}
        onOpenChange={(open) => {
          setOpenDropdowns(prev => ({ ...prev, [category]: open }));
        }}
        onValueChange={(value) => {
          if (value === 'add_custom') {
            setOpenDropdowns(prev => ({ ...prev, [category]: false }));
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
            return (
              <div key={term.id} className="group relative">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-primary/20 hover:text-primary"
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditTermClick(category, term);
                    }}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteCustomTermClick(category, term);
                    }}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
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
                logger.debug('🔍 ProposalFormTerms - Other Terms onChange:', {
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

      {/* Add/Edit Term Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setNewTermText("");
          setCurrentCategory(null);
          setEditingTermId(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTermId ? 'Şartı Düzenle' : 'Yeni Şart Ekle'}</DialogTitle>
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
                  setEditingTermId(null);
                }}
                disabled={isLoading}
              >
                İptal
              </Button>
              <Button
                onClick={handleSaveTerm}
                disabled={isLoading || !newTermText.trim()}
              >
                {isLoading ? (editingTermId ? "Güncelleniyor..." : "Ekleniyor...") : (editingTermId ? "Güncelle" : "Ekle")}
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
