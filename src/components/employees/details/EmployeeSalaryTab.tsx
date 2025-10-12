
import { Employee } from "@/types/employee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SalaryForm } from "./salary/SalaryForm";
import { EmployeeFinancialStatement } from "./salary/EmployeeFinancialStatement";
import { SalaryInfo } from "./salary/SalaryInfo";
import { Plus, FileText, Receipt, Building, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmployeeSalaryTabProps {
  employee: Employee;
  refetch: () => Promise<void>;
}

export const EmployeeSalaryTab = ({ employee, refetch }: EmployeeSalaryTabProps) => {
  const [open, setOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSaveSalary = async (values: any) => {
    setOpen(false);
    setEditingSalary(null);
    await refetch();
    setRefreshTrigger(prev => prev + 1); // Trigger SalaryInfo refresh
  };

  const handleEditSalary = (salaryData: any) => {
    setEditingSalary(salaryData);
    setOpen(true);
  };

  const handleNewSalary = () => {
    setEditingSalary(null);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">💰 Maaş ve Finansal Bilgiler</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewSalary}>
              <Plus className="h-4 w-4 mr-2" />
              Maaş Bilgilerini Düzenle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto p-2">
            <DialogHeader>
              <DialogTitle>
                {editingSalary ? "Maaş Bilgilerini Güncelle" : "Yeni Maaş Kaydı"}
              </DialogTitle>
            </DialogHeader>
            <SalaryForm
              employeeId={employee.id}
              existingSalary={editingSalary}
              onSave={handleSaveSalary}
              onClose={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Finansal Ekstre
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Maaş Bilgileri
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Maaş Ayarları
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-6 mt-6">
          <EmployeeFinancialStatement
            employeeId={employee.id}
            onEdit={handleEditSalary}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="salary" className="space-y-6 mt-6">
          <SalaryInfo
            employeeId={employee.id}
            onEdit={handleEditSalary}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="setup" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Maaş Tanımlamaları ve Ayarlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Bu bölümde çalışanın maaş yapılandırması, otomatik hesaplama ayarları ve
                maaş bileşenlerinin detaylı tanımlamaları yer alır.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">📊 Maaş Bileşenleri</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Net Maaş</li>
                    <li>• SGK İşveren Primi</li>
                    <li>• Yemek Yardımı</li>
                    <li>• Yol Yardımı</li>
                    <li>• Ekstra Primler</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">⚙️ Otomatik Hesaplamalar</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Aylık tahakkuk</li>
                    <li>• SGK hesaplamaları</li>
                    <li>• Vergi hesaplamaları</li>
                    <li>• Kesinti hesaplamaları</li>
                    <li>• Toplam maliyet</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
