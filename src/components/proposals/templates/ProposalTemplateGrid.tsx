
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProposalTemplate } from "@/types/proposal-template";
import { FileText, BarChart3, Users, Building, Package, Search, Star, Eye, Clock, CheckCircle2, Sparkles, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import TemplatePreviewModal from "./preview/TemplatePreviewModal";

interface ProposalTemplateGridProps {
  onSelectTemplate: (template: ProposalTemplate) => void;
  templates?: ProposalTemplate[];
}

const ProposalTemplateGrid: React.FC<ProposalTemplateGridProps> = ({ 
  onSelectTemplate,
  templates = enhancedDefaultTemplates
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ProposalTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.templateType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [
    { value: "all", label: "Tüm Şablonlar" },
    ...Array.from(new Set(templates.map(t => t.templateType))).map(type => ({
      value: type,
      label: getCategoryLabel(type)
    }))
  ];

  const handlePreview = (template: ProposalTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewTemplate(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Teklif Şablonları
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          İhtiyacınıza Uygun Şablonu Seçin
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Profesyonel ve etkileyici teklifler hazırlamak için özel olarak tasarlanmış şablonlarımızdan birini seçin.
        </p>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Şablon ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Kategori seçin" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className={cn(
              "overflow-hidden cursor-pointer transition-all duration-300 border-2",
              "hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]",
              hoveredTemplate === template.id && "border-primary/50 shadow-lg scale-[1.02]"
            )}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
          >
            <CardHeader className="pb-3 relative">
              {/* Category Badge */}
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="text-xs">
                  {getCategoryLabel(template.templateType)}
                </Badge>
              </div>
              
              {/* Template Icon & Title */}
              <div className="flex items-start gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  {getTemplateIcon(template.templateType)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1 line-clamp-1">{template.name}</CardTitle>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{template.popularity || 4.8}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{template.estimatedTime || "5 dk"}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <CardDescription className="text-sm line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-4">
              {/* Features List */}
              <div className="space-y-2 mb-4">
                {template.templateFeatures.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-gray-600">{feature}</span>
                  </div>
                ))}
                {template.templateFeatures.length > 3 && (
                  <div className="text-xs text-gray-500 ml-5">
                    +{template.templateFeatures.length - 3} özellik daha
                  </div>
                )}
              </div>

              {/* Template Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{template.usageCount || "2.1k"} kullanım</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(template);
                  }}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  <span>Önizle</span>
                </button>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0">
              <Button 
                onClick={() => onSelectTemplate(template)} 
                className="w-full group"
                size="sm"
              >
                <span>Bu Şablonu Kullan</span>
                <Zap className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Şablon bulunamadı
          </h3>
          <p className="text-gray-500">
            Arama kriterlerinizi değiştirmeyi deneyin.
          </p>
        </div>
      )}

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        onSelectTemplate={onSelectTemplate}
      />
    </div>
  );
};

// Helper function to get the appropriate icon based on template type
const getTemplateIcon = (type: string) => {
  switch (type) {
    case "product":
      return <Package className="h-5 w-5 text-blue-500" />;
    case "service":
      return <FileText className="h-5 w-5 text-green-500" />;
    case "consulting":
      return <BarChart3 className="h-5 w-5 text-purple-500" />;
    case "company":
      return <Building className="h-5 w-5 text-red-500" />;
    case "enterprise":
      return <Users className="h-5 w-5 text-orange-500" />;
    case "standard":
      return <Shield className="h-5 w-5 text-primary" />;
    case "quick":
      return <Zap className="h-5 w-5 text-yellow-500" />;
    default:
      return <FileText className="h-5 w-5 text-gray-500" />;
  }
};

// Helper function to get category label
const getCategoryLabel = (type: string): string => {
  switch (type) {
    case "product":
      return "Ürün Teklifi";
    case "service":
      return "Hizmet Teklifi";
    case "consulting":
      return "Danışmanlık";
    case "company":
      return "Kurumsal";
    case "enterprise":
      return "Kurumsal Çözüm";
    case "standard":
      return "Standart";
    case "quick":
      return "Hızlı Teklif";
    default:
      return "Genel";
  }
};

// Enhanced templates data with more features
const enhancedDefaultTemplates: ProposalTemplate[] = [
  {
    id: "template-standard",
    name: "Standart Teklif",
    description: "En popüler şablon - her türlü iş için uygun, kapsamlı ve profesyonel görünüm",
    templateType: "standard",
    templateFeatures: [
      "Profesyonel tasarım ve düzen",
      "Detaylı ürün/hizmet listesi",
      "Otomatik toplam hesaplama",
      "KDV dahil/hariç seçeneği",
      "Ödeme koşulları ve şartlar",
      "Şirket logosu ve bilgileri"
    ],
    items: [],
    prefilledFields: {
      title: "Teklif",
      validityDays: 30,
      paymentTerm: "net30"
    },
    popularity: 4.9,
    estimatedTime: "8 dk",
    usageCount: "15.2k"
  },
  {
    id: "template-product",
    name: "Ürün Teklifi",
    description: "Fiziksel ürün satışları için optimize edilmiş şablon",
    templateType: "product",
    templateFeatures: [
      "Ürün görselleri ve açıklamaları",
      "Stok durumu bilgisi",
      "Toplu iskonto seçenekleri",
      "Kargo ve teslimat bilgileri",
      "Garanti ve iade koşulları"
    ],
    items: [],
    prefilledFields: {
      title: "Ürün Teklifi",
      validityDays: 30,
      paymentTerm: "prepaid"
    },
    popularity: 4.7,
    estimatedTime: "6 dk",
    usageCount: "8.9k"
  },
  {
    id: "template-service",
    name: "Hizmet Teklifi",
    description: "Danışmanlık, teknik servis ve hizmet sunumu için özel şablon",
    templateType: "service",
    templateFeatures: [
      "Saatlik/günlük hizmet bedeli",
      "Proje zaman çizelgesi",
      "Hizmet kapsamı detayları",
      "Teknik şartname alanı",
      "SLA ve performans kriterleri"
    ],
    items: [],
    prefilledFields: {
      title: "Hizmet Teklifi",
      validityDays: 15,
      paymentTerm: "net30"
    },
    popularity: 4.6,
    estimatedTime: "7 dk",
    usageCount: "6.3k"
  },
  {
    id: "template-enterprise",
    name: "Kurumsal Çözüm",
    description: "Büyük ölçekli projeler ve kurumsal müşteriler için gelişmiş şablon",
    templateType: "enterprise",
    templateFeatures: [
      "Multi-phase proje yapısı",
      "Detaylı maliyet analizi",
      "Risk değerlendirmesi",
      "Implementation timeline",
      "Support ve maintenance planı",
      "Compliance ve güvenlik maddeleri"
    ],
    items: [],
    prefilledFields: {
      title: "Kurumsal Çözüm Teklifi",
      validityDays: 45,
      paymentTerm: "net60"
    },
    popularity: 4.8,
    estimatedTime: "12 dk",
    usageCount: "3.1k"
  },
  {
    id: "template-quick",
    name: "Hızlı Teklif",
    description: "Acil durumlar ve hızlı satışlar için minimal ve etkili şablon",
    templateType: "quick",
    templateFeatures: [
      "Basitleştirilmiş form",
      "Hızlı doldurulan alanlar",
      "Tek sayfa düzen",
      "Anında PDF oluşturma"
    ],
    items: [],
    prefilledFields: {
      title: "Hızlı Teklif",
      validityDays: 15,
      paymentTerm: "prepaid"
    },
    popularity: 4.4,
    estimatedTime: "3 dk",
    usageCount: "9.7k"
  },
  {
    id: "template-consulting",
    name: "Danışmanlık Teklifi",
    description: "Profesyonel danışmanlık hizmetleri için özelleştirilmiş şablon",
    templateType: "consulting",
    templateFeatures: [
      "Expertise ve referanslar",
      "Metodoloji açıklaması",
      "Deliverable listesi",
      "Success metrics",
      "Change management planı"
    ],
    items: [],
    prefilledFields: {
      title: "Danışmanlık Teklifi",
      validityDays: 20,
      paymentTerm: "net30"
    },
    popularity: 4.5,
    estimatedTime: "10 dk",
    usageCount: "2.8k"
  }
];

export default ProposalTemplateGrid;
