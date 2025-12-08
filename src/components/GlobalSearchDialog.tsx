import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, X, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearchDialog = ({ open, onOpenChange }: GlobalSearchDialogProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { results, isLoading, error } = useGlobalSearch(debouncedQuery);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  const categories = Object.keys(groupedResults);
  
  // Filter results based on selected category
  const filteredResults = selectedCategory === "all" 
    ? results 
    : groupedResults[selectedCategory] || [];

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
      setSelectedIndex(-1);
      setSelectedCategory("all");
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (filteredResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
          handleResultClick(filteredResults[selectedIndex].url);
        }
        break;
      case "Escape":
        onOpenChange(false);
        break;
    }
  }, [filteredResults, selectedIndex, onOpenChange]);

  const handleResultClick = (url: string) => {
    navigate(url);
    onOpenChange(false);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("forms.quickSearch")}</DialogTitle>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("forms.searchPlaceholder")}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/60"
            autoComplete="off"
          />
          {isLoading && (
            <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
          )}
          {searchQuery && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Results Area */}
        {searchQuery.length >= 2 ? (
          <div className="flex h-[400px]">
            {/* Categories Sidebar */}
            {results.length > 0 && (
              <div className="w-48 border-r bg-muted/30 shrink-0">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === "all"
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Tümü</span>
                        <Badge variant="secondary" className="text-xs">
                          {results.length}
                        </Badge>
                      </div>
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedCategory === category
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{category}</span>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {groupedResults[category].length}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Results List */}
            <div className="flex-1 min-w-0">
              {error ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-12 h-12 mb-3 bg-destructive/10 rounded-xl flex items-center justify-center">
                    <X className="h-6 w-6 text-destructive" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Arama sırasında hata oluştu</p>
                  <p className="text-xs text-muted-foreground mt-1">Lütfen tekrar deneyin</p>
                </div>
              ) : results.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-12 h-12 mb-3 bg-muted rounded-xl flex items-center justify-center">
                    <Search className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Sonuç bulunamadı</p>
                  <p className="text-xs text-muted-foreground mt-1">Farklı anahtar kelimeler deneyin</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {filteredResults.map((result, index) => {
                      const isSelected = selectedIndex === index;
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result.url)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-150 focus:outline-none group ${
                            isSelected 
                              ? "bg-primary/10" 
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm line-clamp-1 transition-colors ${
                                isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                              }`}>
                                {result.title}
                              </div>
                              {result.subtitle && (
                                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {result.subtitle}
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {result.category}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-center p-8">
            <div className="w-16 h-16 mb-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
              <Search className="h-8 w-8 text-primary/60" />
            </div>
            <p className="text-sm font-medium text-foreground">{t("forms.quickSearch")}</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {t("forms.quickSearchDescription")}
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground/70">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-muted rounded border text-[10px]">↑↓</kbd>
                Gezin
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-muted rounded border text-[10px]">Enter</kbd>
                Seç
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-muted rounded border text-[10px]">Esc</kbd>
                Kapat
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearchDialog;

