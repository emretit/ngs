
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form";
import { FormValues } from "./types";

interface TaskMetadataProps {
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  errors: FieldErrors<FormValues>;
}

const TaskMetadata = ({ watch, setValue, errors }: TaskMetadataProps) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="priority">Öncelik</Label>
        <Select 
          value={watch("priority")} 
          onValueChange={(value) => setValue("priority", value as any)}
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
