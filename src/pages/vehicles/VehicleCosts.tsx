import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Fuel, Wrench, FileText, TrendingUp, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Schema mapping: Using cashflow_transactions for all vehicle costs
// - category_id: fuel, maintenance, insurance, etc.
// - amount: cost amount
// - date: cost date
// - description: cost details, vehicle info
// - type: expense
// - company_id: company filter

interface CostEntry {
  id: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  company_id: string;
}

interface Vehicle {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
}

interface CostCategory {
  id: string;
  name: string;
  type: string;
}

export default function VehicleCosts() {
  const [selectedPeriod, setSelectedPeriod] = useState("6");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, model, manufacturer')
        .eq('category', 'vehicle')
        .order('name');

      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['cost-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashflow_categories')
        .select('*')
        .eq('type', 'expense')
        .in('name', ['Yakıt', 'Bakım', 'Sigorta', 'Lastik', 'Ceza'])
        .order('name');

      if (error) throw error;
      return data as CostCategory[];
    },
  });

  const { data: costs, isLoading } = useQuery({
    queryKey: ['vehicle-costs', selectedPeriod],
    queryFn: async () => {
      if (!categories?.length) return [];

      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(selectedPeriod));

      const { data, error } = await supabase
        .from('cashflow_transactions')
        .select(`
          *,
          category:cashflow_categories(name)
        `)
        .in('category_id', categories.map(c => c.id))
        .gte('date', monthsAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        ...item,
        category: item.category?.name || 'Diğer'
      })) as CostEntry[];
    },
  });

  const monthlyData = costs?.reduce((acc, cost) => {
    const month = new Date(cost.date).toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    if (!acc[month]) {
      acc[month] = { month, total: 0, fuel: 0, maintenance: 0, insurance: 0, other: 0 };
    }
    
    acc[month].total += cost.amount;
    
    switch (cost.category.toLowerCase()) {
      case 'yakıt':
        acc[month].fuel += cost.amount;
        break;
      case 'bakım':
        acc[month].maintenance += cost.amount;
        break;
      case 'sigorta':
        acc[month].insurance += cost.amount;
        break;
      default:
        acc[month].other += cost.amount;
    }
    
    return acc;
  }, {} as Record<string, any>) || {};

  const chartData = Object.values(monthlyData);

  const categoryData = categories?.map(category => {
    const categoryTotal = costs
      ?.filter(cost => cost.category === category.name)
      .reduce((sum, cost) => sum + cost.amount, 0) || 0;
    
    return {
      name: category.name,
      value: categoryTotal,
      color: {
        'Yakıt': '#3b82f6',
        'Bakım': '#ef4444',
        'Sigorta': '#22c55e',
        'Lastik': '#f59e0b',
        'Ceza': '#8b5cf6'
      }[category.name] || '#6b7280'
    };
  }).filter(item => item.value > 0) || [];

  const totalCosts = costs?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
  const avgMonthlyCost = totalCosts / parseInt(selectedPeriod);

  const getVehicleFromDescription = (description: string) => {
    // Try to extract vehicle plate from description
    const vehicle = vehicles?.find(v => description.includes(v.name));
    return vehicle?.name || 'Genel';
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Araç Maliyetleri</h1>
          <p className="text-muted-foreground">Araç maliyetlerini analiz edin ve takip edin</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Son 3 Ay</SelectItem>
              <SelectItem value="6">Son 6 Ay</SelectItem>
              <SelectItem value="12">Son 12 Ay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Toplam Maliyet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCosts.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">₺</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Aylık Ortalama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgMonthlyCost.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">₺</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Fuel className="h-5 w-5 text-orange-600" />
              Yakıt Maliyeti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costs
                ?.filter(cost => cost.category === 'Yakıt')
                .reduce((sum, cost) => sum + cost.amount, 0)
                .toFixed(0) || '0'} <span className="text-sm font-normal text-muted-foreground">₺</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5 text-red-600" />
              Bakım Maliyeti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costs
                ?.filter(cost => cost.category === 'Bakım')
                .reduce((sum, cost) => sum + cost.amount, 0)
                .toFixed(0) || '0'} <span className="text-sm font-normal text-muted-foreground">₺</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aylık Maliyet Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [`${value}₺`, name]}
                  labelFormatter={(label) => `Ay: ${label}`}
                />
                <Bar dataKey="total" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kategori Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} %${(percent * 100).toFixed(0)}`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}₺`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detaylı Maliyet Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Araç</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs?.slice(0, 20).map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(cost.date).toLocaleDateString('tr-TR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-secondary rounded-md text-xs">
                      {cost.category}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {cost.description}
                  </TableCell>
                  <TableCell>
                    {getVehicleFromDescription(cost.description)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {cost.amount.toFixed(2)}₺
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {costs?.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Maliyet kaydı bulunamadı</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}