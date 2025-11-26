import { useState } from 'react';
import { Send, Loader2, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useInviteSupplierToPortal } from '@/hooks/useSupplierPortal';

interface PortalInviteDialogProps {
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  trigger?: React.ReactNode;
}

export default function PortalInviteDialog({
  supplierId,
  supplierName,
  supplierEmail,
  trigger,
}: PortalInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(supplierEmail || '');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  
  const inviteMutation = useInviteSupplierToPortal();

  const handleSendInvite = async () => {
    if (!email.trim()) {
      toast({
        title: 'Hata',
        description: 'E-posta adresi gereklidir',
        variant: 'destructive',
      });
      return;
    }

    inviteMutation.mutate(
      { supplier_id: supplierId, email },
      {
        onSuccess: (data) => {
          setInviteUrl(data.invite_url);
        },
      }
    );
  };

  const handleCopyUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      toast({
        title: 'Kopyalandı',
        description: 'Davet linki panoya kopyalandı',
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setInviteUrl(null);
    setEmail(supplierEmail || '');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Send className="w-4 h-4" />
            Portal Daveti
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tedarikçi Portal Daveti</DialogTitle>
          <DialogDescription>
            <strong>{supplierName}</strong> tedarikçisini portala davet edin. 
            Tedarikçi bu link ile giriş yaparak teklif taleplerinizi yanıtlayabilir.
          </DialogDescription>
        </DialogHeader>

        {inviteUrl ? (
          // Success state
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <p className="text-center text-slate-600">
              Davet oluşturuldu! Aşağıdaki linki tedarikçinizle paylaşın.
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={inviteUrl}
                readOnly
                className="text-xs font-mono"
              />
              <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Link 7 gün geçerlidir ve yalnızca bir kez kullanılabilir.
            </p>
          </div>
        ) : (
          // Input state
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta Adresi</Label>
              <Input
                id="email"
                type="email"
                placeholder="tedarikci@firma.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={inviteMutation.isPending}
              />
              <p className="text-xs text-slate-500">
                Tedarikçinin portal erişimi için kullanacağı e-posta adresi
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {inviteUrl ? (
            <Button onClick={handleClose}>Tamam</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button
                onClick={handleSendInvite}
                disabled={inviteMutation.isPending || !email.trim()}
                className="gap-2"
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Davet Oluştur
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

