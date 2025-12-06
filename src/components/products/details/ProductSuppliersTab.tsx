import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, ExternalLink, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import { formatDate } from "@/utils/dateUtils";
import ProductTabSkeleton from "./ProductTabSkeleton";

interface ProductSuppliersTabProps {
  product: Product;
  onUpdate: (updates: Partial<Product>) => void;
}

export const ProductSuppliersTab = ({ product }: ProductSuppliersTabProps) => {
  const navigate = useNavigate();

  // suppliers alanı varsa ilk supplier'ı al
  const supplierId = product.suppliers?.id || null;

  const { data: supplier, isLoading: isLoadingSupplier } = useQuery({
    queryKey: ['product-supplier', supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });

  const { data: purchaseOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['product-supplier-orders', product.id],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('purchase_order_items')
        .select(`
          id,
          order_id,
          quantity,
          unit_price,
          line_total,
          tax_rate,
          created_at,
          purchase_orders (
            id,
            order_number,
            supplier_id,
            order_date,
            status,
            suppliers (
              id,
              name,
              company_name
            )
          )
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return orders || [];
    },
  });

  const isLoading = isLoadingSupplier || isLoadingOrders;

  if (isLoading) {
    return <ProductTabSkeleton columns={6} title="Tedarikçiler" />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            Tedarikçi Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          {supplier ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Tedarikçi</label>
                <p className="text-sm font-medium">{supplier.name || supplier.company_name || 'Tedarikçi Adı'}</p>
              </div>
              {supplier.email && (
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">E-posta</label>
                  <p className="text-sm">{supplier.email}</p>
                </div>
              )}
              {supplier.phone && (
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Telefon</label>
                  <p className="text-sm">{supplier.phone}</p>
                </div>
              )}
              {product.last_purchase_date && (
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Son Satın Alma Tarihi</label>
                  <p className="text-sm">{formatDate(product.last_purchase_date)}</p>
                </div>
              )}
              {supplier.id && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/suppliers/${supplier.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Tedarikçi Detayları
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">Bu ürün için tedarikçi bilgisi bulunmuyor.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/product-form/${product.id}`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tedarikçi Ekle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {purchaseOrders && purchaseOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Satın Alma Geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {purchaseOrders.map((item: any) => {
                const order = item.purchase_orders;
                const supplier = order?.suppliers;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/purchasing/orders/${order?.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{order?.order_number || 'N/A'}</span>
                        {order?.status && (
                          <Badge variant="outline" className="text-xs">
                            {order.status}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        {supplier?.company_name || supplier?.name || 'Tedarikçi'} • {item.quantity} adet • {formatCurrency(item.unit_price, 'TRY')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {order?.order_date ? formatDate(order.order_date) : formatDate(item.created_at)}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

