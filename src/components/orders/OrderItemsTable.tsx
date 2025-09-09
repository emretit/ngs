
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ProposalItem } from "@/types/proposal";

interface OrderItemsTableProps {
  items: ProposalItem[];
  setItems: (items: ProposalItem[]) => void;
  currency: string;
}

const OrderItemsTable: React.FC<OrderItemsTableProps> = ({ items, setItems, currency }) => {
  // Format number for display
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleAddItem = () => {
    // In a real implementation, this would open a dialog to add a new product
    const newItem: ProposalItem = {
      id: Date.now().toString(),
      name: "Yeni ürün",
      description: "",
      quantity: 1,
      unit: "adet",
      unit_price: 0,
      tax_rate: 18,
      discount_rate: 0,
      total_price: 0,
      currency: currency,
    };
    
    setItems([...items, newItem]);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Sipariş Kalemleri</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün/Hizmet</TableHead>
              <TableHead className="text-right">Miktar</TableHead>
              <TableHead className="text-right">Birim Fiyat</TableHead>
              <TableHead className="text-right">KDV</TableHead>
              <TableHead className="text-right">İndirim</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  Henüz ürün eklenmemiş
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.unit_price)}</TableCell>
                  <TableCell className="text-right">%{item.tax_rate}</TableCell>
                  <TableCell className="text-right">%{item.discount_rate || 0}</TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(item.total_price)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-2" />
            Ürün Ekle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItemsTable;
