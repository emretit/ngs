
import { useState } from "react";
import { logger } from '@/utils/logger';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface NewTaskFormProps {
  relatedItemId?: string;
  relatedItemTitle?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const NewTaskForm = ({ 
  relatedItemId,
  relatedItemTitle,
  onSuccess, 
  onCancel 
}: NewTaskFormProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'priority') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value as 'low' | 'medium' | 'high' 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: 'todo',
          type: relatedItemId ? 'opportunity' : 'general',
          due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
          related_item_id: relatedItemId || null,
          related_item_title: relatedItemTitle || null
        });

      if (error) throw error;
      
      toast.success(t("forms.activityCreated"));
      onSuccess();
    } catch (error) {
      logger.error('Error creating task:', error);
      toast.error(t("forms.activityCreateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4 border border-blue-100 bg-blue-50">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="title">{t("forms.activityTitle")}</Label>
          <Input
            id="title"
            name="title"
            placeholder={t("forms.activityTitle")}
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">{t("forms.description")}</Label>
          <Textarea
            id="description"
            name="description"
            placeholder={t("forms.activityDescription")}
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority">{t("forms.priority")}</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => handleSelectChange("priority", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("forms.selectPriority")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t("forms.low")}</SelectItem>
                <SelectItem value="medium">{t("forms.medium")}</SelectItem>
                <SelectItem value="high">{t("forms.high")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="due_date">{t("forms.dueDate")}</Label>
            <Input
              id="due_date"
              name="due_date"
              type="date"
              value={formData.due_date}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting || !formData.title}
          >
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default NewTaskForm;
