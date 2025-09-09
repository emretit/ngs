
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ProposalItem } from "@/types/proposal";

interface ProposalTemplateItemsProps {
  items: ProposalItem[];
  onItemsChange: (items: ProposalItem[]) => void;
}

const ProposalTemplateItems: React.FC<ProposalTemplateItemsProps> = ({ items, onItemsChange }) => {
  const addItem = () => {
    const newItem = {
      id: uuidv4(),
      name: "",
      quantity: 1,
      unit: "adet",
      unit_price: 0,
      tax_rate: 18,
      total_price: 0,
    };
    
    onItemsChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ProposalItem, value: any) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate total if quantity, unit_price, or tax_rate changed
        if (field === "quantity" || field === "unit_price" || field === "tax_rate") {
          const quantity = Number(updatedItem.quantity);
          const unitPrice = Number(updatedItem.unit_price);
          const taxRate = Number(updatedItem.tax_rate);
          
          updatedItem.total_price = quantity * unitPrice * (1 + taxRate / 100);
        }
        
        return updatedItem;
      }
      return item;
    });
    
    onItemsChange(updatedItems);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  const calculateTax = () => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;
      const subtotal = quantity * unitPrice;
      return sum + (subtotal * taxRate / 100);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Teklif Kalemleri</h3>
        <Button onClick={addItem} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Kalem Ekle
        </Button>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Ürün/Hizmet</TableHead>
              <TableHead>Adet</TableHead>
              <TableHead>Birim Fiyat</TableHead>
              <TableHead>Vergi %</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Henüz teklif kalemi eklenmemiş
                </TableCell>
              </TableRow>
            ) : (
              <>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, "name", e.target.value)}
                        placeholder="Ürün/Hizmet adı"
                        className="max-w-[250px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value))}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.tax_rate}
                        onChange={(e) => updateItem(item.id, "tax_rate", parseFloat(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(item.total_price)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Sil</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <div className="border border-border rounded-lg p-4 bg-muted/50 min-w-[300px]">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Ara Toplam:</span>
              <span>{formatMoney(calculateSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>KDV:</span>
              <span>{formatMoney(calculateTax())}</span>
            </div>
            <hr className="border-t border-border" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Net Toplam:</span>
              <span>{formatMoney(calculateTotal())}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalTemplateItems;
