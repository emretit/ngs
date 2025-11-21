import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Package, CheckCircle2, XCircle } from "lucide-react";
import { BOM } from "@/types/production";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface BOMsGridProps {
  boms: BOM[];
  isLoading: boolean;
  onBOMClick?: (bom: BOM) => void;
  searchQuery?: string;
}

const BOMsGrid = ({
  boms,
  isLoading,
  onBOMClick,
  searchQuery
}: BOMsGridProps) => {
  const navigate = useNavigate();

  const filteredBOMs = boms.filter(bom => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bom.name?.toLowerCase().includes(query) ||
      bom.product_name?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-[200px] w-full rounded-md mb-4" />
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredBOMs.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-muted-foreground">
        <Settings className="h-12 w-12 mb-4 opacity-50" />
        <p>Henüz ürün reçetesi kaydı bulunmuyor</p>
        <p className="text-sm mt-2">Yeni ürün reçetesi oluşturmak için üstteki butonu kullanın</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {filteredBOMs.map((bom) => (
        <Card 
          key={bom.id}
          className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
          onClick={() => {
            if (onBOMClick) {
              onBOMClick(bom);
            } else {
              navigate(`/production/bom/${bom.id}`);
            }
          }}
        >
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                    {bom.name}
                  </h3>
                </div>
              </div>
            </div>

            {/* Ana Ürün */}
            <div className="mb-3 p-2 bg-gray-50 rounded-md border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500">Ana Ürün</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {bom.product_name || 'Ürün Adı Yok'}
              </p>
            </div>

            {/* Alt Ürün Sayısı */}
            <div className="mb-3">
              <span className="text-xs text-gray-500">Alt Ürün Sayısı:</span>
              <span className="ml-2 text-sm font-semibold text-gray-900">
                {bom.items?.length || 0} ürün
              </span>
            </div>

            {/* Son Güncelleme */}
            {bom.updated_at && (
              <div className="text-xs text-gray-500 border-t pt-2 mt-2">
                <span>Son Güncelleme: {format(new Date(bom.updated_at), 'dd MMM yyyy', { locale: tr })}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BOMsGrid;

