import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, AlertCircle, ShoppingCart, Plus, Search, Trash2, Package, Calculator, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import ProposalItems from "../items/ProposalItems";

interface ProposalLineItemsTabProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  validationErrors: Record<string, string[]>;
  onNext: () => void;
}

const ProposalLineItemsTab: React.FC<ProposalLineItemsTabProps> = ({
  formData,
  onFieldChange,
  validationErrors,
  onNext
}) => {
  const [quickSearchTerm, setQuickSearchTerm] = useState("");

  const handleItemsChange = (items: any[]) => {
    onFieldChange("items", items);
    
    // Auto-calculate totals
    const subtotal = items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      const discountRate = Number(item.discount_rate || 0);
      const taxRate = Number(item.tax_rate || 0);
      
      const lineTotal = quantity * unitPrice * (1 - discountRate / 100) * (1 + taxRate / 100);
      return sum + lineTotal;
    }, 0);
    
    const totalTax = items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      const discountRate = Number(item.discount_rate || 0);
      const taxRate = Number(item.tax_rate || 0);
      
      const taxAmount = quantity * unitPrice * (1 - discountRate / 100) * (taxRate / 100);
      return sum + taxAmount;
    }, 0);
    
    const totalDiscount = items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      const discountRate = Number(item.discount_rate || 0);
      
      const discountAmount = quantity * unitPrice * (discountRate / 100);
      return sum + discountAmount;
    }, 0);
    
    // Update totals
    onFieldChange("subtotal", subtotal - totalTax);
    onFieldChange("total_tax", totalTax);
    onFieldChange("total_discount", totalDiscount);
    onFieldChange("total_amount", subtotal);
  };

  const addQuickItem = () => {
    if (!quickSearchTerm.trim()) return;
    
    const newItem = {
      id: crypto.randomUUID(),
      name: quickSearchTerm,
      quantity: 1,
      unit_price: 0,
      tax_rate: 18,
      discount_rate: 0,
      total_price: 0,
      currency: formData.currency || "TRY"
    };
    
    const updatedItems = [...(formData.items || []), newItem];
    handleItemsChange(updatedItems);
    setQuickSearchTerm("");
  };

  const handleQuickSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addQuickItem();
    }
  };

  const isValid = formData.items && formData.items.length > 0;
  const itemCount = formData.items?.length || 0;
  const totalAmount = formData.total_amount || 0;

  const itemSummary = {
    totalItems: itemCount,
    totalValue: totalAmount,
    currency: formData.currency || "TRY"
  };

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Teklif Kalemleri
            {itemCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {itemCount} kalem
              </Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Teklif kalemlerini ekleyin, ürün arayın ve fiyatları hesaplayın
          </p>
        </div>
        <div className="flex items-center gap-4">
          {totalAmount > 0 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Toplam Tutar</p>
              <p className="text-lg font-semibold text-primary">
                {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: formData.currency || 'TRY'
                }).format(totalAmount)}
              </p>
            </div>
          )}
          <Button onClick={onNext} disabled={!isValid} className="gap-2">
            Sonraki: Özet & Toplamlar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Validation Alert */}
      {validationErrors.items && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationErrors.items[0]}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Add Item */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Hızlı Ekleme</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ürün/hizmet adı yazın ve Enter'a basın..."
                  value={quickSearchTerm}
                  onChange={(e) => setQuickSearchTerm(e.target.value)}
                  onKeyPress={handleQuickSearchKeyPress}
                  className="bg-white border-blue-200 focus:border-blue-400"
                />
                <Button 
                  onClick={addQuickItem}
                  disabled={!quickSearchTerm.trim()}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Ekle
                </Button>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-600 mb-1">veya</p>
              <Button variant="outline" size="sm" className="gap-1">
                <Package className="h-3 w-3" />
                Ürün Ara
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Kalemler & Hesaplamalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProposalItems
            items={formData.items || []}
            onItemsChange={handleItemsChange}
            globalCurrency={formData.currency || "TRY"}
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {itemCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50/50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600">Toplam Kalem</p>
                  <p className="text-xl font-semibold text-blue-900">{itemCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50/50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600">Ara Toplam</p>
                  <p className="text-xl font-semibold text-green-900">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: formData.currency || 'TRY'
                    }).format(formData.subtotal || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50/50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-600">KDV Toplamı</p>
                  <p className="text-xl font-semibold text-purple-900">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: formData.currency || 'TRY'
                    }).format(formData.total_tax || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {itemCount === 0 && (
        <Card className="border-2 border-dashed border-muted-foreground/30">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Henüz kalem eklenmedi
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Teklifinizi oluşturmak için ürün veya hizmet kalemleri ekleyin. 
                Yukarıdaki hızlı ekleme alanını kullanabilir veya ürün kataloğundan seçim yapabilirsiniz.
              </p>
              <div className="flex justify-center gap-3">
                <Button 
                  onClick={() => setQuickSearchTerm("Örnek Ürün")}
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  İlk Kalemi Ekle
                </Button>
                <Button variant="outline" className="gap-2">
                  <Package className="h-4 w-4" />
                  Ürün Kataloğu
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProposalLineItemsTab; 