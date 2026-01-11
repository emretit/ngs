
import React from "react";
import { logger } from '@/utils/logger';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toastUtils";
import { ContactHistoryItem } from "@/types/crm";

const formSchema = z.object({
  contact_type: z.enum(["call", "email", "meeting", "other"]),
  date: z.string().min(1, "Tarih zorunludur"),
  notes: z.string().min(1, "Not zorunludur")
});

interface NewContactFormProps {
  opportunityId: string;
  onSubmit: (newContact: Omit<ContactHistoryItem, "id">) => Promise<void>;
  onCancel: () => void;
}

const NewContactForm: React.FC<NewContactFormProps> = ({ opportunityId, onSubmit, onCancel }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contact_type: "call",
      date: new Date().toISOString().split("T")[0],
      notes: ""
    }
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Create new contact history entry
      const newContact: Omit<ContactHistoryItem, "id"> = {
        contact_type: values.contact_type as "call" | "email" | "meeting" | "other",
        date: values.date,
        notes: values.notes,
        employee_name: "Mevcut Kullanıcı" // This would be replaced with actual user data
      };

      await onSubmit(newContact);
      showSuccess("İletişim kaydı başarıyla eklendi", { duration: 1000 });
      form.reset();
      
    } catch (error) {
      logger.error("Error adding contact:", error);
      showError("İletişim kaydedilemedi");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="contact_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İletişim Tipi</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="İletişim tipi seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="call">Arama</SelectItem>
                  <SelectItem value="email">E-posta</SelectItem>
                  <SelectItem value="meeting">Toplantı</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tarih</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
                <Textarea {...field} placeholder="İletişim detaylarını girin" rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
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

export default NewContactForm;
