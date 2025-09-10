// NavigationGroup kullanım örnekleri
import React, { useState } from "react";
import {
  Navigation,
  NavLink,
  BreadcrumbNavigation,
  TabsNavigation,
  NavigationHeader,
  type NavigationItem,
  type TabItem,
  type BreadcrumbItem,
} from "../index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Home,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Settings,
  TrendingUp,
  Target,
  ListTodo,
  Building2,
  Receipt,
  Briefcase,
  BarChart2,
  User,
  Bell,
  Search,
  Plus
} from "lucide-react";

// Örnek navigation yapısı
const navigationItems: NavigationItem[] = [
  {
    path: "/dashboard",
    icon: Home,
    label: "Gösterge Paneli",
  },
  {
    category: "Satış Yönetimi",
    icon: TrendingUp,
    path: "/sales",
    defaultExpanded: true,
    items: [
      {
        path: "/opportunities",
        icon: Target,
        label: "Fırsatlar",
        badge: "12",
      },
      {
        path: "/proposals",
        icon: FileText,
        label: "Teklifler",
        badge: "5",
      },
      {
        path: "/activities",
        icon: ListTodo,
        label: "Aktiviteler",
      },
      {
        path: "/orders",
        icon: ShoppingCart,
        label: "Siparişler",
        badge: "3",
      },
    ],
  },
  {
    category: "İletişim",
    icon: Users,
    items: [
      {
        path: "/customers",
        icon: User,
        label: "Müşteriler",
        badge: "1.2K",
      },
      {
        path: "/suppliers",
        icon: Building2,
        label: "Tedarikçiler",
      },
    ],
  },
  {
    path: "/products",
    icon: Package,
    label: "Ürünler",
    badge: "New",
  },
  {
    path: "/reports",
    icon: BarChart2,
    label: "Raporlar",
  },
  {
    path: "/settings",
    icon: Settings,
    label: "Ayarlar",
  },
];

// Örnek tab items
const tabItems: TabItem[] = [
  {
    id: "overview",
    label: "Genel Bakış",
    icon: Home,
  },
  {
    id: "analytics",
    label: "Analitik",
    icon: BarChart2,
    badge: "2",
  },
  {
    id: "users",
    label: "Kullanıcılar",
    icon: Users,
    badge: "156",
  },
  {
    id: "settings",
    label: "Ayarlar",
    icon: Settings,
  },
  {
    id: "disabled",
    label: "Devre Dışı",
    icon: Bell,
    disabled: true,
  },
];

// Örnek breadcrumb items
const breadcrumbItems: BreadcrumbItem[] = [
  {
    label: "Satış",
    path: "/sales",
    icon: TrendingUp,
  },
  {
    label: "Teklifler",
    path: "/proposals",
    icon: FileText,
  },
  {
    label: "Teklif Detayı",
    icon: Receipt,
  },
];

