
import { Card, CardContent } from "@/components/ui/card";
import { Tag } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ProductMetaProps {
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

const ProductMeta = ({ 
  createdAt, 
  updatedAt,
  isActive
}: ProductMetaProps) => {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-4">
        <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Ek Bilgiler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Durum</label>
            <p className="mt-1">
              <Badge variant={isActive ? "default" : "secondary"} className="h-6 px-2 text-[11px]">
                {isActive ? "Aktif" : "Pasif"}
              </Badge>
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500">Oluşturulma</label>
            <p className="mt-1 text-sm">{format(new Date(createdAt), 'dd.MM.yyyy HH:mm')}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500">Son Güncelleme</label>
            <p className="mt-1 text-sm">{format(new Date(updatedAt), 'dd.MM.yyyy HH:mm')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductMeta;
