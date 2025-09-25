
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form";
import { FormValues } from "./types";
import { Star } from "lucide-react";

interface TaskMetadataProps {
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  errors: FieldErrors<FormValues>;
}

const TaskMetadata = ({ watch, setValue, errors }: TaskMetadataProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Switch
          id="is_important"
          checked={watch("is_important")}
          onCheckedChange={(checked) => setValue("is_important", checked)}
        />
        <Label htmlFor="is_important" className="flex items-center space-x-2 cursor-pointer">
          <Star className={`h-4 w-4 ${watch("is_important") ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}`} />
          <span>Önemli</span>
        </Label>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="due_date">Son Tarih</Label>
        <DatePicker 
          date={watch("due_date")} 
          onSelect={(date) => setValue("due_date", date)} 
          placeholder="Son tarih seçin" 
        />
      </div>
    </div>
  );
};

export default TaskMetadata;
