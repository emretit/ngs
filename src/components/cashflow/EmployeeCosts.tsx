import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, TrendingUp, FileDown, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmployeeCostData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string;
  position: string;
  status: string;
  hire_date: string;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  postal_code: string | null;
  country: string | null;
  id_ssn: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  gross_salary: number;
  net_salary: number;
  total_employer_cost: number;
  meal_allowance: number;
  transport_allowance: number;
  effective_date: string;
  manual_employer_sgk_cost: number;
  unemployment_employer_amount: number;
  accident_insurance_amount: number;
}


const EmployeeCosts = () => {
  const [employeeCosts, setEmployeeCosts] = useState<EmployeeCostData[]>([]);
  const [filteredCosts, setFilteredCosts] = useState<EmployeeCostData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployeeCosts();
  }, []);

  useEffect(() => {
    filterData();
  }, [employeeCosts, searchTerm, selectedDepartment, selectedStatus]);

  const fetchEmployeeCosts = async () => {
    try {
      console.log('Fetching employee costs...');
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          department,
          position,
          status,
          hire_date,
          date_of_birth,
          gender,
          marital_status,
          address,
          city,
          district,
          postal_code,
          country,
          id_ssn,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relation,
          employee_salaries!inner (
            gross_salary,
            net_salary,
            total_employer_cost,
            meal_allowance,
            transport_allowance,
            effective_date,
            manual_employer_sgk_cost,
            unemployment_employer_amount,
            accident_insurance_amount
          )
        `)
        .eq('status', 'aktif')
        .order('department')
        .order('last_name');

      console.log('Query result:', { data, error });

      if (error) throw error;

      const processedData = (data as any)?.map((employee: any) => {
        console.log('Processing employee:', employee);
        const salariesArray = Array.isArray(employee.employee_salaries) ? employee.employee_salaries : [employee.employee_salaries];
        const latestSalary = salariesArray[0]; // Get the latest salary record
        return {
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          position: employee.position,
          status: employee.status,
          hire_date: employee.hire_date,
          date_of_birth: employee.date_of_birth,
          gender: employee.gender,
          marital_status: employee.marital_status,
          address: employee.address,
          city: employee.city,
          district: employee.district,
          postal_code: employee.postal_code,
          country: employee.country,
          id_ssn: employee.id_ssn,
          emergency_contact_name: employee.emergency_contact_name,
          emergency_contact_phone: employee.emergency_contact_phone,
          emergency_contact_relation: employee.emergency_contact_relation,
          gross_salary: latestSalary?.gross_salary || 0,
          net_salary: latestSalary?.net_salary || 0,
          total_employer_cost: latestSalary?.total_employer_cost || 0,
          meal_allowance: latestSalary?.meal_allowance || 0,
          transport_allowance: latestSalary?.transport_allowance || 0,
          effective_date: latestSalary?.effective_date,
          manual_employer_sgk_cost: latestSalary?.manual_employer_sgk_cost || 0,
          unemployment_employer_amount: latestSalary?.unemployment_employer_amount || 0,
          accident_insurance_amount: latestSalary?.accident_insurance_amount || 0,
        };
      }) || [];

      console.log('Processed data:', processedData);

      setEmployeeCosts(processedData);
    } catch (error) {
      console.error('Error fetching employee costs:', error);
      toast({
        title: "Hata",
        description: "Personel maliyetleri yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const filterData = () => {
    let filtered = employeeCosts;

    if (searchTerm) {
      filtered = filtered.filter(employee => 
        employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.phone && employee.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employee.id_ssn && employee.id_ssn.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedDepartment !== "all") {
      filtered = filtered.filter(employee => employee.department === selectedDepartment);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(employee => employee.status === selectedStatus);
    }

    setFilteredCosts(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = [
      'Ad Soyad',
      'E-posta',
      'Telefon',
      'Departman',
      'Pozisyon',
      'İşe Giriş Tarihi',
      'Doğum Tarihi',
      'Cinsiyet',
      'Medeni Durum',
      'Adres',
      'Şehir',
      'İlçe',
      'Posta Kodu',
      'Ülke',
      'TC/SSN',
      'Acil Durum Kişisi',
      'Acil Durum Telefon',
      'Acil Durum Yakınlık',
      'Brüt Maaş',
      'Net Maaş',
      'Toplam İşveren Maliyeti',
      'Yemek Yardımı',
      'Ulaşım Yardımı',
      'SGK İşveren Payı',
      'İşsizlik İşveren Payı',
      'İş Kazası Sigortası'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredCosts.map(employee => [
        `"${employee.first_name} ${employee.last_name}"`,
        `"${employee.email || ''}"`,
        `"${employee.phone || ''}"`,
        `"${employee.department}"`,
        `"${employee.position}"`,
        `"${employee.hire_date || ''}"`,
        `"${employee.date_of_birth || ''}"`,
        `"${employee.gender || ''}"`,
        `"${employee.marital_status || ''}"`,
        `"${employee.address || ''}"`,
        `"${employee.city || ''}"`,
        `"${employee.district || ''}"`,
        `"${employee.postal_code || ''}"`,
        `"${employee.country || ''}"`,
        `"${employee.id_ssn || ''}"`,
        `"${employee.emergency_contact_name || ''}"`,
        `"${employee.emergency_contact_phone || ''}"`,
        `"${employee.emergency_contact_relation || ''}"`,
        employee.gross_salary,
        employee.net_salary,
        employee.total_employer_cost,
        employee.meal_allowance,
        employee.transport_allowance,
        employee.manual_employer_sgk_cost,
        employee.unemployment_employer_amount,
        employee.accident_insurance_amount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `personel_maliyetleri_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCosts = filteredCosts.reduce((acc, employee) => ({
    gross_salary: acc.gross_salary + employee.gross_salary,
    net_salary: acc.net_salary + employee.net_salary,
    total_employer_cost: acc.total_employer_cost + employee.total_employer_cost,
  }), { gross_salary: 0, net_salary: 0, total_employer_cost: 0 });

  const uniqueDepartments = [...new Set(employeeCosts.map(emp => emp.department))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Personel maliyetleri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 rounded-2xl border border-blue-100/50 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Personel Maliyetleri</h1>
              <p className="text-gray-600 text-base">Aktif çalışanların detaylı maaş ve maliyet bilgileri - Kapsamlı HR analizi</p>
            </div>
          </div>
          <Button
            onClick={exportToCSV}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            CSV İndir
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden bg-white border border-blue-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-blue-500 rounded-lg shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Toplam Çalışan</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-2">
              {filteredCosts.length}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-blue-100 rounded-full">
                <span className="text-xs font-medium text-blue-700">Aktif personel</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-green-100 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-green-500 rounded-lg shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Toplam Brüt Maaş</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(totalCosts.gross_salary)}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-green-100 rounded-full">
                <span className="text-xs font-medium text-green-700">Aylık toplam</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-purple-100 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-purple-500 rounded-lg shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Toplam Net Maaş</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-purple-600 mb-2">
              {formatCurrency(totalCosts.net_salary)}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-purple-100 rounded-full">
                <span className="text-xs font-medium text-purple-700">Net ödemeler</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-red-100 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-red-500 rounded-lg shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Toplam İşveren Maliyeti</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-red-600 mb-2">
              {formatCurrency(totalCosts.total_employer_cost)}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-red-100 rounded-full">
                <span className="text-xs font-medium text-red-700">Gerçek maliyet</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Enhanced Filters Section */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Search className="h-4 w-4 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Filtreleme ve Arama</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Personel ara (isim, e-posta, telefon, TC)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Departman seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Departmanlar</SelectItem>
                {uniqueDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Employee Costs Table */}
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Detaylı Personel Maliyetleri</CardTitle>
              <CardDescription className="text-gray-600">Tüm aktif çalışanların maaş ve maliyet detayları - Kapsamlı personel analizi</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50">
                  <TableHead className="min-w-[200px] font-semibold text-gray-700">Kişisel Bilgiler</TableHead>
                  <TableHead className="text-right min-w-[100px] font-semibold text-gray-700">Net Maaş</TableHead>
                  <TableHead className="text-right min-w-[100px] font-semibold text-gray-700">SGK İşveren</TableHead>
                  <TableHead className="text-right min-w-[80px] font-semibold text-gray-700">Yemek</TableHead>
                  <TableHead className="text-right min-w-[80px] font-semibold text-gray-700">Ulaşım</TableHead>
                  <TableHead className="text-right min-w-[120px] font-semibold text-gray-700">Toplam Maliyet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCosts.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-blue-50/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{employee.first_name} {employee.last_name}</div>
                            <div className="text-sm text-gray-600">{employee.department} • {employee.position}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pl-11">
                          {employee.date_of_birth && (
                            <div>📅 {new Date(employee.date_of_birth).toLocaleDateString('tr-TR')}</div>
                          )}
                          {employee.gender && <div>👤 {employee.gender}</div>}
                          {employee.marital_status && <div>💍 {employee.marital_status}</div>}
                          {employee.id_ssn && <div>🆔 {employee.id_ssn}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-purple-600">
                      {formatCurrency(employee.net_salary)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-blue-600">
                      {formatCurrency(employee.manual_employer_sgk_cost)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(employee.meal_allowance)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-orange-600">
                      {formatCurrency(employee.transport_allowance)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-bold text-red-600 text-lg">
                        {formatCurrency(employee.total_employer_cost)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Gerçek maliyet
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeCosts;