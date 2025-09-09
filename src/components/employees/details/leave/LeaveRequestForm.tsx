
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

interface LeaveRequestFormProps {
  form: UseFormReturn<{
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    notes: string;
  }>;
  onSubmit: (values: any) => Promise<void>;
}

export const LeaveRequestForm = ({ form, onSubmit }: LeaveRequestFormProps) => {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
      <FormField
        control={form.control}
        name="leave_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>İzin Türü</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="İzin türü seçin" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="annual">Yıllık İzin</SelectItem>
                <SelectItem value="sick">Hastalık İzni</SelectItem>
                <SelectItem value="parental">Doğum İzni</SelectItem>
                <SelectItem value="unpaid">Ücretsiz İzin</SelectItem>
                <SelectItem value="other">Diğer</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Başlangıç Tarihi</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bitiş Tarihi</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>İzin Nedeni</FormLabel>
            <FormControl>
              <Textarea {...field} />
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
            <FormLabel>Notlar</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex justify-end">
        <Button type="submit">İzin Talebi Oluştur</Button>
      </div>
    </form>
  );
};
