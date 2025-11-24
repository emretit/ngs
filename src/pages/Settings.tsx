import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings2, Users, UserCheck, Zap, Wrench, FileText, CreditCard, ClipboardList } from "lucide-react";
interface SettingsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const Settings = ({ isCollapsed, setIsCollapsed }: SettingsProps) => {
  const navigate = useNavigate();
  useEffect(() => {
    // Varsayılan olarak kullanıcılar sayfasına yönlendir
    navigate("/users", { replace: true });
  }, [navigate]);
  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
          {/* Sol taraf - Başlık */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-white shadow-lg">
              <Settings2 className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Ayarlar & Yönetim
              </h1>
              <p className="text-xs text-muted-foreground/70">
                Sistem ayarlarını yönetin ve kullanıcı izinlerini düzenleyin.
              </p>
            </div>
          </div>
          {/* Orta - İstatistik Kartları */}
          <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
            {/* Sistem Durumu */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-600 shadow-sm">
              <Settings2 className="h-3 w-3" />
              <span className="font-bold">Sistem Durumu</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                Aktif
              </span>
            </div>
            {/* Toplam Kullanıcı */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
              <Users className="h-3 w-3" />
              <span className="font-medium">Kullanıcılar</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                -
              </span>
            </div>
            {/* Entegrasyonlar */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300">
              <Zap className="h-3 w-3" />
              <span className="font-medium">Entegrasyonlar</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                -
              </span>
            </div>
          </div>
          {/* Sağ taraf - Boş alan (gelecekte butonlar eklenebilir) */}
          <div className="flex items-center gap-2">
            {/* Gelecekte butonlar buraya eklenebilir */}
          </div>
        </div>
        {/* Ayarlar Menüsü */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Kullanıcılar */}
              <div 
                onClick={() => navigate("/users")}
                className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg group-hover:shadow-xl transition-shadow">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      Kullanıcılar
                    </h3>
                    <p className="text-sm text-gray-600">
                      Sistem kullanıcılarını yönetin
                    </p>
                  </div>
                </div>
              </div>
              {/* Abonelik & Faturalama */}
              <div 
                onClick={() => navigate("/subscription")}
                className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg group-hover:shadow-xl transition-shadow">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      Abonelik & Faturalama
                    </h3>
                    <p className="text-sm text-gray-600">
                      Paket ve ödeme yönetimi
                    </p>
                  </div>
                </div>
              </div>
              {/* Roller & İzinler */}
              <div 
                onClick={() => navigate("/settings/roles")}
                className="p-6 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white shadow-lg group-hover:shadow-xl transition-shadow">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      Roller & İzinler
                    </h3>
                    <p className="text-sm text-gray-600">
                      Kullanıcı rollerini düzenleyin
                    </p>
                  </div>
                </div>
              </div>
              {/* Nilvera E-Fatura */}
              <div 
                onClick={() => navigate("/nilvera")}
                className="p-6 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white shadow-lg group-hover:shadow-xl transition-shadow">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      Nilvera E-Fatura
                    </h3>
                    <p className="text-sm text-gray-600">
                      E-fatura entegrasyonu ayarları
                    </p>
                  </div>
                </div>
              </div>
              {/* Sistem Ayarları */}
              <div 
                onClick={() => navigate("/system")}
                className="p-6 rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg text-white shadow-lg group-hover:shadow-xl transition-shadow">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">
                      Sistem Ayarları
                    </h3>
                    <p className="text-sm text-gray-600">
                      Genel sistem ayarları
                    </p>
                  </div>
                </div>
              </div>
              {/* PDF Şablonları */}
              <div 
                onClick={() => navigate("/pdf-templates")}
                className="p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg group-hover:shadow-xl transition-shadow">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      PDF Şablonları
                    </h3>
                    <p className="text-sm text-gray-600">
                      PDF şablonlarını yönetin
                    </p>
                  </div>
                </div>
              </div>
              {/* Denetim Günlüğü */}
              <div 
                onClick={() => navigate("/audit-logs")}
                className="p-6 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-white shadow-lg group-hover:shadow-xl transition-shadow">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      Denetim Günlüğü
                    </h3>
                    <p className="text-sm text-gray-600">
                      Sistem aktivite logları ve değişiklik geçmişi
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};
export default Settings;