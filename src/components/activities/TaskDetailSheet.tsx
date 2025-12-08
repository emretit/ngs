
import { useState, useEffect } from "react";
import { CalendarIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { Task } from "@/types/task";

interface TaskDetailSheetProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskDetailSheet = ({ task, isOpen, onClose }: TaskDetailSheetProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Task | null>(null);

  useEffect(() => {
    if (task) {
      setFormData(task);
    }
  }, [task]);

  const updateTaskMutation = useMutation({
    mutationFn: async (updatedTask: Partial<Task>) => {
      if (!task?.id) throw new Error('Task ID is required');

      const { data, error } = await supabase
        .from('activities')
        .update(updatedTask as any)
        .eq('id', task.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success(t('toast.activityUpdated'));
      onClose();
    },
    onError: (error) => {
      toast.error(t('toast.activityUpdateError'));
      console.error('Update error:', error);
    }
  });

  const handleSave = () => {
    if (!formData) return;
    updateTaskMutation.mutate(formData);
  };

  const handleInputChange = (key: keyof Task, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [key]: value });
  };

  if (!formData) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <h2 className="text-lg font-semibold text-foreground">{t("activities.title")}</h2>
        </SheetHeader>
        
        <div className="py-4 space-y-6">
          <Textarea
            placeholder={t("forms.addDescription")}
            value={formData.description || ""}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={updateTaskMutation.isPending}>
              {updateTaskMutation.isPending ? (
                t("common.saving")
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("common.save")}
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailSheet;
