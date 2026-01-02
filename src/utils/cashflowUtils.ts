// formatCurrency has been removed - use formatCurrency from @/utils/formatters directly

export const getStatusConfig = (status: string) => {
  // Eski "tedarikciye_verildi" durumunu "ciro_edildi" olarak map et
  const normalizedStatus = status === "tedarikciye_verildi" ? "ciro_edildi" : status;
  
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
  
  return statusConfig[normalizedStatus as keyof typeof statusConfig] || { label: status, variant: "secondary" as const };
};

