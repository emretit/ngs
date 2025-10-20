
import { 
  Shield, 
  MessageSquare, 
  Smartphone, 
  BarChart3,
  Globe,
  Zap,
  Star,
} from "lucide-react";
import i18n from "@/i18n/config";

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
    name: i18n.t("landing.pricing.plans.free.name"),
    monthlyPrice: "₺0",
    yearlyPrice: "₺0",
    description: i18n.t("landing.pricing.plans.free.description"),
    features: [
      i18n.t("landing.pricing.plans.free.features.users"),
      i18n.t("landing.pricing.plans.free.features.einvoice"),
      i18n.t("landing.pricing.plans.free.features.basicCrm"),
      i18n.t("landing.pricing.plans.free.features.customerManagement"),
      i18n.t("landing.pricing.plans.free.features.simpleReporting"),
      i18n.t("landing.pricing.plans.free.features.emailSupport")
    ],
    buttonText: i18n.t("landing.pricing.plans.free.buttonText"),
    featured: false
  },
  {
    name: i18n.t("landing.pricing.plans.business.name"),
    monthlyPrice: "₺999",
    yearlyPrice: "₺9.999",
    yearlyDiscount: i18n.t("landing.pricing.plans.business.discount"),
    description: i18n.t("landing.pricing.plans.business.description"),
    features: [
      i18n.t("landing.pricing.plans.business.features.users"),
      i18n.t("landing.pricing.plans.business.features.advancedEinvoice"),
      i18n.t("landing.pricing.plans.business.features.inventory"),
      i18n.t("landing.pricing.plans.business.features.financialReporting"),
      i18n.t("landing.pricing.plans.business.features.prioritySupport"),
      i18n.t("landing.pricing.plans.business.features.apiAccess")
    ],
    buttonText: i18n.t("landing.pricing.plans.business.buttonText"),
    featured: true
  },
  {
    name: i18n.t("landing.pricing.plans.enterprise.name"),
    monthlyPrice: "",
    yearlyPrice: "",
    description: i18n.t("landing.pricing.plans.enterprise.description"),
    features: [
      i18n.t("landing.pricing.plans.enterprise.features.unlimitedUsers"),
      i18n.t("landing.pricing.plans.enterprise.features.allFeatures"),
      i18n.t("landing.pricing.plans.enterprise.features.customIntegrations"),
      i18n.t("landing.pricing.plans.enterprise.features.advancedSecurity"),
      i18n.t("landing.pricing.plans.enterprise.features.prioritySupport"),
      i18n.t("landing.pricing.plans.enterprise.features.customTraining")
    ],
    buttonText: i18n.t("landing.pricing.plans.enterprise.buttonText"),
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
    question: i18n.t("landing.faq.questions.einvoice.q"),
    answer: i18n.t("landing.faq.questions.einvoice.a")
  },
  {
    question: i18n.t("landing.faq.questions.free.q"),
    answer: i18n.t("landing.faq.questions.free.a")
  },
  {
    question: i18n.t("landing.faq.questions.setup.q"),
    answer: i18n.t("landing.faq.questions.setup.a")
  },
  {
    question: i18n.t("landing.faq.questions.migration.q"),
    answer: i18n.t("landing.faq.questions.migration.a")
  },
  {
    question: i18n.t("landing.faq.questions.providers.q"),
    answer: i18n.t("landing.faq.questions.providers.a")
  },
  {
    question: i18n.t("landing.faq.questions.support.q"),
    answer: i18n.t("landing.faq.questions.support.a")
  }
];
