import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Employee } from "@/types/employee";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeSalaryTabProps {
  employee: Employee;
}

export const EmployeeSalaryTab = ({ employee }: EmployeeSalaryTabProps) => {
  // Fetch salary history from Supabase
  const { data: salaryHistory, isLoading } = useQuery({
    queryKey: ['employee-salary-history', employee.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_salaries')
        .select('*')
        .eq('employee_id', employee.id)
        .order('effective_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const getSalaryTypeColor = (type: string) => {
    switch (type) {
      case 'gross':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'net':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hourly':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'daily':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'weekly':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'daily':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'hourly':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Get the latest salary record
  const latestSalary = salaryHistory && salaryHistory.length > 0 ? salaryHistory[0] : null;

  return (
    <div className="space-y-6">
      {/* Otomatik Maaş Hesaplama Tablosu */}
      {latestSalary && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Otomatik Maaş Hesaplama</h3>
            </div>
            <Badge variant="outline" className="text-xs">
              {formatDate(latestSalary.effective_date)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sol Kolon - Brüt ve Kesintiler */}
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700 font-medium mb-2">BRÜT MAAŞ</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(Number(latestSalary.gross_salary) || 0)}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">KESİNTİLER</h4>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">SGK (Çalışan Payı %{latestSalary.sgk_employee_rate || 14})</span>
                  <span className="text-sm font-semibold text-red-600">
                    -{formatCurrency(Number(latestSalary.sgk_employee_amount) || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">İşsizlik Sigortası (%{latestSalary.unemployment_employee_rate || 1})</span>
                  <span className="text-sm font-semibold text-red-600">
                    -{formatCurrency(Number(latestSalary.unemployment_employee_amount) || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">Gelir Vergisi</span>
                  <span className="text-sm font-semibold text-red-600">
                    -{formatCurrency(Number(latestSalary.income_tax_amount) || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">Damga Vergisi (%{latestSalary.stamp_tax_rate || 0.759})</span>
                  <span className="text-sm font-semibold text-red-600">
                    -{formatCurrency(Number(latestSalary.stamp_tax_amount) || 0)}
                  </span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span className="text-sm font-semibold text-gray-900">Toplam Kesinti</span>
                    <span className="text-base font-bold text-red-700">
                      -{formatCurrency(Number(latestSalary.total_deductions) || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hakediş ve Yardımlar */}
              {(latestSalary.meal_allowance || latestSalary.transport_allowance) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">YARDIMLAR</h4>
                  
                  {latestSalary.meal_allowance && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Yemek Yardımı</span>
                      <span className="text-sm font-semibold text-green-600">
                        +{formatCurrency(Number(latestSalary.meal_allowance) || 0)}
                      </span>
                    </div>
                  )}

                  {latestSalary.transport_allowance && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Ulaşım Yardımı</span>
                      <span className="text-sm font-semibold text-green-600">
                        +{formatCurrency(Number(latestSalary.transport_allowance) || 0)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sağ Kolon - İşveren Maliyeti ve Net */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-medium mb-2">NET MAAŞ</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(Number(latestSalary.net_salary) || 0)}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">İŞVEREN MALİYETLERİ</h4>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">SGK (İşveren Payı %{latestSalary.sgk_employer_rate || 20.5})</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {formatCurrency(Number(latestSalary.sgk_employer_amount) || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">İşsizlik Sigortası (%{latestSalary.unemployment_employer_rate || 3})</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {formatCurrency(Number(latestSalary.unemployment_employer_amount) || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">İş Kazası Sigortası (%{latestSalary.accident_insurance_rate || 2})</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {formatCurrency(Number(latestSalary.accident_insurance_amount) || 0)}
                  </span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <span className="text-sm font-semibold text-gray-900">Toplam İşveren Maliyeti</span>
                    <span className="text-base font-bold text-orange-700">
                      {formatCurrency(Number(latestSalary.total_employer_cost) || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kümülatif Bilgiler */}
              {(latestSalary.cumulative_yearly_gross || latestSalary.cumulative_yearly_tax) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">YILLIK KÜMÜLATİF</h4>
                  
                  {latestSalary.cumulative_yearly_gross && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Yıllık Toplam Brüt</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(latestSalary.cumulative_yearly_gross) || 0)}
                      </span>
                    </div>
                  )}

                  {latestSalary.cumulative_yearly_tax && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Yıllık Toplam Vergi</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(latestSalary.cumulative_yearly_tax) || 0)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Notlar */}
              {latestSalary.notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Notlar:</p>
                  <p className="text-sm text-gray-900">{latestSalary.notes}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Mevcut Maaş Bilgileri */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Mevcut Maaş Bilgileri</h3>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Maaş Kaydı
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Maaş Miktarı</p>
            <p className="text-2xl font-bold text-gray-900">
              {employee.salary_amount ? formatCurrency(employee.salary_amount) : 'Belirtilmemiş'}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Para Birimi</p>
            <Badge variant="outline" className="text-sm">
              {employee.salary_currency || 'TRY'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Maaş Türü</p>
            <Badge 
              variant="outline" 
              className={`text-sm ${getSalaryTypeColor(employee.salary_type || 'gross')}`}
            >
              {employee.salary_type === 'gross' ? 'Brüt' : 
               employee.salary_type === 'net' ? 'Net' :
               employee.salary_type === 'hourly' ? 'Saatlik' :
               employee.salary_type === 'daily' ? 'Günlük' : 'Brüt'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Ödeme Sıklığı</p>
            <Badge 
              variant="outline" 
              className={`text-sm ${getPaymentFrequencyColor(employee.payment_frequency || 'monthly')}`}
            >
              {employee.payment_frequency === 'monthly' ? 'Aylık' :
               employee.payment_frequency === 'weekly' ? 'Haftalık' :
               employee.payment_frequency === 'daily' ? 'Günlük' :
               employee.payment_frequency === 'hourly' ? 'Saatlik' : 'Aylık'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Başlangıç Tarihi</p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-900">
                {employee.salary_start_date ? formatDate(employee.salary_start_date) : 'Belirtilmemiş'}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Notlar</p>
            <p className="text-sm text-gray-900">
              {employee.salary_notes || 'Not bulunmuyor'}
            </p>
          </div>
        </div>
      </Card>

      {/* Maaş Geçmişi */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Maaş Geçmişi</h3>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            Düzenle
          </Button>
        </div>

        {salaryHistory && salaryHistory.length > 0 ? (
          <div className="space-y-3">
            {salaryHistory.map((salary, index) => (
              <div key={salary.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(salary.amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(salary.effective_date)} tarihinden itibaren
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getSalaryTypeColor(salary.type)}`}
                  >
                    {salary.type === 'gross' ? 'Brüt' : 
                     salary.type === 'net' ? 'Net' :
                     salary.type === 'hourly' ? 'Saatlik' :
                     salary.type === 'daily' ? 'Günlük' : salary.type}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getPaymentFrequencyColor(salary.payment_frequency)}`}
                  >
                    {salary.payment_frequency === 'monthly' ? 'Aylık' :
                     salary.payment_frequency === 'weekly' ? 'Haftalık' :
                     salary.payment_frequency === 'daily' ? 'Günlük' :
                     salary.payment_frequency === 'hourly' ? 'Saatlik' : salary.payment_frequency}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Maaş Geçmişi Bulunamadı</h3>
            <p className="text-gray-600 mb-4">Bu çalışan için henüz maaş geçmişi kaydı bulunmuyor.</p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              İlk Maaş Kaydını Ekle
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
