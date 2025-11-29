import { cn } from '@/lib/utils';

interface DateDisplayProps {
  date: Date | string | null | undefined;
  className?: string;
  showTime?: boolean;
}

/**
 * Minimal tarih gösterimi komponenti
 * Müşteriler sayfasındaki format ile tutarlı: DD.MM.YYYY
 */
export function DateDisplay({ 
  date, 
  className,
  showTime = false 
}: DateDisplayProps) {
  if (!date) {
    return (
      <span className={cn("text-muted-foreground text-sm", className)}>
        -
      </span>
    );
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return (
      <span className={cn("text-muted-foreground text-sm", className)}>
        -
      </span>
    );
  }

  // Müşteriler sayfasındaki format: DD.MM.YYYY
  const displayText = dateObj.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Saat gösterimi için
  const timeText = showTime 
    ? ` ${dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  return (
    <span className={cn("text-sm text-muted-foreground", className)}>
      {displayText}{timeText}
    </span>
  );
}

