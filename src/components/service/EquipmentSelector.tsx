import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface Equipment {
  id: string;
  name: string;
  model?: string | null;
  serial_number?: string | null;
  category?: string | null;
  manufacturer?: string | null;
}

interface EquipmentSelectorProps {
  value: string;
  onChange: (equipmentName: string, equipment?: Equipment) => void;
  onEquipmentSelect?: (equipment: Equipment) => void;
  equipmentList: Equipment[];
  placeholder?: string;
  className?: string;
}

const EquipmentSelector = ({ 
  value, 
  onChange, 
  onEquipmentSelect, 
  equipmentList = [],
  placeholder = "Ekipman seçin...", 
  className 
}: EquipmentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEquipment = equipmentList.filter((equipment) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      equipment.name.toLowerCase().includes(query) ||
      equipment.model?.toLowerCase().includes(query) ||
      equipment.serial_number?.toLowerCase().includes(query) ||
      equipment.category?.toLowerCase().includes(query) ||
      equipment.manufacturer?.toLowerCase().includes(query)
    );
  });

  const handleSelect = (equipment: Equipment) => {
    if (onEquipmentSelect) {
      onEquipmentSelect(equipment);
    } else {
      onChange(equipment.name, equipment);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-w-0 bg-background border-border hover:border-primary hover:bg-background transition-colors duration-200 focus:border-primary focus:ring-0",
            !value && "text-muted-foreground",
            className
          )}
          style={{
            borderColor: 'hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'hsl(var(--primary))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'hsl(var(--border))';
          }}
        >
          <span className="truncate text-left flex-1 min-w-0" title={value || placeholder}>
            {value || <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[550px] p-0" align="start">
        <Command shouldFilter={false} className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder="Ekipman ara..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty className="py-6 text-center text-sm">
              Aramanızla eşleşen ekipman bulunamadı.
            </CommandEmpty>
            <CommandGroup>
              {filteredEquipment.map((equipment) => (
                <CommandItem
                  key={equipment.id}
                  value={equipment.name}
                  onSelect={() => handleSelect(equipment)}
                  className="flex items-start gap-2 p-2 cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent-foreground rounded-sm transition-colors"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 mt-0.5",
                      value === equipment.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                    {/* Sol Sütun - Ekipman Bilgileri */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-semibold text-foreground text-sm leading-tight truncate">
                        {equipment.name}
                      </span>
                      
                      {equipment.model && (
                        <span className="text-xs text-muted-foreground">
                          Model: {equipment.model}
                        </span>
                      )}
                      
                      {equipment.serial_number && (
                        <span className="text-xs text-muted-foreground">
                          Seri No: {equipment.serial_number}
                        </span>
                      )}
                    </div>

                    {/* Sağ Sütun - Kategori ve Üretici */}
                    <div className="flex flex-col items-end gap-1 text-right">
                      {equipment.category && (
                        <span className="text-xs text-muted-foreground bg-gray-50 px-1.5 py-0.5 rounded">
                          {equipment.category}
                        </span>
                      )}
                      {equipment.manufacturer && (
                        <span className="text-[10px] text-muted-foreground">
                          {equipment.manufacturer}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default EquipmentSelector;

