import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Eye, MoreHorizontal, Save, FileDown, Send, ShoppingCart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductServiceCard from "@/components/proposals/cards/ProductServiceCard";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";
import { useCreatePurchaseRequest } from "@/hooks/usePurchasing";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/product";

// LineItem interface (ProductServiceCard için)
interface LineItem {
  id: string;
  row_number: number;
  name?: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  tax_rate?: number;
  discount_rate?: number;
  total_price: number;
  currency?: string;
  image_url?: string;
}

export default function NewPurchaseRequest() {
  const navigate = useNavigate();
  const createMutation = useCreatePurchaseRequest();
  
  const [currentUserId, setCurrentUserId] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [needByDate, setNeedByDate] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Product modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItemData, setEditingItemData] = useState<any>(null);
  
  // Line items state (ProductServiceCard formatında)
  const [items, setItems] = useState<LineItem[]>([
    {
      id: "1",
      row_number: 1,
      name: "",
      description: "",
      quantity: 1,
      unit: "Adet",
      unit_price: 0,
      tax_rate: 0,
      discount_rate: 0,
      total_price: 0,
      currency: "TRY"
    }
  ]);

  // Auth kontrolü
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setCurrentUserId(data.user.id);
    };
    getCurrentUser();
  }, []);

  // Memoized total calculation
  const totalEstimated = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  }, [items]);

  // Item change handler
  const handleItemChange = useCallback((index: number, field: keyof LineItem, value: any) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
        total_price: field === 'quantity' || field === 'unit_price' || field === 'discount_rate' || field === 'tax_rate'
          ? (() => {
              const qty = field === 'quantity' ? value : updatedItems[index].quantity;
              const price = field === 'unit_price' ? value : updatedItems[index].unit_price;
              const discount = field === 'discount_rate' ? value : (updatedItems[index].discount_rate || 0);
              const tax = field === 'tax_rate' ? value : (updatedItems[index].tax_rate || 0);
              
              const subtotal = qty * price;
              const discountAmount = subtotal * (discount / 100);
              const afterDiscount = subtotal - discountAmount;
              const taxAmount = afterDiscount * (tax / 100);
              
              return afterDiscount + taxAmount;
            })()
          : updatedItems[index].total_price
      };
      return updatedItems;
    });
  }, []);

  // Add item
  const addItem = useCallback(() => {
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      row_number: prev.length + 1,
      name: "",
      description: "",
      quantity: 1,
      unit: "Adet",
      unit_price: 0,
      tax_rate: 0,
      discount_rate: 0,
      total_price: 0,
      currency: "TRY"
    }]);
  }, []);

  // Remove item
  const removeItem = useCallback((index: number) => {
    setItems(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      // Row numbers'ı yeniden düzenle
      return filtered.map((item, i) => ({
        ...item,
        row_number: i + 1
      }));
    });
  }, []);

  // Move item up
  const moveItemUp = useCallback((index: number) => {
    if (index === 0) return;
    setItems(prev => {
      const newItems = [...prev];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      // Row numbers'ı güncelle
      return newItems.map((item, i) => ({
        ...item,
        row_number: i + 1
      }));
    });
  }, []);

  // Move item down
  const moveItemDown = useCallback((index: number) => {
    setItems(prev => {
      if (index === prev.length - 1) return prev;
      const newItems = [...prev];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      // Row numbers'ı güncelle
      return newItems.map((item, i) => ({
        ...item,
        row_number: i + 1
      }));
    });
  }, []);

  // Product modal select handler
  const handleProductModalSelect = useCallback((product: Product | any, itemIndex?: number) => {
    if (itemIndex !== undefined) {
      // Editing existing item
      setSelectedProduct(product);
      setEditingItemIndex(itemIndex);
      setEditingItemData(product);
      setProductModalOpen(true);
    } else {
      // Adding new item
      setSelectedProduct(product);
      setEditingItemIndex(undefined);
      setEditingItemData(null);
      setProductModalOpen(true);
    }
  }, []);

  // Add product to items
  const handleAddProductToProposal = useCallback((productData: {
    name: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    vat_rate: number;
    discount_rate: number;
    total_price: number;
    currency: string;
    image_url?: string;
  }, itemIndex?: number) => {
    if (itemIndex !== undefined) {
      // Update existing item
      setItems(prev => {
        const updated = [...prev];
        updated[itemIndex] = {
          ...updated[itemIndex],
          name: productData.name,
          description: productData.description,
          quantity: productData.quantity,
          unit: productData.unit,
          unit_price: productData.unit_price,
          tax_rate: productData.vat_rate,
          discount_rate: productData.discount_rate,
          total_price: productData.total_price,
          currency: productData.currency,
          image_url: productData.image_url
        };
        return updated;
      });
    } else {
      // Add new item
      setItems(prev => [...prev, {
        id: Date.now().toString(),
        row_number: prev.length + 1,
        name: productData.name,
        description: productData.description,
        quantity: productData.quantity,
        unit: productData.unit,
        unit_price: productData.unit_price,
        tax_rate: productData.vat_rate,
        discount_rate: productData.discount_rate,
        total_price: productData.total_price,
        currency: productData.currency,
        image_url: productData.image_url
      }]);
    }
    setProductModalOpen(false);
    setEditingItemIndex(undefined);
    setSelectedProduct(null);
    setEditingItemData(null);
  }, []);

  const handleSmartSave = useCallback(async () => {
    if (!currentUserId) {
      toast({ title: "Hata", description: "Kullanıcı bilgisi alınamadı", variant: "destructive" });
      return;
    }

    if (items.length === 0 || items.every((item) => !item.description && !item.name)) {
      toast({ title: "Hata", description: "En az bir kalem girmelisiniz", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      createMutation.mutate(
        {
          requester_id: currentUserId,
          priority,
          need_by_date: needByDate || undefined,
          requester_notes: notes || undefined,
          cost_center: costCenter || undefined,
          items: items
            .filter((item) => item.description || item.name)
            .map((item) => ({
              description: item.description || item.name || "",
              quantity: item.quantity,
              unit: item.unit || "Adet",
              estimated_unit_price: item.unit_price,
              estimated_total: item.total_price,
            })),
        },
        {
          onSuccess: () => {
            toast({ title: "Başarılı", description: "Satın alma talebi oluşturuldu" });
            navigate("/purchasing/requests");
          },
          onError: () => {
            toast({ title: "Hata", description: "Talep oluşturulurken bir hata oluştu", variant: "destructive" });
          },
        }
      );
    } finally {
      setSaving(false);
    }
  }, [currentUserId, items, priority, needByDate, notes, costCenter, createMutation, navigate]);

  const handlePreview = () => {
    toast({ title: "Bilgi", description: "Önizleme özelliği yakında eklenecek" });
  };

  const handleExportPDF = () => {
    toast({ title: "Bilgi", description: "PDF export özelliği yakında eklenecek" });
  };

  const handleSendEmail = () => {
    toast({ title: "Bilgi", description: "E-posta gönderimi özelliği yakında eklenecek" });
  };

  const handleConvertToRFQ = () => {
    if (items.length === 0 || items.every((item) => !item.description && !item.name)) {
      toast({ title: "Hata", description: "Önce talebi kaydedin", variant: "destructive" });
      return;
    }
    toast({ title: "Bilgi", description: "RFQ'ya çevirme özelliği yakında eklenecek" });
  };

  return (
    <div className="space-y-2">
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <BackButton 
              onClick={() => navigate("/purchasing/requests")}
              variant="ghost"
              size="sm"
            >
              Talepler
            </BackButton>
            
            {/* Title Section with Icon */}
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Yeni Satın Alma Talebi
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  Hızlı ve kolay talep oluşturma
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSmartSave}
              disabled={saving || createMutation.isPending}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{saving || createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="font-medium">İşlemler</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handlePreview} className="gap-2 cursor-pointer">
                  <Eye className="h-4 w-4" />
                  <span>Önizle</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                  <FileDown className="h-4 w-4" />
                  <span>PDF İndir</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendEmail} className="gap-2 cursor-pointer">
                  <Send className="h-4 w-4" />
                  <span>E-posta Gönder</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleConvertToRFQ} className="gap-2 cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                  <ShoppingCart className="h-4 w-4" />
                  <span>RFQ'ya Çevir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content - Her kart bağımsız Card komponenti */}
      <div className="space-y-4">
        {/* Request Details Card */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              Talep Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Öncelik</Label>
                <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                  <SelectTrigger className="mt-1 h-10 text-sm">
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
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">İhtiyaç Tarihi</Label>
                <Input 
                  type="date" 
                  value={needByDate} 
                  onChange={(e) => setNeedByDate(e.target.value)}
                  className="mt-1 h-10 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Masraf Merkezi</Label>
                <Input 
                  value={costCenter} 
                  onChange={(e) => setCostCenter(e.target.value)} 
                  placeholder="Opsiyonel"
                  className="mt-1 h-10 text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Notlar</Label>
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Opsiyonel notlar..."
                rows={3}
                className="mt-1 resize-none text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products/Services Card - ProductServiceCard component kullanılıyor */}
        <ProductServiceCard
          items={items}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onMoveItemUp={moveItemUp}
          onMoveItemDown={moveItemDown}
          onItemChange={handleItemChange}
          onProductModalSelect={handleProductModalSelect}
          showMoveButtons={true}
          inputHeight="h-10"
        />

        {/* Product Details Modal */}
        <ProductDetailsModal
          open={productModalOpen}
          onOpenChange={(open) => {
            setProductModalOpen(open);
            if (!open) {
              setEditingItemIndex(undefined);
              setSelectedProduct(null);
              setEditingItemData(null);
            }
          }}
          product={selectedProduct}
          onAddToProposal={handleAddProductToProposal}
          currency="TRY"
          existingData={editingItemData}
        />
      </div>
    </div>
  );
}
