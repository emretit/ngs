import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Calculator } from "lucide-react";
import { useInvoiceAnalysis } from "@/hooks/useInvoiceAnalysis";
import { useToast } from "@/components/ui/use-toast";

const InvoiceAnalysisTable = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [matrixData, setMatrixData] = useState<Record<string, Record<number, number>>>({});
  const [loading, setLoading] = useState(false);
  const { data, upsertInvoiceAnalysis, getDataForMonth, loading: dataLoading } = useInvoiceAnalysis(selectedYear);
  const { toast } = useToast();

  // Auto-save timeout
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const MONTHS = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const FIELDS = [
    { key: 'purchase_invoice', label: 'Alış Faturası', editable: true },
    { key: 'purchase_vat', label: 'Alış KDV (%20)', editable: false },
    { key: 'sales_invoice', label: 'Satış Faturası', editable: true },
    { key: 'sales_vat', label: 'Satış KDV (%20)', editable: false },
    { key: 'vat_difference', label: 'Fark KDV', editable: false }
  ];

  // Transform data from hook to matrix format
  useEffect(() => {
    const matrix: Record<string, Record<number, number>> = {};
    
    FIELDS.forEach(field => {
      matrix[field.key] = {};
      MONTHS.forEach((_, monthIndex) => {
        const month = monthIndex + 1;
        const monthData = getDataForMonth(selectedYear, month);
        matrix[field.key][month] = monthData?.[field.key as keyof typeof monthData] as number || 0;
      });
    });

    setMatrixData(matrix);
  }, [data, selectedYear]);

  // Auto-save cell value with debounce
  const handleCellChange = (field: string, month: number, value: string) => {
    const amount = parseFloat(value) || 0;
    
    // Get current values for this month to preserve existing data
    const currentPurchaseInvoice = matrixData.purchase_invoice?.[month] || 0;
    const currentSalesInvoice = matrixData.sales_invoice?.[month] || 0;
    
    // Calculate VAT from VAT-inclusive amount (KDV dahil tutardan KDV hesaplama)
    const calculatedData: any = {};

    if (field === 'purchase_invoice') {
      // Update purchase values
      calculatedData.purchase_invoice = amount;
      calculatedData.purchase_vat = amount * (20/120);
      // Preserve sales values
      calculatedData.sales_invoice = currentSalesInvoice;
      calculatedData.sales_vat = currentSalesInvoice * (20/120);
    } else if (field === 'sales_invoice') {
      // Update sales values  
      calculatedData.sales_invoice = amount;
      calculatedData.sales_vat = amount * (20/120);
      // Preserve purchase values
      calculatedData.purchase_invoice = currentPurchaseInvoice;
      calculatedData.purchase_vat = currentPurchaseInvoice * (20/120);
    }

    // Calculate VAT difference
    calculatedData.vat_difference = calculatedData.sales_vat - calculatedData.purchase_vat;
    
    setMatrixData(prev => {
      const newData = { ...prev };
      Object.keys(calculatedData).forEach(key => {
        newData[key] = {
          ...newData[key],
          [month]: calculatedData[key]
        };
      });
      return newData;
    });

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout for auto-save
    const newTimeout = setTimeout(async () => {
      try {
        await upsertInvoiceAnalysis({
          year: selectedYear,
          month: month,
          ...calculatedData
        });
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    }, 1000);

    setSaveTimeout(newTimeout);
  };

  // Get cell value
  const getCellValue = (field: string, month: number): number => {
    return matrixData[field]?.[month] || 0;
  };

  // Calculate row total
  const getRowTotal = (field: string): number => {
    const row = matrixData[field] || {};
    return Object.values(row).reduce((sum, value) => sum + value, 0);
  };

  // Calculate column total
  const getColumnTotal = (month: number): number => {
    return FIELDS.reduce((total, field) => {
      return total + getCellValue(field.key, month);
    }, 0);
  };

  // Calculate grand total
  const getGrandTotal = (): number => {
    return MONTHS.reduce((total, _, monthIndex) => {
      return total + getColumnTotal(monthIndex + 1);
    }, 0);
  };

  const formatTurkishCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Save all data functionality
  const saveAllData = async () => {
    try {
      setLoading(true);
      
      // Save all months data
      const savePromises = [];
      
      for (let month = 1; month <= 12; month++) {
        const monthData: any = { year: selectedYear, month };
        
        FIELDS.forEach(field => {
          monthData[field.key] = getCellValue(field.key, month);
        });
        
        savePromises.push(upsertInvoiceAnalysis(monthData));
      }
      
      await Promise.all(savePromises);
      
      toast({
        title: "Başarılı",
        description: "Tüm veriler kaydedildi.",
      });
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Veriler kaydedilirken bir hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Fatura Analizi
          </span>
          <div className="flex items-center gap-4">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={saveAllData} disabled={loading || dataLoading}>
              <Save className="mr-2 h-4 w-4" />
              Kaydet
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left font-medium">Aylar</th>
                {FIELDS.map(field => (
                  <th key={field.key} className="border p-3 text-right font-medium">{field.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((monthName, monthIndex) => {
                const month = monthIndex + 1;
                return (
                  <tr key={month} className="hover:bg-gray-50">
                    <td className="border p-3 font-medium">{String(month).padStart(2, '0')}-{monthName.toUpperCase()}</td>
                    {FIELDS.map(field => (
                      <td key={field.key} className="border p-1">
                        {field.editable ? (
                          <Input
                            type="number"
                            value={getCellValue(field.key, month)}
                            onChange={(e) => handleCellChange(field.key, month, e.target.value)}
                            className="w-full text-right border-none bg-transparent focus:bg-white"
                            step="0.01"
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="w-full text-right p-2 bg-gray-50 text-gray-700 font-medium">
                            {formatTurkishCurrency(getCellValue(field.key, month))}
                          </div>
                        )}
                      </td>
                     ))}
                   </tr>
                 );
               })}
              {/* Totals row */}
              <tr className="bg-gray-100 font-bold">
                <td className="border p-3 text-left">TOPLAM</td>
                {FIELDS.map(field => (
                  <td key={field.key} className="border p-3 text-right">
                    {field.key === 'vat_difference' ? (
                      <Badge variant={getRowTotal(field.key) > 0 ? "default" : "destructive"}>
                        {formatTurkishCurrency(getRowTotal(field.key))}
                      </Badge>
                    ) : (
                      formatTurkishCurrency(getRowTotal(field.key))
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceAnalysisTable;