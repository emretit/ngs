import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { FormValues } from "./types";
import { useTranslation } from "react-i18next";

interface TaskBasicInfoProps {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
}

const TaskBasicInfo = ({ register, errors, watch, setValue }: TaskBasicInfoProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="title">{t("forms.title")} <span className="text-red-500">*</span></Label>
        <Input
          id="title"
          placeholder={t("forms.activityTitle")}
          {...register("title", { required: t("validation.titleRequired") })}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">{t("forms.description")}</Label>
        <Textarea
          id="description"
          placeholder={t("forms.activityDescription")}
          rows={3}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="type">{t("forms.type")}</Label>
        <Select 
          value={watch("type")} 
          onValueChange={(value) => setValue("type", value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("forms.selectType")} />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[9999]">
            <SelectItem value="general">{t("forms.general")}</SelectItem>
            <SelectItem value="call">{t("forms.call")}</SelectItem>
            <SelectItem value="meeting">{t("forms.meeting")}</SelectItem>
            <SelectItem value="follow_up">{t("forms.followUp")}</SelectItem>
            <SelectItem value="proposal">{t("forms.proposal")}</SelectItem>
            <SelectItem value="opportunity">{t("forms.opportunity")}</SelectItem>
            <SelectItem value="reminder">{t("forms.reminder")}</SelectItem>
            <SelectItem value="email">{t("forms.email")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="status">{t("common.status")} <span className="text-red-500">*</span></Label>
        <Select 
          value={watch("status")} 
          onValueChange={(value) => setValue("status", value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("common.select")} />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[9999]">
            <SelectItem value="todo">{t("activities.status.todo")}</SelectItem>
            <SelectItem value="in_progress">{t("activities.status.in_progress")}</SelectItem>
            <SelectItem value="completed">{t("activities.status.completed")}</SelectItem>
            <SelectItem value="postponed">{t("activities.status.postponed")}</SelectItem>
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
