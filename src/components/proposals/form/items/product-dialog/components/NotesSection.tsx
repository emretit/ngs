
import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface NotesSectionProps {
  notes: string;
  setNotes: (value: string) => void;
}

const NotesSection: React.FC<NotesSectionProps> = ({
  notes,
  setNotes
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Ek Notlar</Label>
      <Textarea
        id="notes"
        placeholder="Ürün için ek açıklamalar..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />
    </div>
  );
};

export default NotesSection;
