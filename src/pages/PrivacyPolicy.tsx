import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/50 hover:text-red-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfaya Dön</span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Pafta.App Gizlilik Politikası</h1>
          <p className="text-white/50">Son Güncelleme: 15 Ocak 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-4xl">
          <div className="bg-white/5 border border-white/10 rounded-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Giriş</h2>
              <p className="text-white/70 leading-relaxed">
                Pafta.App ("Biz", "Bizim", "Uygulama"), kullanıcılarımızın gizliliğini korumayı taahhüt eder. 
                Bu Gizlilik Politikası, Pafta.App mobil uygulamasını ("Uygulama") kullandığınızda kişisel 
                bilgilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Toplanan Bilgiler</h2>
              
              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">2.1 Kullanıcı Hesap Bilgileri</h3>
              <ul className="text-white/70 space-y-2 list-disc list-inside">
                <li>E-posta adresi</li>
                <li>İsim ve iletişim bilgileri</li>
                <li>Şirket bilgileri</li>
              </ul>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">2.2 Teknik Servis Verileri</h3>
              <ul className="text-white/70 space-y-2 list-disc list-inside">
                <li>Servis talepleri</li>
                <li>Müşteri bilgileri</li>
                <li>Servis geçmişi</li>
                <li>İmza verileri</li>
                <li>PDF belgeleri</li>
              </ul>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">2.3 Konum Bilgileri</h3>
              <p className="text-white/70 leading-relaxed mb-2">
                Uygulama, teknik servis hizmetleri için konum bilgilerinizi kullanır:
              </p>
              <ul className="text-white/70 space-y-2 list-disc list-inside mb-3">
                <li>Google Maps entegrasyonu ile harita görüntüleme</li>
                <li>Servis adreslerinin belirlenmesi</li>
                <li>Rota planlama</li>
              </ul>
              <p className="text-white/70 leading-relaxed italic">
                <strong>Not:</strong> Konum bilgileri yalnızca servis hizmetleri için kullanılır ve cihazınızda saklanır.
              </p>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">2.4 Cihaz Bilgileri</h3>
              <ul className="text-white/70 space-y-2 list-disc list-inside">
                <li>Cihaz modeli ve işletim sistemi</li>
                <li>Uygulama versiyonu</li>
                <li>Benzersiz cihaz tanımlayıcıları</li>
              </ul>

              <h3 className="text-xl font-semibold text-white/90 mb-3 mt-6">2.5 Kullanım Verileri</h3>
              <ul className="text-white/70 space-y-2 list-disc list-inside">
                <li>Uygulama içi aktiviteler</li>
                <li>Hata logları</li>
                <li>Performans metrikleri</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Bilgilerin Kullanımı</h2>
              <p className="text-white/70 leading-relaxed mb-3">
                Toplanan bilgiler aşağıdaki amaçlar için kullanılır:
              </p>
              <ul className="text-white/70 space-y-2 list-disc list-inside">
                <li>Teknik servis yönetimi ve takibi</li>
                <li>Müşteri ilişkileri yönetimi (CRM)</li>
                <li>Servis taleplerinin işlenmesi</li>
                <li>Fatura ve belge oluşturma</li>
                <li>Push bildirimleri gönderme</li>
                <li>Uygulama performansını iyileştirme</li>
                <li>Güvenlik ve dolandırıcılık önleme</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Bilgilerin Paylaşımı</h2>
              <p className="text-white/70 leading-relaxed mb-3">
                Kişisel bilgileriniz aşağıdaki durumlar dışında üçüncü taraflarla paylaşılmaz:
              </p>
              <ul className="text-white/70 space-y-2 list-disc list-inside">
                <li><strong>Supabase:</strong> Veri depolama ve backend hizmetleri için</li>
                <li><strong>Firebase:</strong> Push bildirimleri için</li>
                <li><strong>Google Maps:</strong> Harita ve konum hizmetleri için</li>
                <li>Yasal yükümlülükler gereği yetkili makamlarla</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Veri Güvenliği</h2>
              <p className="text-white/70 leading-relaxed mb-3">
                Verilerinizin güvenliğini sağlamak için:
              </p>
              <ul className="text-white/70 space-y-2 list-disc list-inside">
                <li>SSL/TLS şifreleme kullanıyoruz</li>
                <li>Güvenli sunucu altyapısı (Supabase)</li>
                <li>Düzenli güvenlik güncellemeleri</li>
                <li>Erişim kontrolleri ve yetkilendirme</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Veri Saklama</h2>
              <p className="text-white/70 leading-relaxed">
                Kişisel bilgileriniz, hesabınız aktif olduğu sürece saklanır. Hesabınızı sildiğinizde, 
                verileriniz 30 gün içinde silinir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Kullanıcı Hakları</h2>
              <p className="text-white/70 leading-relaxed mb-3">
                Aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="text-white/70 space-y-2 list-disc list-inside mb-4">
                <li>Kişisel verilerinize erişim</li>
                <li>Verilerinizin düzeltilmesi</li>
                <li>Verilerinizin silinmesi</li>
                <li>Veri işlemeye itiraz</li>
                <li>Veri taşınabilirliği</li>
              </ul>
              <p className="text-white/70 leading-relaxed">
                Bu haklarınızı kullanmak için: <a href="mailto:info@pafta.app" className="text-red-400 hover:underline">info@pafta.app</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Çocukların Gizliliği</h2>
              <p className="text-white/70 leading-relaxed">
                Uygulamamız 13 yaş altındaki çocuklardan bilgi toplamaz. 13 yaş altındaysanız, 
                lütfen uygulamayı kullanmayın.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Çerezler ve Takip Teknolojileri</h2>
              <p className="text-white/70 leading-relaxed mb-3">
                Uygulama, kullanıcı deneyimini iyileştirmek için:
              </p>
              <ul className="text-white/70 space-y-2 list-disc list-inside">
                <li>Yerel depolama (SharedPreferences)</li>
                <li>Oturum yönetimi</li>
                <li>Analitik veriler</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Üçüncü Taraf Hizmetleri</h2>
              <p className="text-white/70 leading-relaxed mb-3">
                Uygulama aşağıdaki üçüncü taraf hizmetleri kullanır:
              </p>
              <ul className="text-white/70 space-y-2 list-disc list-inside mb-4">
                <li><strong>Supabase:</strong> Backend ve veritabanı hizmetleri</li>
                <li><strong>Firebase:</strong> Push bildirimleri</li>
                <li><strong>Google Maps:</strong> Harita ve konum hizmetleri</li>
              </ul>
              <p className="text-white/70 leading-relaxed mb-2">Bu hizmetlerin gizlilik politikaları:</p>
              <ul className="text-white/70 space-y-2">
                <li>
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
                    Supabase: https://supabase.com/privacy
                  </a>
                </li>
                <li>
                  <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
                    Firebase: https://firebase.google.com/support/privacy
                  </a>
                </li>
                <li>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
                    Google Maps: https://policies.google.com/privacy
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Gizlilik Politikası Değişiklikleri</h2>
              <p className="text-white/70 leading-relaxed">
                Bu Gizlilik Politikası zaman zaman güncellenebilir. Önemli değişiklikler için size bildirimde bulunacağız.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. İletişim</h2>
              <p className="text-white/70 leading-relaxed mb-3">
                Gizlilik ile ilgili sorularınız için:
              </p>
              <p className="text-white/70 leading-relaxed">
                <strong>E-posta:</strong> <a href="mailto:info@pafta.app" className="text-red-400 hover:underline">info@pafta.app</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

