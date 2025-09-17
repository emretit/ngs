
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
    name: "Ücretsiz",
    price: "₺0",
    description: "5 kullanıcıya kadar tamamen ücretsiz. E-fatura dahil!",
    features: [
      "5 kullanıcıya kadar",
      "E-fatura entegrasyonu",
      "Temel CRM özellikleri",
      "Müşteri yönetimi",
      "Basit raporlama",
      "E-posta desteği"
    ],
    buttonText: "Ücretsiz Başla",
    featured: true
  },
  {
    name: "Business",
    price: "₺599",
    description: "Büyüyen işletmeler için kapsamlı özellikler.",
    features: [
      "20 kullanıcıya kadar",
      "Gelişmiş e-fatura özellikleri",
      "Envanter yönetimi",
      "Finansal raporlama",
      "Öncelikli destek",
      "API erişimi"
    ],
    buttonText: "Ücretsiz Deneyin",
    featured: false
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
    quote: "Modern arayüzü ve kullanım kolaylığı gerçekten etkileyici! İşletmemizi dijitalleştirdik.",
    name: "Ahmet Yılmaz",
    role: "Genel Müdür, ABC Teknoloji",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    quote: "8 modülün tek platformda olması iş akışlarımızı çok hızlandırdı. Harika çözüm!",
    name: "Zeynep Kara",
    role: "Operasyon Müdürü, İnovasyon Ltd.",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    quote: "Kullanıcı dostu ara yüz sayesinde ekibimiz hızla adapte oldu. Çok memnunuz.",
    name: "Can Özkan",
    role: "İş Geliştirme Müdürü, TechCorp",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
  },
];

export const faqs = [
  {
    question: "E-fatura entegrasyonu nasıl çalışıyor?",
    answer: "Nilvera API entegrasyonu ile e-fatura gönderim ve alma işlemlerinizi otomatikleştiriyoruz. Yasal mevzuata tam uyumlu, güvenli ve hızlı."
  },
  {
    question: "5 kullanıcıya kadar gerçekten ücretsiz mi?",
    answer: "Evet! E-fatura entegrasyonu dahil olmak üzere temel tüm özellikler 5 kullanıcıya kadar tamamen ücretsiz."
  },
  {
    question: "Kurulum ne kadar sürer?",
    answer: "24-48 saat içinde kurulum tamamlanır ve e-fatura entegrasyonunuz hazır hale gelir."
  },
  {
    question: "Mevcut verilerim aktarılır mı?",
    answer: "Evet, Excel, CSV ve diğer sistemlerden veri aktarımı yapılır. E-fatura geçmişiniz de korunur."
  },
  {
    question: "Hangi e-fatura sağlayıcıları destekleniyor?",
    answer: "Şu an Nilvera entegrasyonu aktif. Diğer sağlayıcılar için destek ekleyebiliriz."
  },
  {
    question: "Teknik destek nasıl alırım?",
    answer: "E-posta, telefon, canlı destek ve video eğitimlerle 7/24 destekliyoruz."
  }
];
