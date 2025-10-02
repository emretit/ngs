import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePurchaseRequest } from "@/hooks/usePurchasing";
import { PurchaseRequestFormData, PurchaseRequestPriority } from "@/types/purchasing";
import { supabase } from "@/integrations/supabase/client";

interface FormItem {
  description: string;
  quantity: number;
  estimated_price: number;
  uom: string;
}

export default function NewPurchaseRequest() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch } = useForm<PurchaseRequestFormData>();
  const createMutation = useCreatePurchaseRequest();
  const [items, setItems] = useState<FormItem[]>([{ description: "", quantity: 1, estimated_price: 0, uom: "Adet" }]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const priority = watch("priority");

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    });
  }, []);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, estimated_price: 0, uom: "Adet" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof FormItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const onSubmit = (data: PurchaseRequestFormData) => {
    createMutation.mutate(
      { ...data, requester_id: currentUserId, items },
      {
        onSuccess: () => {
          navigate("/purchasing/requests");
        },
      }
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Yeni Satın Alma Talebi</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Talep Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Öncelik</Label>
                <Select
                  value={priority}
                  onValueChange={(value) => setValue("priority", value as PurchaseRequestPriority)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Öncelik seçin" />
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
                <Input type="date" {...register("need_by_date")} />
              </div>

              <div>
                <Label>Masraf Merkezi</Label>
                <Input {...register("cost_center")} placeholder="Masraf merkezi" />
              </div>
            </div>

            <div>
              <Label>Notlar</Label>
              <Textarea {...register("requester_notes")} placeholder="Talep notları" rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Kalemler</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Kalem Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                      onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="w-32">
                    <Label>Birim Fiyat</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.estimated_price}
                      onChange={(e) => updateItem(index, "estimated_price", parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="w-24">
                    <Label>Birim</Label>
                    <Input
                      value={item.uom}
                      onChange={(e) => updateItem(index, "uom", e.target.value)}
                    />
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="mt-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/purchasing/requests")}>
            İptal
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Kaydediliyor..." : "Taslak Olarak Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  );
}
