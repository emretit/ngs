/**
 * DrillDownModal Component
 * Genel kullanım için rapor detaylarını gösterir (tablo formatında)
 */

import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X, Download } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useReportExport } from "@/hooks/useReportExport";

export interface DrillDownData {
  title: string;
  data: any;
  columns?: Array<{
    key: string;
    label: string;
    type?: 'string' | 'number' | 'date' | 'currency';
  }>;
}

interface DrillDownModalProps {
  open: boolean;
  onClose: () => void;
  data: DrillDownData | null;
}

export default function DrillDownModal({
  open,
  onClose,
  data,
}: DrillDownModalProps) {
  const { exportToExcel, exportToCSV } = useReportExport();

  const tableData = useMemo(() => {
    if (!data || !data.data) return [];
    
    if (Array.isArray(data.data)) {
      return data.data;
    }
    
    // If data is an object, convert to array
    if (typeof data.data === 'object') {
      return [data.data];
    }
    
    return [];
  }, [data]);

  const columns = useMemo(() => {
    if (data?.columns && data.columns.length > 0) {
      return data.columns;
    }
    
    // Auto-generate columns from first row
    if (tableData.length > 0) {
      const firstRow = tableData[0];
      return Object.keys(firstRow).map((key) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        type: 'string' as const,
      }));
    }
    
    return [];
  }, [data, tableData]);

  const formatCellValue = (value: any, column: { type?: string }) => {
    if (value === null || value === undefined) return '-';
    
    if (column.type === 'date') {
      try {
        return format(new Date(value), "dd.MM.yyyy", { locale: tr });
      } catch {
        return value;
      }
    }
    
    if (column.type === 'currency') {
      return typeof value === 'number'
        ? value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : value;
    }
    
    if (column.type === 'number') {
      return typeof value === 'number'
        ? value.toLocaleString('tr-TR')
        : value;
    }
    
    return String(value);
  };

  const handleExport = (format: 'excel' | 'csv') => {
    if (!data || tableData.length === 0) return;

    const formattedData = tableData.map((row: any) => {
      const formatted: any = {};
      columns.forEach((col) => {
        formatted[col.label] = formatCellValue(row[col.key], col);
      });
      return formatted;
    });

    if (format === 'excel') {
      exportToExcel(formattedData, data.title, 'Detay');
    } else {
      exportToCSV(formattedData, data.title);
    }
  };

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-full">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {data.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel')}
                className="h-8 text-xs"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                className="h-8 text-xs"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4 overflow-auto max-h-[70vh]">
          {tableData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Veri bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key} className="text-xs">
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row: any, rowIndex: number) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column) => (
                      <TableCell key={column.key} className="text-xs">
                        {formatCellValue(row[column.key], column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
