
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import TaskForm from "@/components/activities/form/TaskForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle>Yeni Aktivite Oluştur</CardTitle>
          <CardDescription>
            Yeni bir aktivite eklemek için aşağıdaki formu doldurun. Zorunlu alanlar
            <span className="text-red-500 mx-1">*</span>
            ile işaretlenmiştir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm onClose={handleClose} />
        </CardContent>
      </Card>
    </DefaultLayout>
  );
};

export default NewActivity;
