
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
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
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
            <Settings className="h-4 w-4 text-purple-600" />
          </div>
          Ek Bilgiler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Durum</label>
            <div className="mt-1">
              <Badge variant={isActive ? "default" : "secondary"} className="h-6 px-2 text-[11px]">
                {isActive ? "Aktif" : "Pasif"}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Oluşturulma</label>
            <p className="text-sm">{format(new Date(createdAt), 'dd.MM.yyyy HH:mm')}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Son Güncelleme</label>
            <p className="text-sm">{format(new Date(updatedAt), 'dd.MM.yyyy HH:mm')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductMeta;
