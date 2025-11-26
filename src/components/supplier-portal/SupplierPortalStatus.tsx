import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import PortalInviteDialog from './PortalInviteDialog';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface SupplierPortalStatusProps {
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  portalEnabled?: boolean;
  portalEmail?: string;
  lastPortalLogin?: string;
  showInviteButton?: boolean;
}

export default function SupplierPortalStatus({
  supplierId,
  supplierName,
  supplierEmail,
  portalEnabled,
  portalEmail,
  lastPortalLogin,
  showInviteButton = true,
}: SupplierPortalStatusProps) {
  if (!portalEnabled) {
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 text-slate-500">
                <XCircle className="w-3 h-3" />
                Portal Kapalı
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bu tedarikçi henüz portala davet edilmedi</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {showInviteButton && (
          <PortalInviteDialog
            supplierId={supplierId}
            supplierName={supplierName}
            supplierEmail={supplierEmail}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1 text-emerald-700 bg-emerald-50">
              <CheckCircle className="w-3 h-3" />
              Portal Aktif
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p><strong>E-posta:</strong> {portalEmail}</p>
              {lastPortalLogin && (
                <p><strong>Son Giriş:</strong> {format(new Date(lastPortalLogin), 'dd MMM yyyy HH:mm', { locale: tr })}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {lastPortalLogin && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 text-xs">
                <Clock className="w-3 h-3" />
                {format(new Date(lastPortalLogin), 'dd MMM', { locale: tr })}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Son portal girişi: {format(new Date(lastPortalLogin), 'dd MMM yyyy HH:mm', { locale: tr })}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {showInviteButton && (
        <PortalInviteDialog
          supplierId={supplierId}
          supplierName={supplierName}
          supplierEmail={portalEmail || supplierEmail}
          trigger={
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              <ExternalLink className="w-3 h-3" />
              Yeni Davet
            </Button>
          }
        />
      )}
    </div>
  );
}

