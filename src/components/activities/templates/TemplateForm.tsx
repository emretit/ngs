import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskType } from "@/types/task";
import { CreateTemplateData } from "@/types/template";
import TaskRecurrence from "../form/TaskRecurrence";
import { useState } from "react";
import { RefreshCw, Star } from "lucide-react";

const templateFormSchema = z.object({
  name: z.string().min(1, "Şablon adı gereklidir"),
  description: z.string().optional(),
  template_data: z.object({
    title: z.string().min(1, "Başlık gereklidir"),
    description: z.string().optional(),
    is_important: z.boolean().optional(),
    type: z.enum(["general", "opportunity", "proposal", "service"]),
    estimated_duration: z.number().optional(),
    is_recurring: z.boolean().optional(),
    recurrence_type: z.enum(['none', 'daily', 'weekly', 'monthly', 'custom']).optional(),
    recurrence_interval: z.number().optional(),
    recurrence_days: z.array(z.string()).optional(),
    recurrence_day_of_month: z.number().optional(),
  }),
  is_public: z.boolean().optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface TemplateFormProps {
  onSubmit: (data: CreateTemplateData) => void;
  onCancel: () => void;
  initialData?: Partial<TemplateFormValues>;
}

export const TemplateForm = ({ onSubmit, onCancel, initialData }: TemplateFormProps) => {
  const [showRecurrence, setShowRecurrence] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      template_data: {
        title: initialData?.template_data?.title || "",
        description: initialData?.template_data?.description || "",
        is_important: initialData?.template_data?.is_important || false,
        type: initialData?.template_data?.type || "general",
        estimated_duration: initialData?.template_data?.estimated_duration,
        is_recurring: initialData?.template_data?.is_recurring || false,
        recurrence_type: initialData?.template_data?.recurrence_type || 'none',
        recurrence_interval: initialData?.template_data?.recurrence_interval,
        recurrence_days: initialData?.template_data?.recurrence_days || [],
        recurrence_day_of_month: initialData?.template_data?.recurrence_day_of_month,
      },
      is_public: initialData?.is_public || false,
    },
  });

  const watchedIsRecurring = watch("template_data.is_recurring");

  const handleFormSubmit = (data: TemplateFormValues) => {
    onSubmit({
      name: data.name,
      description: data.description,
      template_data: {
        ...data.template_data,
        title: data.template_data.title || "Şablon Görevi",
        type: data.template_data.type || "general"
      },
      is_public: data.is_public,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Şablon Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Şablon Adı *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Örn: Müşteri Takip Görevi"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Bu şablonun ne için kullanıldığını açıklayın"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              {...register("is_public")}
            />
            <Label htmlFor="is_public">Herkesle paylaş</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktivite Şablonu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template_title">Başlık *</Label>
            <Input
              id="template_title"
              {...register("template_data.title")}
              placeholder="Aktivite başlığı"
            />
            {errors.template_data?.title && (
              <p className="text-sm text-red-500">{errors.template_data.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="template_description">Açıklama</Label>
            <Textarea
              id="template_description"
              {...register("template_data.description")}
              placeholder="Aktivite açıklaması"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Switch
                id="template_is_important"
                checked={watch("template_data.is_important")}
                onCheckedChange={(checked) => setValue("template_data.is_important", checked)}
              />
              <Label htmlFor="template_is_important" className="flex items-center space-x-2 cursor-pointer">
                <Star className={`h-4 w-4 ${watch("template_data.is_important") ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}`} />
                <span>Önemli</span>
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Tür</Label>
                <Select
                  value={watch("template_data.type")}
                  onValueChange={(value: string) => {
                    const validTypes = ["general", "opportunity", "proposal", "service"] as const;
                    if (validTypes.includes(value as any)) {
                      setValue("template_data.type", value as "general" | "opportunity" | "proposal" | "service");
                    }
                  }}
                >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Genel</SelectItem>
                  <SelectItem value="opportunity">Fırsat</SelectItem>
                  <SelectItem value="proposal">Teklif</SelectItem>
                  <SelectItem value="service">Servis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_duration">Tahmini Süre (dakika)</Label>
            <Input
              id="estimated_duration"
              type="number"
              {...register("template_data.estimated_duration", { valueAsNumber: true })}
              placeholder="60"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_recurring"
              checked={watchedIsRecurring}
              onCheckedChange={(checked) => {
                setValue("template_data.is_recurring", checked);
                setShowRecurrence(checked);
              }}
            />
            <Label htmlFor="is_recurring">Tekrar eden görev</Label>
          </div>

          {watchedIsRecurring && (
            <div className="border-l-4 border-blue-200 pl-4">
              <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <Label className="text-base font-medium">Tekrarlama Ayarları</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tekrarlama Sıklığı</Label>
                    <Select 
                      value={watch("template_data.recurrence_type") || 'none'} 
                      onValueChange={(value) => setValue("template_data.recurrence_type", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sıklık seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">🗓️ Günlük</SelectItem>
                        <SelectItem value="weekly">📅 Haftalık</SelectItem>
                        <SelectItem value="monthly">📆 Aylık</SelectItem>
                        <SelectItem value="custom">⚙️ Özel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {watch("template_data.recurrence_type") === 'custom' && (
                    <div className="space-y-2">
                      <Label>Özel Aralık</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          value={watch("template_data.recurrence_interval") || 1}
                          onChange={(e) => setValue("template_data.recurrence_interval", parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                        <span className="flex items-center text-sm text-muted-foreground">günde bir</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" onClick={handleSubmit(handleFormSubmit)}>
          Şablonu Kaydet
        </Button>
      </div>
    </div>
  );
};