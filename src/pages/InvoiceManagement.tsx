import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, FileText, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";
import { useIncomingInvoices } from "@/hooks/useIncomingInvoices";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface InvoiceManagementProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const InvoiceManagement = ({ isCollapsed, setIsCollapsed }: InvoiceManagementProps) => {
  const { invoices: salesInvoices, isLoading: salesLoading } = useSalesInvoices();
  
  const getCurrentMonthRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0]
    };
  };
  
  const currentMonth = getCurrentMonthRange();
  const { incomingInvoices, isLoading: incomingLoading } = useIncomingInvoices({ 
    startDate: currentMonth.start, 
    endDate: currentMonth.end 
  });

  // Satış faturaları istatistikleri
  const totalSalesInvoices = salesInvoices?.length || 0;
  const pendingSalesInvoices = salesInvoices?.filter(inv => inv.odeme_durumu === 'odenmedi').length || 0;
  const totalSalesAmount = salesInvoices?.reduce((sum, inv) => sum + (inv.toplam_tutar || 0), 0) || 0;
  const paidSalesAmount = salesInvoices?.reduce((sum, inv) => sum + (inv.odenen_tutar || 0), 0) || 0;
  const unpaidSalesAmount = totalSalesAmount - paidSalesAmount;

  // E-Fatura istatistikleri
  const totalIncomingInvoices = incomingInvoices?.length || 0;
  const totalIncomingAmount = incomingInvoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;

  // Son 5 satış faturası
  const recentSalesInvoices = salesInvoices?.slice(0, 5) || [];

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    color = "primary",
    isLoading = false 
  }: any) => (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${
        color === 'primary' ? 'from-primary/10 to-primary/5' :
        color === 'success' ? 'from-success/10 to-success/5' :
        color === 'warning' ? 'from-warning/10 to-warning/5' :
        'from-muted/10 to-muted/5'
      }`} />
      
      <CardContent className="relative p-6">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className={`p-2 rounded-lg bg-${color}/10 group-hover:scale-110 transition-transform`}>
                <Icon className={`h-5 w-5 text-${color}`} />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
              {subtitle && (
                <div className="flex items-center gap-1 text-sm">
                  {trend === 'up' && <TrendingUp className="h-3 w-3 text-success" />}
                  {trend === 'down' && <TrendingDown className="h-3 w-3 text-destructive" />}
                  <span className="text-muted-foreground">{subtitle}</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ title, icon: Icon, path, description }: any) => (
    <Link to={path}>
      <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-300" />
        <CardContent className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="p-3 rounded-xl bg-primary/10 w-fit group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <Icon className="h-6 w-6 text-primary group-hover:text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            Fatura Yönetimi
          </h1>
          <p className="text-lg text-muted-foreground">
            Tüm fatura işlemlerinizi tek yerden yönetin ve takip edin
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Toplam Satış Faturası"
            value={totalSalesInvoices}
            subtitle={`${pendingSalesInvoices} ödeme bekliyor`}
            icon={Receipt}
            color="primary"
            isLoading={salesLoading}
          />
          <StatCard
            title="Satış Tutarı"
            value={formatCurrency(totalSalesAmount, 'TRY')}
            subtitle="Toplam satış"
            icon={DollarSign}
            color="success"
            trend="up"
            isLoading={salesLoading}
          />
          <StatCard
            title="Bekleyen Tahsilat"
            value={formatCurrency(unpaidSalesAmount, 'TRY')}
            subtitle="Ödenmemiş tutar"
            icon={TrendingDown}
            color="warning"
            isLoading={salesLoading}
          />
          <StatCard
            title="E-Fatura (Bu Ay)"
            value={totalIncomingInvoices}
            subtitle={formatCurrency(totalIncomingAmount, 'TRY')}
            icon={FileText}
            color="primary"
            isLoading={incomingLoading}
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Hızlı İşlemler</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="Satış Faturaları"
              description="Müşteri faturalarını görüntüle"
              icon={Receipt}
              path="/sales-invoices"
            />
            <QuickActionCard
              title="Alış Faturaları"
              description="Tedarikçi faturalarını görüntüle"
              icon={Receipt}
              path="/purchase-invoices"
            />
            <QuickActionCard
              title="E-Fatura"
              description="E-fatura entegrasyonu"
              icon={FileText}
              path="/purchase/e-invoice"
            />
            <QuickActionCard
              title="Fatura Analizi"
              description="Detaylı raporlar ve analizler"
              icon={TrendingUp}
              path="/invoice-analysis"
            />
          </div>
        </div>

        {/* Recent Invoices */}
        {!salesLoading && recentSalesInvoices.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">Son Faturalar</h2>
              <Link to="/sales-invoices">
                <Button variant="ghost" className="gap-2">
                  Tümünü Gör
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {recentSalesInvoices.map((invoice) => (
                    <Link 
                      key={invoice.id} 
                      to={`/sales-invoices/${invoice.id}`}
                      className="block hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Receipt className="h-5 w-5 text-primary" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{invoice.fatura_no}</p>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                invoice.odeme_durumu === 'odendi' 
                                  ? 'bg-success/10 text-success'
                                  : invoice.odeme_durumu === 'kismi_odendi'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-destructive/10 text-destructive'
                              }`}>
                                {invoice.odeme_durumu === 'odendi' ? 'Ödendi' :
                                 invoice.odeme_durumu === 'kismi_odendi' ? 'Kısmi Ödendi' : 'Ödenmedi'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {invoice.customer?.name || invoice.customer?.company || 'Müşteri'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              {formatCurrency(invoice.toplam_tutar, invoice.para_birimi)}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(invoice.fatura_tarihi), 'dd MMM yyyy', { locale: tr })}
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceManagement;