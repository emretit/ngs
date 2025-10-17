
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Check, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProposalTermsProps {
  paymentTerms?: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  priceTerms?: string;
  otherTerms?: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
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
  onInputChange
}) => {
  console.log('🔍 ProposalFormTerms - Props:', {
    paymentTerms,
    deliveryTerms,
    warrantyTerms,
    priceTerms,
    otherTerms
  });
  // State to hold all available terms (predefined + custom from DB)
  const [availableTerms, setAvailableTerms] = useState<{[key: string]: Term[]}>({
    payment: INITIAL_TERMS.payment,
    delivery: INITIAL_TERMS.delivery,
    warranty: INITIAL_TERMS.warranty,
    price: INITIAL_TERMS.price
  });

  const [customTermInputs, setCustomTermInputs] = useState<{[key: string]: { show: boolean, label: string, text: string }}>({
    payment: { show: false, label: '', text: '' },
    delivery: { show: false, label: '', text: '' },
    warranty: { show: false, label: '', text: '' },
    price: { show: false, label: '', text: '' }
  });
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState<{category: string, term: Term} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

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
    const newValue = selectedTerm.text;

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
  };

  const handleAddCustomTerm = async (category: 'payment' | 'delivery' | 'warranty' | 'price') => {
    const customLabel = customTermInputs[category].label.trim();
    const customText = customTermInputs[category].text.trim();
    
    if (!customLabel || !customText) {
      toast.error("Lütfen hem başlık hem de açıklama giriniz.");
      return;
    }

    setIsLoading(true);

    try {
      // Save to database
      const { data, error } = await supabase
        .from('proposal_terms')
        .insert({
          category: category,
          label: customLabel,
          text: customText,
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
        label: customLabel,
        text: customText,
        is_default: false
      };

      setAvailableTerms(prev => ({
        ...prev,
        [category]: [...prev[category], newTerm]
      }));

      // Reset the custom input
      setCustomTermInputs(prev => ({
        ...prev,
        [category]: { show: false, label: '', text: '' }
      }));

      toast.success("Yeni şart başarıyla eklendi! Şimdi dropdown'dan seçebilirsiniz.");

    } catch (error) {
      console.error('Error saving custom term:', error);
      toast.error("Şart eklenirken bir hata oluştu: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
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
    
    console.log('🔍 ProposalFormTerms - getCurrentValue:', {
      category,
      currentTerms,
      matchingTerm: matchingTerm?.label,
      selectedId: matchingTerm?.id || ''
    });
    
    return matchingTerm?.id || '';
  };

  const renderDropdown = (category: 'payment' | 'delivery' | 'warranty' | 'price', title: string, placeholder: string) => (
    <div className="space-y-2">
      <Label>{title}</Label>
      
      {/* Dropdown for predefined terms */}
      <Select 
        value={getCurrentValue(category)}
        onValueChange={(value) => {
          if (value === 'add_custom') {
            setCustomTermInputs(prev => ({ 
              ...prev, 
              [category]: { ...prev[category], show: true } 
            }));
          } else {
            handleTermSelect(category, value);
          }
        }}
      >
        <SelectTrigger className="w-full bg-background border-border hover:border-primary transition-colors">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-background border border-border shadow-xl z-[100] max-h-[300px] overflow-y-auto">
          {availableTerms[category].map((term) => (
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
              
              {/* Delete button positioned outside SelectItem */}
              <div className="absolute top-2 right-2 z-10">
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
              </div>
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

      {/* Custom term input card - rendered outside dropdown */}
      {customTermInputs[category].show && (
        <Card className="p-4 border-2 border-dashed border-primary/50 bg-primary/5">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Yeni {title} Şartı</h4>
            <div className="space-y-2">
              <Input
                placeholder="Şart başlığı giriniz..."
                value={customTermInputs[category].label}
                onChange={(e) => setCustomTermInputs(prev => ({ 
                  ...prev, 
                  [category]: { ...prev[category], label: e.target.value } 
                }))}
                className="text-sm"
                autoFocus
              />
              <Textarea
                placeholder="Şart açıklamasını yazınız..."
                value={customTermInputs[category].text}
                onChange={(e) => setCustomTermInputs(prev => ({ 
                  ...prev, 
                  [category]: { ...prev[category], text: e.target.value } 
                }))}
                className="text-sm min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    handleAddCustomTerm(category);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setCustomTermInputs(prev => ({ 
                      ...prev, 
                      [category]: { show: false, label: '', text: '' } 
                    }));
                  }
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setCustomTermInputs(prev => ({ 
                  ...prev, 
                  [category]: { show: false, label: '', text: '' } 
                }))}
                className="h-8 px-3 text-xs"
              >
                İptal
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleAddCustomTerm(category)}
                disabled={isLoading || !customTermInputs[category].label.trim() || !customTermInputs[category].text.trim()}
                className="h-8 px-3 text-xs"
              >
                <Plus size={14} className="mr-1" />
                {isLoading ? "Ekleniyor..." : "Dropdown'a Ekle"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl + Enter</kbd> ile hızlı ekle
            </p>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <CardHeader className="p-0">
        <CardTitle className="text-lg">Şartlar ve Koşullar</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 space-y-6">
        {/* Predefined Terms Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderDropdown('payment', 'Ödeme Şartları', 'Ödeme koşulu seçin')}
          {renderDropdown('delivery', 'Teslimat', 'Teslimat koşulu seçin')}
          {renderDropdown('warranty', 'Garanti Şartları', 'Garanti koşulu seçin')}
          {renderDropdown('price', 'Fiyat', 'Fiyat koşulu seçin')}
        </div>


        {/* Other Terms Input */}
        <div className="space-y-2">
          <Label htmlFor="other_terms">Diğer Şartlar</Label>
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
            className="min-h-[120px]"
          />
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Şartı Sil"
        description={`"${termToDelete?.term.label || 'Bu şart'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteCustomTermConfirm}
        onCancel={handleDeleteCustomTermCancel}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProposalFormTerms;
