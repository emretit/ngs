
import { useState } from "react";
import { Deal } from "@/types/deal";

interface DealsState {
  new: Deal[];
  negotiation: Deal[];
  follow_up: Deal[];
  won: Deal[];
  lost: Deal[];
}

const initialDeals: DealsState = {
  new: [
    {
      id: "1",
      title: "Kurumsal Yazılım Çözümü",
      value: 50000,
      customerName: "Tech Corp",
      employeeName: "Ahmet Yılmaz",
      priority: "high",
      status: "new",
      proposalDate: new Date(),
      lastContactDate: new Date(),
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      description: "Kurumsal yazılım çözümü, uygulama ve eğitim dahil.",
      department: "Kurumsal Satış",
      contactHistory: [],
      proposalFiles: [],
      nextSteps: [
        { id: 1, action: "Teknik inceleme planla", dueDate: "2024-03-20" }
      ],
      productServices: [
        { id: 1, name: "Kurumsal Lisans", quantity: 1, price: 35000 },
        { id: 2, name: "Uygulama Hizmeti", quantity: 1, price: 15000 }
      ],
      reminders: []
    },
    {
      id: "2",
      title: "Bulut Göç Projesi",
      value: 25000,
      customerName: "StartUp A.Ş.",
      employeeName: "Zeynep Kaya",
      priority: "medium",
      status: "new",
      proposalDate: new Date(),
      lastContactDate: new Date(),
      department: "Bulut Çözümleri",
      contactHistory: [],
      proposalFiles: [],
      nextSteps: [],
      productServices: [],
      reminders: []
    },
  ],
  negotiation: [],
  follow_up: [],
  won: [],
  lost: [],
};

export const useDeals = () => {
  const [deals, setDeals] = useState<DealsState>(initialDeals);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState<Deal[]>([]);

  const handleDragEnd = (result: any) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (source.droppableId === destination.droppableId) {
      const column = Array.from(deals[source.droppableId as keyof DealsState]);
      const [removed] = column.splice(source.index, 1);
      column.splice(destination.index, 0, removed);
      setDeals({ ...deals, [source.droppableId]: column });
      return;
    }

    const sourceColumn = Array.from(deals[source.droppableId as keyof DealsState]);
    const destColumn = Array.from(deals[destination.droppableId as keyof DealsState]);
    const [removed] = sourceColumn.splice(source.index, 1);
    const updatedDeal = { ...removed, status: destination.droppableId };
    destColumn.splice(destination.index, 0, updatedDeal);
    setDeals({
      ...deals,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn,
    });
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsModalOpen(true);
  };

  const handleDealSelect = (deal: Deal) => {
    setSelectedDeals(prev => {
      const isSelected = prev.some(d => d.id === deal.id);
      if (isSelected) {
        return prev.filter(d => d.id !== deal.id);
      }
      return [...prev, deal];
    });
  };

  const handleBulkStatusUpdate = (selectedDeals: Deal[], newStatus: Deal["status"]) => {
    const updatedDeals = { ...deals };
    
    selectedDeals.forEach(deal => {
      const oldStatus = deal.status;
      updatedDeals[oldStatus] = updatedDeals[oldStatus].filter(d => d.id !== deal.id);
      updatedDeals[newStatus] = [...updatedDeals[newStatus], { ...deal, status: newStatus }];
    });
    
    setDeals(updatedDeals);
    setSelectedDeals([]);
  };

  return {
    deals,
    selectedDeal,
    isModalOpen,
    selectedDeals,
    handleDragEnd,
    handleDealClick,
    handleDealSelect,
    handleBulkStatusUpdate,
    setIsModalOpen,
    setSelectedDeals,
  };
};
