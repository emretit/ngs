
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
    <div>
      <Label htmlFor="notes" className="text-xs font-medium text-gray-600">
        Açıklama
      </Label>
      <Textarea
        id="notes"
        placeholder="Açıklama"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="mt-0.5 resize-none text-xs"
      />
    </div>
  );
};

export default NotesSection;
