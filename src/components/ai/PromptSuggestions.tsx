import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertCircle, Users, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Suggestion {
  icon: typeof Sparkles;
  label: string;
  prompt: string;
  category: 'financial' | 'crm' | 'operations' | 'insights';
}

const SUGGESTIONS: Suggestion[] = [
  // Financial
  {
    icon: TrendingUp,
    label: 'Bu ayki en karlı ürünler',
    prompt: 'Bu ayki en karlı ürünleri göster',
    category: 'financial',
  },
  {
    icon: TrendingUp,
    label: 'Gelir trend analizi',
    prompt: 'Son 3 aylık gelir trendimi analiz et',
    category: 'financial',
  },
  {
    icon: AlertCircle,
    label: 'Vadesi yaklaşan alacaklar',
    prompt: '30 gün içinde vadesi dolacak alacakları göster',
    category: 'financial',
  },

  // CRM
  {
    icon: Users,
    label: 'Aktif fırsatlar',
    prompt: 'Aktif fırsatları durumlarına göre grupla',
    category: 'crm',
  },
  {
    icon: Users,
    label: 'En değerli müşteriler',
    prompt: 'En yüksek cirolu 10 müşteriyi göster',
    category: 'crm',
  },

  // Operations
  {
    icon: Package,
    label: 'Stok durumu',
    prompt: 'Kritik seviyede olan stokları göster',
    category: 'operations',
  },
  {
    icon: Package,
    label: 'Bekleyen siparişler',
    prompt: 'Teslim tarihi geçmiş siparişleri listele',
    category: 'operations',
  },

  // Insights
  {
    icon: Sparkles,
    label: 'Genel durum analizi',
    prompt: 'İşletmemin genel finansal durumunu analiz et',
    category: 'insights',
  },
  {
    icon: Sparkles,
    label: 'Risk analizi',
    prompt: 'Finansal risklerimi ve önerilerini ver',
    category: 'insights',
  },
];

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
  filter?: Suggestion['category'] | 'all';
  limit?: number;
  className?: string;
}

const categoryColors = {
  financial: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
  crm: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700',
  operations: 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700',
  insights: 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
};

export function PromptSuggestions({
  onSelectPrompt,
  filter = 'all',
  limit,
  className,
}: PromptSuggestionsProps) {
  // Filter suggestions
  let filteredSuggestions = SUGGESTIONS;
  if (filter !== 'all') {
    filteredSuggestions = SUGGESTIONS.filter((s) => s.category === filter);
  }

  // Limit if specified
  if (limit) {
    filteredSuggestions = filteredSuggestions.slice(0, limit);
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Önerilen sorular:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filteredSuggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={index}
              onClick={() => onSelectPrompt(suggestion.prompt)}
              className={cn(
                'text-left p-3 rounded-lg border transition-all text-sm',
                'hover:shadow-sm active:scale-[0.98]',
                categoryColors[suggestion.category]
              )}
            >
              <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-medium">{suggestion.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
