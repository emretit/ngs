import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { ServicePartsInventoryService } from '@/services/servicePartsInventoryService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp } from 'lucide-react';

export const ServicePartsUsageReport: React.FC = () => {
  const { userData } = useCurrentUser();
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { data: usageReport, isLoading } = useQuery({
    queryKey: ['parts-usage-report', userData?.company_id, startDate, endDate],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      return ServicePartsInventoryService.getPartsUsageReport(
        userData.company_id,
        startDate,
        endDate
      );
    },
    enabled: !!userData?.company_id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 block">Başlangıç Tarihi</label>
              <DatePicker
                date={startDate}
                onSelect={setStartDate}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 block">Bitiş Tarihi</label>
              <DatePicker
                date={endDate}
                onSelect={setEndDate}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                setEndDate(new Date());
              }}
            >
              Bu Ay
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span>Parça Kullanım Raporu</span>
            <Badge variant="outline">{usageReport?.length || 0} ürün</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usageReport && usageReport.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">Toplam Kullanım</TableHead>
                  <TableHead className="text-center">Kullanım Sayısı</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageReport.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {item.sku || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{item.totalQuantity}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.usageCount} servis</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Bu dönemde parça kullanımı bulunamadı</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};






