import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { Opportunity, OpportunityStatus } from "@/types/crm";
import { Circle, Square, Triangle, Star, Hexagon, Zap, Target, Check, Clock, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export interface OpportunityColumn {
  id: string;
  title: string;
  icon: any;
  color: string;
}

const defaultColumns: OpportunityColumn[] = [
  { id: "new", title: "Yeni", icon: Circle, color: "bg-blue-600" },
  { id: "meeting_visit", title: "Görüşme ve Ziyaret", icon: Square, color: "bg-purple-600" },
  { id: "proposal", title: "Teklif", icon: Star, color: "bg-orange-600" },
  { id: "negotiation", title: "Müzakere", icon: Target, color: "bg-yellow-600" },
  { id: "won", title: "Kazanıldı", icon: CheckCircle2, color: "bg-green-600" },
  { id: "lost", title: "Kaybedildi", icon: XCircle, color: "bg-red-600" }
];

const customColumnIcons = [Circle, Square, Triangle, Star, Hexagon, Zap, Target, Check, Clock, ChevronRight];
const customColumnColors = [
  "bg-blue-600", "bg-purple-600", "bg-indigo-600", "bg-amber-600", 
  "bg-yellow-600", "bg-green-600", "bg-red-600", "bg-pink-600", 
  "bg-cyan-600", "bg-orange-600", "bg-teal-600", "bg-lime-600"
];

export const useOpportunityColumns = (
  opportunities: Opportunity[],
  onUpdateOpportunityStatus: (id: string, status: string) => Promise<void>
) => {
  const [columns, setColumns] = useState<OpportunityColumn[]>([]);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);

  // Icon map for reconstruction from localStorage
  const iconMap: { [key: string]: any } = {
    Circle, Square, Triangle, Star, Hexagon, Zap, Target, Check, Clock, ChevronRight, CheckCircle2, XCircle
  };

  // Load custom columns from localStorage on mount
  useEffect(() => {
    // Force reset to new 4-stage system by clearing old data
    const savedColumns = localStorage.getItem('opportunity-columns');
    const savedVersion = localStorage.getItem('opportunity-columns-version');
    
    // If no version or old version, reset to new system
    if (!savedVersion || savedVersion !== '6-stage') {
      localStorage.removeItem('opportunity-columns');
      localStorage.setItem('opportunity-columns-version', '6-stage');
      setColumns(defaultColumns);
      return;
    }
    
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        // Reconstruct icons from stored icon names
        const reconstructedColumns = parsed.map((col: any) => ({
          ...col,
          icon: iconMap[col.iconName] || Circle // fallback to Circle if icon not found
        }));
        setColumns(reconstructedColumns);
      } catch (error) {
        logger.error('Error loading saved columns:', error);
        setColumns(defaultColumns);
      }
    } else {
      setColumns(defaultColumns);
    }
  }, []);

  // Save columns to localStorage whenever they change
  useEffect(() => {
    // Convert columns to serializable format
    const serializableColumns = columns.map(col => ({
      ...col,
      iconName: col.icon.name || 'Circle', // store icon name instead of function
      icon: undefined // remove the function reference
    }));
    localStorage.setItem('opportunity-columns', JSON.stringify(serializableColumns));
  }, [columns]);

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) {
      toast.error("Kolon adı gereklidir");
      return;
    }

    // Check if column title already exists
    if (columns.some(col => col.title.toLowerCase() === newColumnTitle.toLowerCase())) {
      toast.error("Bu isimde bir kolon zaten mevcut");
      return;
    }

    // Generate a unique ID based on title
    const id = newColumnTitle.toLowerCase()
      .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i')
      .replace(/[^a-z0-9]/g, '_');

    // Select random icon and color for custom columns
    const randomIcon = customColumnIcons[Math.floor(Math.random() * customColumnIcons.length)];
    const randomColor = customColumnColors[Math.floor(Math.random() * customColumnColors.length)];

    const newColumn: OpportunityColumn = {
      id,
      title: newColumnTitle.trim(),
      icon: randomIcon,
      color: randomColor
    };

    setColumns([...columns, newColumn]);
    setNewColumnTitle("");
    setIsAddColumnOpen(false);
    toast.success(`"${newColumn.title}" kolonu eklendi`);
  };

  const handleDeleteColumn = (id: string) => {
    if (isDefaultColumn(id)) {
      toast.error("Varsayılan kolonlar silinemez");
      return;
    }
    setColumnToDelete(id);
  };

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) return;

    try {
      // Find opportunities in this column and move them to "new" status
      const opportunitiesInColumn = opportunities.filter(opp => opp.status === columnToDelete);
      
      // Move all opportunities to "new" status
      for (const opportunity of opportunitiesInColumn) {
        await onUpdateOpportunityStatus(opportunity.id, 'new');
      }

      // Remove the column
      setColumns(prev => prev.filter(col => col.id !== columnToDelete));
      
      const deletedColumn = columns.find(col => col.id === columnToDelete);
      toast.success(`"${deletedColumn?.title}" kolonu silindi. Fırsatlar "Yeni" durumuna taşındı.`);
      
    } catch (error) {
      logger.error('Error deleting column:', error);
      toast.error("Kolon silinirken hata oluştu");
    } finally {
      setColumnToDelete(null);
    }
  };

  const isDefaultColumn = (id: string): boolean => {
    return defaultColumns.some(col => col.id === id);
  };

  const handleUpdateColumnTitle = (id: string, newTitle: string) => {
    if (isDefaultColumn(id)) {
      toast.error("Varsayılan kolon isimleri değiştirilemez");
      return;
    }

    setColumns(prev => prev.map(col => 
      col.id === id ? { ...col, title: newTitle } : col
    ));
    toast.success("Kolon adı güncellendi");
  };

  const handleReorderColumns = (startIndex: number, endIndex: number) => {
    const result = Array.from(columns);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setColumns(result);
    toast.success("Kolon sırası güncellendi");
  };

  return {
    columns,
    setColumns,
    isAddColumnOpen,
    setIsAddColumnOpen,
    newColumnTitle,
    setNewColumnTitle,
    columnToDelete,
    setColumnToDelete,
    handleAddColumn,
    handleDeleteColumn,
    confirmDeleteColumn,
    isDefaultColumn,
    handleUpdateColumnTitle,
    handleReorderColumns
  };
};