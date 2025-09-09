
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowUpToLine, ArrowDownToLine, Globe, CalendarClock } from "lucide-react";
import { BankAccount } from "@/hooks/useBankAccounts";

interface QuickActionsProps {
  account: BankAccount;
}

const QuickActions = ({ account }: QuickActionsProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold mb-4">Hızlı İşlemler</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-auto py-4 w-full flex flex-col items-center gap-2">
              <ArrowUpToLine className="h-5 w-5 text-blue-500" />
              <span>Para Gönder</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Para Gönder</DialogTitle>
              <DialogDescription>
                Bu özellik yakında kullanıma açılacaktır.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-auto py-4 w-full flex flex-col items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-green-500" />
              <span>Para Al</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Para Al</DialogTitle>
              <DialogDescription>
                Bu özellik yakında kullanıma açılacaktır.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-auto py-4 w-full flex flex-col items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              <span>Swift</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Swift Transfer</DialogTitle>
              <DialogDescription>
                Bu özellik yakında kullanıma açılacaktır.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-auto py-4 w-full flex flex-col items-center gap-2">
              <CalendarClock className="h-5 w-5 text-orange-500" />
              <span>Düzenli Ödeme</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Düzenli Ödeme Talimatı</DialogTitle>
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

export default QuickActions;

