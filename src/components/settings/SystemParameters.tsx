import { NumberFormatSettings } from './NumberFormatSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const FORMAT_VARIABLES = [
  { key: '{YYYY}', description: '4 haneli yıl (2025)', example: '2025' },
  { key: '{YY}', description: '2 haneli yıl (25)', example: '25' },
  { key: '{MM}', description: 'Ay numarası (01-12)', example: '01' },
  { key: '{DD}', description: 'Gün numarası (01-31)', example: '15' },
  { key: '{0001}', description: '4 haneli sıralı numara', example: '0001' },
  { key: '{001}', description: '3 haneli sıralı numara', example: '001' },
  { key: '{01}', description: '2 haneli sıralı numara', example: '01' },
];

// Sistem parametreleri bileşeni
export const SystemParameters = () => {
  return (
    <div className="space-y-4">
      {/* Format Değişkenleri Kartı */}
      <Card className="border-gray-200 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm font-medium">Format Değişkenleri</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1.5">
            {FORMAT_VARIABLES.map((variable) => (
              <div key={variable.key} className="p-2 border rounded-md bg-muted/30">
                <div className="font-mono font-semibold text-xs">{variable.key}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{variable.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Numara Formatları Kartı */}
      <Card className="border-gray-200 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <div className="p-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <span>Numara Formatları</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <NumberFormatSettings />
        </CardContent>
      </Card>
    </div>
  );
};
