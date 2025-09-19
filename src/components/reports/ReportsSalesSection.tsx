import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, TrendingUp, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReportsSalesSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

export default function ReportsSalesSection({ isExpanded, onToggle, searchParams }: ReportsSalesSectionProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const { data: pipelineData } = useQuery({
    queryKey: ['salesPipeline', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('opportunities')
        .select('*');
        
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      
      const { data } = await query;
      return data || [];
    },
    enabled: isExpanded
  });

  const { data: winRateData } = useQuery({
    queryKey: ['winRate', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('proposals')
        .select('status');
        
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      
      const { data } = await query;
      if (!data || data.length === 0) return { total: 0, won: 0, rate: 0 };
      
      const won = data.filter(p => p.status === 'accepted').length;
      const total = data.length;
      return { total, won, rate: (won / total) * 100 };
    },
    enabled: isExpanded
  });

  const { data: topProducts } = useQuery({
    queryKey: ['topProducts', startDate, endDate],
    queryFn: async () => {
      // Note: This would need order_items table to properly calculate
      // For now, showing products with highest quantity
      const { data } = await supabase
        .from('products')
        .select('name, quantity, price')
        .order('quantity', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: isExpanded
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Satış & CRM Raporları
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pipeline Status */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Pipeline Durumu
              </h4>
              <div className="space-y-2">
                {pipelineData?.slice(0, 5).map((opportunity, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm">{opportunity.title}</span>
                    <span className="text-sm font-medium">₺{(opportunity.value || 0).toLocaleString()}</span>
                  </div>
                ))}
                {!pipelineData?.length && (
                  <p className="text-sm text-muted-foreground">Veri bulunamadı</p>
                )}
              </div>
            </div>

            {/* Win Rate */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Kazanma Oranı
              </h4>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {winRateData?.rate.toFixed(1) || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {winRateData?.won || 0} / {winRateData?.total || 0} teklif kazanıldı
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div>
              <h4 className="font-semibold mb-3">En Çok Satılan Ürünler</h4>
              <div className="space-y-2">
                {topProducts?.map((product, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm">{product.name}</span>
                    <span className="text-sm font-medium">{product.quantity} adet</span>
                  </div>
                ))}
                {!topProducts?.length && (
                  <p className="text-sm text-muted-foreground">Veri bulunamadı</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}