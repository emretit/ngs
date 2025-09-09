
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Employee, EmployeeLeave } from "@/types/employee";
import { Button } from "@/components/ui/button";
import { Calendar, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmployeeLeaveTabProps {
  employee: Employee;
}

export const EmployeeLeaveTab = ({ employee }: EmployeeLeaveTabProps) => {
  const [leaves, setLeaves] = useState<EmployeeLeave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('employee_leaves')
          .select('*')
          .eq('employee_id', employee.id)
          .order('start_date', { ascending: false });

        if (error) throw error;
        setLeaves(data as EmployeeLeave[]);
      } catch (error) {
        console.error('Error fetching leave data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load leave information",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaves();
  }, [employee.id, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Leave Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary" />
          Leave Management
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Request Leave
        </Button>
      </CardHeader>
      <CardContent>
        {leaves.length > 0 ? (
          <div className="divide-y">
            {leaves.map((leave) => (
              <div key={leave.id} className="py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{leave.leave_type}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                    </p>
                    {leave.reason && (
                      <p className="text-sm mt-1">{leave.reason}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(leave.status)}>
                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No leave records found for this employee.</p>
            <Button variant="outline" className="mt-4">
              <PlusCircle className="h-4 w-4 mr-2" />
              Request Leave
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
