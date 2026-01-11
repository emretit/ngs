import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { Allowance } from "@/services/payrollService";

interface AllowancesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowances: Allowance[];
  onSave: (allowances: Allowance[]) => void;
}

export const AllowancesDialog = ({
  open,
  onOpenChange,
  allowances,
  onSave,
}: AllowancesDialogProps) => {
  const [localAllowances, setLocalAllowances] = useState<Allowance[]>([...allowances]);

  const handleAdd = () => {
    setLocalAllowances([
      ...localAllowances,
      {
        type: 'meal',
        description: '',
        amount: 0,
        is_taxable: true,
      },
    ]);
  };

  const handleRemove = (index: number) => {
    setLocalAllowances(localAllowances.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: keyof Allowance, value: any) => {
    const updated = [...localAllowances];
    updated[index] = { ...updated[index], [field]: value };
    setLocalAllowances(updated);
  };

  const handleSave = () => {
    onSave(localAllowances.filter(a => a.description && a.amount > 0));
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalAmount = localAllowances.reduce((sum, a) => sum + a.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yan Ödemeler</DialogTitle>
          <DialogDescription>
            Yemek, yol gibi yan ödemeleri ekleyin ve düzenleyin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {localAllowances.map((allowance, index) => (
            <div
              key={index}
              className="grid gap-4 p-4 border rounded-lg bg-gray-50"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tür</Label>
                  <Select
                    value={allowance.type}
                    onValueChange={(value: 'meal' | 'transportation' | 'other') =>
                      handleUpdate(index, 'type', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meal">🍽️ Yemek Yardımı</SelectItem>
                      <SelectItem value="transportation">🚗 Yol Yardımı</SelectItem>
                      <SelectItem value="other">📦 Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tutar (TRY)</Label>
                  <Input
                    type="number"
                    value={allowance.amount || ''}
                    onChange={(e) =>
                      handleUpdate(index, 'amount', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Input
                  value={allowance.description}
                  onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                  placeholder="Örn: Aylık yemek yardımı"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={allowance.is_taxable}
                    onCheckedChange={(checked) =>
                      handleUpdate(index, 'is_taxable', checked)
                    }
                  />
                  <Label className="text-sm">
                    Vergiye tabi{' '}
                    <span className="text-muted-foreground">
                      (brüt maaşa dahil edilir)
                    </span>
                  </Label>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={handleAdd}
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Yeni Yan Ödeme Ekle
          </Button>

          {localAllowances.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="font-medium">Toplam Yan Ödeme</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
