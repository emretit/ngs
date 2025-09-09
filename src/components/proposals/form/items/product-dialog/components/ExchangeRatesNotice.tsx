
import React from "react";

interface ExchangeRatesNoticeProps {
  isLoadingRates: boolean;
}

const ExchangeRatesNotice: React.FC<ExchangeRatesNoticeProps> = ({ isLoadingRates }) => {
  if (!isLoadingRates) return null;
  
  return (
    <div className="mr-auto text-sm text-muted-foreground flex items-center">
      <span className="animate-pulse mr-2">●</span>
      Güncel kurlar yükleniyor...
    </div>
  );
};

export default ExchangeRatesNotice;
