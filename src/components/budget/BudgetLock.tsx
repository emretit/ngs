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
import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";
import { Lock, Unlock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface BudgetLockProps {
  filters: BudgetFiltersState;
}

const BudgetLock = ({ filters }: BudgetLockProps) => {
  const [isLocked, setIsLocked] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleLock = () => {
    setIsLocked(true);
    toast({
      title: "Bütçe Kilitlendi",
      description: `${filters.year} yılı bütçesi kilitlendi. Artık değişiklik yapılamaz.`,
    });
    setOpen(false);
  };

  const handleUnlock = () => {
    setIsLocked(false);
    toast({
      title: "Bütçe Kilidi Açıldı",
      description: `${filters.year} yılı bütçesi düzenlenebilir hale geldi.`,
    });
  };

  return (
    <div className="flex items-center gap-2">
      {isLocked ? (
        <>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Kilitli
          </Badge>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Unlock className="h-4 w-4" />
                Kilidi Aç
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bütçe Kilidini Aç</DialogTitle>
                <DialogDescription>
                  {filters.year} yılı bütçesinin kilidini açmak istediğinize emin misiniz?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleUnlock} variant="destructive">
                  <Unlock className="h-4 w-4 mr-2" />
                  Kilidi Aç
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Lock className="h-4 w-4" />
              Bütçeyi Kilitle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bütçe Kilitleme</DialogTitle>
              <DialogDescription>
                {filters.year} yılı bütçesini kilitlemek istediğinize emin misiniz? Kilitlendikten
                sonra değişiklik yapılamaz.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleLock}>
                <Lock className="h-4 w-4 mr-2" />
                Kilitle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BudgetLock;

