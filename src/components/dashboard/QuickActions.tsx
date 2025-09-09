import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Receipt, Users, TrendingUp, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Yeni Fatura",
      description: "Satış faturası oluştur",
      icon: <FileText className="h-5 w-5" />,
      onClick: () => navigate("/sales-invoices"),
      variant: "default" as const
    },
    {
      title: "Gider Ekle",
      description: "Yeni gider kaydı",
      icon: <Receipt className="h-5 w-5" />,
      onClick: () => navigate("/expense-management"),
      variant: "outline" as const
    },
    {
      title: "Müşteri Ekle",
      description: "Yeni müşteri kaydı",
      icon: <Users className="h-5 w-5" />,
      onClick: () => navigate("/customer-form"),
      variant: "outline" as const
    },
    {
      title: "Rapor İndir",
      description: "Mali rapor al",
      icon: <Download className="h-5 w-5" />,
      onClick: () => {/* Export functionality */},
      variant: "outline" as const
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Hızlı İşlemler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto p-4 flex flex-col items-start gap-2 text-left"
              onClick={action.onClick}
            >
              <div className="flex items-center gap-2 w-full">
                {action.icon}
                <span className="font-medium text-sm">{action.title}</span>
              </div>
              <span className="text-xs text-muted-foreground font-normal">
                {action.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};