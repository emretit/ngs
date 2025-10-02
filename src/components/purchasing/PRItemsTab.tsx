import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { PurchaseRequestItem } from "@/types/purchasing";

interface PRItemsTabProps {
  requestId: string;
  items: PurchaseRequestItem[];
  isEditable: boolean;
}

export function PRItemsTab({ items, isEditable }: PRItemsTabProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Henüz kalem eklenmemiş
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Açıklama</TableHead>
              <TableHead className="text-right">Miktar</TableHead>
              <TableHead>Birim</TableHead>
              <TableHead className="text-right">Birim Fiyat</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.description}</p>
                    {item.product && (
                      <p className="text-sm text-muted-foreground">
                        {item.product.code} - {item.product.name}
                      </p>
                    )}
                    {item.notes && <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>}
                  </div>
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell>{item.uom}</TableCell>
                <TableCell className="text-right">
                  {item.estimated_price ? `₺${item.estimated_price.toFixed(2)}` : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {item.estimated_price ? `₺${(item.estimated_price * item.quantity).toFixed(2)}` : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
