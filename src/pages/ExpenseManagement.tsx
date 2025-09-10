import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import { EnhancedCard, SummaryCard } from "@/components/shared";
import { PrimaryButton, SecondaryButton } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Plus, TrendingDown, CreditEnhancedCard, Users } from "lucide-react";

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
    "Personel Giderleri",
    "Kira Giderleri",
    "Elektrik ve Faturalar",
    "İnternet ve Telefon",
    "Ofis Malzemeleri",
    "Pazarlama Giderleri",
    "Ulaşım Giderleri",
    "Danışmanlık Giderleri",
    "Vergi ve Resmi Ödemeler",
    "Sigorta Giderleri",
    "Bakım ve Onarım",
    "Diğer Operasyonel Giderler"
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
              <h1 className="text-2xl font-semibold text-gray-900">Operasyonel Gider Yönetimi</h1>
              <p className="text-gray-600 mt-1">OPEX giderleri, personel giderleri ve diğer operasyonel harcamaları yönetin</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gider Giriş Formu */}
            <EnhancedCard>
              <div>
                <h3 className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Yeni Gider Girişi
                </h3>
                <EnhancedCardDescription>
                  Operasyonel giderlerinizi kaydedin
                </EnhancedCardDescription>
              </div>
              <div className="space-y-4">
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
                  <Label htmlFor="subcategory">Gider Kategorisi</Label>
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
                  <Label htmlFor="amount">Tutar (TL)</Label>
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
                    placeholder="Gider açıklaması..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Gider Ekle
                </Button>
              </div>
            </EnhancedCard>

            {/* Özet Kartları */}
            <div className="space-y-4">
              <EnhancedCard>
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium">Bu Ay Toplam Gider</h3>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">₺89,250</div>
                  <p className="text-xs text-muted-foreground">
                    +8% geçen aya göre
                  </p>
                </div>
              </EnhancedCard>

              <EnhancedCard>
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium">Personel Giderleri</h3>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">₺55,000</div>
                  <p className="text-xs text-muted-foreground">
                    Toplam giderlerin %62'si
                  </p>
                </div>
              </EnhancedCard>

              <EnhancedCard>
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium">Sabit Giderler</h3>
                  <CreditEnhancedCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">₺25,750</div>
                  <p className="text-xs text-muted-foreground">
                    Kira, elektrik, internet vb.
                  </p>
                </div>
              </EnhancedCard>

              <EnhancedCard>
                <div>
                  <h3 className="text-sm font-medium">En Yüksek Gider Kategorileri</h3>
                </div>
                <div>
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
                </div>
              </EnhancedCard>
            </div>
          </div>

          {/* Son Girişler Tablosu */}
          <EnhancedCard>
            <div>
              <h3>Son Gider Girişleri</h3>
              <EnhancedCardDescription>En son eklenen gider kayıtları</EnhancedCardDescription>
            </div>
            <div>
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
            </div>
          </EnhancedCard>
        </div>
      </main>
    </div>
  );
};

export default ExpenseManagement;