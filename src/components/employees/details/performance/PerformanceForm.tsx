
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePerformanceForm } from "./usePerformanceForm";
import { PerformanceRecord } from "./types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

interface PerformanceFormProps {
  employeeId: string;
  onSuccess: (record: PerformanceRecord) => void;
  onClose: () => void;
}

export const PerformanceForm = ({ 
  employeeId, 
  onSuccess,
  onClose 
}: PerformanceFormProps) => {
  const { form, handleSubmit } = usePerformanceForm(employeeId, onSuccess, onClose);

  const renderScoreField = (
    name: "technical_score" | "communication_score" | "teamwork_score" | "leadership_score",
    label: string,
    description: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <div className="flex justify-between items-center">
            <FormLabel>{label}</FormLabel>
            <span className="text-sm font-medium">{field.value}/5</span>
          </div>
          <FormControl>
            <Slider
              min={1}
              max={5}
              step={0.5}
              value={[field.value]}
              onValueChange={(values) => field.onChange(values[0])}
            />
          </FormControl>
          <p className="text-xs text-muted-foreground">{description}</p>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="review_period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Değerlendirme Dönemi</FormLabel>
              <FormControl>
                <Input type="month" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator className="my-4" />
        
        <div className="space-y-4">
          <h3 className="text-md font-medium">Performans Puanları</h3>
          
          {renderScoreField(
            "technical_score",
            "Teknik Yetkinlik",
            "Teknik bilgi, problemleri çözme ve uzmanlık becerileri"
          )}
          
          {renderScoreField(
            "communication_score",
            "İletişim Becerileri",
            "Sözlü ve yazılı iletişim, sunum ve raporlama becerileri"
          )}
          
          {renderScoreField(
            "teamwork_score",
            "Takım Çalışması",
            "İş birliği, takım içinde uyum ve ortak hedeflere katkı"
          )}
          
          {renderScoreField(
            "leadership_score",
            "Liderlik",
            "İnisiyatif alma, sorumluluk üstlenme ve diğerlerini yönlendirme"
          )}
        </div>

        <Separator className="my-4" />
        
        <FormField
          control={form.control}
          name="strengths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Güçlü Yönler</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="areas_for_improvement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gelişim Alanları</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="goals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hedefler</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ek Notlar</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit">
            Kaydet
          </Button>
        </div>
      </form>
    </Form>
  );
};
