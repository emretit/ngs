import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ProposalTemplate } from "@/types/proposal-template";
import { ProposalFormData } from "@/types/proposal-form";
import { ProposalItem } from "@/types/proposal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  FileText, 
  CalendarIcon, 
  Building2, 
  User, 
  Package, 
  Calculator, 
  FileCheck, 
  AlertCircle,
  Plus,
  Trash2,
  Info,
  CheckCircle,
  Clock,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StandardProposalFormProps {
  template: ProposalTemplate;
  onSaveDraft: () => void;
  onPreview?: () => void;
}

interface FormCompletionStatus {
  basic: boolean;
  customer: boolean;
  items: boolean;
  terms: boolean;
}

const StandardProposalForm: React.FC<StandardProposalFormProps> = ({ 
  template, 
  onSaveDraft,
  onPreview 
}) => {
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [validUntil, setValidUntil] = useState<Date | undefined>(
    template.prefilledFields?.validityDays 
      ? new Date(Date.now() + template.prefilledFields.validityDays * 24 * 60 * 60 * 1000) 
      : undefined
  );
  const [activeTab, setActiveTab] = useState("basic");
  const [completionStatus, setCompletionStatus] = useState<FormCompletionStatus>({
    basic: false,
    customer: false,
    items: false,
    terms: false
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProposalFormData>({
    defaultValues: {
      title: template.prefilledFields?.title || "",
      customer_id: undefined,
      items: [],
      paymentTerm: template.prefilledFields?.paymentTerm || "net30",
      internalNotes: template.prefilledFields?.internalNotes || "",
      discounts: 0,
      additionalCharges: 0,
    },
  });

  const watchedValues = watch();

  // Calculate completion progress
  useEffect(() => {
    const newStatus = {
      basic: !!(watchedValues.title && validUntil),
      customer: !!(watchedValues.customer_id),
      items: items.length > 0 && items.every(item => item.name && item.quantity && item.unit_price),
      terms: !!(watchedValues.paymentTerm)
    };
    
    setCompletionStatus(newStatus);
  }, [watchedValues, items, validUntil]);

  const completionPercentage = Object.values(completionStatus).filter(Boolean).length * 25;

  // Generate proposal number
  const generateProposalNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `STD${year}${month}${day}${random}`;
  };

  // Add new item
  const addItem = () => {
    const newItem: ProposalItem = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      quantity: 1,
      unit: "adet",
      unit_price: 0,
      tax_rate: 20,
      total_price: 0
    };
    setItems([...items, newItem]);
  };

  // Remove item
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Update item
  const updateItem = (id: string, field: keyof ProposalItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate total price
        updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
        return updatedItem;
      }
      return item;
    }));
  };

  // Calculate totals
  const calculations = {
    subtotal: items.reduce((sum, item) => sum + item.total_price, 0),
    get totalTax() {
      return items.reduce((sum, item) => sum + (item.total_price * (item.tax_rate / 100)), 0);
    },
    get grandTotal() {
      return this.subtotal + this.totalTax;
    }
  };

  const onSubmit = (data: ProposalFormData) => {
    const formData = {
      ...data,
      items,
      valid_until: validUntil ? validUntil.toISOString() : undefined,
      subtotal: calculations.subtotal,
      total_tax: calculations.totalTax,
      total_amount: calculations.grandTotal
    };
    console.log("Standard Template Form Data:", formData);
    toast.success("Standart teklif taslak olarak kaydedildi");
    onSaveDraft();
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview();
    } else {
      toast.info("Önizleme özelliği yakında eklenecek");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <p className="text-gray-600">{template.description}</p>
          </div>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          Standart Şablon
        </Badge>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tamamlanma Oranı</span>
            <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className={cn("flex items-center gap-1", completionStatus.basic ? "text-green-600" : "text-gray-500")}>
              <CheckCircle className="h-3 w-3" />
              Temel Bilgiler
            </div>
            <div className={cn("flex items-center gap-1", completionStatus.customer ? "text-green-600" : "text-gray-500")}>
              <CheckCircle className="h-3 w-3" />
              Müşteri
            </div>
            <div className={cn("flex items-center gap-1", completionStatus.items ? "text-green-600" : "text-gray-500")}>
              <CheckCircle className="h-3 w-3" />
              Kalemler
            </div>
            <div className={cn("flex items-center gap-1", completionStatus.terms ? "text-green-600" : "text-gray-500")}>
              <CheckCircle className="h-3 w-3" />
              Şartlar
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Tabs */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Temel Bilgiler
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Müşteri
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Kalemler
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Şartlar & Notlar
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Teklif Detayları
                </CardTitle>
                <CardDescription>
                  Teklifinizin temel bilgilerini girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="proposal_number">Teklif Numarası</Label>
                    <Input 
                      id="proposal_number"
                      defaultValue={generateProposalNumber()}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="proposal_date">Teklif Tarihi</Label>
                    <Input 
                      id="proposal_date"
                      value={format(new Date(), "dd.MM.yyyy", { locale: tr })}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Teklif Başlığı *</Label>
                  <Input 
                    id="title" 
                    {...register("title", { required: "Teklif başlığı gereklidir" })} 
                    placeholder="Örn: Yazılım Geliştirme Projesi Teklifi"
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
                </div>

                <div>
                  <Label htmlFor="valid_until">Geçerlilik Tarihi *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left font-normal"
                      >
                        {validUntil ? (
                          format(validUntil, "dd.MM.yyyy", { locale: tr })
                        ) : (
                          <span className="text-gray-500">Tarih seçin</span>
                        )}
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={validUntil}
                        onSelect={(date) => setValidUntil(date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        locale={tr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Tab */}
          <TabsContent value="customer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Müşteri Bilgileri
                </CardTitle>
                <CardDescription>
                  Teklifi göndereceğiniz müşteriyi seçin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Müşteri seçimi, faturalama ve iletişim bilgileri için gereklidir.
                  </AlertDescription>
                </Alert>
                
                <div>
                  <Label htmlFor="customer_id">Müşteri Seçin *</Label>
                  <Select onValueChange={(value) => setValue("customer_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer-1">ABC Teknoloji Ltd.</SelectItem>
                      <SelectItem value="customer-2">XYZ Yazılım A.Ş.</SelectItem>
                      <SelectItem value="customer-3">123 Danışmanlık</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Contact person field removed as it's not in ProposalFormData schema */}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Teklif Kalemleri
                </CardTitle>
                <CardDescription>
                  Teklifinize dahil edilecek ürün ve hizmetleri ekleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Henüz kalem eklenmedi
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Teklifinize ilk kalemi eklemek için butona tıklayın
                    </p>
                    <Button onClick={addItem} className="inline-flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      İlk Kalemi Ekle
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <Card key={item.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-sm">Kalem #{index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div className="lg:col-span-2">
                              <Label>Ürün/Hizmet Adı *</Label>
                              <Input
                                value={item.name}
                                onChange={(e) => updateItem(item.id, "name", e.target.value)}
                                placeholder="Ürün/hizmet adı"
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label>Miktar *</Label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label>Birim</Label>
                              <Select
                                value={item.unit}
                                onValueChange={(value) => updateItem(item.id, "unit", value)}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="adet">Adet</SelectItem>
                                  <SelectItem value="saat">Saat</SelectItem>
                                  <SelectItem value="gün">Gün</SelectItem>
                                  <SelectItem value="ay">Ay</SelectItem>
                                  <SelectItem value="kg">Kg</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Birim Fiyat (₺) *</Label>
                              <Input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label>Toplam (₺)</Label>
                              <Input
                                value={item.total_price.toFixed(2)}
                                readOnly
                                className="bg-muted text-sm font-medium"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <Label>Açıklama</Label>
                            <Textarea
                              value={item.description}
                              onChange={(e) => updateItem(item.id, "description", e.target.value)}
                              placeholder="Opsiyonel açıklama"
                              className="text-sm"
                              rows={2}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addItem}
                      className="w-full border-dashed"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Kalem Ekle
                    </Button>
                  </div>
                )}

                {/* Totals */}
                {items.length > 0 && (
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Calculator className="h-5 w-5 text-primary" />
                        <span className="font-medium">Teklif Özeti</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Ara Toplam:</span>
                          <span>{calculations.subtotal.toFixed(2)} ₺</span>
                        </div>
                        <div className="flex justify-between">
                          <span>KDV ({items[0]?.tax_rate || 20}%):</span>
                          <span>{calculations.totalTax.toFixed(2)} ₺</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Genel Toplam:</span>
                          <span className="text-primary">{calculations.grandTotal.toFixed(2)} ₺</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terms Tab */}
          <TabsContent value="terms" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Ödeme Şartları
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="payment_terms">Ödeme Koşulu *</Label>
                    <Select onValueChange={(value) => setValue("paymentTerm", value)} defaultValue={template.prefilledFields?.paymentTerm || "net30"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prepaid">Peşin</SelectItem>
                        <SelectItem value="net30">30 Gün Vadeli</SelectItem>
                        <SelectItem value="net60">60 Gün Vadeli</SelectItem>
                        <SelectItem value="net90">90 Gün Vadeli</SelectItem>
                        <SelectItem value="installment">Taksitli</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="delivery_terms">Teslimat Şartları</Label>
                    <Textarea
                      id="delivery_terms"
                      {...register("delivery_terms")}
                      placeholder="Teslimat süreleri ve koşulları..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Notlar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Teklif Notları</Label>
                    <Textarea
                      id="notes"
                      {...register("notes")}
                      placeholder="Müşteriye gösterilecek notlar..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="internal_notes">İç Notlar</Label>
                    <Textarea
                      id="internal_notes"
                      {...register("internalNotes")}
                      placeholder="Sadece internal kullanım için notlar..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Tahmini tamamlama süresi: 8 dakika</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={completionPercentage < 75}
                >
                  Önizleme
                </Button>
                <Button type="submit" className="min-w-32">
                  Taslak Kaydet
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default StandardProposalForm;