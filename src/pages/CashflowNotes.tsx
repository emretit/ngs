import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getStatusConfig } from "@/utils/cashflowUtils";
import { useTranslation } from "react-i18next";

interface FinancialInstrument {
  id: string;
  instrument_type: "check" | "promissory_note";
  instrument_number: string;
  issuer_name: string;
  recipient_name: string;
  amount: number;
  issue_date: string;
  due_date: string;
  status: string;
  bank_account_id?: string;
  bank_name?: string;
  branch_name?: string;
  currency: string;
  notes?: string;
  created_at: string;
}

const CashflowNotes = () => {
  const { t } = useTranslation();
  const [noteDialog, setNoteDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<FinancialInstrument | null>(null);
  const [noteFilters, setNoteFilters] = useState({ status: "all", dateRange: "" });
  const [noteStatus, setNoteStatus] = useState("pending");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch promissory notes
  const { data: notes = [] } = useQuery({
    queryKey: ["financial_instruments", "promissory_note"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_instruments")
        .select("*")
        .eq("instrument_type", "promissory_note")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data as unknown as FinancialInstrument[]) || [];
    },
  });

  // Note mutations
  const saveNoteMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const noteData = {
        instrument_type: "promissory_note" as const,
        instrument_number: formData.get("instrument_number") as string,
        issuer_name: formData.get("issuer_name") as string,
        recipient_name: formData.get("recipient_name") as string,
        amount: parseFloat(formData.get("amount") as string),
        issue_date: formData.get("issue_date") as string,
        due_date: formData.get("due_date") as string,
        bank_name: formData.get("bank_name") as string,
        branch_name: formData.get("branch_name") as string,
        currency: formData.get("currency") as string || "TRY",
        status: formData.get("status") as string,
        notes: formData.get("notes") as string,
      };

      if (editingNote) {
        const { error } = await supabase
          .from("financial_instruments")
          .update(noteData)
          .eq("id", editingNote.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("financial_instruments")
          .insert([noteData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_instruments"] });
      setNoteDialog(false);
      setEditingNote(null);
      toast({ title: "Başarılı", description: "Senet kaydedildi" });
    },
    onError: (error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_instruments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_instruments"] });
      toast({ title: "Başarılı", description: "Senet silindi" });
    },
  });

  const NoteForm = () => {
    const currentNoteStatus = editingNote?.status || "pending";
    const [issueDate, setIssueDate] = useState<Date | undefined>(
      editingNote?.issue_date ? new Date(editingNote.issue_date) : undefined
    );
    const [dueDate, setDueDate] = useState<Date | undefined>(
      editingNote?.due_date ? new Date(editingNote.due_date) : undefined
    );
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="instrument_number">Senet No</Label>
            <Input
              id="instrument_number"
              name="instrument_number"
              defaultValue={editingNote?.instrument_number || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Tutar</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              defaultValue={editingNote?.amount || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="issuer_name">Keşideci</Label>
            <Input
              id="issuer_name"
              name="issuer_name"
              defaultValue={editingNote?.issuer_name || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="recipient_name">Lehtar</Label>
            <Input
              id="recipient_name"
              name="recipient_name"
              defaultValue={editingNote?.recipient_name || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t("cashflow.issueDate")}</Label>
            <EnhancedDatePicker date={issueDate} onSelect={setIssueDate} placeholder={t("forms.selectDate")} />
            <input type="hidden" name="issue_date" value={issueDate ? format(issueDate, "yyyy-MM-dd") : ""} />
          </div>
          <div>
            <Label>{t("cashflow.dueDate")}</Label>
            <EnhancedDatePicker date={dueDate} onSelect={setDueDate} placeholder={t("forms.selectDate")} />
            <input type="hidden" name="due_date" value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bank_name">{t("cashflow.bank")}</Label>
            <Input
              id="bank_name"
              name="bank_name"
              defaultValue={editingNote?.bank_name || ""}
            />
          </div>
          <div>
            <Label htmlFor="branch_name">{t("cashflow.branch")}</Label>
            <Input
              id="branch_name"
              name="branch_name"
              defaultValue={editingNote?.branch_name || ""}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currency">Para Birimi</Label>
            <Select name="currency" defaultValue={editingNote?.currency || "TRY"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">TRY</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Durum</Label>
            <Select 
              value={noteStatus} 
              onValueChange={setNoteStatus}
              defaultValue={currentNoteStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="cleared">Tahsil Edildi</SelectItem>
                <SelectItem value="bounced">Karşılıksız</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="status" value={noteStatus} />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notlar</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={editingNote?.notes || ""}
            placeholder={t("forms.notes")}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setNoteDialog(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={(e) => {
              const form = e.currentTarget.closest("form") as HTMLFormElement;
              const formData = new FormData(form);
              saveNoteMutation.mutate(formData);
            }}
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Select
            value={noteFilters.status}
            onValueChange={(value) => setNoteFilters({ ...noteFilters, status: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Durum filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hepsi</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="cleared">Tahsil Edildi</SelectItem>
              <SelectItem value="bounced">Karşılıksız</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
        <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingNote(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Senet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingNote ? t("cashflow.editNote") : t("cashflow.addNote")}
              </DialogTitle>
            </DialogHeader>
            <form>
              <NoteForm />
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Senet No</TableHead>
              <TableHead>Keşideci</TableHead>
              <TableHead>Lehtar</TableHead>
              <TableHead>{t("common.actions")}</TableHead>
              <TableHead>Vade</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
              <TableHead>Banka</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-center">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes
              .filter(note => noteFilters.status === "all" || note.status === noteFilters.status)
              .map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="font-medium">{note.instrument_number}</TableCell>
                  <TableCell>{note.issuer_name}</TableCell>
                  <TableCell>{note.recipient_name}</TableCell>
                  <TableCell>{format(new Date(note.issue_date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{format(new Date(note.due_date), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-right">{formatCurrency(note.amount)}</TableCell>
                  <TableCell>{note.bank_name || "-"}</TableCell>
                  <TableCell>{<Badge variant={getStatusConfig(note.status).variant}>{getStatusConfig(note.status).label}</Badge>}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingNote(note);
                          setNoteStatus(note.status);
                          setNoteDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CashflowNotes;

