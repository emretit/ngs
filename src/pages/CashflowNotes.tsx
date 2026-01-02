import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { NotesFilterBar } from "@/components/cashflow/notes/NotesFilterBar";
import { NotesTable } from "@/components/cashflow/notes/NotesTable";
import { NoteFormDialog } from "@/components/cashflow/notes/NoteFormDialog";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<FinancialInstrument | null>(null);
  
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
      setIsDeleteDialogOpen(false);
      setNoteToDelete(null);
    },
    onError: () => {
      setIsDeleteDialogOpen(false);
      setNoteToDelete(null);
    },
  });

  const handleDeleteClick = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      setNoteToDelete(note);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (noteToDelete) {
      deleteNoteMutation.mutate(noteToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setNoteToDelete(null);
  };


  const filteredNotes = notes.filter(
    (note) => noteFilters.status === "all" || note.status === noteFilters.status
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <NotesFilterBar
          statusFilter={noteFilters.status}
          onStatusChange={(value) => setNoteFilters({ ...noteFilters, status: value })}
        />
        <Button
          onClick={() => {
            setEditingNote(null);
            setNoteStatus("pending");
            setNoteDialog(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Senet
        </Button>
      </div>

      <NotesTable
        notes={filteredNotes}
        onEdit={(note) => {
          setEditingNote(note);
          setNoteStatus(note.status);
          setNoteDialog(true);
        }}
        onDelete={handleDeleteClick}
      />

      <NoteFormDialog
        open={noteDialog}
        onOpenChange={setNoteDialog}
        editingNote={editingNote}
        onSave={(formData) => {
          saveNoteMutation.mutate(formData);
        }}
        noteStatus={noteStatus}
        onNoteStatusChange={setNoteStatus}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Seneti Sil"
        description={
          noteToDelete
            ? `"${noteToDelete.instrument_number}" numaralı seneti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : "Bu seneti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        }
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteNoteMutation.isPending}
      />
    </div>
  );
};

export default CashflowNotes;