export function NavigationGroupExample() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          NavigationGroup Bileşenleri Örneği
        </h1>
        <p className="text-gray-600">
          Farklı navigasyon türleri ve kullanım senaryoları
        </p>
      </div>

      {/* Navigation Header */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">1. Navigation Header</h2>
        <Card>
          <CardContent className="p-0">
            <NavigationHeader
              title="Proje Yönetimi"
              subtitle="Aktif projelerinizi yönetin"
              logo={
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-white" />
                </div>
              }
              actions={
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Search className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Bell className="h-4 w-4" />
                  </button>
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-1 inline" />
                    Yeni
                  </button>
                </div>
              }
            />
          </CardContent>
        </Card>
      </section>

      {/* Breadcrumb Navigation */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">2. Breadcrumb Navigation</h2>
        <Card>
          <CardHeader>
            <CardTitle>Sayfa Konumu</CardTitle>
          </CardHeader>
          <CardContent>
            <BreadcrumbNavigation 
              items={breadcrumbItems}
              homeLink="/dashboard"
            />
          </CardContent>
        </Card>
      </section>

      {/* Tabs Navigation */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">3. Tabs Navigation</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Default Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Default Tabs</CardTitle>
            </CardHeader>
            <CardContent>
              <TabsNavigation
                items={tabItems}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="default"
                size="sm"
              />
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Aktif Tab: <strong>{activeTab}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pills Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Pills Tabs</CardTitle>
            </CardHeader>
            <CardContent>
              <TabsNavigation
                items={tabItems}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="pills"
                size="sm"
              />
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Pills stili kullanarak modern görünüm
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Underline Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Underline Tabs</CardTitle>
            </CardHeader>
            <CardContent>
              <TabsNavigation
                items={tabItems}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="underline"
                size="sm"
              />
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Alt çizgi ile minimal tasarım
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sidebar Navigation */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">4. Sidebar Navigation</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expanded Navigation */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Genişletilmiş Navigasyon</CardTitle>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="px-2 py-1 text-xs bg-gray-100 rounded"
              >
                {isCollapsed ? "Genişlet" : "Daralt"}
              </button>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-4" style={{ minHeight: '400px' }}>
                <Navigation
                  items={navigationItems}
                  isCollapsed={isCollapsed}
                  defaultExpanded={["Satış Yönetimi"]}
                  storageKey="example-nav"
                />
              </div>
            </CardContent>
          </Card>

          {/* Individual Navigation Links */}
          <Card>
            <CardHeader>
              <CardTitle>Tekil Navigation Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Normal Links</h3>
                <div className="bg-gray-900 rounded-lg p-3 space-y-1">
                  <NavLink
                    to="/dashboard"
                    icon={Home}
                    label="Gösterge Paneli"
                    isActive={true}
                  />
                  <NavLink
                    to="/users"
                    icon={Users}
                    label="Kullanıcılar"
                    badge="12"
                  />
                  <NavLink
                    to="/analytics"
                    icon={BarChart2}
                    label="Analitik"
                    external={true}
                  />
                </div>

                <h3 className="text-sm font-medium text-gray-700 mb-3 mt-6">Sub Items</h3>
                <div className="bg-gray-900 rounded-lg p-3 space-y-1">
                  <NavLink
                    to="/sales/opportunities"
                    icon={Target}
                    label="Fırsatlar"
                    isSubItem={true}
                    badge="5"
                  />
                  <NavLink
                    to="/sales/proposals"
                    icon={FileText}
                    label="Teklifler"
                    isSubItem={true}
                    isActive={true}
                  />
                  <NavLink
                    to="/sales/orders"
                    icon={ShoppingCart}
                    label="Siparişler"
                    isSubItem={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Real-world Layout Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">5. Gerçek Dünya Layoutu</h2>
        
        <Card>
          <CardContent className="p-0">
            <div className="flex h-96">
              {/* Sidebar */}
              <div className="w-64 bg-gray-900 overflow-auto">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">NGS</h3>
                      <p className="text-xs text-gray-400">Business App</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <Navigation
                    items={navigationItems}
                    defaultExpanded={["Satış Yönetimi", "İletişim"]}
                    storageKey="demo-nav"
                  />
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col">
                <NavigationHeader
                  title="Dashboard"
                  subtitle="Genel sistem durumu"
                  actions={
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Bell className="h-4 w-4" />
                      </button>
                    </div>
                  }
                />
                
                <div className="p-6">
                  <BreadcrumbNavigation 
                    items={[
                      { label: "Dashboard", icon: Home }
                    ]}
                  />
                  
                  <div className="mt-6">
                    <TabsNavigation
                      items={[
                        { id: "overview", label: "Genel", icon: Home },
                        { id: "stats", label: "İstatistikler", icon: BarChart2, badge: "New" },
                        { id: "users", label: "Kullanıcılar", icon: Users },
                      ]}
                      activeTab="overview"
                      onTabChange={() => {}}
                      variant="underline"
                    />
                    
                    <div className="mt-6 p-8 bg-gray-50 rounded-lg text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Dashboard İçeriği
                      </h3>
                      <p className="text-gray-600">
                        Bu alan dashboard içeriklerini gösterecek
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
