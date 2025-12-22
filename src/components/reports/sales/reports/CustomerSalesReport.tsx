/**
 * Customer Sales Report Component
 * Müşteri bazlı satış analizi raporu
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { fetchCustomerSalesData } from "@/services/salesReportsService";
import type { GlobalFilters } from "@/types/salesReports";

interface CustomerSalesReportProps {
  filters: GlobalFilters;
  onDrillDown?: (data: any) => void;
}

export default function CustomerSalesReport({
  filters,
  onDrillDown,
}: CustomerSalesReportProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-sales', filters],
    queryFn: () => fetchCustomerSalesData(filters),
  });

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center">Yükleniyor...</div>;
  }

  if (error || !data || data.customers.length === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Veri bulunamadı</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Toplam Müşteri</div>
            <div className="text-2xl font-bold text-foreground">{data.totalCustomers}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Top 10 Müşteri</div>
            <div className="text-2xl font-bold text-foreground">{data.topCustomers.length}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Toplam Gelir</div>
            <div className="text-2xl font-bold text-foreground">
              ₺{data.customers.reduce((sum, c) => sum + c.totalRevenue, 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </Card>

      {/* Top Customers Bar Chart */}
      <Card className="p-0 border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
          <h4 className="text-sm font-semibold text-foreground">En İyi Müşteriler (Top 10)</h4>
        </div>
        <div className="p-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.topCustomers}
              layout="vertical"
              onClick={(e) => {
                if (e?.activePayload && onDrillDown) {
                  const customer = e.activePayload[0]?.payload;
                  onDrillDown({
                    reportType: 'customer_sales',
                    title: `${customer.customerName} Detayları`,
                    data: customer,
                    columns: [
                      { key: 'customerName', label: 'Müşteri', type: 'string' },
                      { key: 'totalRevenue', label: 'Toplam Gelir', type: 'currency' },
                      { key: 'dealCount', label: 'İşlem Sayısı', type: 'number' },
                      { key: 'avgDealSize', label: 'Ort. İşlem', type: 'currency' },
                      { key: 'lastTransactionDate', label: 'Son İşlem', type: 'date' },
                    ],
                  });
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="customerName"
                type="category"
                tick={{ fontSize: 11 }}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [
                  `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
                  'Toplam Gelir',
                ]}
              />
              <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </div>
        </Card>

      {/* Detailed Customer Table */}
      <Card className="p-0 border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
          <h4 className="text-sm font-semibold text-foreground">Müşteri Detayları</h4>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100/50 border-b border-slate-200">
                <TableHead className="py-3 px-4 font-bold text-foreground/80 text-xs tracking-wide">Müşteri</TableHead>
                <TableHead className="text-right py-3 px-4 font-bold text-foreground/80 text-xs tracking-wide">Toplam Gelir</TableHead>
                <TableHead className="text-right py-3 px-4 font-bold text-foreground/80 text-xs tracking-wide">İşlem Sayısı</TableHead>
                <TableHead className="text-right py-3 px-4 font-bold text-foreground/80 text-xs tracking-wide">Ort. İşlem</TableHead>
                <TableHead className="text-right py-3 px-4 font-bold text-foreground/80 text-xs tracking-wide">Son İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.customers.slice(0, 20).map((customer: any) => (
                <TableRow
                  key={customer.customerId}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    if (onDrillDown) {
                      onDrillDown({
                        reportType: 'customer_sales',
                        title: `${customer.customerName} Detayları`,
                        data: customer,
                        columns: [
                          { key: 'customerName', label: 'Müşteri', type: 'string' },
                          { key: 'totalRevenue', label: 'Toplam Gelir', type: 'currency' },
                          { key: 'dealCount', label: 'İşlem Sayısı', type: 'number' },
                          { key: 'avgDealSize', label: 'Ort. İşlem', type: 'currency' },
                          { key: 'lastTransactionDate', label: 'Son İşlem', type: 'date' },
                        ],
                      });
                    }
                  }}
                >
                  <TableCell className="py-3 px-4 font-medium text-foreground">{customer.customerName}</TableCell>
                  <TableCell className="text-right py-3 px-4 font-medium text-foreground">
                    ₺{customer.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right py-3 px-4 text-foreground">{customer.dealCount}</TableCell>
                  <TableCell className="text-right py-3 px-4 font-medium text-foreground">
                    ₺{customer.avgDealSize.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right py-3 px-4 text-foreground">
                    {format(new Date(customer.lastTransactionDate), "dd.MM.yyyy", { locale: tr })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {data.customers.length > 20 && (
          <div className="px-6 py-3 border-t border-border/50 bg-muted/20 text-xs text-muted-foreground text-center">
            ... ve {data.customers.length - 20} müşteri daha
          </div>
        )}
      </Card>
    </div>
  );
}

