import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePurchaseRequest } from "@/hooks/usePurchasing";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FormItem {
  description: string;
  quantity: number;
  unit: string;
  estimated_unit_price: number;
  estimated_total: number;
}

export default function NewPurchaseRequest() {
  const navigate = useNavigate();
  const createMutation = useCreatePurchaseRequest();
  
  const [currentUserId, setCurrentUserId] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [needByDate, setNeedByDate] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<FormItem[]>([
    { description: "", quantity: 1, unit: "Adet", estimated_unit_price: 0, estimated_total: 0 },
  ]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit: "Adet", estimated_unit_price: 0, estimated_total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof FormItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate estimated_total
    if (field === "quantity" || field === "estimated_unit_price") {
      newItems[index].estimated_total = newItems[index].quantity * newItems[index].estimated_unit_price;
    }
    
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!currentUserId) {
      toast({ title: "Hata", description: "Kullanıcı bilgisi alınamadı", variant: "destructive" });
      return;
    }

    if (items.length === 0 || items.every((item) => !item.description)) {
      toast({ title: "Hata", description: "En az bir kalem girmelisiniz", variant: "destructive" });
      return;
    }

    createMutation.mutate(
      {
        requester_id: currentUserId,
        priority,
        need_by_date: needByDate || undefined,
        requester_notes: notes || undefined,
        cost_center: costCenter || undefined,
        items: items
          .filter((item) => item.description)
          .map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            estimated_unit_price: item.estimated_unit_price,
            estimated_total: item.estimated_total,
          })),
      },
      {
        onSuccess: () => {
          navigate("/purchasing/requests");
        },
      }
    );
  };

  const totalEstimated = items.reduce((sum, item) => sum + item.estimated_total, 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/purchasing/requests")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Yeni Satın Alma Talebi</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Talep Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Öncelik</Label>
              <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                <SelectTrigger>
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
            <div>
              <Label>İhtiyaç Tarihi</Label>
              <Input type="date" value={needByDate} onChange={(e) => setNeedByDate(e.target.value)} />
            </div>
            <div>
              <Label>Masraf Merkezi</Label>
              <Input value={costCenter} onChange={(e) => setCostCenter(e.target.value)} placeholder="Opsiyonel" />
            </div>
          </div>
          <div>
            <Label>Notlar</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsiyonel" rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Kalemler</CardTitle>
            <Button size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Kalem Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex gap-4 items-start border-b pb-4">
              <div className="flex-1">
                <Label>Açıklama</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  placeholder="Ürün açıklaması"
                />
              </div>
              <div className="w-24">
                <Label>Miktar</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="w-24">
                <Label>Birim</Label>
                <Input value={item.unit} onChange={(e) => updateItem(index, "unit", e.target.value)} />
              </div>
              <div className="w-32">
                <Label>Birim Fiyat</Label>
                <Input
                  type="number"
                  value={item.estimated_unit_price}
                  onChange={(e) => updateItem(index, "estimated_unit_price", parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="w-32">
                <Label>Toplam</Label>
                <Input value={item.estimated_total.toFixed(2)} readOnly className="bg-muted" />
              </div>
              {items.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="mt-8">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <div className="flex justify-between items-center pt-4 border-t font-semibold">
            <span>Tahmini Toplam:</span>
            <span className="text-lg">₺{totalEstimated.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate("/purchasing/requests")}>
          İptal
        </Button>
        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Kaydediliyor..." : "Taslak Olarak Kaydet"}
        </Button>
      </div>
    </div>
  );
}
