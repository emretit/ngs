import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface InvoiceItem {
  id: string;
  urun_adi: string;
  aciklama: string;
  miktar: number;
  birim: string;
  birim_fiyat: number;
  kdv_orani: number;
  indirim_orani: number;
  satir_toplami: number;
  kdv_tutari: number;
}

interface InvoiceItemsCardProps {
  items: InvoiceItem[];
  currency: string;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, field: keyof InvoiceItem, value: any) => void;
  formatCurrency: (amount: number, currency: string) => string;
}

const InvoiceItemsCard: React.FC<InvoiceItemsCardProps> = ({
  items,
  currency,
  onAddItem,
  onRemoveItem,
  onItemChange,
  formatCurrency,
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
              <Plus className="h-4 w-4 text-purple-600" />
            </div>
            Fatura Kalemleri
          </CardTitle>
          <Button type="button" onClick={onAddItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Kalem Ekle
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-semibold text-gray-700">Ürün/Hizmet *</th>
                <th className="text-left p-3 font-semibold text-gray-700">Açıklama</th>
                <th className="text-left p-3 font-semibold text-gray-700">Miktar *</th>
                <th className="text-left p-3 font-semibold text-gray-700">Birim *</th>
                <th className="text-left p-3 font-semibold text-gray-700">Birim Fiyat *</th>
                <th className="text-left p-3 font-semibold text-gray-700">İndirim %</th>
                <th className="text-left p-3 font-semibold text-gray-700">KDV %</th>
                <th className="text-left p-3 font-semibold text-gray-700 min-w-[120px]">Tutar</th>
                <th className="text-left p-3 font-semibold text-gray-700">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <Input
                      value={item.urun_adi}
                      onChange={(e) => onItemChange(index, "urun_adi", e.target.value)}
                      placeholder="Ürün/Hizmet adı"
                      className={!item.urun_adi.trim() ? 'border-red-300' : ''}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.aciklama}
                      onChange={(e) => onItemChange(index, "aciklama", e.target.value)}
                      placeholder="Açıklama"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.001"
                      value={item.miktar}
                      onChange={(e) => onItemChange(index, "miktar", parseFloat(e.target.value) || 0)}
                      className={`w-20 ${item.miktar <= 0 ? 'border-red-300' : ''}`}
                    />
                  </td>
                  <td className="p-2">
                    <Select
                      value={item.birim}
                      onValueChange={(value) => onItemChange(index, "birim", value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adet">Adet</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                        <SelectItem value="lt">Litre</SelectItem>
                        <SelectItem value="m">Metre</SelectItem>
                        <SelectItem value="m2">Metrekare</SelectItem>
                        <SelectItem value="m3">Metreküp</SelectItem>
                        <SelectItem value="saat">Saat</SelectItem>
                        <SelectItem value="gün">Gün</SelectItem>
                        <SelectItem value="ay">Ay</SelectItem>
                        <SelectItem value="paket">Paket</SelectItem>
                        <SelectItem value="kutu">Kutu</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.birim_fiyat}
                      onChange={(e) => onItemChange(index, "birim_fiyat", parseFloat(e.target.value) || 0)}
                      className={`w-28 ${item.birim_fiyat <= 0 ? 'border-red-300' : ''}`}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.indirim_orani}
                      onChange={(e) => onItemChange(index, "indirim_orani", parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.kdv_orani}
                      onChange={(e) => onItemChange(index, "kdv_orani", parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  </td>
                  <td className="p-2 text-right font-medium">
                    {formatCurrency(item.satir_toplami + item.kdv_tutari, currency)}
                  </td>
                  <td className="p-2">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceItemsCard;


