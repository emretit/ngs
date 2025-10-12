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
      className="w-full max-w-2xl mx-auto px-4 sm:px-0 mb-6" 
      ref={containerRef}
      role="search"
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Müşteri, teklif, çalışan, ürün ara..."
          className="pl-10 pr-20 h-12 text-base bg-background/50 backdrop-blur-sm border-2 focus:border-primary/50 transition-all"
          aria-label="Global arama"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-autocomplete="list"
          autoComplete="off"
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0 hover:bg-accent"
              aria-label="Aramayı temizle"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {isLoading && (
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Results Dropdown */}
        {isOpen && (
          <div 
            id="search-results"
            role="listbox"
            className="absolute top-full left-0 right-0 mt-2 bg-background border-2 border-border rounded-lg shadow-lg max-h-[min(400px,60vh)] overflow-y-auto z-50 animate-fade-in"
          >
            {results.length === 0 && !isLoading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <p>Sonuç bulunamadı</p>
                <p className="text-xs mt-1">Farklı anahtar kelimeler deneyin</p>
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(groupedResults).map(([category, categoryResults]) => (
                  <div key={category} className="mb-2 last:mb-0">
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0 z-10">
                      {category}
                    </div>
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
                          className={`w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors focus:outline-none focus:bg-accent/50 ${
                            isSelected ? "bg-accent/50" : ""
                          }`}
                        >
                          <div className="font-medium text-sm line-clamp-1">{result.title}</div>
                          {result.subtitle && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {result.subtitle}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile hint */}
      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <p className="text-xs text-muted-foreground mt-2 text-center sm:hidden">
          En az 2 karakter girin
        </p>
      )}
    </div>
  );
};

export default GlobalSearchBar;
