
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

interface TaskMetadataProps {
  formData: Task;
  date: Date | undefined;
  handleInputChange: (key: keyof Task, value: any) => void;
  handleDateChange: (date: Date | undefined) => void;
}

const TaskMetadata = ({ 
  formData, 
  date, 
  handleInputChange, 
  handleDateChange 
}: TaskMetadataProps) => {
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, avatar_url")
        .eq("status", "aktif");

      if (error) throw error;
      return data || [];
    }
  });

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Görevlendirilen</label>
        <Select
          value={formData.assignee_id || ''}
          onValueChange={(value) => handleInputChange('assignee_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Görevlendirilecek kişiyi seçin" />
          </SelectTrigger>
          <SelectContent>
            {employees?.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Bitiş Tarihi</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "PPP") : <span>Tarih seçin</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Durum</label>
        <Select
          value={formData.status}
          onValueChange={(value) => 
            handleInputChange('status', value as Task['status'])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Durum seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">Yapılacak</SelectItem>
            <SelectItem value="in_progress">Devam Ediyor</SelectItem>
            <SelectItem value="completed">Tamamlandı</SelectItem>
            <SelectItem value="postponed">Ertelendi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Öncelik</label>
        <Select
          value={formData.priority}
          onValueChange={(value) => 
            handleInputChange('priority', value as Task['priority'])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Öncelik seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Düşük</SelectItem>
            <SelectItem value="medium">Orta</SelectItem>
            <SelectItem value="high">Yüksek</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default TaskMetadata;
