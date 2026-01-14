
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const data = [
  { name: "Ocak", gelir: 120000, gider: 65000 },
  { name: "Şubat", gelir: 98000, gider: 72000 },
  { name: "Mart", gelir: 86000, gider: 68000 },
  { name: "Nisan", gelir: 99000, gider: 71000 },
  { name: "Mayıs", gelir: 125000, gider: 80000 },
  { name: "Haziran", gelir: 145000, gider: 85000 },
];

const dailyFlow = [
  { date: "01.03", balance: 50000 },
  { date: "02.03", balance: 48000 },
  { date: "03.03", balance: 52000 },
  { date: "04.03", balance: 49000 },
  { date: "05.03", balance: 53000 },
  { date: "06.03", balance: 51000 },
  { date: "07.03", balance: 54000 },
];

const CashFlow = () => {
  const [date, setDate] = useState<Date>();
  const [period, setPeriod] = useState("monthly");

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold">Nakit Akışı</h2>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Periyot Seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Günlük</SelectItem>
              <SelectItem value="weekly">Haftalık</SelectItem>
              <SelectItem value="monthly">Aylık</SelectItem>
              <SelectItem value="yearly">Yıllık</SelectItem>
            </SelectContent>
          </Select>

          <EnhancedDatePicker
            date={date}
            onSelect={setDate}
            placeholder="Tarih Seç"
            className="w-auto"
          />

          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Income vs Expenses */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Gelir ve Gider Karşılaştırması</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="gelir" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gider" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Balance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Günlük Bakiye Değişimi</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Upcoming Cash Flows */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold">Yaklaşan Nakit Akışları</h3>
          <Button variant="outline" size="sm">Tümünü Görüntüle</Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Kira Ödemesi</p>
                <p className="text-xs text-gray-500">15 Mart 2024</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                Gider
              </span>
            </div>
            <p className="text-lg font-semibold text-red-600">-₺25,000</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Müşteri Ödemesi</p>
                <p className="text-xs text-gray-500">18 Mart 2024</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                Gelir
              </span>
            </div>
            <p className="text-lg font-semibold text-green-600">+₺42,500</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Tedarikçi Ödemesi</p>
                <p className="text-xs text-gray-500">20 Mart 2024</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                Gider
              </span>
            </div>
            <p className="text-lg font-semibold text-red-600">-₺18,750</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlow;
