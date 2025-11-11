import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BudgetFiltersState } from "@/pages/BudgetManagement";
import { Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface QuickActionsProps {
  filters: BudgetFiltersState;
  onYearChange?: (year: number) => void;
}

const QuickActions = ({ filters, onYearChange }: QuickActionsProps) => {
  const [open, setOpen] = useState(false);
  const [sourceYear, setSourceYear] = useState<number>(filters.year - 1);
  const { toast } = useToast();

  const handleCopyFromPreviousYear = () => {
    // Burada gerçek API çağrısı yapılacak
    toast({
      title: "Başarılı",
      description: `${sourceYear} yılı bütçesi ${filters.year} yılına kopyalandı`,
    });
    setOpen(false);
  };

  const availableYears = Array.from({ length: 3 }, (_, i) => filters.year - 1 - i);

  return (
    <div className="flex items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Copy className="h-4 w-4" />
            Geçmiş Yıldan Kopyala
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bütçe Kopyalama</DialogTitle>
            <DialogDescription>
              Seçtiğiniz yılın bütçesini {filters.year} yılına kopyalayın
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kaynak Yıl</label>
              <Select
                value={sourceYear.toString()}
                onValueChange={(value) => setSourceYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Dikkat:</p>
                  <p>
                    {sourceYear} yılındaki tüm bütçe kalemleri {filters.year} yılına kopyalanacak.
                    Mevcut bütçe verileri üzerine yazılacaktır.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleCopyFromPreviousYear}>
              <Copy className="h-4 w-4 mr-2" />
              Kopyala
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuickActions;

