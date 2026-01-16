/**
 * PivotTableView Component
 * Pivot tablo görünümü - satır/sütun gruplandırma ve ölçü seçimi
 */

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Settings2 } from "lucide-react";
import { exportToExcel } from "@/hooks/useReportExport";
import { cn } from "@/lib/utils";

export type MeasureType = 'sum' | 'average' | 'count';

interface PivotTableViewProps {
  data: any[];
  rowFields: string[];
  columnFields: string[];
  measureField: string;
  measureType?: MeasureType;
  onRowFieldsChange?: (fields: string[]) => void;
  onColumnFieldsChange?: (fields: string[]) => void;
  onMeasureFieldChange?: (field: string) => void;
  onMeasureTypeChange?: (type: MeasureType) => void;
  availableFields: Array<{ key: string; label: string; type: 'string' | 'number' | 'date' }>;
}

export default function PivotTableView({
  data,
  rowFields,
  columnFields,
  measureField,
  measureType = 'sum',
  onRowFieldsChange,
  onColumnFieldsChange,
  onMeasureFieldChange,
  onMeasureTypeChange,
  availableFields,
}: PivotTableViewProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Calculate pivot table
  const pivotData = useMemo(() => {
    if (!data.length || !measureField) return { rows: [], columns: [] };

    const pivotMap = new Map<string, Map<string, number>>();
    const allRowValues = new Set<string>();
    const allColumnValues = new Set<string>();

    // Process data
    data.forEach((row) => {
      const rowKey = rowFields.map(field => String(row[field] || '-')).join(' | ');
      const colKey = columnFields.map(field => String(row[field] || '-')).join(' | ');
      
      allRowValues.add(rowKey);
      allColumnValues.add(colKey);

      if (!pivotMap.has(rowKey)) {
        pivotMap.set(rowKey, new Map());
      }

      const colMap = pivotMap.get(rowKey)!;
      const currentValue = colMap.get(colKey) || 0;
      const measureValue = Number(row[measureField]) || 0;

      let newValue = currentValue;
      if (measureType === 'sum') {
        newValue = currentValue + measureValue;
      } else if (measureType === 'average') {
        // For average, we'll track count and sum separately
        const count = colMap.get(`${colKey}_count`) || 0;
        colMap.set(`${colKey}_count`, count + 1);
        newValue = currentValue + measureValue;
      } else if (measureType === 'count') {
        newValue = currentValue + 1;
      }

      colMap.set(colKey, newValue);
    });

    // Calculate averages if needed
    if (measureType === 'average') {
      pivotMap.forEach((colMap) => {
        colMap.forEach((value, key) => {
          if (key.endsWith('_count')) {
            const count = value;
            const sumKey = key.replace('_count', '');
            const sum = colMap.get(sumKey) || 0;
            colMap.set(sumKey, count > 0 ? sum / count : 0);
            colMap.delete(key);
          }
        });
      });
    }

    const sortedRows = Array.from(allRowValues).sort();
    const sortedColumns = Array.from(allColumnValues).sort();

    return {
      rows: sortedRows,
      columns: sortedColumns,
      data: pivotMap,
    };
  }, [data, rowFields, columnFields, measureField, measureType]);

  const handleExport = () => {
    const exportData: any[] = [];
    
    pivotData.rows.forEach((rowKey) => {
      const row: any = {};
      const rowParts = rowKey.split(' | ');
      rowFields.forEach((field, index) => {
        row[availableFields.find(f => f.key === field)?.label || field] = rowParts[index] || '-';
      });

      pivotData.columns.forEach((colKey) => {
        const value = pivotData.data.get(rowKey)?.get(colKey) || 0;
        const formattedValue = measureType === 'average' 
          ? value.toFixed(2) 
          : measureType === 'count'
          ? value
          : value.toLocaleString('tr-TR');
        row[colKey] = formattedValue;
      });

      exportData.push(row);
    });

    exportToExcel(exportData, 'Pivot_Tablo', 'Pivot');
  };

  const formatValue = (value: number) => {
    if (measureType === 'average') {
      return value.toFixed(2);
    }
    if (measureType === 'count') {
      return Math.round(value).toString();
    }
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Pivot Tablo</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="h-8 text-xs"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Yapılandır
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-8 text-xs"
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {isConfigOpen && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Satır Alanları</Label>
              <Select
                value={rowFields[0] || ""}
                onValueChange={(value) => onRowFieldsChange?.([value])}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Satır alanı seç" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.filter(f => f.type !== 'number').map((field) => (
                    <SelectItem key={field.key} value={field.key} className="text-xs">
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Sütun Alanları</Label>
              <Select
                value={columnFields[0] || ""}
                onValueChange={(value) => onColumnFieldsChange?.([value])}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Sütun alanı seç" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.filter(f => f.type !== 'number').map((field) => (
                    <SelectItem key={field.key} value={field.key} className="text-xs">
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Ölçü Alanı</Label>
              <Select
                value={measureField}
                onValueChange={(value) => onMeasureFieldChange?.(value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Ölçü alanı seç" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.filter(f => f.type === 'number').map((field) => (
                    <SelectItem key={field.key} value={field.key} className="text-xs">
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Ölçü Tipi</Label>
              <Select
                value={measureType}
                onValueChange={(value) => onMeasureTypeChange?.(value as MeasureType)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum" className="text-xs">Toplam</SelectItem>
                  <SelectItem value="average" className="text-xs">Ortalama</SelectItem>
                  <SelectItem value="count" className="text-xs">Sayı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-auto max-h-[600px]">
        {pivotData.rows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Veri bulunamadı veya yapılandırma eksik
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10 min-w-[150px] text-xs">
                  {rowFields.map(field => 
                    availableFields.find(f => f.key === field)?.label || field
                  ).join(' / ')}
                </TableHead>
                {pivotData.columns.map((col) => (
                  <TableHead key={col} className="text-xs text-center min-w-[100px]">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pivotData.rows.map((rowKey) => (
                <TableRow key={rowKey}>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium text-xs">
                    {rowKey}
                  </TableCell>
                  {pivotData.columns.map((colKey) => {
                    const value = pivotData.data.get(rowKey)?.get(colKey) || 0;
                    return (
                      <TableCell key={colKey} className="text-xs text-right">
                        {formatValue(value)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
}
