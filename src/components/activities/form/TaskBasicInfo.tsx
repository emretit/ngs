
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { FormValues } from "./types";

interface TaskBasicInfoProps {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
}

const TaskBasicInfo = ({ register, errors, watch, setValue }: TaskBasicInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Başlık <span className="text-red-500">*</span></Label>
        <Input
          id="title"
          placeholder="Aktivite başlığı"
          {...register("title", { required: "Başlık zorunludur" })}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          placeholder="Aktivite açıklaması"
          rows={3}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="type">Tür</Label>
        <Select 
          value={watch("type")} 
          onValueChange={(value) => setValue("type", value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tür seçin" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[9999]">
            <SelectItem value="general">Genel</SelectItem>
            <SelectItem value="call">Arama</SelectItem>
            <SelectItem value="meeting">Toplantı</SelectItem>
            <SelectItem value="follow_up">Takip</SelectItem>
            <SelectItem value="proposal">Teklif</SelectItem>
            <SelectItem value="opportunity">Fırsat</SelectItem>
            <SelectItem value="reminder">Hatırlatma</SelectItem>
            <SelectItem value="email">E-posta</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="status">Durum <span className="text-red-500">*</span></Label>
        <Select 
          value={watch("status")} 
          onValueChange={(value) => setValue("status", value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Durum seçin" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[9999]">
            <SelectItem value="todo">Yapılacak</SelectItem>
            <SelectItem value="in_progress">Devam Ediyor</SelectItem>
            <SelectItem value="completed">Tamamlandı</SelectItem>
            <SelectItem value="postponed">Ertelendi</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-sm text-red-500">{errors.status.message}</p>
        )}
      </div>
    </div>
  );
};

export default TaskBasicInfo;
