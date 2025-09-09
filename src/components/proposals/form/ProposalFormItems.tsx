
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ProposalItem } from "@/types/proposal";

interface ProposalFormItemsProps {
  items: ProposalItem[];
  onItemsChange: (items: ProposalItem[]) => void;
  onEditItem?: (item: ProposalItem) => void;
}

const ProposalFormItems: React.FC<ProposalFormItemsProps> = ({ items, onItemsChange, onEditItem }) => {
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
    return items.reduce((sum, item) => sum + Number(item.total_price), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Teklif Kalemleri</h3>
        <Button onClick={addItem} size="sm" variant="outline" className="dark:bg-gray-800 dark:hover:bg-gray-700">
          <Plus className="h-4 w-4 mr-2" />
          Kalem Ekle
        </Button>
      </div>
      
      <div className="border dark:border-gray-700 rounded-md overflow-hidden">
        <Table>
          <TableHeader className="dark:bg-gray-800">
            <TableRow>
              <TableHead className="w-[250px]">Ürün/Hizmet</TableHead>
              <TableHead>Adet</TableHead>
              <TableHead>Birim Fiyat</TableHead>
              <TableHead>Vergi %</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="dark:bg-gray-900">
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Henüz teklif kalemi eklenmemiş
                </TableCell>
              </TableRow>
            ) : (
              <>
                {items.map((item) => (
                  <TableRow key={item.id} className="dark:border-gray-700">
                    <TableCell>
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, "name", e.target.value)}
                        placeholder="Ürün/Hizmet adı"
                        className="max-w-[250px] dark:bg-gray-800 dark:border-gray-700"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value))}
                        className="w-20 dark:bg-gray-800 dark:border-gray-700"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value))}
                        className="w-28 dark:bg-gray-800 dark:border-gray-700"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.tax_rate}
                        onChange={(e) => updateItem(item.id, "tax_rate", parseFloat(e.target.value))}
                        className="w-20 dark:bg-gray-800 dark:border-gray-700"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(item.total_price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {onEditItem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditItem(item)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Düzenle</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Sil</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <div className="space-y-1 min-w-[200px] p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="flex justify-between text-sm">
            <span>Ara Toplam:</span>
            <span>{formatMoney(calculateSubtotal())}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Toplam:</span>
            <span>{formatMoney(calculateSubtotal())}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalFormItems;
