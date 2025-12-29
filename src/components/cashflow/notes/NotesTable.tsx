import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { formatCurrency, getStatusConfig } from "@/utils/cashflowUtils";
import { format } from "date-fns";

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

interface NotesTableProps {
  notes: FinancialInstrument[];
  onEdit: (note: FinancialInstrument) => void;
  onDelete: (id: string) => void;
}

export const NotesTable = ({ notes, onEdit, onDelete }: NotesTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Senet No</TableHead>
            <TableHead>Keşideci</TableHead>
            <TableHead>Lehtar</TableHead>
            <TableHead>İşlem Tarihi</TableHead>
            <TableHead>Vade</TableHead>
            <TableHead className="text-right">Tutar</TableHead>
            <TableHead>Banka</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-center">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notes.map((note) => (
            <TableRow key={note.id}>
              <TableCell className="font-medium">{note.instrument_number}</TableCell>
              <TableCell>{note.issuer_name}</TableCell>
              <TableCell>{note.recipient_name}</TableCell>
              <TableCell>{format(new Date(note.issue_date), "dd/MM/yyyy")}</TableCell>
              <TableCell>{format(new Date(note.due_date), "dd/MM/yyyy")}</TableCell>
              <TableCell className="text-right">{formatCurrency(note.amount)}</TableCell>
              <TableCell>{note.bank_name || "-"}</TableCell>
              <TableCell>
                <Badge variant={getStatusConfig(note.status).variant}>
                  {getStatusConfig(note.status).label}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(note)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(note.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {notes.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-sm text-gray-500 py-4">
                Henüz senet bulunmuyor
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

