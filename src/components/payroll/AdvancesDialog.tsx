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
import { Trash2, Plus } from "lucide-react";
import { Advance } from "@/services/payrollService";
import { format } from "date-fns";

interface AdvancesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advances: Advance[];
  onSave: (advances: Advance[]) => void;
}

export const AdvancesDialog = ({
  open,
  onOpenChange,
  advances,
  onSave,
}: AdvancesDialogProps) => {
  const [localAdvances, setLocalAdvances] = useState<Advance[]>([...advances]);

  const handleAdd = () => {
    setLocalAdvances([
      ...localAdvances,
      {
        description: '',
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
      },
    ]);
  };

  const handleRemove = (index: number) => {
    setLocalAdvances(localAdvances.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: keyof Advance, value: any) => {
    const updated = [...localAdvances];
    updated[index] = { ...updated[index], [field]: value };
    setLocalAdvances(updated);
  };

  const handleSave = () => {
    onSave(localAdvances.filter(a => a.description && a.amount > 0));
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalAmount = localAdvances.reduce((sum, a) => sum + a.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avans Kesintileri</DialogTitle>
          <DialogDescription>
            Çalışanın bu ay kesilecek avans tutarlarını girin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {localAdvances.map((advance, index) => (
            <div
              key={index}
              className="grid gap-4 p-4 border rounded-lg bg-orange-50"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tutar (TRY)</Label>
                  <Input
                    type="number"
                    value={advance.amount || ''}
                    onChange={(e) =>
                      handleUpdate(index, 'amount', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tarih</Label>
                  <Input
                    type="date"
                    value={advance.date || ''}
                    onChange={(e) => handleUpdate(index, 'date', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Input
                  value={advance.description}
                  onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                  placeholder="Örn: Eylül ayı avans kesintisi"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sil
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
            Yeni Avans Ekle
          </Button>

          {localAdvances.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <span className="font-medium">Toplam Avans Kesintisi</span>
              <span className="text-xl font-bold text-red-600">
                -{formatCurrency(totalAmount)}
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
