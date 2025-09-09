
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatMoney } from "../constants";
import { PurchaseOrderStatus, PurchaseOrderItem } from "@/types/purchase";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Truck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PurchaseOrderItemsProps {
  items: PurchaseOrderItem[];
  currency: string;
  orderStatus: PurchaseOrderStatus;
  onItemsReceived: (items: { id: string, received_quantity: number }[]) => void;
}

const PurchaseOrderItems: React.FC<PurchaseOrderItemsProps> = ({ 
  items, 
  currency,
  orderStatus,
  onItemsReceived
}) => {
  const [receivingItems, setReceivingItems] = useState(false);
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
  
  const canReceiveItems = orderStatus === 'confirmed' || orderStatus === 'partially_received';
  
  const handleOpenReceiving = () => {
    const initialQuantities: Record<string, number> = {};
    items.forEach(item => {
      initialQuantities[item.id] = 0;
    });
    setReceivedQuantities(initialQuantities);
    setReceivingItems(true);
  };
  
  const handleQuantityChange = (id: string, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setReceivedQuantities(prev => ({
      ...prev,
      [id]: numValue
    }));
  };
  
  const handleSubmitReceive = () => {
    const itemsToUpdate = Object.keys(receivedQuantities)
      .filter(id => receivedQuantities[id] > 0)
      .map(id => ({
        id,
        received_quantity: receivedQuantities[id] + (
          items.find(item => item.id === id)?.received_quantity || 0
        )
      }));
    
    if (itemsToUpdate.length > 0) {
      onItemsReceived(itemsToUpdate);
    }
    
    setReceivingItems(false);
  };
  
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium">Sipariş Kalemleri</CardTitle>
            {canReceiveItems && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpenReceiving}
              >
                <Truck className="h-4 w-4 mr-2" />
                Ürün Alımı Kaydet
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün/Açıklama</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead className="text-right">Alınan</TableHead>
                <TableHead className="text-right">Birim</TableHead>
                <TableHead className="text-right">Birim Fiyat</TableHead>
                <TableHead className="text-right">KDV</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Sipariş kalemi bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">
                        {item.product_id || 'Ürün belirtilmemiş'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {item.received_quantity > 0 ? (
                        <Badge variant={
                          item.received_quantity >= item.quantity 
                            ? "secondary"
                            : "warning"
                        }>
                          {item.received_quantity}
                        </Badge>
                      ) : (
                        '0'
                      )}
                    </TableCell>
                    <TableCell className="text-right">{item.unit}</TableCell>
                    <TableCell className="text-right">{formatMoney(item.unit_price, currency)}</TableCell>
                    <TableCell className="text-right">%{item.tax_rate}</TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(item.total_price, currency)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={receivingItems} onOpenChange={setReceivingItems}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ürün Alımı Kaydet</DialogTitle>
            <DialogDescription>
              Teslim alınan ürün miktarlarını giriniz.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead className="text-right">Sipariş Miktar</TableHead>
                  <TableHead className="text-right">Alınan Miktar</TableHead>
                  <TableHead className="text-right">Yeni Alım</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="py-2">
                      <div className="font-medium">
                        {item.product_id || 'Ürün belirtilmemiş'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2">{item.quantity}</TableCell>
                    <TableCell className="text-right py-2">{item.received_quantity || 0}</TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number"
                        min="0"
                        max={item.quantity - (item.received_quantity || 0)}
                        value={receivedQuantities[item.id] || 0}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="w-16 h-8 px-2 text-right ml-auto"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceivingItems(false)}>
              İptal
            </Button>
            <Button onClick={handleSubmitReceive}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PurchaseOrderItems;
