import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, TrendingUp, DollarSign } from "lucide-react";

interface IncomeManagementProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const IncomeManagement = ({ isCollapsed, setIsCollapsed }: IncomeManagementProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [amount, setAmount] = useState<string>("");
  const [subcategory, setSubcategory] = useState<string>("");

  const months = [
    { value: "1", label: "Ocak" },
    { value: "2", label: "Şubat" },
    { value: "3", label: "Mart" },
    { value: "4", label: "Nisan" },
    { value: "5", label: "Mayıs" },
    { value: "6", label: "Haziran" },
    { value: "7", label: "Temmuz" },
    { value: "8", label: "Ağustos" },
    { value: "9", label: "Eylül" },
    { value: "10", label: "Ekim" },
    { value: "11", label: "Kasım" },
    { value: "12", label: "Aralık" }
  ];

  const incomeCategories = [
    "Ürün Satışları",
    "Hizmet Gelirleri", 
    "Lisans Gelirleri",
    "Danışmanlık Gelirleri",
    "Diğer Operasyonel Gelirler"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex relative">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}
      >
        <TopBar />
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Operasyonel Gelir Yönetimi</h1>
              <p className="text-gray-600 mt-1">Ürün satışları, hizmet gelirleri ve diğer nakit girişlerini yönetin</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gelir Giriş Formu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Yeni Gelir Girişi
                </CardTitle>
                <CardDescription>
                  Operasyonel gelirlerinizi kaydedin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">Yıl</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Yıl seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="month">Ay</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ay seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subcategory">Gelir Kategorisi</Label>
                  <Select value={subcategory} onValueChange={setSubcategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {incomeCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Tutar (TL)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Gelir Ekle
                </Button>
              </CardContent>
            </Card>

            {/* Özet Kartları */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bu Ay Toplam Gelir</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₺125,430</div>
                  <p className="text-xs text-muted-foreground">
                    +12% geçen aya göre
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Yıllık Toplam</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₺1,245,670</div>
                  <p className="text-xs text-muted-foreground">
                    +18% geçen yıla göre
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Kategori Dağılımı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ürün Satışları</span>
                      <span className="font-medium">₺85,430</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Hizmet Gelirleri</span>
                      <span className="font-medium">₺25,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Danışmanlık</span>
                      <span className="font-medium">₺15,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Son Girişler Tablosu */}
          <Card>
            <CardHeader>
              <CardTitle>Son Gelir Girişleri</CardTitle>
              <CardDescription>En son eklenen gelir kayıtları</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Tarih</th>
                      <th className="text-left p-2">Kategori</th>
                      <th className="text-right p-2">Tutar</th>
                      <th className="text-left p-2">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">2024/12 - Aralık</td>
                      <td className="p-2">Ürün Satışları</td>
                      <td className="p-2 text-right font-medium">₺45,000</td>
                      <td className="p-2">
                        <Button variant="ghost" size="sm">Düzenle</Button>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">2024/12 - Aralık</td>
                      <td className="p-2">Hizmet Gelirleri</td>
                      <td className="p-2 text-right font-medium">₺15,000</td>
                      <td className="p-2">
                        <Button variant="ghost" size="sm">Düzenle</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default IncomeManagement;