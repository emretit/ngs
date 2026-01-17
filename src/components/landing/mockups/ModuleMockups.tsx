import { Users, TrendingUp, Package, UserCheck, FileText, DollarSign, Building2, Calendar } from "lucide-react";

// CRM Module Mockup
export const CRMMockup = () => {
  const customers = [
    { name: "ABC Teknoloji Ltd.", status: "Aktif", balance: "₺125,000", trend: "+15%" },
    { name: "XYZ Holding A.Ş.", status: "Aktif", balance: "₺890,000", trend: "+8%" },
    { name: "Demo İnşaat", status: "Beklemede", balance: "₺45,000", trend: "-3%" },
  ];

  return (
    <div className="bg-card rounded-xl border overflow-hidden h-full">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Müşteri Yönetimi</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">1,248</p>
            <p className="text-[10px] text-muted-foreground">Toplam Müşteri</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-500">89%</p>
            <p className="text-[10px] text-muted-foreground">Aktif Oran</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">₺12.4M</p>
            <p className="text-[10px] text-muted-foreground">Toplam Bakiye</p>
          </div>
        </div>

        {/* Customer List */}
        <div className="space-y-2">
          {customers.map((customer, i) => (
            <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-3 h-3 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-foreground">{customer.name}</p>
                  <p className="text-[10px] text-muted-foreground">{customer.status}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground">{customer.balance}</p>
                <p className={`text-[10px] ${customer.trend.startsWith("+") ? "text-emerald-500" : "text-rose-500"}`}>
                  {customer.trend}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Finance Module Mockup
export const FinanceMockup = () => {
  const transactions = [
    { type: "Gelir", desc: "Fatura #2024-1234", amount: "+₺45,000", time: "Bugün" },
    { type: "Gider", desc: "Tedarikçi Ödemesi", amount: "-₺12,500", time: "Dün" },
    { type: "Gelir", desc: "Müşteri Tahsilatı", amount: "+₺78,000", time: "2 gün önce" },
  ];

  return (
    <div className="bg-card rounded-xl border overflow-hidden h-full">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Finansal Analiz</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Chart Preview */}
        <div className="h-20 flex items-end gap-1 px-2">
          {[40, 65, 45, 80, 55, 70, 85, 60, 90, 75, 95, 88].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-primary to-primary/40 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>

        {/* Transactions */}
        <div className="space-y-2">
          {transactions.map((tx, i) => (
            <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
              <div>
                <p className="text-xs font-medium text-foreground">{tx.desc}</p>
                <p className="text-[10px] text-muted-foreground">{tx.time}</p>
              </div>
              <span className={`text-xs font-semibold ${tx.amount.startsWith("+") ? "text-emerald-500" : "text-rose-500"}`}>
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Inventory Module Mockup
export const InventoryMockup = () => {
  const products = [
    { name: "Ürün A-1234", stock: 450, status: "Yeterli", color: "emerald" },
    { name: "Ürün B-5678", stock: 23, status: "Kritik", color: "rose" },
    { name: "Ürün C-9012", stock: 128, status: "Normal", color: "yellow" },
  ];

  return (
    <div className="bg-card rounded-xl border overflow-hidden h-full">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Stok Yönetimi</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">5,892</p>
            <p className="text-[10px] text-muted-foreground">Toplam Ürün</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-rose-500">12</p>
            <p className="text-[10px] text-muted-foreground">Kritik Stok</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">₺8.2M</p>
            <p className="text-[10px] text-muted-foreground">Stok Değeri</p>
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-2">
          {products.map((product, i) => (
            <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
              <div>
                <p className="text-xs font-medium text-foreground">{product.name}</p>
                <p className="text-[10px] text-muted-foreground">Stok: {product.stock} adet</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                product.color === "emerald" ? "bg-emerald-500/20 text-emerald-500" :
                product.color === "rose" ? "bg-rose-500/20 text-rose-500" :
                "bg-yellow-500/20 text-yellow-500"
              }`}>
                {product.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// HR Module Mockup
export const HRMockup = () => {
  const employees = [
    { name: "Ahmet Yılmaz", dept: "Satış", status: "Aktif" },
    { name: "Ayşe Demir", dept: "Finans", status: "İzinde" },
    { name: "Mehmet Kaya", dept: "IT", status: "Aktif" },
  ];

  return (
    <div className="bg-card rounded-xl border overflow-hidden h-full">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">İnsan Kaynakları</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">156</p>
            <p className="text-[10px] text-muted-foreground">Çalışan</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-500">148</p>
            <p className="text-[10px] text-muted-foreground">Aktif</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-500">8</p>
            <p className="text-[10px] text-muted-foreground">İzinde</p>
          </div>
        </div>

        {/* Employee List */}
        <div className="space-y-2">
          {employees.map((emp, i) => (
            <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-primary">{emp.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{emp.name}</p>
                  <p className="text-[10px] text-muted-foreground">{emp.dept}</p>
                </div>
              </div>
              <span className={`text-[10px] ${emp.status === "Aktif" ? "text-emerald-500" : "text-yellow-500"}`}>
                {emp.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default { CRMMockup, FinanceMockup, InventoryMockup, HRMockup };
