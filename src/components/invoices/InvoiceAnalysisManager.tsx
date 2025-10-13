import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const InvoiceAnalysisManager = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  // Satış faturaları
  const { 
    invoices: salesInvoices, 
    isLoading: isLoadingSales 
  } = useSalesInvoices();
  
  // Alış faturaları
  const { 
    invoices: purchaseInvoices, 
    isLoading: isLoadingPurchase 
  } = usePurchaseInvoices();

  const isLoading = isLoadingSales || isLoadingPurchase;

  // Filtrelenmiş veriler
  const getFilteredInvoices = (invoices: any[]) => {
    if (!invoices) return [];
    
    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date || invoice.created_at);
      const invoiceYear = invoiceDate.getFullYear();
      const invoiceMonth = invoiceDate.getMonth() + 1;
      
      if (selectedPeriod === "year") {
        return invoiceYear === selectedYear;
      } else {
        return invoiceYear === selectedYear && invoiceMonth === selectedMonth;
      }
    });
  };

  const filteredSalesInvoices = getFilteredInvoices(salesInvoices || []);
  const filteredPurchaseInvoices = getFilteredInvoices(purchaseInvoices || []);

  // Analiz verileri
  const getAnalysisData = () => {
    const totalSales = filteredSalesInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
    const totalPurchases = filteredPurchaseInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
    const netAmount = totalSales - totalPurchases;
    
    const salesCount = filteredSalesInvoices.length;
    const purchaseCount = filteredPurchaseInvoices.length;
    
    const avgSalesAmount = salesCount > 0 ? totalSales / salesCount : 0;
    const avgPurchaseAmount = purchaseCount > 0 ? totalPurchases / purchaseCount : 0;

    return {
      totalSales,
      totalPurchases,
      netAmount,
      salesCount,
      purchaseCount,
      avgSalesAmount,
      avgPurchaseAmount
    };
  };

  const analysisData = getAnalysisData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPeriodLabel = () => {
    if (selectedPeriod === "year") {
      return selectedYear.toString();
    } else {
      const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      return `${monthNames[selectedMonth - 1]} ${selectedYear}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Fatura verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtreler:</span>
        </div>
        
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Aylık</SelectItem>
            <SelectItem value="year">Yıllık</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-32">
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
            <SelectTrigger className="w-32">
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

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Toplam Satış</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analysisData.totalSales)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {analysisData.salesCount} fatura
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Toplam Alış</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(analysisData.totalPurchases)}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {analysisData.purchaseCount} fatura
            </p>
          </CardContent>
        </Card>

        <Card className={`${analysisData.netAmount >= 0 ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${analysisData.netAmount >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              Net Tutar
            </CardTitle>
            <DollarSign className={`h-4 w-4 ${analysisData.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analysisData.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatCurrency(analysisData.netAmount)}
            </div>
            <p className={`text-xs mt-1 ${analysisData.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {analysisData.netAmount >= 0 ? 'Pozitif' : 'Negatif'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Ortalama Satış</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(analysisData.avgSalesAmount)}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Fatura başına
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detaylı Analiz */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Satış Faturaları Analizi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Toplam Fatura Sayısı:</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {analysisData.salesCount}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Toplam Tutar:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(analysisData.totalSales)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ortalama Tutar:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(analysisData.avgSalesAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600" />
              Alış Faturaları Analizi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Toplam Fatura Sayısı:</span>
                <Badge variant="outline" className="text-red-600 border-red-200">
                  {analysisData.purchaseCount}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Toplam Tutar:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(analysisData.totalPurchases)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ortalama Tutar:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(analysisData.avgPurchaseAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dönem Bilgisi */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">
                Analiz Dönemi: {getPeriodLabel()}
              </span>
            </div>
            <Button variant="outline" size="sm" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
              <Download className="h-4 w-4 mr-2" />
              Rapor İndir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceAnalysisManager;
