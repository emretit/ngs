
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, DollarSign, Calendar, BarChart2, CheckSquare } from "lucide-react";

interface TabsListProps {
  activeTab: string;
}

export const EmployeeTabsList = ({ activeTab }: TabsListProps) => {
  return (
    <TabsList className="w-full sticky top-4 z-10">
      <TabsTrigger value="details" className="flex items-center gap-2">
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">Genel Bilgiler</span>
      </TabsTrigger>
      <TabsTrigger value="salary" className="flex items-center gap-2">
        <DollarSign className="w-4 h-4" />
        <span className="hidden sm:inline">Maaş</span>
      </TabsTrigger>
      <TabsTrigger value="leave" className="flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        <span className="hidden sm:inline">İzin</span>
      </TabsTrigger>
      <TabsTrigger value="performance" className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4" />
        <span className="hidden sm:inline">Performans</span>
      </TabsTrigger>
      <TabsTrigger value="tasks" className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Görevler</span>
      </TabsTrigger>
    </TabsList>
  );
};
