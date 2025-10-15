import { Badge } from "@/components/ui/badge";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY"
  }).format(amount);
};

export const getStatusBadge = (status: string) => {
  const statusConfig = {
    portfoyde: { label: "Portföyde", variant: "secondary" as const },
    bankaya_verildi: { label: "Bankaya Verildi", variant: "outline" as const },
    tahsil_edildi: { label: "Tahsil Edildi", variant: "default" as const },
    ciro_edildi: { label: "Ciro Edildi", variant: "outline" as const },
    karsilik_yok: { label: "Karşılıksız", variant: "destructive" as const },
    odenecek: { label: "Ödenecek", variant: "destructive" as const },
    odendi: { label: "Ödendi", variant: "default" as const },
    pending: { label: "Beklemede", variant: "secondary" as const },
    cleared: { label: "Tahsil Edildi", variant: "default" as const },
    bounced: { label: "Karşılıksız", variant: "destructive" as const },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

