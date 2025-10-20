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
      className="w-full max-w-4xl mx-auto px-4 sm:px-0 mb-8" 
      ref={containerRef}
      role="search"
    >
      <div className="relative group">
        {/* Search Icon with gradient background */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <div className="p-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
            <Search className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Müşteri, teklif, çalışan, ürün ara..."
          className="pl-16 pr-24 h-14 text-base bg-white/80 backdrop-blur-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 shadow-lg hover:shadow-xl"
          aria-label="Global arama"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-autocomplete="list"
          autoComplete="off"
        />
        
        {/* Right side controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
              aria-label="Aramayı temizle"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          {isLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              <span className="text-xs text-gray-500">Aranıyor...</span>
            </div>
          )}
        </div>

        {/* Results Dropdown */}
        {isOpen && (
          <div 
            id="search-results"
            role="listbox"
            className="absolute top-full left-0 right-0 mt-3 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-[min(500px,70vh)] overflow-y-auto z-50 animate-in slide-in-from-top-2 duration-200"
          >
            {results.length === 0 && !isLoading ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">Sonuç bulunamadı</p>
                <p className="text-sm text-gray-500 mt-1">Farklı anahtar kelimeler deneyin</p>
              </div>
            ) : (
              <div className="py-3">
                {Object.entries(groupedResults).map(([category, categoryResults]) => (
                  <div key={category} className="mb-3 last:mb-0">
                    <div className="px-4 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 border-b border-gray-200">
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
                          className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-all duration-150 focus:outline-none focus:bg-blue-50 border-l-4 ${
                            isSelected ? "bg-blue-50 border-l-blue-500" : "border-l-transparent"
                          }`}
                        >
                          <div className="font-semibold text-sm text-gray-900 line-clamp-1">{result.title}</div>
                          {result.subtitle && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
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

    </div>
  );
};

export default GlobalSearchBar;
