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
import { Settings, Package, MoreHorizontal, Edit, Trash2, Copy, Layers, FileText } from "lucide-react";
import { BOM } from "@/types/production";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
      bom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bom.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bom.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Reçete Adı</TableHead>
            <TableHead>İlgili Ürün</TableHead>
            <TableHead>Bileşen Sayısı</TableHead>
            <TableHead>Oluşturulma Tarihi</TableHead>
            <TableHead className="text-center">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
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
    <div className="rounded-md border border-gray-200">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="font-semibold w-[300px]">Reçete Adı</TableHead>
            <TableHead className="font-semibold">İlgili Ürün</TableHead>
            <TableHead className="font-semibold">Bileşen Sayısı</TableHead>
            <TableHead className="font-semibold">Oluşturulma Tarihi</TableHead>
            <TableHead className="font-semibold text-center">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBOMs.map((bom) => (
            <TableRow 
              key={bom.id}
              className="cursor-pointer hover:bg-gray-50/80 transition-colors"
              onClick={() => onSelectBOM(bom)}
            >
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">{bom.name}</span>
                  </div>
                  {bom.description && (
                    <div className="text-xs text-muted-foreground mt-1 pl-6 truncate max-w-[250px]">
                      {bom.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-gray-700">
                  <Package className="h-4 w-4 text-gray-400" />
                  {bom.product_name || '-'}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                  {bom.items?.length || 0} bileşen
                </Badge>
              </TableCell>
              <TableCell className="text-gray-600 text-sm">
                {format(new Date(bom.created_at), "dd MMM yyyy", { locale: tr })}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {onEditBOM && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditBOM(bom)}
                      className="h-8 w-8 text-gray-500 hover:text-primary hover:bg-primary/10"
                      title="Düzenle"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {onDuplicateBOM && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicateBOM(bom); }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Kopyala
                        </DropdownMenuItem>
                      )}
                      {onDeleteBOM && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Ürün reçetesini silmek istediğinizden emin misiniz?')) {
                              onDeleteBOM(bom.id);
                            }
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Sil
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BOMTable;
