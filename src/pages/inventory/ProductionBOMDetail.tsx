import React, { useState } from "react";
import { logger } from '@/utils/logger';
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Package, Layers, Calendar } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { BOM, BOMItem } from "@/types/production";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

const ProductionBOMDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: bom, isLoading } = useQuery({
    queryKey: ["bom", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("boms")
        .select(`
          *,
          items:bom_items(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as BOM;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (bomId: string) => {
      const { error } = await supabase
        .from("boms")
        .delete()
        .eq("id", bomId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reçete başarıyla silindi");
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      navigate("/production/boms");
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      logger.error("Delete error:", error);
      toast.error("Silme işlemi başarısız oldu");
      setIsDeleteDialogOpen(false);
    },
  });

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (id) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <div className="animate-pulse text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (!bom) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Reçete bulunamadı</h2>
        <Button variant="link" onClick={() => navigate("/production")}>
          Listeye Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/production")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="h-6 w-6 text-purple-600" />
              {bom.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Calendar className="h-3 w-3" />
              <span>Oluşturulma: {format(new Date(bom.created_at), "dd MMM yyyy", { locale: tr })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/production/bom/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Taraf: Genel Bilgiler */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Reçete Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">İlgili Ürün</label>
                <div className="mt-1 flex items-center gap-2 font-medium text-gray-900">
                  <Package className="h-4 w-4 text-gray-400" />
                  {bom.product_name || "Belirtilmemiş"}
                </div>
              </div>

              {bom.description && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</label>
                  <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {bom.description}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Toplam Bileşen</span>
                  <Badge variant="secondary">{bom.items?.length || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ Taraf: Malzeme Listesi */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Bileşenler / Malzemeler</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Malzeme Adı</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead>Birim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bom.items?.map((item: BOMItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                      <TableCell className="text-gray-500">{item.unit}</TableCell>
                    </TableRow>
                  ))}
                  {(!bom.items || bom.items.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Bu reçetede henüz bileşen bulunmuyor.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Reçeteyi Sil"
        description={
          bom
            ? `"${bom.name}" reçetesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : "Bu reçeteyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        }
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ProductionBOMDetail;

