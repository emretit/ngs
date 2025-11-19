import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import ProductSelector from "@/components/proposals/form/ProductSelector";
import { useProduction } from "@/hooks/useProduction";
import { toast } from "sonner";

const ProductionBOMNew = () => {
  const navigate = useNavigate();
  const { createBOM, isCreating } = useProduction();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  
  // Reçete kalemleri
  const [items, setItems] = useState<{
    item_name: string;
    quantity: number;
    unit: string;
  }[]>([
    { item_name: "", quantity: 1, unit: "adet" } // Başlangıçta boş bir satır
  ]);

  const handleProductSelect = (name: string, product: any) => {
    setProductName(name);
    if (product) {
      setProductId(product.id);
      // Ürün seçildiğinde reçete adını otomatik doldur (eğer boşsa)
      if (!name) setName(`${product.name} Reçetesi`);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { item_name: "", quantity: 1, unit: "adet" }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return; // En az bir satır kalsın
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast.error("Lütfen reçete adını girin");
      return;
    }

    // Boş satırları filtrele
    const validItems = items.filter(item => item.item_name.trim() !== "");
    
    if (validItems.length === 0) {
      toast.error("En az bir malzeme girmelisiniz");
      return;
    }

    try {
      await createBOM({
        name,
        description,
        product_id: productId || undefined,
        product_name: productName || undefined,
        items: validItems
      });
      
      // Başarılı olunca listeye dön ama BOM tabını aç
      // Bunu query param ile yapabiliriz ama Production.tsx'te bunu okumak lazım
      // Şimdilik düz dönelim
      navigate("/production");
    } catch (error) {
      console.error(error);
      toast.error("Reçete oluşturulurken hata oluştu");
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/production")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Yeni Ürün Reçetesi</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Genel Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Reçete Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reçete Adı *</Label>
                  <Input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: Masa Standart Üretim"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>İlgili Ürün (Opsiyonel)</Label>
                  <ProductSelector
                    value={productName}
                    onChange={handleProductSelect}
                    onProductSelect={(p) => handleProductSelect(p.name, p)}
                    placeholder="Ürün seçin..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Reçete hakkında notlar..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reçete Kalemleri */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Bileşenler / Malzemeler</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Satır Ekle
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Malzeme / Hammadde</TableHead>
                    <TableHead className="w-[20%]">Miktar</TableHead>
                    <TableHead className="w-[20%]">Birim</TableHead>
                    <TableHead className="w-[10%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={item.item_name}
                          onChange={(e) => handleItemChange(index, "item_name", e.target.value)}
                          placeholder="Malzeme adı..."
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0.0001"
                          step="0.0001"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                          placeholder="kg, adet, m..."
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/production")}>
              İptal
            </Button>
            <Button type="submit" disabled={isCreating}>
              <Save className="h-4 w-4 mr-2" />
              {isCreating ? "Kaydediliyor..." : "Reçeteyi Kaydet"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductionBOMNew;

