import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, FileText, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface InvoiceManagementProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const InvoiceManagement = ({ isCollapsed, setIsCollapsed }: InvoiceManagementProps) => {
  const invoiceModules = [
    {
      title: "Satış Faturaları",
      description: "Müşteri faturalarının yönetimi ve takibi",
      icon: Receipt,
      path: "/sales-invoices",
      color: "from-primary/5 via-primary/10 to-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary"
    },
    {
      title: "Alış Faturaları", 
      description: "Tedarikçi faturalarının yönetimi ve takibi",
      icon: Receipt,
      path: "/purchase-invoices",
      color: "from-success/5 via-success/10 to-success/5",
      iconBg: "bg-success/10",
      iconColor: "text-success"
    },
    {
      title: "E-Fatura Yönetimi",
      description: "Elektronik fatura entegrasyonu ve işlemleri",
      icon: FileText,
      path: "/purchase/e-invoice",
      color: "from-accent/5 via-accent/10 to-accent/5",
      iconBg: "bg-accent/10",
      iconColor: "text-accent"
    },
    {
      title: "Fatura Analizi",
      description: "Aylık fatura analizleri ve performans raporları",
      icon: BarChart3,
      path: "/invoices/analysis",
      color: "from-warning/5 via-warning/10 to-warning/5",
      iconBg: "bg-warning/10",
      iconColor: "text-warning"
    }
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Fatura Yönetimi
          </h1>
          <p className="text-muted-foreground">
            Tüm fatura işlemlerinizi tek yerden yönetin
          </p>
        </div>
      </div>

      {/* Main Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {invoiceModules.map((module) => {
          const IconComponent = module.icon;
          return (
            <Link key={module.path} to={module.path}>
              <Card className="h-full hover:shadow-xl transition-all duration-300 group cursor-pointer border-0 shadow-md overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <CardHeader className="relative pb-4">
                  <div className={`w-14 h-14 rounded-xl ${module.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                    <IconComponent className={`h-7 w-7 ${module.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex items-center justify-end">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/sales-invoices/create">
            <Button 
              variant="outline" 
              className="w-full h-auto p-4 flex flex-col items-start justify-start hover:shadow-md hover:border-primary transition-all duration-200"
            >
              <Receipt className="h-5 w-5 mb-2 text-primary" />
              <span className="font-medium">Yeni Satış Faturası</span>
            </Button>
          </Link>
          
          <Link to="/purchase-invoices">
            <Button 
              variant="outline" 
              className="w-full h-auto p-4 flex flex-col items-start justify-start hover:shadow-md hover:border-primary transition-all duration-200"
            >
              <Receipt className="h-5 w-5 mb-2 text-primary" />
              <span className="font-medium">Yeni Alış Faturası</span>
            </Button>
          </Link>

          <Link to="/purchase/e-invoice">
            <Button 
              variant="outline" 
              className="w-full h-auto p-4 flex flex-col items-start justify-start hover:shadow-md hover:border-primary transition-all duration-200"
            >
              <FileText className="h-5 w-5 mb-2 text-primary" />
              <span className="font-medium">E-Fatura Kontrol</span>
            </Button>
          </Link>

          <Link to="/invoices/analysis">
            <Button
              variant="outline"
              className="w-full h-auto p-4 flex flex-col items-start justify-start hover:shadow-md hover:border-primary transition-all duration-200"
            >
              <BarChart3 className="h-5 w-5 mb-2 text-primary" />
              <span className="font-medium">Fatura Analizi</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagement;