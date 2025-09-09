
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Filter, Download, Search } from "lucide-react";

const GeneralLedger = () => {
  return (
    <div className="grid gap-4">
      {/* Üst Araçlar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div className="flex gap-2 flex-wrap items-center">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Hesap Türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Hesaplar</SelectItem>
                <SelectItem value="assets">Varlıklar</SelectItem>
                <SelectItem value="liabilities">Yükümlülükler</SelectItem>
                <SelectItem value="equity">Özkaynaklar</SelectItem>
                <SelectItem value="income">Gelirler</SelectItem>
                <SelectItem value="expense">Giderler</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="TRY">
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Para Birimi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">TRY</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Dışa Aktar</span>
            </Button>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Yeni Kayıt</span>
            </Button>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Hesap planında ara..."
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Hesap Planı ve İşlemler */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Hesap Planı */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold mb-4">Hesap Planı</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
              <div>
                <p className="font-medium">100 - Kasa</p>
                <p className="text-sm text-gray-500">Varlıklar</p>
              </div>
              <span className="text-blue-600 font-semibold">₺45,000</span>
            </div>
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
              <div>
                <p className="font-medium">120 - Alıcılar</p>
                <p className="text-sm text-gray-500">Varlıklar</p>
              </div>
              <span className="text-blue-600 font-semibold">₺125,000</span>
            </div>
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
              <div>
                <p className="font-medium">320 - Satıcılar</p>
                <p className="text-sm text-gray-500">Yükümlülükler</p>
              </div>
              <span className="text-red-600 font-semibold">₺75,000</span>
            </div>
          </div>
        </div>

        {/* Son İşlemler */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Son İşlemler</h3>
            <Button variant="outline" size="sm">
              Tümünü Gör
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Fiş No</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Hesap</TableHead>
                <TableHead className="text-right">Borç</TableHead>
                <TableHead className="text-right">Alacak</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>01.03.2024</TableCell>
                <TableCell>YEV-2024-0001</TableCell>
                <TableCell>Satış Geliri</TableCell>
                <TableCell>100 - Kasa</TableCell>
                <TableCell className="text-right">₺5,000</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Onaylandı
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>01.03.2024</TableCell>
                <TableCell>YEV-2024-0001</TableCell>
                <TableCell>Satış Geliri</TableCell>
                <TableCell>600 - Gelirler</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">₺5,000</TableCell>
                <TableCell>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Onaylandı
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>28.02.2024</TableCell>
                <TableCell>YEV-2024-0002</TableCell>
                <TableCell>Kira Ödemesi</TableCell>
                <TableCell>770 - Genel Giderler</TableCell>
                <TableCell className="text-right">₺3,500</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Onaylandı
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default GeneralLedger;
