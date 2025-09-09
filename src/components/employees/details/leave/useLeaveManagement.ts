
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";

interface LeaveRecord {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'parental' | 'unpaid' | 'other';
  start_date: string;
  end_date: string;
  total_days: number;
  status: 'approved' | 'pending' | 'rejected';
  reason: string;
  notes: string | null;
  approved_by: string | null;
  created_at: string;
}

interface LeaveBalance {
  annual: number;
  sick: number;
  parental: number;
  unpaid: number;
  other: number;
}

export const useLeaveManagement = (employeeId: string) => {
  const [leaveHistory, setLeaveHistory] = useState<LeaveRecord[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({
    annual: 20,
    sick: 10,
    parental: 5,
    unpaid: 0,
    other: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      leave_type: 'annual',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
    }
  });

  useEffect(() => {
    const fetchLeaveHistory = async () => {
      try {
        setIsLoading(true);
        // This is a placeholder until the actual leave table is created
        // Using mock data for now
        const mockData: LeaveRecord[] = [
          {
            id: '1',
            employee_id: employeeId,
            leave_type: 'annual',
            start_date: '2023-06-10',
            end_date: '2023-06-20',
            total_days: 10,
            status: 'approved',
            reason: 'Yıllık izin',
            notes: null,
            approved_by: 'Some Manager',
            created_at: '2023-05-01T00:00:00Z'
          },
          {
            id: '2',
            employee_id: employeeId,
            leave_type: 'sick',
            start_date: '2023-03-15',
            end_date: '2023-03-18',
            total_days: 3,
            status: 'approved',
            reason: 'Hastalık izni',
            notes: 'Doktor raporu ile',
            approved_by: 'Some Manager',
            created_at: '2023-03-14T00:00:00Z'
          },
          {
            id: '3',
            employee_id: employeeId,
            leave_type: 'annual',
            start_date: '2023-12-25',
            end_date: '2023-12-29',
            total_days: 5,
            status: 'pending',
            reason: 'Yıl sonu tatili',
            notes: null,
            approved_by: null,
            created_at: '2023-11-10T00:00:00Z'
          }
        ];
        
        setLeaveHistory(mockData);
      } catch (error) {
        console.error('Error fetching leave history:', error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "İzin bilgileri yüklenirken bir hata oluştu.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaveHistory();
  }, [employeeId, toast]);

  const handleSubmit = async (values: any) => {
    try {
      const startDate = new Date(values.start_date);
      const endDate = new Date(values.end_date);
      
      // Calculate days difference
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      
      if (startDate > endDate) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Başlangıç tarihi bitiş tarihinden sonra olamaz.",
        });
        return;
      }
      
      // This is a placeholder until the actual leave table is created
      console.log('Submitted leave data:', { 
        ...values, 
        employee_id: employeeId,
        total_days: diffDays
      });
      
      toast({
        title: "Başarılı",
        description: "İzin talebi kaydedildi.",
      });
      setIsFormOpen(false);
      
      // Add the new record to the state (simulating DB update)
      const newRecord: LeaveRecord = {
        id: Date.now().toString(),
        employee_id: employeeId,
        leave_type: values.leave_type as any,
        start_date: values.start_date,
        end_date: values.end_date,
        total_days: diffDays,
        status: 'pending',
        reason: values.reason,
        notes: values.notes,
        approved_by: null,
        created_at: new Date().toISOString()
      };
      
      setLeaveHistory([...leaveHistory, newRecord]);
      
      // Update leave balance
      setLeaveBalance({
        ...leaveBalance,
        [values.leave_type]: leaveBalance[values.leave_type as keyof typeof leaveBalance] - diffDays
      });
    } catch (error) {
      console.error('Error saving leave data:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İzin talebi kaydedilirken bir hata oluştu.",
      });
    }
  };

  return {
    leaveHistory,
    leaveBalance,
    isLoading,
    isFormOpen,
    setIsFormOpen,
    form,
    handleSubmit
  };
};

export const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getLeaveTypeDisplay = (type: string) => {
  switch (type) {
    case 'annual':
      return 'Yıllık İzin';
    case 'sick':
      return 'Hastalık İzni';
    case 'parental':
      return 'Doğum İzni';
    case 'unpaid':
      return 'Ücretsiz İzin';
    case 'other':
      return 'Diğer';
    default:
      return type;
  }
};
