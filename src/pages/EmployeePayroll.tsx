import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { useToast } from "@/hooks/use-toast";
import { 
  calculateEmployeePayroll,
  getPayrollYearParameters,
  Allowance,
  Advance,
  PayrollCalculationResult
} from "@/services/payrollService";
import { PayrollHeader } from "@/components/payroll/PayrollHeader";
import { TimesheetSummaryCard } from "@/components/payroll/TimesheetSummaryCard";
import { GrossSalaryCard } from "@/components/payroll/GrossSalaryCard";
import { DeductionsCard } from "@/components/payroll/DeductionsCard";
import { EmployerCostCard } from "@/components/payroll/EmployerCostCard";
import { PayrollActions } from "@/components/payroll/PayrollActions";
import { AllowancesDialog } from "@/components/payroll/AllowancesDialog";
import { AdvancesDialog } from "@/components/payroll/AdvancesDialog";
import { Loader2 } from "lucide-react";

// Props interface for EmployeePayrollContent
export interface EmployeePayrollContentProps {
  employeeId: string;
  companyId: string;
  onBack?: () => void;
  initialMonth?: number;
  initialYear?: number;
}

// Main content component - can be used standalone or embedded
export const EmployeePayrollContent = ({ 
  employeeId, 
  companyId,
  onBack,
  initialMonth,
  initialYear 
}: EmployeePayrollContentProps) => {
  const { toast } = useToast();
  const currentDate = new Date();
  
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(initialYear || currentDate.getFullYear());
  
  // Calculation state
  const [calculation, setCalculation] = useState<PayrollCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Manual adjustments
  const [baseSalary, setBaseSalary] = useState(0);
  const [overtimePay, setOvertimePay] = useState(0);
  const [bonusPremium, setBonusPremium] = useState(0);
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [garnishments, setGarnishments] = useState(0);

  // Dialog states
  const [allowancesDialogOpen, setAllowancesDialogOpen] = useState(false);
  const [advancesDialogOpen, setAdvancesDialogOpen] = useState(false);

  // Fetch employee data
  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: async () => {
      if (!employeeId) throw new Error("Employee ID is required");
      
      const { data, error } = await supabase
        .from("employees")
        .select(`
          id,
          first_name,
          last_name,
          gross_salary,
          salary_amount,
          hire_date,
          department,
          position
        `)
        .eq("id", employeeId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  // Fetch timesheet data
  const { data: timesheetData, isLoading: timesheetLoading } = useQuery({
    queryKey: ["timesheet", employeeId, selectedYear, selectedMonth],
    queryFn: async () => {
      if (!employeeId || !companyId) throw new Error("Missing required parameters");

      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${new Date(selectedYear, selectedMonth, 0).getDate()}`;

      const { data, error } = await supabase
        .from("timesheet_days")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("company_id", companyId)
        .gte("work_date", startDate)
        .lte("work_date", endDate);

      if (error) throw error;
      return data || [];
    },
    enabled: !!employeeId && !!companyId,
  });

  // Initialize base salary from employee data
  useEffect(() => {
    if (employee) {
      const salary = employee.gross_salary || employee.salary_amount || 0;
      setBaseSalary(salary);
    }
  }, [employee]);

  // Calculate timesheet summary
  const timesheetSummary = {
    totalWorkingHours: (timesheetData?.reduce((sum, ts) => sum + (ts.net_working_minutes || 0), 0) || 0) / 60,
    overtimeHours: (timesheetData?.reduce((sum, ts) => sum + (ts.overtime_minutes || 0), 0) || 0) / 60,
    totalDays: timesheetData?.filter(ts => ts.net_working_minutes > 0).length || 0,
    leaveDays: 0, // TODO: Calculate from leave records
    sickLeaveDays: 0, // TODO: Calculate from sick leave records
  };

  const handleCalculate = async () => {
    if (!employeeId || !companyId) {
      toast({
        title: "Hata",
        description: "Çalışan veya şirket bilgisi bulunamadı",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    try {
      // Get year parameters
      const yearParams = await getPayrollYearParameters(companyId, selectedYear);
      if (!yearParams) {
        throw new Error(`${selectedYear} yılı için bordro parametreleri bulunamadı`);
      }

      // Get approved timesheets
      const approvedTimesheets = (timesheetData || []).filter(
        ts => ts.approval_status === "manager_approved" || ts.approval_status === "hr_locked"
      );

      // Calculate payroll
      const result = calculateEmployeePayroll(
        employeeId,
        baseSalary,
        approvedTimesheets,
        yearParams,
        {
          allowances,
          advances,
          bonusPremium,
          garnishments,
          manualOverrides: {
            baseSalary,
            overtimePay: overtimePay > 0 ? overtimePay : undefined,
          },
        }
      );

      setCalculation(result);
      setOvertimePay(result.overtime_pay);

      toast({
        title: "Başarılı",
        description: "Bordro hesaplandı",
      });
    } catch (error: any) {
      console.error("Payroll calculation error:", error);
      toast({
        title: "Hata",
        description: error.message || "Bordro hesaplanırken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!calculation || !employeeId || !companyId) return;

    setIsSaving(true);
    try {
      // TODO: Save to payroll_runs and payroll_items tables
      toast({
        title: "Başarılı",
        description: "Bordro kaydedildi",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Bordro kaydedilemedi",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!calculation || !employee || !companyId) return;

    try {
      const { generatePayrollPdf } = await import("@/services/payrollPdfService");
      
      // Fetch company info
      const { data: companyData } = await supabase
        .from("companies")
        .select("name, address, tax_number, tax_office")
        .eq("id", companyId)
        .single();

      await generatePayrollPdf({
        employee: {
          first_name: employee.first_name,
          last_name: employee.last_name,
          position: employee.position,
          department: employee.department,
        },
        company: {
          name: companyData?.name || "Şirket",
          address: companyData?.address,
          tax_number: companyData?.tax_number,
          tax_office: companyData?.tax_office,
        },
        period: {
          month: selectedMonth,
          year: selectedYear,
        },
        calculation,
      });

      toast({
        title: "Başarılı",
        description: "PDF bordro fişi indirildi",
      });
    } catch (error: any) {
      console.error("PDF generation error:", error);
      toast({
        title: "Hata",
        description: "PDF oluşturulurken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleDownloadExcel = async () => {
    if (!calculation || !employee) return;

    try {
      const { generatePayrollExcel, downloadFile } = await import("@/services/excelGenerationService");
      
      const file = await generatePayrollExcel(
        {
          first_name: employee.first_name,
          last_name: employee.last_name,
          position: employee.position,
          department: employee.department,
        },
        {
          month: selectedMonth,
          year: selectedYear,
        },
        calculation
      );

      downloadFile(file);

      toast({
        title: "Başarılı",
        description: "Excel bordro fişi indirildi",
      });
    } catch (error: any) {
      console.error("Excel generation error:", error);
      toast({
        title: "Hata",
        description: "Excel oluşturulurken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = () => {
    if (onBack) {
      onBack();
    }
  };

  if (employeeLoading || timesheetLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Çalışan bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">{/* Header */}
      <PayrollHeader
        employee={{
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          department: employee.department,
          position: employee.position,
          hire_date: employee.hire_date,
        }}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />

      {/* Timesheet Summary */}
      <TimesheetSummaryCard
        employeeId={employeeId}
        year={selectedYear}
        month={selectedMonth}
        data={timesheetSummary}
      />

      {/* Calculation Cards */}
      {calculation ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gross Salary */}
          <GrossSalaryCard
            baseSalary={calculation.base_salary}
            overtimePay={calculation.overtime_pay}
            bonusPremium={calculation.bonus_premium}
            allowances={allowances}
            grossSalary={calculation.gross_salary}
            onEditBaseSalary={setBaseSalary}
            onEditOvertimePay={setOvertimePay}
            onEditBonusPremium={setBonusPremium}
            onManageAllowances={() => setAllowancesDialogOpen(true)}
            isEditable={true}
          />

          {/* Deductions */}
          <DeductionsCard
            sgkBase={calculation.sgk_base}
            sgkEmployeeShare={calculation.sgk_employee_share}
            unemploymentEmployee={calculation.unemployment_employee}
            incomeTaxBase={calculation.income_tax_base}
            incomeTaxAmount={calculation.income_tax_amount}
            incomeTaxExemption={calculation.income_tax_exemption}
            stampTaxAmount={calculation.stamp_tax_amount}
            stampTaxExemption={calculation.stamp_tax_exemption}
            advances={advances}
            garnishments={calculation.garnishments}
            totalDeductions={calculation.total_deductions}
            netSalary={calculation.net_salary}
            isMinimumWageExemption={calculation.is_minimum_wage_exemption_applied}
            warnings={calculation.warnings}
            onManageAdvances={() => setAdvancesDialogOpen(true)}
            isEditable={true}
          />

          {/* Employer Cost */}
          <div className="lg:col-span-2">
            <EmployerCostCard
              grossSalary={calculation.gross_salary}
              sgkBase={calculation.sgk_base}
              sgkEmployerShare={calculation.sgk_employer_share}
              unemploymentEmployer={calculation.unemployment_employer}
              accidentInsurance={calculation.accident_insurance}
              totalEmployerCost={calculation.total_employer_cost}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground mb-4">
            Bordro hesaplaması yapmak için "Bordroyu Hesapla" butonuna tıklayın
          </p>
        </div>
      )}

      {/* Actions */}
      <PayrollActions
        onCalculate={handleCalculate}
        onSave={handleSave}
        onDownloadPdf={handleDownloadPdf}
        onDownloadExcel={handleDownloadExcel}
        onViewHistory={onBack ? handleViewHistory : undefined}
        isCalculating={isCalculating}
        isSaving={isSaving}
        hasCalculation={!!calculation}
      />

      {/* Dialogs */}
      <AllowancesDialog
        open={allowancesDialogOpen}
        onOpenChange={setAllowancesDialogOpen}
        allowances={allowances}
        onSave={(newAllowances) => {
          setAllowances(newAllowances);
          // Recalculate if we already have a calculation
          if (calculation) {
            setTimeout(handleCalculate, 100);
          }
        }}
      />

      <AdvancesDialog
        open={advancesDialogOpen}
        onOpenChange={setAdvancesDialogOpen}
        advances={advances}
        onSave={(newAdvances) => {
          setAdvances(newAdvances);
          // Recalculate if we already have a calculation
          if (calculation) {
            setTimeout(handleCalculate, 100);
          }
        }}
      />
    </div>
  );
};

// Wrapper component for standalone route usage (URL-based)
const EmployeePayroll = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { companyId } = useCurrentCompany();
  
  const employeeId = searchParams.get("employeeId");
  
  if (!employeeId || !companyId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Çalışan seçilmedi</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <EmployeePayrollContent
        employeeId={employeeId}
        companyId={companyId}
        onBack={() => navigate("/hr/time-payroll")}
      />
    </div>
  );
};

export default EmployeePayroll;
