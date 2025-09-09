
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Filter, Download } from "lucide-react";

interface InstrumentActionsProps {
  selectedType: string;
  setSelectedType: (value: string) => void;
}

const InstrumentActions = ({ selectedType, setSelectedType }: InstrumentActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
      <div className="flex items-center gap-3">
        <h3 className="font-semibold">Çek ve Senetler</h3>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          20 Aktif
        </span>
      </div>
      <div className="flex gap-2">
        <Select
          value={selectedType}
          onValueChange={setSelectedType}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tür" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="check">Çekler</SelectItem>
            <SelectItem value="note">Senetler</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span>Dışa Aktar</span>
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Yeni Ekle</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Çek/Senet Ekle</DialogTitle>
              <DialogDescription>
                Bu özellik yakında kullanıma açılacaktır.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InstrumentActions;
