import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Bank { id: string; name: string; short_name?: string | null }

export interface CheckRecord {
  id?: string;
  check_number?: string;
  issue_date?: string;
  due_date?: string;
  amount?: number;
  bank?: string;
  payee?: string;
  status?: string;
  notes?: string | null;
}

interface CheckCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCheck?: CheckRecord | null;
  setEditingCheck?: (c: CheckRecord | null) => void;
  onSaved?: () => void;
}

export default function CheckCreateDialog({ open, onOpenChange, editingCheck, setEditingCheck, onSaved }: CheckCreateDialogProps) {
  const queryClient = useQueryClient();

  const { data: banks = [] } = useQuery({
    queryKey: ["banks", { active: true }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banks")
        .select("id, name, short_name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data as unknown as Bank[]) || [];
    },
  });

  const [bankName, setBankName] = useState<string>(editingCheck?.bank || (banks[0]?.name || ""));
  const [issueDate, setIssueDate] = useState<Date | undefined>(editingCheck?.issue_date ? new Date(editingCheck.issue_date) : undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(editingCheck?.due_date ? new Date(editingCheck.due_date) : undefined);
  const [status, setStatus] = useState<string>(editingCheck?.status || "pending");

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const payload = {
        check_number: formData.get("check_number") as string,
        issue_date: formData.get("issue_date") as string,
        due_date: formData.get("due_date") as string,
        amount: parseFloat((formData.get("amount") as string) || "0"),
        bank: formData.get("bank") as string,
        payee: formData.get("payee") as string,
        status: formData.get("status") as string,
        notes: (formData.get("notes") as string) || null,
      };

      if (editingCheck?.id) {
        const { error } = await supabase.from("checks").update(payload).eq("id", editingCheck.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("checks").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checks"] });
      onOpenChange(false);
      setEditingCheck?.(null);
      onSaved?.();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingCheck?.id ? "Çek Düzenle" : "Yeni Çek Ekle"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const fd = new FormData(form);
            fd.set("bank", bankName || "");
            fd.set("issue_date", issueDate ? format(issueDate, "yyyy-MM-dd") : "");
            fd.set("due_date", dueDate ? format(dueDate, "yyyy-MM-dd") : "");
            fd.set("status", status);
            saveMutation.mutate(fd);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="check_number">Çek No</Label>
              <Input id="check_number" name="check_number" defaultValue={editingCheck?.check_number || ""} required />
            </div>
            <div>
              <Label>Banka</Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger>
                  <SelectValue placeholder="Banka seçin" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {banks.map((b) => (
                    <SelectItem key={b.id} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Düzenleme Tarihi</Label>
              <EnhancedDatePicker date={issueDate} onSelect={setIssueDate} placeholder="Tarih seçin" />
            </div>
            <div>
              <Label>Vade Tarihi</Label>
              <EnhancedDatePicker date={dueDate} onSelect={setDueDate} placeholder="Tarih seçin" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Tutar</Label>
              <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingCheck?.amount || ""} required />
            </div>
            <div>
              <Label htmlFor="payee">Lehtar</Label>
              <Input id="payee" name="payee" defaultValue={editingCheck?.payee || ""} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Durum</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="odenecek">Ödenecek</SelectItem>
                  <SelectItem value="odendi">Ödendi</SelectItem>
                  <SelectItem value="karsilik_yok">Karşılıksız</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="status" value={status} />
            </div>
            <div>
              <Label htmlFor="notes">Notlar</Label>
              <Textarea id="notes" name="notes" defaultValue={editingCheck?.notes || ""} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button type="submit">Kaydet</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


