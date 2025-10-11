import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const GlobalSearchBar = () => {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Müşteri, teklif, çalışan, ürün ara..."
          className="pl-10 h-12 text-base bg-background/50 backdrop-blur-sm border-2 focus:border-primary/50 transition-all"
        />
      </div>
    </div>
  );
};

export default GlobalSearchBar;
