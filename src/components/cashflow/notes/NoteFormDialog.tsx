import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { format } from "date-fns";
import { useState } from "react";
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

interface NoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingNote: FinancialInstrument | null;
  onSave: (formData: FormData) => void;
  noteStatus: string;
  onNoteStatusChange: (status: string) => void;
}

export const NoteFormDialog = ({
  open,
  onOpenChange,
  editingNote,
  onSave,
  noteStatus,
  onNoteStatusChange,
}: NoteFormDialogProps) => {
  const { t } = useTranslation();
  const [issueDate, setIssueDate] = useState<Date | undefined>(
    editingNote?.issue_date ? new Date(editingNote.issue_date) : undefined
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(
    editingNote?.due_date ? new Date(editingNote.due_date) : undefined
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingNote ? t("cashflow.editNote") : t("cashflow.addNote")}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            onSave(formData);
          }}
        >
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
                <EnhancedDatePicker
                  date={issueDate}
                  onSelect={setIssueDate}
                  placeholder={t("forms.selectDate")}
                />
                <input
                  type="hidden"
                  name="issue_date"
                  value={issueDate ? format(issueDate, "yyyy-MM-dd") : ""}
                />
              </div>
              <div>
                <Label>{t("cashflow.dueDate")}</Label>
                <EnhancedDatePicker
                  date={dueDate}
                  onSelect={setDueDate}
                  placeholder={t("forms.selectDate")}
                />
                <input
                  type="hidden"
                  name="due_date"
                  value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                />
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
                  onValueChange={onNoteStatusChange}
                  defaultValue={editingNote?.status || "pending"}
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("common.save")}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

