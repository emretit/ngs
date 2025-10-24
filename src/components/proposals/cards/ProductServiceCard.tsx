import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import ProposalItemsTable from "@/components/proposals/form/items/ProposalItemsTable";

interface ProposalItem {
  id?: string;
  row_number: number;
  product_id?: string;
  product_name?: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_percentage: number;
  discount_percentage: number;
  total_amount: number;
}

interface ProductServiceCardProps {
  items: ProposalItem[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: string, value: any) => void;
  onMoveItemUp?: (index: number) => void;
  onMoveItemDown?: (index: number) => void;
  loading?: boolean;
}

const ProductServiceCard: React.FC<ProductServiceCardProps> = ({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onMoveItemUp,
  onMoveItemDown,
  loading = false
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
            Ürün/Hizmet Listesi
          </CardTitle>
          <Button
            onClick={onAddItem}
            disabled={loading}
            className="gap-2 px-3 py-1.5 h-8 text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold rounded-xl"
          >
            <Plus className="h-3 w-3" />
            Satır Ekle
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <ProposalItemsTable
          items={items}
          onRemoveItem={onRemoveItem}
          onUpdateItem={onUpdateItem}
          onMoveItemUp={onMoveItemUp}
          onMoveItemDown={onMoveItemDown}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
};

export default ProductServiceCard;
