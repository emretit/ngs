import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  DollarSign, 
  Clock,
  Users,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const InvoiceAnalysisManager = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  const { invoices: salesInvoices, isLoading: isLoadingSales } = useSalesInvoices();
  const { invoices: purchaseInvoices, isLoading: isLoadingPurchase } = usePurchaseInvoices();

  const isLoading = isLoadingSales || isLoadingPurchase;

  const getFilteredInvoices = (invoices: any[], dateField: string) => {
    if (!invoices) return [];
    
    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice[dateField] || invoice.created_at);
      const invoiceYear = invoiceDate.getFullYear();
      const invoiceMonth = invoiceDate.getMonth() + 1;
      
      if (selectedPeriod === "year") {
        return invoiceYear === selectedYear;
      } else {
        return invoiceYear === selectedYear && invoiceMonth === selectedMonth;
      }
    });
  };

  const filteredSalesInvoices = getFilteredInvoices(salesInvoices || [], 'fatura_tarihi');
  const filteredPurchaseInvoices = getFilteredInvoices(purchaseInvoices || [], 'invoice_date');

  // Gelişmiş analiz verileri
  const analysisData = useMemo(() => {
    const totalSales = filteredSalesInvoices.reduce((sum: number, inv: any) => sum + (inv.toplam_tutar || 0), 0);
    const totalPurchases = filteredPurchaseInvoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);
    
    // KDV hesaplamaları - SalesInvoice'ta kdv_tutari var, PurchaseInvoice'ta tax_amount
    const salesVat = filteredSalesInvoices.reduce((sum: number, inv: any) => sum + (inv.kdv_tutari || 0), 0);
    const purchaseVat = filteredPurchaseInvoices.reduce((sum: number, inv: any) => sum + (inv.tax_amount || 0), 0);
    const vatDifference = salesVat - purchaseVat;

    // Karlılık
    const grossProfit = totalSales - totalPurchases;
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    // İade ve iskonto
    const receivedReturns = filteredPurchaseInvoices.filter((inv: any) => inv.document_type === 'iade').length;
    const givenReturns = filteredSalesInvoices.filter((inv: any) => inv.document_type === 'iade').length;
    const totalDiscount = filteredSalesInvoices.reduce((sum: number, inv: any) => sum + (inv.indirim_tutari || 0), 0);

    // Ödeme performansı - SalesInvoice için odeme_durumu kullanılır
    const paidOnTime = filteredSalesInvoices.filter((inv: any) => 
      inv.odeme_durumu === 'odendi' && inv.vade_tarihi && new Date(inv.fatura_tarihi) <= new Date(inv.vade_tarihi)
    ).length;
    const totalPaidInvoices = filteredSalesInvoices.filter((inv: any) => inv.odeme_durumu === 'odendi').length;
    const onTimePaymentRate = totalPaidInvoices > 0 ? (paidOnTime / totalPaidInvoices) * 100 : 0;
    const overdueInvoices = filteredSalesInvoices.filter((inv: any) => 
      inv.odeme_durumu !== 'odendi' && inv.vade_tarihi && new Date(inv.vade_tarihi) < new Date()
    ).length;

    // Müşteri/Tedarikçi analizi
    const customerSales = filteredSalesInvoices.reduce((acc: Record<string, number>, inv: any) => {
      const key = inv.customer?.name || 'Bilinmeyen';
      acc[key] = (acc[key] || 0) + (inv.toplam_tutar || 0);
      return acc;
    }, {} as Record<string, number>);

    const supplierPurchases = filteredPurchaseInvoices.reduce((acc: Record<string, number>, inv: any) => {
      const key = inv.supplier?.name || 'Bilinmeyen';
      acc[key] = (acc[key] || 0) + (inv.total_amount || 0);
      return acc;
    }, {} as Record<string, number>);

    const topCustomers = Object.entries(customerSales)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount: amount as number }));

    const topSuppliers = Object.entries(supplierPurchases)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount: amount as number }));

    return {
      salesVat,
      purchaseVat,
      vatDifference,
      grossProfit,
      profitMargin,
      receivedReturns,
      givenReturns,
      totalDiscount,
      onTimePaymentRate,
      overdueInvoices,
      topCustomers,
      topSuppliers
    };
  }, [filteredSalesInvoices, filteredPurchaseInvoices]);

  // Son 6 ay trendi
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const monthSales = (salesInvoices || [])
        .filter((inv: any) => {
          const invDate = new Date(inv.fatura_tarihi || inv.created_at);
          return invDate.getFullYear() === year && invDate.getMonth() + 1 === month;
        })
        .reduce((sum: number, inv: any) => sum + (inv.toplam_tutar || 0), 0);

      const monthPurchases = (purchaseInvoices || [])
        .filter((inv: any) => {
          const invDate = new Date(inv.invoice_date || inv.created_at);
          return invDate.getFullYear() === year && invDate.getMonth() + 1 === month;
        })
        .reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

      months.push({
        name: format(date, 'MMM', { locale: tr }),
        satış: Math.round(monthSales / 1000),
        alış: Math.round(monthPurchases / 1000),
        kar: Math.round((monthSales - monthPurchases) / 1000)
      });
    }
    return months;
  }, [salesInvoices, purchaseInvoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Filters Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtreler:</span>
        </div>
        
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Aylık</SelectItem>
            <SelectItem value="year">Yıllık</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-32 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPeriod === "month" && (
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-32 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <SelectItem key={month} value={month.toString()}>
                  {format(new Date(2024, month - 1, 1), 'MMMM', { locale: tr })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* KDV Analizi */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-violet-500 rounded-full"></div>
          KDV Analizi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Alış KDV</CardTitle>
              <TrendingDown className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(analysisData.purchaseVat)}
              </div>
              <p className="text-xs text-purple-600/70 mt-1">İndirilecek KDV</p>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-violet-700">Satış KDV</CardTitle>
              <TrendingUp className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-600">
                {formatCurrency(analysisData.salesVat)}
              </div>
              <p className="text-xs text-violet-600/70 mt-1">Hesaplanan KDV</p>
            </CardContent>
          </Card>

          <Card className={`${analysisData.vatDifference >= 0 ? 'border-purple-300 bg-gradient-to-br from-purple-100 to-violet-100' : 'border-blue-300 bg-gradient-to-br from-blue-100 to-cyan-100'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${analysisData.vatDifference >= 0 ? 'text-purple-800' : 'text-blue-800'}`}>
                KDV Farkı
              </CardTitle>
              <DollarSign className={`h-4 w-4 ${analysisData.vatDifference >= 0 ? 'text-purple-700' : 'text-blue-700'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${analysisData.vatDifference >= 0 ? 'text-purple-700' : 'text-blue-700'}`}>
                {formatCurrency(Math.abs(analysisData.vatDifference))}
              </div>
              <p className={`text-xs mt-1 ${analysisData.vatDifference >= 0 ? 'text-purple-700/70' : 'text-blue-700/70'}`}>
                {analysisData.vatDifference >= 0 ? 'Ödenecek' : 'İade Alınacak'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Karlılık Analizi */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full"></div>
          Karlılık Analizi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={`${analysisData.grossProfit >= 0 ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50' : 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${analysisData.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                Brüt Kar/Zarar
              </CardTitle>
              {analysisData.grossProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${analysisData.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(analysisData.grossProfit))}
              </div>
              <p className={`text-xs mt-1 ${analysisData.grossProfit >= 0 ? 'text-emerald-600/70' : 'text-red-600/70'}`}>
                {analysisData.grossProfit >= 0 ? 'Kar' : 'Zarar'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Kar Marjı</CardTitle>
              <Percent className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                %{analysisData.profitMargin.toFixed(1)}
              </div>
              <p className="text-xs text-green-600/70 mt-1">Satış üzerinden</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">Dönem Durumu</CardTitle>
              {analysisData.grossProfit >= 0 ? (
                <CheckCircle2 className="h-4 w-4 text-amber-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {analysisData.grossProfit >= 0 ? 'Pozitif' : 'Negatif'}
              </div>
              <p className="text-xs text-amber-600/70 mt-1">Genel durum</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* İade ve İskonto Analizi */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
          İade ve İskonto Analizi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Alınan İadeler</CardTitle>
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {analysisData.receivedReturns}
              </div>
              <p className="text-xs text-blue-600/70 mt-1">Adet</p>
            </CardContent>
          </Card>

          <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-700">Verilen İadeler</CardTitle>
              <TrendingUp className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">
                {analysisData.givenReturns}
              </div>
              <p className="text-xs text-cyan-600/70 mt-1">Adet</p>
            </CardContent>
          </Card>

          <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-sky-700">Toplam İskonto</CardTitle>
              <Percent className="h-4 w-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-600">
                {formatCurrency(analysisData.totalDiscount)}
              </div>
              <p className="text-xs text-sky-600/70 mt-1">İndirim tutarı</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ödeme Performans Analizi */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
          Ödeme Performans Analizi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700">Zamanında Ödeme</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                %{analysisData.onTimePaymentRate.toFixed(1)}
              </div>
              <p className="text-xs text-indigo-600/70 mt-1">Ödeme oranı</p>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-violet-700">Ortalama Süre</CardTitle>
              <Clock className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-600">
                ~30 gün
              </div>
              <p className="text-xs text-violet-600/70 mt-1">Ödeme süresi</p>
            </CardContent>
          </Card>

          <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-red-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-rose-700">Gecikmiş Ödemeler</CardTitle>
              <XCircle className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">
                {analysisData.overdueInvoices}
              </div>
              <p className="text-xs text-rose-600/70 mt-1">Adet fatura</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Müşteri/Tedarikçi Analizi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Users className="h-5 w-5 text-green-600" />
              En Çok Satış Yapılan 5 Müşteri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisData.topCustomers.map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center bg-white text-green-600 border-green-200">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium text-gray-700">{customer.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(customer.amount)}
                  </span>
                </div>
              ))}
              {analysisData.topCustomers.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Müşteri verisi bulunamadı</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Users className="h-5 w-5 text-blue-600" />
              En Çok Alış Yapılan 5 Tedarikçi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisData.topSuppliers.map((supplier, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center bg-white text-blue-600 border-blue-200">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium text-gray-700">{supplier.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    {formatCurrency(supplier.amount)}
                  </span>
                </div>
              ))}
              {analysisData.topSuppliers.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Tedarikçi verisi bulunamadı</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Grafikleri */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
          Son 6 Ay Trendi
        </h3>
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Satış, Alış ve Kar Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value: any) => [`${value}K ₺`, '']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="satış" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Satış"
                />
                <Line 
                  type="monotone" 
                  dataKey="alış" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Alış"
                />
                <Line 
                  type="monotone" 
                  dataKey="kar" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  name="Kar/Zarar"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 text-center mt-2">* Tutarlar bin TRY cinsinden gösterilmektedir</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceAnalysisManager;
