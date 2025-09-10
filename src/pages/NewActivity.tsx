
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import TaskForm from "@/components/activities/form/TaskForm";
import { EnhancedCard, SummaryCard } from "@/components/shared";
import { Label } from "@/components/ui/label";

interface NewActivityProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const NewActivity = ({ isCollapsed, setIsCollapsed }: NewActivityProps) => {
  const navigate = useNavigate();
  
  const handleClose = () => {
    navigate("/activities");
  };

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="Yeni Aktivite"
      subtitle="Yeni bir aktivite oluşturun"
    >
      <EnhancedCard className="border-none shadow-lg">
        <div className="pb-4">
          <h3>Yeni Aktivite Oluştur</h3>
          <EnhancedCardDescription>
            Yeni bir aktivite eklemek için aşağıdaki formu doldurun. Zorunlu alanlar
            <span className="text-red-500 mx-1">*</span>
            ile işaretlenmiştir.
          </EnhancedCardDescription>
        </div>
        <div>
          <TaskForm onClose={handleClose} />
        </div>
      </EnhancedCard>
    </DefaultLayout>
  );
};

export default NewActivity;
