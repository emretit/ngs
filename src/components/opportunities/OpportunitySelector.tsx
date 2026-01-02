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
  Search, 
  Target, 
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  disabled?: boolean;
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
  className = "",
  disabled = false
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
      <div className={cn("space-y-1.5", className)}>
        {showLabel && (
          <Label className={cn("text-xs font-medium text-gray-700", error ? "text-red-500" : "")}>
            {label}
          </Label>
        )}
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="ml-2 text-xs">{loadingText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <Label className={cn("text-xs font-medium text-gray-700", error ? "text-red-500" : "")}>
          {label}
        </Label>
      )}
      <Popover 
        open={open} 
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) {
            setSearchQuery("");
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between mt-0.5 h-10 text-xs",
              !value && "text-muted-foreground",
              error && error.trim() && "border-red-500"
            )}
          >
            <div className="flex items-center">
              <Target className="mr-1.5 h-3 w-3 shrink-0 opacity-50" />
              <span className="truncate">
                {selectedOpportunity 
                  ? selectedOpportunity.title
                  : placeholder
                }
              </span>
            </div>
            <Search className="ml-1.5 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[400px] max-w-[90vw] p-0 z-[9999] pointer-events-auto" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-1.5 border-b">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 text-xs"
              autoComplete="off"
            />
          </div>
          
          <ScrollArea className="h-[200px]">
            {filteredOpportunities.length === 0 ? (
              <div className="p-3 text-center text-muted-foreground text-xs">
                {searchQuery 
                  ? `"${searchQuery}" ile eşleşen fırsat bulunamadı` 
                  : noResultsText}
              </div>
            ) : (
              <div className="grid gap-0.5 p-1">
                {filteredOpportunities.map(opportunity => (
                  <div
                    key={opportunity.id}
                    className={cn(
                      "flex items-start py-1 px-1.5 cursor-pointer rounded-md hover:bg-muted/50",
                      opportunity.id === value && "bg-muted"
                    )}
                    onClick={() => handleSelectOpportunity(opportunity)}
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-1.5 mt-0.5">
                      <Target className="h-2.5 w-2.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium truncate text-xs">
                          {opportunity.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn(
                          "px-1 py-0.5 text-[9px] rounded",
                          getStatusColor(opportunity.status)
                        )}>
                          {opportunity.status}
                        </span>
                        {opportunity.value && (
                          <span className="text-[10px] text-muted-foreground">
                            {opportunity.value.toLocaleString('tr-TR')} ₺
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default OpportunitySelector;
