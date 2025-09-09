
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { PerformanceFormValues, PerformanceRecord } from "./types";

export const usePerformanceForm = (
  employeeId: string,
  onSuccess: (record: PerformanceRecord) => void,
  onClose: () => void
) => {
  const { toast } = useToast();
  
  const form = useForm<PerformanceFormValues>({
    defaultValues: {
      review_period: new Date().toLocaleDateString('en-CA').substring(0, 7), // YYYY-MM format
      technical_score: 3,
      communication_score: 3,
      teamwork_score: 3,
      leadership_score: 3,
      strengths: '',
      areas_for_improvement: '',
      goals: '',
      notes: '',
    }
  });

  const handleSubmit = async (values: PerformanceFormValues) => {
    try {
      // Calculate overall score
      const overall = (
        parseFloat(values.technical_score.toString()) + 
        parseFloat(values.communication_score.toString()) + 
        parseFloat(values.teamwork_score.toString()) + 
        parseFloat(values.leadership_score.toString())
      ) / 4;
      
      // This is a placeholder until the actual performance table is created
      const newRecord: PerformanceRecord = {
        id: Date.now().toString(),
        employee_id: employeeId,
        review_period: values.review_period,
        reviewer_id: 'current-user',
        reviewer_name: 'Current User',
        technical_score: parseFloat(values.technical_score.toString()),
        communication_score: parseFloat(values.communication_score.toString()),
        teamwork_score: parseFloat(values.teamwork_score.toString()),
        leadership_score: parseFloat(values.leadership_score.toString()),
        overall_score: overall,
        strengths: values.strengths,
        areas_for_improvement: values.areas_for_improvement,
        goals: values.goals,
        notes: values.notes,
        created_at: new Date().toISOString()
      };
      
      onSuccess(newRecord);
      onClose();
      
      toast({
        title: "Başarılı",
        description: "Performans değerlendirmesi kaydedildi.",
      });
    } catch (error) {
      console.error('Error saving performance data:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Performans değerlendirmesi kaydedilirken bir hata oluştu.",
      });
    }
  };

  return {
    form,
    handleSubmit: form.handleSubmit(handleSubmit)
  };
};
