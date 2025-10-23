import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  ChevronsUpDown, 
  Search, 
  Target, 
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface Opportunity {
  id: string;
  title: string;
  status: string;
  value?: number;
}

interface OpportunitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  companyId?: string;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  loadingText?: string;
  noResultsText?: string;
  showLabel?: boolean;
  className?: string;
}

const OpportunitySelector: React.FC<OpportunitySelectorProps> = ({ 
  value, 
  onChange, 
  error, 
  companyId,
  label = "Fırsat Seçin",
  placeholder = "Fırsat seçin...",
  searchPlaceholder = "Fırsat ara...",
  loadingText = "Fırsatlar yükleniyor...",
  noResultsText = "Fırsat bulunamadı",
  showLabel = true,
  className = ""
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { userData } = useCurrentUser();

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ["opportunities", companyId || userData?.company_id],
    queryFn: async () => {
      const targetCompanyId = companyId || userData?.company_id;
      if (!targetCompanyId) return [];
      
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, title, status, value")
        .eq("company_id", targetCompanyId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Opportunity[] || [];
    },
    enabled: !!(companyId || userData?.company_id),
  });

  // Filter opportunities based on search query
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opportunity => {
      const matchesSearch = 
        searchQuery === "" || 
        opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opportunity.status.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [opportunities, searchQuery]);

  const selectedOpportunity = opportunities.find(opp => opp.id === value);

  const handleSelectOpportunity = (opportunity: Opportunity) => {
    onChange(opportunity.id);
    setOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'yeni':
        return 'text-blue-600 bg-blue-50';
      case 'devam ediyor':
        return 'text-yellow-600 bg-yellow-50';
      case 'teklif verildi':
        return 'text-purple-600 bg-purple-50';
      case 'kazanıldı':
        return 'text-green-600 bg-green-50';
      case 'kaybedildi':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {showLabel && <Label className={cn("text-xs font-medium text-gray-700", error ? "text-red-500" : "")}>{label}</Label>}
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="ml-2 text-sm">{loadingText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && <Label className={cn("text-sm font-medium text-gray-700", error ? "text-red-500" : "")}>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full h-8 text-sm justify-between",
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            <span className="truncate text-left flex-1">
              {selectedOpportunity 
                ? selectedOpportunity.title
                : placeholder
              }
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {filteredOpportunities.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery 
                  ? `"${searchQuery}" ile eşleşen fırsat bulunamadı` 
                  : noResultsText}
              </div>
            ) : (
              <div className="p-1">
                {filteredOpportunities.map(opportunity => (
                  <div
                    key={opportunity.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer rounded-sm"
                    onClick={() => handleSelectOpportunity(opportunity)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {opportunity.title}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            getStatusColor(opportunity.status)
                          )}>
                            {opportunity.status}
                          </span>
                          {opportunity.value && (
                            <span className="text-xs text-muted-foreground">
                              {opportunity.value.toLocaleString('tr-TR')} ₺
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default OpportunitySelector;
