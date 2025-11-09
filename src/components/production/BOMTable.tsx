import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Package, MoreHorizontal, Edit, Trash2, Copy } from "lucide-react";
import { BOM } from "@/types/production";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface BOMTableProps {
  boms: BOM[];
  isLoading: boolean;
  onSelectBOM: (bom: BOM) => void;
  onEditBOM?: (bom: BOM) => void;
  onDeleteBOM?: (bomId: string) => void;
  onDuplicateBOM?: (bom: BOM) => void;
  searchQuery?: string;
}

const BOMTable = ({
  boms,
  isLoading,
  onSelectBOM,
  onEditBOM,
  onDeleteBOM,
  onDuplicateBOM,
  searchQuery
}: BOMTableProps) => {
  const filteredBOMs = boms.filter(bom => {
    const matchesSearch = !searchQuery || 
      bom.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bom.main_product_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Reçete Adı</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Ana Ürün</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Alt Ürün Sayısı</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Versiyon</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Durum</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Son Güncelleme</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (filteredBOMs.length === 0) {
    return (
              <div className="text-center py-12 text-muted-foreground">
        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Henüz ürün reçetesi kaydı bulunmuyor</p>
        <p className="text-sm mt-2">Yeni ürün reçetesi oluşturmak için üstteki butonu kullanın</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Reçete Adı</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Ana Ürün</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Alt Ürün Sayısı</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Versiyon</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Durum</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Son Güncelleme</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredBOMs.map((bom) => (
          <TableRow 
            key={bom.id}
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onSelectBOM(bom)}
          >
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                {bom.name}
              </div>
            </TableCell>
            <TableCell>
              {bom.main_product_name || bom.main_product?.name || '-'}
            </TableCell>
            <TableCell>
              {bom.items?.length || 0} ürün
            </TableCell>
            <TableCell>
              {bom.version || '-'}
            </TableCell>
            <TableCell>
              {bom.is_active ? (
                <Badge variant="outline" className="border-green-500 text-green-700">Aktif</Badge>
              ) : (
                <Badge variant="outline" className="border-gray-500 text-gray-700">Pasif</Badge>
              )}
            </TableCell>
            <TableCell>
              {bom.updated_at 
                ? format(new Date(bom.updated_at), "dd MMM yyyy", { locale: tr })
                : '-'}
            </TableCell>
            <TableCell className="text-center">
              <div className="flex justify-center items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                {onEditBOM && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditBOM(bom)}
                    className="h-8 w-8"
                    title="Düzenle"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                
                {onDeleteBOM && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Ürün reçetesini silmek istediğinizden emin misiniz?')) {
                        onDeleteBOM(bom.id);
                      }
                    }}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                
                {onDuplicateBOM && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                        title="Daha Fazla"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onDuplicateBOM(bom)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Kopyala
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BOMTable;

