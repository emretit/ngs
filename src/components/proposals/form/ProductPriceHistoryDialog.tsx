import React, { useState, useEffect, useMemo } from "react";
import { logger } from '@/utils/logger';
import { UnifiedDialog } from "@/components/ui/unified-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import { History, FileText, ShoppingCart, TrendingUp, Search, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface PriceHistoryItem {
  id: string;
  type: "proposal" | "purchase" | "sales";
  document_number?: string;
  date: string;
  unit_price: number;
  quantity: number;
  currency: string;
  total: number;
  customer_name?: string;
  supplier_name?: string;
}

interface ProductPriceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}

const ProductPriceHistoryDialog: React.FC<ProductPriceHistoryDialogProps> = ({
  open,
  onOpenChange,
  productId,
  productName,
}) => {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (open && productId) {
      fetchPriceHistory();
    }
  }, [open, productId]);

  const fetchPriceHistory = async () => {
    setIsLoading(true);
    try {
      const historyItems: PriceHistoryItem[] = [];

      // Tekliflerden fiyatları çek (items JSONB içinden)
      const { data: proposals, error: proposalError } = await supabase
        .from("proposals")
        .select(`
          id,
          number,
          created_at,
          items,
          customer:customers (
            name
          )
        `)
        .not("items", "is", null)
        .order("created_at", { ascending: false });

      if (proposalError) {
        logger.error("Proposals error:", proposalError);
      } else if (proposals) {
        proposals.forEach((proposal: any) => {
          // items JSONB'den ürünü bul
          if (proposal.items && Array.isArray(proposal.items)) {
            proposal.items.forEach((item: any, index: number) => {
              // product_id varsa onu kontrol et, yoksa name ile eşleşme yapabiliriz
              if (item.product_id === productId || (!item.product_id && item.name)) {
                // Eğer product_id yoksa, product name ile eşleşme yapmak için product bilgisini çekmemiz gerekir
                // Şimdilik sadece product_id olanları alalım
                if (item.product_id === productId) {
                  historyItems.push({
                    id: `${proposal.id}-${item.id || index}`,
                    type: "proposal",
                    document_number: proposal.number,
                    date: proposal.created_at,
                    unit_price: Number(item.unit_price) || 0,
                    quantity: Number(item.quantity) || 0,
                    currency: item.currency || "TRY",
                    total: Number(item.total_price) || (Number(item.unit_price) || 0) * (Number(item.quantity) || 0),
                    customer_name: proposal.customer?.name,
                  });
                }
              }
            });
          }
        });
      }

      // Alış faturalarından fiyatları çek
      const { data: purchaseItems, error: purchaseError } = await supabase
        .from("purchase_invoice_items")
        .select(`
          id,
          unit_price,
          quantity,
          line_total,
          created_at,
          purchase_invoices (
            id,
            invoice_number,
            invoice_date,
            created_at,
            currency,
            supplier_id
          )
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (purchaseError) {
        logger.error("Purchase invoice items error:", purchaseError);
      } else if (purchaseItems && purchaseItems.length > 0) {
        // Supplier bilgilerini ayrı çek
        const supplierIds = purchaseItems
          .map((item: any) => item.purchase_invoices?.supplier_id)
          .filter(Boolean);
        
        let suppliersMap: Record<string, string> = {};
        if (supplierIds.length > 0) {
          const { data: suppliers } = await supabase
            .from("customers")
            .select("id, name")
            .in("id", supplierIds);
          
          if (suppliers) {
            suppliers.forEach((s: any) => {
              suppliersMap[s.id] = s.name;
            });
          }
        }

        purchaseItems.forEach((item: any) => {
          if (item.purchase_invoices) {
            historyItems.push({
              id: item.id,
              type: "purchase",
              document_number: item.purchase_invoices.invoice_number,
              date: item.purchase_invoices.invoice_date || item.purchase_invoices.created_at,
              unit_price: Number(item.unit_price) || 0,
              quantity: Number(item.quantity) || 0,
              currency: item.purchase_invoices.currency || "TL",
              total: Number(item.line_total) || 0,
              supplier_name: item.purchase_invoices.supplier_id ? suppliersMap[item.purchase_invoices.supplier_id] : undefined,
            });
          }
        });
      }

      // Satış faturalarından fiyatları çek
      const { data: salesItems, error: salesError } = await supabase
        .from("sales_invoice_items")
        .select(`
          id,
          birim_fiyat,
          miktar,
          satir_toplami,
          para_birimi,
          sales_invoices (
            id,
            fatura_no,
            fatura_tarihi,
            created_at,
            customer:customers (
              name
            )
          )
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (salesError) {
        logger.error("Sales invoice items error:", salesError);
      } else if (salesItems) {
        salesItems.forEach((item: any) => {
          if (item.sales_invoices) {
            historyItems.push({
              id: item.id,
              type: "sales",
              document_number: item.sales_invoices.fatura_no,
              date: item.sales_invoices.fatura_tarihi || item.sales_invoices.created_at,
              unit_price: item.birim_fiyat || 0,
              quantity: item.miktar || 0,
              currency: item.para_birimi || "TL",
              total: item.satir_toplami || 0,
              customer_name: item.sales_invoices.customer?.name,
            });
          }
        });
      }

      // Tarihe göre sırala (en yeni en üstte)
      historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      logger.debug("Price history items:", historyItems);
      logger.debug("Product ID:", productId);
      
      setPriceHistory(historyItems);
    } catch (error) {
      logger.error("Error fetching price history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "proposal":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "purchase":
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case "sales":
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "proposal":
        return "Teklif";
      case "purchase":
        return "Alış Faturası";
      case "sales":
        return "Satış Faturası";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "proposal":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "purchase":
        return "bg-green-50 text-green-700 border-green-200";
      case "sales":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Filtrelenmiş fiyat geçmişi
  const filteredPriceHistory = useMemo(() => {
    return priceHistory.filter((item) => {
      // Belge tipi filtresi
      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false;
      }

      // Arama filtresi
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesDocumentNumber = item.document_number?.toLowerCase().includes(query);
        const matchesCustomer = item.customer_name?.toLowerCase().includes(query);
        const matchesSupplier = item.supplier_name?.toLowerCase().includes(query);
        const matchesPrice = item.unit_price.toString().includes(query);
        
        if (!matchesDocumentNumber && !matchesCustomer && !matchesSupplier && !matchesPrice) {
          return false;
        }
      }

      return true;
    });
  }, [priceHistory, typeFilter, searchQuery]);

  const hasActiveFilters = typeFilter !== "all" || searchQuery;

  const clearFilters = () => {
    setTypeFilter("all");
    setSearchQuery("");
  };

  return (
    <UnifiedDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={`Fiyat Geçmişi - ${productName}`}
      maxWidth="2xl"
      headerColor="blue"
    >
      <div className="space-y-3">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Belge no, müşteri/tedarikçi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-7 text-xs"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-7 text-xs">
              <Filter className="mr-1.5 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hepsi</SelectItem>
              <SelectItem value="proposal">Teklif</SelectItem>
              <SelectItem value="purchase">Alış Faturası</SelectItem>
              <SelectItem value="sales">Satış Faturası</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Temizle
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Yükleniyor...</div>
          </div>
        ) : filteredPriceHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <History className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {priceHistory.length === 0
                ? "Bu ürün için fiyat geçmişi bulunamadı."
                : "Filtre kriterlerine uygun kayıt bulunamadı."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPriceHistory.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border ${getTypeColor(item.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">{getTypeIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">
                          {getTypeLabel(item.type)}
                        </span>
                        {item.document_number && (
                          <span className="text-xs text-muted-foreground">
                            #{item.document_number}
                          </span>
                        )}
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Tarih:</span>
                          <span>
                            {format(new Date(item.date), "dd MMM yyyy", { locale: tr })}
                          </span>
                        </div>
                        {(item.customer_name || item.supplier_name) && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {item.type === "purchase" ? "Tedarikçi:" : "Müşteri:"}
                            </span>
                            <span>{item.customer_name || item.supplier_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold mb-1">
                      {formatCurrency(item.unit_price, item.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>
                        {item.quantity} adet
                      </div>
                      <div className="font-medium">
                        Toplam: {formatCurrency(item.total, item.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredPriceHistory.length > 0 && priceHistory.length !== filteredPriceHistory.length && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                {filteredPriceHistory.length} / {priceHistory.length} kayıt gösteriliyor
              </div>
            )}
          </div>
        )}
      </div>
    </UnifiedDialog>
  );
};

export default ProductPriceHistoryDialog;

