import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

interface NotesFilterBarProps {
  statusFilter: string;
  onStatusChange: (value: string) => void;
  onExport?: () => void;
}

export const NotesFilterBar = ({
  statusFilter,
  onStatusChange,
  onExport,
}: NotesFilterBarProps) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex space-x-2">
        <Select value={statusFilter} onValueChange={onStatusChange}>
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
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        )}
      </div>
    </div>
  );
};

