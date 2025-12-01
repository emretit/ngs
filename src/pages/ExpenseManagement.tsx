import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Plus, TrendingDown, CreditCard, Users } from "lucide-react";

interface ExpenseManagementProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const ExpenseManagement = ({ isCollapsed, setIsCollapsed }: ExpenseManagementProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [amount, setAmount] = useState<string>("");
  const [subcategory, setSubcategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");

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

  const expenseCategories = [
    "Personel Masrafları",
    "Kira Masrafları",
    "Elektrik ve Faturalar",
    "İnternet ve Telefon",
    "Ofis Malzemeleri",
    "Pazarlama Masrafları",
    "Ulaşım Masrafları",
    "Danışmanlık Masrafları",
    "Vergi ve Resmi Ödemeler",
    "Sigorta Masrafları",
    "Bakım ve Onarım",
    "Diğer Operasyonel Masraflar"
  ];

  return (
    <>
      {/* Modern Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Masraf Yönetimi
            </h1>
            <p className="text-muted-foreground mt-1">
              İş süreçlerinizi takip edin ve yönetin
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Güncel</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gider Giriş Formu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Yeni Masraf Girişi
            </CardTitle>
            <CardDescription>
              Operasyonel masraflarınızı kaydedin
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
              <Label htmlFor="subcategory">Masraf Kategorisi</Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Tutar (TRY)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Masraf açıklaması..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Masraf Ekle
            </Button>
          </CardContent>
        </Card>

        {/* Özet Kartları */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bu Ay Toplam Masraf</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₺89,250</div>
              <p className="text-xs text-muted-foreground">
                +8% geçen aya göre
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personel Masrafları</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺55,000</div>
              <p className="text-xs text-muted-foreground">
                Toplam masrafların %62'si
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sabit Masraflar</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺25,750</div>
              <p className="text-xs text-muted-foreground">
                Kira, elektrik, internet vb.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">En Yüksek Masraf Kategorileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Personel Giderleri</span>
                  <span className="font-medium text-red-600">₺55,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Kira Giderleri</span>
                  <span className="font-medium text-red-600">₺15,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pazarlama Giderleri</span>
                  <span className="font-medium text-red-600">₺12,500</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Son Girişler Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>Son Gider Girişleri</CardTitle>
          <CardDescription>En son eklenen gider kayıtları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Tarih</th>
                  <th className="text-left p-2">Kategori</th>
                  <th className="text-right p-2">Tutar</th>
                  <th className="text-left p-2">Açıklama</th>
                  <th className="text-left p-2">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">2024/12 - Aralık</td>
                  <td className="p-2">Personel Giderleri</td>
                  <td className="p-2 text-right font-medium text-red-600">₺55,000</td>
                  <td className="p-2">Aylık maaşlar</td>
                  <td className="p-2">
                    <Button variant="ghost" size="sm">Düzenle</Button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">2024/12 - Aralık</td>
                  <td className="p-2">Kira Giderleri</td>
                  <td className="p-2 text-right font-medium text-red-600">₺15,000</td>
                  <td className="p-2">Ofis kirası</td>
                  <td className="p-2">
                    <Button variant="ghost" size="sm">Düzenle</Button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">2024/12 - Aralık</td>
                  <td className="p-2">Elektrik ve Faturalar</td>
                  <td className="p-2 text-right font-medium text-red-600">₺3,250</td>
                  <td className="p-2">Elektrik, su, doğalgaz</td>
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
    </>
  );
};

export default ExpenseManagement;