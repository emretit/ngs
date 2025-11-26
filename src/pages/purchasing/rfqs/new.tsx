import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useCreateRFQ } from "@/hooks/useRFQs";
import { useVendors } from "@/hooks/useVendors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface RFQLine {
  description: string;
  quantity: number;
  uom: string;
  target_price?: number;
  notes?: string;
}

interface RFQFormData {
  due_date?: string;
  incoterm?: string;
  currency: string;
  notes?: string;
  vendor_ids: string[];
  lines: RFQLine[];
}

export default function NewRFQ() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, watch, setValue } = useForm<RFQFormData>({
    defaultValues: {
      currency: 'TRY',
      vendor_ids: [],
      lines: [{ description: '', quantity: 1, uom: 'adet' }],
    },
  });

  const createRFQ = useCreateRFQ();
  const { data: vendors } = useVendors({ is_active: true });
  
  const [lines, setLines] = useState<RFQLine[]>([
    { description: '', quantity: 1, uom: 'adet' },
  ]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  // Pre-fill from PR if available
  useEffect(() => {
    const prItems = location.state?.prItems;
    if (prItems && Array.isArray(prItems) && prItems.length > 0) {
      setLines(prItems);
    }
  }, [location.state]);

  const addLine = () => {
    setLines([...lines, { description: '', quantity: 1, uom: 'adet' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof RFQLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const toggleVendor = (vendorId: string) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const onSubmit = async (data: RFQFormData) => {
    if (selectedVendors.length === 0) {
      alert('En az bir tedarikçi seçmelisiniz');
      return;
    }

    if (lines.some(line => !line.description)) {
      alert('Tüm satırlar için açıklama girmelisiniz');
      return;
    }

    await createRFQ.mutateAsync({
      ...data,
      vendor_ids: selectedVendors,
      lines: lines,
    });

    navigate('/purchasing/rfqs');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/purchasing/rfqs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Yeni RFQ Oluştur</h1>
          <p className="text-muted-foreground">Tedarikçilerden teklif isteyin</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">RFQ Bilgileri</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Son Teklif Tarihi</Label>
              <Input
                id="due_date"
                type="date"
                {...register('due_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Para Birimi</Label>
              <Select defaultValue="TRY" onValueChange={(value) => setValue('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incoterm">Incoterm</Label>
              <Input
                id="incoterm"
                placeholder="EXW, FOB, CIF..."
                {...register('incoterm')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              placeholder="RFQ ile ilgili notlar..."
              {...register('notes')}
              rows={3}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Ürün/Hizmet Kalemleri</h3>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-2" />
              Satır Ekle
            </Button>
          </div>

          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-12 gap-3">
                  <div className="col-span-5">
                    <Input
                      placeholder="Açıklama *"
                      value={line.description}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Miktar"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Birim"
                      value={line.uom}
                      onChange={(e) => updateLine(index, 'uom', e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Hedef fiyat"
                      value={line.target_price || ''}
                      onChange={(e) => updateLine(index, 'target_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </div>
                {lines.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Tedarikçi Seçimi</h3>
          <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {vendors?.map((vendor) => (
              <div key={vendor.id} className="flex items-center space-x-2 p-2 border rounded">
                <Checkbox
                  id={vendor.id}
                  checked={selectedVendors.includes(vendor.id)}
                  onCheckedChange={() => toggleVendor(vendor.id)}
                />
                <label
                  htmlFor={vendor.id}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {vendor.name} ({vendor.city || vendor.country})
                </label>
              </div>
            ))}
          </div>
          {selectedVendors.length === 0 && (
            <p className="text-sm text-destructive">En az bir tedarikçi seçmelisiniz</p>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/purchasing/rfqs')}
          >
            İptal
          </Button>
          <Button type="submit" disabled={createRFQ.isPending}>
            {createRFQ.isPending ? 'Oluşturuluyor...' : 'RFQ Oluştur'}
          </Button>
        </div>
      </form>
    </div>
  );
}
