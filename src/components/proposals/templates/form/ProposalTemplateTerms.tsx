import React, { useState } from "react";
import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  DollarSign, 
  Shield, 
  Truck, 
  Plus,
  Edit3,
  X,
  Check
} from "lucide-react";
import { ProposalFormData } from "@/types/proposal-form";

interface ProposalTemplateTermsProps {
  register: UseFormRegister<ProposalFormData>;
  watch?: UseFormWatch<ProposalFormData>;
  setValue?: UseFormSetValue<ProposalFormData>;
}

// Seçilebilir şartlar veri yapısı
const TERMS_CATEGORIES = {
  payment: {
    title: "Ödeme Şartları",
    icon: CreditCard,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    options: [
      { id: "payment_prepaid", label: "Peşin Ödeme", text: "%100 peşin ödeme yapılacaktır." },
      { id: "payment_30_70", label: "30-70 Avans", text: "%30 avans, %70 işin tamamlanmasının ardından ödenecektir." },
      { id: "payment_50_50", label: "50-50 Avans", text: "%50 avans, %50 işin tamamlanmasının ardından ödenecektir." },
      { id: "payment_net30", label: "30 Gün Vadeli", text: "Fatura tarihinden itibaren 30 gün vadeli ödenecektir." },
      { id: "payment_installment", label: "Taksitli", text: "3 eşit taksitte ödenecek, ilk taksit peşin olacaktır." }
    ]
  },
  pricing: {
    title: "Fiyatlandırma Koşulları",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-50",
    options: [
      { id: "pricing_vat_excluded", label: "KDV Hariç", text: "Belirtilen fiyatlar KDV hariçtir." },
      { id: "pricing_currency_try", label: "TRY Cinsinden", text: "Tüm fiyatlar Türk Lirası (TRY) cinsindendir." },
      { id: "pricing_usd_rate", label: "USD Kuru", text: "Teklifimiz USD cinsinden GARANTİ Bankası Döviz Satış Kuruna göre hazırlanmıştır." },
      { id: "pricing_validity", label: "Geçerlilik", text: "Bu teklif 30 gün süreyle geçerlidir." }
    ]
  },
  warranty: {
    title: "Garanti",
    icon: Shield,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    options: [
      { id: "warranty_1year", label: "1 Yıl", text: "Ürünlerimiz fatura tarihinden itibaren 1 yıl garantilidir." },
      { id: "warranty_2year", label: "2 Yıl", text: "Ürünlerimiz fatura tarihinden itibaren 2(iki) yıl garantilidir." },
      { id: "warranty_manufacturer", label: "Üretici Garantisi", text: "Ürünler üretici garantisi kapsamındadır." }
    ]
  },
  delivery: {
    title: "Stok ve Teslimat",
    icon: Truck,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    options: [
      { id: "delivery_standard", label: "Standart Teslimat", text: "Ürünler siparişten sonra 15 gün içinde teslim edilecektir." },
      { id: "delivery_express", label: "Hızlı Teslimat", text: "Ürünler siparişten sonra 7 gün içinde teslim edilecektir." },
      { id: "delivery_custom", label: "Özel Üretim", text: "Ürünler sipariş sonrası üretime alınacaktır. Tahmini iş süresi ürün teslimatından sonra belirlenir." }
    ]
  }
};

const ProposalTemplateTerms: React.FC<ProposalTemplateTermsProps> = ({
  register,
  watch,
  setValue
}) => {
  const [selectedTerms, setSelectedTerms] = useState<{[key: string]: string[]}>({
    payment: ["payment_prepaid"],
    pricing: ["pricing_vat_excluded", "pricing_currency_tl"],
    warranty: ["warranty_2year"],
    delivery: ["delivery_standard"]
  });
  
  const [customTerms, setCustomTerms] = useState<{[key: string]: string}>({});
  const [editingCustom, setEditingCustom] = useState<string | null>(null);

  const handleTermSelection = (category: string, termId: string, checked: boolean) => {
    setSelectedTerms(prev => {
      const categoryTerms = prev[category] || [];
      if (checked) {
        return { ...prev, [category]: [...categoryTerms, termId] };
      } else {
        return { ...prev, [category]: categoryTerms.filter(id => id !== termId) };
      }
    });
  };

  const addCustomTerm = (category: string) => {
    setEditingCustom(category);
  };

  const saveCustomTerm = (category: string, text: string) => {
    if (text.trim()) {
      setCustomTerms(prev => ({ ...prev, [category]: text.trim() }));
    }
    setEditingCustom(null);
  };

  const removeCustomTerm = (category: string) => {
    setCustomTerms(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
  };

  const renderCategory = (categoryKey: string, category: any) => {
    const Icon = category.icon;
    const categoryTerms = selectedTerms[categoryKey] || [];
    const hasCustom = customTerms[categoryKey];
    
    return (
      <Card key={categoryKey} className="overflow-hidden">
        <CardHeader className={`pb-3 ${category.bgColor}`}>
          <CardTitle className={`flex items-center gap-2 ${category.color} text-base`}>
            <Icon className="h-5 w-5" />
            {category.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Hazır Seçenekler */}
          <div className="space-y-2">
            {category.options.map((option: any) => (
              <div key={option.id} className="flex items-start space-x-2">
                <Checkbox
                  id={option.id}
                  checked={categoryTerms.includes(option.id)}
                  onCheckedChange={(checked) => 
                    handleTermSelection(categoryKey, option.id, checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <Label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">{option.text}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Özel Şart Ekleme */}
          {editingCustom === categoryKey ? (
            <div className="space-y-2" data-category={categoryKey}>
              <Label className="text-sm font-medium">Özel Şart Ekle</Label>
              <Textarea
                placeholder="Özel şartınızı yazın..."
                className="min-h-[80px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    saveCustomTerm(categoryKey, e.currentTarget.value);
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const textarea = document.querySelector(`[data-category="${categoryKey}"] textarea`);
                    if (textarea) saveCustomTerm(categoryKey, (textarea as HTMLTextAreaElement).value);
                  }}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Kaydet
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingCustom(null)}
                >
                  <X className="h-3 w-3 mr-1" />
                  İptal
                </Button>
              </div>
            </div>
          ) : hasCustom ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-purple-700">Özel Şart</Label>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingCustom(categoryKey)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCustomTerm(categoryKey)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="p-2 bg-purple-50 rounded text-sm border border-purple-200">
                {hasCustom}
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCustomTerm(categoryKey)}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Özel Şart Ekle
            </Button>
          )}

          {/* Seçilen Şartlar Özeti */}
          {(categoryTerms.length > 0 || hasCustom) && (
            <div className="pt-2 border-t">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">
                Seçilen Şartlar ({categoryTerms.length + (hasCustom ? 1 : 0)})
              </Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {categoryTerms.map(termId => {
                  const option = category.options.find((opt: any) => opt.id === termId);
                  return (
                    <Badge key={termId} variant="secondary" className="text-xs">
                      {option?.label}
                    </Badge>
                  );
                })}
                {hasCustom && (
                  <Badge variant="outline" className="text-xs text-purple-700">
                    Özel Şart
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center pb-4">
        <h3 className="text-lg font-semibold">Teklif Şartları</h3>
        <p className="text-sm text-gray-600 mt-1">
          Hazır şartları seçin veya özel şartlarınızı ekleyin
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-category="container">
        {Object.entries(TERMS_CATEGORIES).map(([key, category]) =>
          renderCategory(key, category)
        )}
      </div>
    </div>
  );
};

export default ProposalTemplateTerms;