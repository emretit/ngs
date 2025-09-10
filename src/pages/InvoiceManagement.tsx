import Navbar from "@/components/Navbar";
import { EnhancedCard, SummaryCard } from "@/components/shared";
import { Receipt, FileText, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { PrimaryButton, SecondaryButton } from "@/components/shared";

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
      color: "from-blue-500 to-cyan-500",
      stats: "124 Aktif Fatura"
    },
    {
      title: "Alış Faturaları", 
      description: "Tedarikçi faturalarının yönetimi ve takibi",
      icon: Receipt,
      path: "/purchase-invoices",
      color: "from-green-500 to-emerald-500",
      stats: "87 Aktif Fatura"
    },
    {
      title: "E-Fatura Yönetimi",
      description: "Elektronik fatura entegrasyonu ve işlemleri",
      icon: FileText,
      path: "/purchase/e-invoice",
      color: "from-purple-500 to-violet-500",
      stats: "E-Fatura Aktif"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex relative">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}
      >
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Fatura Yönetimi
              </h1>
              <p className="text-gray-600">
                Tüm fatura işlemlerinizi tek yerden yönetin
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoiceModules.map((module) => {
              const IconComponent = module.icon;
              return (
                <Link key={module.path} to={module.path}>
                  <EnhancedCard className="h-full hover:shadow-lg transition-all duration-200 group cursor-pointer border-0 shadow-md">
                    <div className="pb-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {module.title}
                      </h3>
                      <EnhancedCardDescription className="text-gray-600">
                        {module.description}
                      </EnhancedCardDescription>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">
                          {module.stats}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-200">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </EnhancedCard>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Hızlı İşlemler</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col items-start justify-start hover:shadow-md transition-all duration-200"
                asChild
              >
                <Link to="/sales-invoices">
                  <Plus className="h-5 w-5 mb-2" />
                  <span className="font-medium">Yeni Satış Faturası</span>
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col items-start justify-start hover:shadow-md transition-all duration-200"
                asChild
              >
                <Link to="/purchase-invoices">
                  <Plus className="h-5 w-5 mb-2" />
                  <span className="font-medium">Yeni Alış Faturası</span>
                </Link>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col items-start justify-start hover:shadow-md transition-all duration-200"
                asChild
              >
                <Link to="/purchase/e-invoice">
                  <FileText className="h-5 w-5 mb-2" />
                  <span className="font-medium">E-Fatura Kontrol</span>
                </Link>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col items-start justify-start hover:shadow-md transition-all duration-200"
                asChild
              >
                <Link to="/cashflow">
                  <Receipt className="h-5 w-5 mb-2" />
                  <span className="font-medium">Fatura Raporları</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InvoiceManagement;