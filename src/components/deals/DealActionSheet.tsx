
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Bell, Mail, MessageCircle } from "lucide-react";
import { Deal } from "@/types/deal";

interface DealActionSheetProps {
  deal: Deal;
  onAddNote: (note: string) => void;
  onAddReminder: (reminder: { date: Date; note: string }) => void;
  onSendEmail: (subject: string, message: string) => void;
}

const DealActionSheet = ({
  deal,
  onAddNote,
  onAddReminder,
  onSendEmail,
}: DealActionSheetProps) => {
  const [note, setNote] = useState("");
  const [reminderDate, setReminderDate] = useState<Date>();
  const [reminderNote, setReminderNote] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const handleAddNote = () => {
    if (note.trim()) {
      onAddNote(note);
      setNote("");
    }
  };

  const handleAddReminder = () => {
    if (reminderDate && reminderNote.trim()) {
      onAddReminder({ date: reminderDate, note: reminderNote });
      setReminderDate(undefined);
      setReminderNote("");
    }
  };

  const handleSendEmail = () => {
    if (emailSubject.trim() && emailMessage.trim()) {
      onSendEmail(emailSubject, emailMessage);
      setEmailSubject("");
      setEmailMessage("");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageCircle className="h-4 w-4 mr-2" />
          Hızlı Eylemler
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Fırsat Eylemleri</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {/* Hızlı Not Ekleme */}
          <div className="space-y-4">
            <h3 className="font-medium">Hızlı Not Ekle</h3>
            <Textarea
              placeholder="Notunuzu buraya yazın..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button onClick={handleAddNote} className="w-full">
              Not Ekle
            </Button>
          </div>

          {/* Hatırlatıcı Ekleme */}
          <div className="space-y-4">
            <h3 className="font-medium">Hatırlatıcı Ekle</h3>
            <Calendar
              mode="single"
              selected={reminderDate}
              onSelect={setReminderDate}
              locale={tr}
            />
            <Input
              placeholder="Hatırlatıcı notu"
              value={reminderNote}
              onChange={(e) => setReminderNote(e.target.value)}
            />
            <Button onClick={handleAddReminder} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Hatırlatıcı Ekle
            </Button>
          </div>

          {/* E-posta Gönderme */}
          <div className="space-y-4">
            <h3 className="font-medium">E-posta Gönder</h3>
            <Input
              placeholder="Konu"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
            <Textarea
              placeholder="Mesajınız"
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
            />
            <Button onClick={handleSendEmail} className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              E-posta Gönder
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DealActionSheet;
