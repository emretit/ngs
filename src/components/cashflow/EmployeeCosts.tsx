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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Personel Maliyetleri</h2>
          <p className="text-gray-600">Aktif çalışanların detaylı maaş ve maliyet bilgileri</p>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          CSV İndir
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Çalışan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{filteredCosts.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Brüt Maaş</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{formatCurrency(totalCosts.gross_salary)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Net Maaş</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{formatCurrency(totalCosts.net_salary)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam İşveren Maliyeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{formatCurrency(totalCosts.total_employer_cost)}</span>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Personel ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-full sm:w-48">
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

      {/* Employee Costs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detaylı Personel Maliyetleri</CardTitle>
          <CardDescription>Tüm aktif çalışanların maaş ve maliyet detayları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Kişisel Bilgiler</TableHead>
                  <TableHead className="text-right min-w-[100px]">Net Maaş</TableHead>
                  <TableHead className="text-right min-w-[100px]">SGK İşveren</TableHead>
                  <TableHead className="text-right min-w-[80px]">Yemek</TableHead>
                  <TableHead className="text-right min-w-[80px]">Ulaşım</TableHead>
                  <TableHead className="text-right min-w-[120px]">Toplam Maliyet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCosts.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                        <div className="text-xs text-gray-500">
                          {employee.date_of_birth && (
                            <div>Doğum: {new Date(employee.date_of_birth).toLocaleDateString('tr-TR')}</div>
                          )}
                          {employee.gender && <div>Cinsiyet: {employee.gender}</div>}
                          {employee.marital_status && <div>Medeni: {employee.marital_status}</div>}
                          {employee.id_ssn && <div>TC: {employee.id_ssn}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(employee.net_salary)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(employee.manual_employer_sgk_cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(employee.meal_allowance)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(employee.transport_allowance)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {formatCurrency(employee.total_employer_cost)}
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