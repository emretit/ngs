import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  MoreHorizontal
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface AccountDetailLayoutProps {
  children: React.ReactNode;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  account: {
    id: string;
    name: string;
    type: string;
    current_balance: number;
    currency: string;
    is_active: boolean;
    created_at: string;
  };
  showBalances: boolean;
  setShowBalances: (value: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddTransaction?: () => void;
  accountType: "cash" | "bank" | "credit" | "partner";
}

const AccountDetailLayout = ({
  children,
  isCollapsed,
  setIsCollapsed,
  account,
  showBalances,
  setShowBalances,
  onEdit,
  onDelete,
  onAddTransaction,
  accountType
}: AccountDetailLayoutProps) => {
  const navigate = useNavigate();

  const getAccountIcon = () => {
    switch (accountType) {
      case "cash":
        return "💰";
      case "bank":
        return "🏦";
      case "credit":
        return "💳";
      case "partner":
        return "👥";
      default:
        return "💼";
    }
  };

  const getAccountTypeLabel = () => {
    switch (accountType) {
      case "cash":
        return "Nakit Kasa";
      case "bank":
        return "Banka Hesabı";
      case "credit":
        return "Kredi Kartı";
      case "partner":
        return "Şirket Ortağı";
      default:
        return "Hesap";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Navbar */}
      <div className={`fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 transition-all duration-300 flex flex-col ${
        isCollapsed ? "w-[60px]" : "w-64"
      }`}>
        {/* Navbar content will be rendered here */}
      </div>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${
        isCollapsed ? "ml-[60px]" : "ml-64"
      }`}>
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">{getAccountIcon()}</span>
                  {account.name}
                </h1>
                <p className="text-gray-600">{getAccountTypeLabel()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBalances(!showBalances)}
              >
                {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </Button>
              )}
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Account Info Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Mevcut Bakiye</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {showBalances 
                        ? formatCurrency(account.current_balance, account.currency)
                        : "••••••"
                      }
                    </p>
                  </div>
                  <div className="text-2xl">{getAccountIcon()}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hesap Durumu</p>
                    <Badge variant={account.is_active ? "default" : "secondary"}>
                      {account.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Para Birimi</p>
                    <p className="text-lg font-semibold text-gray-900">{account.currency}</p>
                  </div>
                  <div className="text-lg">💱</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Oluşturulma</p>
                    <p className="text-sm text-gray-900">
                      {new Date(account.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="text-lg">📅</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <div className="flex gap-2">
              {onAddTransaction && (
                <Button onClick={onAddTransaction} className="bg-blue-600 hover:bg-blue-700">
                  <span className="mr-2">+</span>
                  Yeni İşlem
                </Button>
              )}
              <Button variant="outline">
                <span className="mr-2">📊</span>
                Rapor
              </Button>
              <Button variant="outline">
                <span className="mr-2">📤</span>
                Dışa Aktar
              </Button>
            </div>
          </div>

          {/* Main Content */}
          {children}
        </div>
      </main>
    </div>
  );
};

export default AccountDetailLayout;
