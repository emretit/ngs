
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";
import { format } from "date-fns";

const InstrumentList = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Referans No</TableHead>
          <TableHead>Tür</TableHead>
          <TableHead>Vade</TableHead>
          <TableHead>Düzenleyen</TableHead>
          <TableHead>Banka</TableHead>
          <TableHead className="text-right">Tutar</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>A123456</TableCell>
          <TableCell>Çek (Alınan)</TableCell>
          <TableCell>{format(new Date('2024-03-15'), 'dd.MM.yyyy')}</TableCell>
          <TableCell>ABC Ltd.</TableCell>
          <TableCell>Ziraat Bankası</TableCell>
          <TableCell className="text-right">₺45,000</TableCell>
          <TableCell>
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              Beklemede
            </span>
          </TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                <span>Tahsil Et</span>
              </Button>
              <Button size="sm" variant="outline" className="flex items-center gap-1 text-red-600">
                <X className="h-3 w-3" />
                <span>Karşılıksız</span>
              </Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>B789012</TableCell>
          <TableCell>Senet (Verilen)</TableCell>
          <TableCell>{format(new Date('2024-04-01'), 'dd.MM.yyyy')}</TableCell>
          <TableCell>XYZ A.Ş.</TableCell>
          <TableCell>İş Bankası</TableCell>
          <TableCell className="text-right">₺75,000</TableCell>
          <TableCell>
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              Beklemede
            </span>
          </TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                <span>Öde</span>
              </Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>C345678</TableCell>
          <TableCell>Çek (Alınan)</TableCell>
          <TableCell>{format(new Date('2024-02-28'), 'dd.MM.yyyy')}</TableCell>
          <TableCell>DEF Ltd.</TableCell>
          <TableCell>Garanti BBVA</TableCell>
          <TableCell className="text-right">₺35,000</TableCell>
          <TableCell>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Tahsil Edildi
            </span>
          </TableCell>
          <TableCell>
            <Button size="sm" variant="outline">Detay</Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default InstrumentList;
