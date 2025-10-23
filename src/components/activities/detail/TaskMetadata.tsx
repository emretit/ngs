
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { Star } from "lucide-react";
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <h3 className="text-sm font-medium text-gray-900">Görev Ayarları</h3>
      </div>

      {/* Form Alanları */}
      <div className="space-y-4">
        {/* Görevlendirilen ve Bitiş Tarihi */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Görevlendirilen</label>
            <Select
              value={formData.assignee_id || ''}
              onValueChange={(value) => handleInputChange('assignee_id', value)}
            >
              <SelectTrigger className="h-8">
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

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Bitiş Tarihi</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-8",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? format(date, "dd MMM yyyy") : <span>Tarih seçin</span>}
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
        </div>

        {/* Durum ve Önem */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <label className="text-xs font-medium text-gray-700">Durum</label>
            <Select
              value={formData.status}
              onValueChange={(value) => 
                handleInputChange('status', value as Task['status'])
              }
            >
              <SelectTrigger className="w-32 h-6 text-xs border-0 bg-transparent focus:ring-0 focus:outline-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Yapılacak</SelectItem>
                <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="postponed">Ertelendi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="priority"
              checked={formData.priority === 'high'}
              onCheckedChange={(checked) => handleInputChange('priority', checked ? 'high' : 'medium')}
              className="scale-90"
            />
            <label htmlFor="priority" className="flex items-center space-x-1 cursor-pointer text-sm">
              <Star className={`h-4 w-4 ${formData.priority === 'high' ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}`} />
              <span>Önemli</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskMetadata;
