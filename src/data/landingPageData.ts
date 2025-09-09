
import { 
  Shield, 
  MessageSquare, 
  Smartphone, 
  BarChart3,
  Globe,
  Zap,
  Star,
} from "lucide-react";

export const coreFeatures = [
  {
    title: "Kolay Kullanım",
    description: "Sezgisel arayüz ile tüm ekibiniz hızlıca adapte olabilir, eğitim gerektirmez.",
    icon: Zap,
  },
  {
    title: "Esnek Raporlama",
    description: "Özelleştirilebilir raporlar ve grafiklerle verilerinizi anlamlı bilgilere dönüştürün.",
    icon: BarChart3,
  },
  {
    title: "Entegrasyonlar",
    description: "Mevcut araçlarınızla sorunsuz entegrasyon, iş akışlarınızı kesintisiz hale getirin.",
    icon: Globe,
  },
  {
    title: "Mobil Uyumlu",
    description: "Hareket halindeyken bile işlerinizi yönetin, her cihazdan erişim sağlayın.",
    icon: Smartphone,
  },
];

export const screenshots = [
  {
    title: "Satış Yönetimi",
    description: "Fırsatları takip edin, teklifler oluşturun ve satış süreçlerinizi optimize edin.",
    image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  },
  {
    title: "Envanter Takibi",
    description: "Stok seviyelerinizi gerçek zamanlı izleyin, otomatik sipariş noktaları belirleyin.",
    image: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2076&q=80",
  },
  {
    title: "Finansal Analiz",
    description: "Gelir-gider takibi yapın, nakit akışınızı planlayın ve finansal performansınızı analiz edin.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2015&q=80",
  },
];

export const pricingPlans = [
  {
    name: "Starter",
    price: "₺299",
    description: "Küçük işletmeler ve yeni başlayanlar için ideal.",
    features: [
      "5 kullanıcıya kadar",
      "Temel CRM özellikleri",
      "Müşteri yönetimi",
      "Basit raporlama",
      "E-posta desteği"
    ],
    buttonText: "Ücretsiz Deneyin",
    featured: false
  },
  {
    name: "Business",
    price: "₺599",
    description: "Büyüyen işletmeler için kapsamlı özellikler.",
    features: [
      "20 kullanıcıya kadar",
      "Gelişmiş CRM özellikleri",
      "Envanter yönetimi",
      "Finansal raporlama",
      "Öncelikli destek",
      "API erişimi"
    ],
    buttonText: "Ücretsiz Deneyin",
    featured: true
  },
  {
    name: "Enterprise",
    price: "₺999",
    description: "Büyük ölçekli işletmeler için özel çözümler.",
    features: [
      "Sınırsız kullanıcı",
      "Tüm özellikler",
      "Özel entegrasyonlar",
      "Gelişmiş güvenlik",
      "Öncelikli destek",
      "Özel eğitim ve destek"
    ],
    buttonText: "Görüşme Talep Edin",
    featured: false
  }
];

export const testimonials = [
  {
    quote: "Bu platform sayesinde satış süreçlerimizi %30 hızlandırdık ve müşteri memnuniyetimiz arttı.",
    name: "Ahmet Yılmaz",
    role: "Satış Direktörü, ABC Teknoloji",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    quote: "Stok yönetimimiz çok daha verimli hale geldi. Artık stok eksikliği yaşamıyoruz.",
    name: "Ayşe Demir",
    role: "Operasyon Müdürü, XYZ Üretim",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    quote: "Finansal raporlama artık dakikalar içinde tamamlanıyor, eskiden günler alıyordu.",
    name: "Mehmet Kaya",
    role: "Finans Müdürü, 123 Holding",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
  },
];

export const faqs = [
  {
    question: "Platform kurulumu ne kadar sürer?",
    answer: "Kurulum genellikle 24-48 saat içinde tamamlanır. Verilerinizin miktarına ve özel ihtiyaçlarınıza bağlı olarak bu süre değişebilir. Kurulum ekibimiz, sorunsuz bir geçiş için size rehberlik edecektir."
  },
  {
    question: "Mevcut verilerimizi aktarabilir miyiz?",
    answer: "Evet, platformumuz çeşitli kaynaklardan veri aktarımını destekler. Excel, CSV ve diğer popüler CRM/ERP sistemlerinden veri aktarımı yapabilirsiniz. Teknik ekibimiz bu süreçte size yardımcı olacaktır."
  },
  {
    question: "Özel entegrasyonlar mümkün mü?",
    answer: "Evet, API'lerimiz ile kendi sistemlerinize özel entegrasyonlar geliştirebilirsiniz. Ayrıca, birçok popüler uygulama ve servisle hazır entegrasyonlar sunuyoruz."
  },
  {
    question: "Eğitim ve destek seçenekleri nelerdir?",
    answer: "Tüm paketlerimizde e-posta desteği sunuyoruz. Business ve Enterprise paketlerimizde telefon ve canlı destek de dahildir. Ayrıca, kapsamlı dokümantasyon ve video eğitimlerimizden yararlanabilirsiniz."
  },
  {
    question: "Verilerimizin güvenliği nasıl sağlanıyor?",
    answer: "Verileriniz, endüstri standardı SSL şifreleme, düzenli yedekleme ve güvenlik denetimleri ile korunmaktadır. KVKK ve GDPR uyumlu hizmet veriyoruz."
  },
  {
    question: "Fiyatlandırma planlarını değiştirebilir miyiz?",
    answer: "Evet, ihtiyaçlarınız değiştikçe paketler arasında geçiş yapabilirsiniz. Planınızı yükseltmek istediğinizde, fiyat farkını ödeyerek hemen geçiş yapabilirsiniz."
  }
];
