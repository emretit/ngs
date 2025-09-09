
import React from "react";
import { Textarea } from "@/components/ui/textarea";

interface NotesSectionProps {
  notes: string;
  setNotes: (notes: string) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ notes, setNotes }) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600">Notlar</label>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Servis talebi ile ilgili notlar..."
        className="h-16 text-sm"
      />
    </div>
  );
};
