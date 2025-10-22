import { useState, useRef, useEffect } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const GlobalSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { results, isLoading } = useGlobalSearch(debouncedQuery);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Show/hide dropdown based on query and results
  useEffect(() => {
    setIsOpen(searchQuery.length >= 2 && (results.length > 0 || !isLoading));
    setSelectedIndex(-1); // Reset selection when results change
  }, [searchQuery, results, isLoading]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex].url);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchQuery("");
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultClick = (url: string) => {
    navigate(url);
    setIsOpen(false);
    setSearchQuery("");
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  return (
    <div 
      className="w-full mx-auto mb-8 px-4 sm:px-0" 
      ref={containerRef}
      role="search"
    >
      {/* Modern Search Card Container */}
      <div className="relative bg-gradient-to-r from-primary/5 via-primary/3 to-background rounded-2xl p-6 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-md">
            <Search className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Hızlı Arama</h2>
            <p className="text-xs text-muted-foreground">Tüm kayıtlarınızda anında arama yapın</p>
          </div>
        </div>

        {/* Search Input Container */}
        <div className="relative group">
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="🔍 Müşteri, teklif, çalışan, ürün veya fırsat ara..."
            className="w-full pl-5 pr-32 h-14 text-base bg-background border-2 border-border/50 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 shadow-sm hover:shadow-md placeholder:text-muted-foreground/60 font-medium"
            aria-label="Global arama"
            aria-expanded={isOpen}
            aria-controls="search-results"
            aria-autocomplete="list"
            autoComplete="off"
          />
          
          {/* Right side controls */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <span className="text-xs font-semibold text-primary">Aranıyor...</span>
              </div>
            )}
            
            {searchQuery && !isLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-9 px-3 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 rounded-lg font-medium"
                aria-label="Aramayı temizle"
              >
                <X className="h-4 w-4 mr-1" />
                <span className="text-xs">Temizle</span>
              </Button>
            )}
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        {!isOpen && !searchQuery && (
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground/70">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded border border-border/50 font-mono text-[10px]">↑</kbd>
              <kbd className="px-2 py-1 bg-muted rounded border border-border/50 font-mono text-[10px]">↓</kbd>
              <span>Gezin</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded border border-border/50 font-mono text-[10px]">Enter</kbd>
              <span>Seç</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-muted rounded border border-border/50 font-mono text-[10px]">Esc</kbd>
              <span>Kapat</span>
            </span>
          </div>
        )}

        {/* Results Dropdown - Modern Design */}
        {isOpen && (
          <div 
            id="search-results"
            role="listbox"
            className="absolute top-full left-0 right-0 mt-4 bg-background border-2 border-border/50 rounded-2xl shadow-2xl max-h-[min(500px,70vh)] overflow-hidden z-50 animate-in slide-in-from-top-4 fade-in-0 duration-300"
          >
            {results.length === 0 && !isLoading ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-2xl flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-foreground font-semibold text-base mb-1">Sonuç bulunamadı</p>
                <p className="text-sm text-muted-foreground">Farklı anahtar kelimeler deneyin</p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[min(500px,70vh)]">
                {Object.entries(groupedResults).map(([category, categoryResults]) => (
                  <div key={category} className="mb-2 last:mb-0">
                    <div className="px-5 py-3 text-xs font-bold text-primary uppercase tracking-wider bg-gradient-to-r from-primary/10 via-primary/5 to-background sticky top-0 z-10 border-b border-border/50 backdrop-blur-sm">
                      {category}
                    </div>
                    <div className="py-1">
                      {categoryResults.map((result) => {
                        const globalIndex = results.indexOf(result);
                        const isSelected = selectedIndex === globalIndex;
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result.url)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            role="option"
                            aria-selected={isSelected}
                            className={`w-full text-left px-5 py-4 transition-all duration-200 focus:outline-none border-l-4 group ${
                              isSelected 
                                ? "bg-primary/10 border-l-primary shadow-sm" 
                                : "border-l-transparent hover:bg-muted/50 hover:border-l-primary/30"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-sm line-clamp-1 transition-colors ${
                                  isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                                }`}>
                                  {result.title}
                                </div>
                                {result.subtitle && (
                                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {result.subtitle}
                                  </div>
                                )}
                              </div>
                              <div className={`ml-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                                isSelected ? "opacity-100" : ""
                              }`}>
                                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                                  <span className="text-primary text-xs">→</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default GlobalSearchBar;
